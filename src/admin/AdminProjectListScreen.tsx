// src/screens/AdminProjectListScreen.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { getProjectSummaries, getProjectFreelancers } from '../services/projectService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProjectCardScreen from '../component/ProjectCardScreen';
import { BASE_URL } from '../constants/apiConfig';

const { width } = Dimensions.get('window');

// Type definitions for API responses
type ProjectFreelancer = {
  freelancer_id: number;
  user_id: number;
  avatar_url: string | null;
  skillset: string;
  freelancer_status: string;
  freelancer_name: string;
  freelancer_email: string;
};

type Project = {
  project_id: number;
  project_title: string;
  client_name?: string | null;
  progress_percent?: number; // 0..100
  status?: 'Ongoing' | 'Completed' | 'Pending' | string;
  start_at?: string | null;
  end_at?: string | null;
  total_tasks?: number;
  completed_tasks?: number;
  freelancer_count?: number;
  freelancer_avatars?: string[];
  extra_freelancers?: number;
  // Add freelancer data for each project
  projectFreelancers?: ProjectFreelancer[];
};

const tabs = ['All', 'Ongoing', 'Completed'] as const;
type Tab = (typeof tabs)[number];

const AdminProjectListScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [displayName, setDisplayName] = useState('User');
  const [activeTab, setActiveTab] = useState<Tab>('All');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  // Search
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');

  // Utility function to get avatar source
  const getAvatarSource = (avatarUrl: string | null) => {
    if (!avatarUrl) {
      return require('../assets/user.png');
    }
    // Construct full URL if it's a relative path
    const fullUrl = avatarUrl.startsWith('http') ? avatarUrl : `${BASE_URL}${avatarUrl}`;
    return { uri: fullUrl };
  };

  const fetchData = async (isRefreshing = false) => {
    try {
      const token = (await AsyncStorage.getItem('userToken'))?.trim() || '';
      if (!isRefreshing) setLoading(true);

      // Fetch project summaries first
      const result = await getProjectSummaries(token);
      const projectsData = Array.isArray(result) ? result : [];

      // Fetch freelancer data for each project
      const projectsWithFreelancers = await Promise.all(
        projectsData.map(async (project) => {
          try {
            const freelancersData = await getProjectFreelancers(token, project.project_id);
            const freelancers = Array.isArray(freelancersData?.freelancers)
              ? freelancersData.freelancers
              : [];

            // Construct full avatar URLs with BASE_URL, include all freelancers (with or without avatars)
            const avatarUrls = freelancers.map((f: ProjectFreelancer) => {
              if (!f.avatar_url) return null; // Will be handled by ProjectCardScreen with default image
              // If it's already a full URL, use as is, otherwise prepend BASE_URL
              return f.avatar_url.startsWith('http') ? f.avatar_url : `${BASE_URL}${f.avatar_url}`;
            });

            console.log('Project', project.project_id, 'freelancers:', freelancers.length);
            console.log('Avatar URLs for project', project.project_id, ':', avatarUrls);

            return {
              ...project,
              projectFreelancers: freelancers,
              // Update freelancer_avatars with full URLs (for backward compatibility)
              freelancer_avatars: avatarUrls,
              freelancer_count: freelancers.length,
            };
          } catch (error) {
            console.error(`Error fetching freelancers for project ${project.project_id}:`, error);
            return {
              ...project,
              projectFreelancers: [],
              freelancer_avatars: [],
              freelancer_count: 0,
            };
          }
        })
      );

      // console.log('Projects with freelancers:', projectsWithFreelancers.map(p => ({
      //   project_id: p.project_id,
      //   project_title: p.project_title,
      //   freelancer_count: p.freelancer_count,
      //   freelancer_avatars: p.freelancer_avatars,
      // })));

      setProjects(projectsWithFreelancers);
    } catch (error) {
      console.error('Fetch projects error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    (async () => {
      const name = (await AsyncStorage.getItem('display_name')) || 'User';
      setDisplayName(name);
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData(true);
    }, [activeTab])
  );

  // Gabung carian + tabs
  const filteredProjects = useMemo(() => {
    const list =
      activeTab === 'All'
        ? projects
        : projects.filter(
          p => (p.status || '').toLowerCase() === activeTab.toLowerCase()
        );

    if (!query.trim()) return list;

    const q = query.trim().toLowerCase();
    return list.filter(p => {
      const title = (p.project_title || '').toLowerCase();
      const client = (p.client_name || '').toLowerCase();
      return title.includes(q) || client.includes(q);
    });
  }, [projects, activeTab, query]);

  const goToTasks = (p: Project) => {
    navigation.navigate('AdminProjectTaskListScreen', { project_title: p.project_title, project_id: p.project_id });
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Gradient header full-bleed ke atas */}
      <LinearGradient
        colors={['#0064B7', '#00A2E1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.heroGreeting}>Hello, {displayName}!</Text>

        {/* Search toggle button */}
        <TouchableOpacity
          style={styles.heroSearchBtn}
          onPress={() => setShowSearch(s => !s)}
          accessibilityRole="button"
          accessibilityLabel="Search projects"
        >
          <Icon name={showSearch ? 'close' : 'search'} size={22} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Section title */}
      <Text style={styles.sectionTitle}>Projects</Text>

      {/* Search bar (show/hide) */}
      {showSearch && (
        <View style={styles.searchWrap}>
          <Icon name="search" size={18} style={styles.searchIcon} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by title or client…"
            placeholderTextColor="#98A6B8"
            style={styles.searchInput}
            returnKeyType="search"
            autoFocus
          />
          {!!query && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Icon name="close-circle" size={18} style={styles.clearIcon} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Segmented tabs */}
      <View style={styles.tabContainer}>
        {tabs.map(tab => {
          const active = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabPill, active && styles.tabPillActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.9}
            >
              <Text style={active ? styles.tabPillTextActive : styles.tabPillText}>{tab}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchData(true);
            }}
          />
        }
      >
        {filteredProjects.length === 0 ? (
          <Text style={styles.emptyText}>
            {query ? 'Tiada projek sepadan dengan carian.' : 'Tiada projek dijumpai.'}
          </Text>
        ) : (
          filteredProjects.map(item => {
            // console.log('Project item for ProjectCardScreen:', {
            //   project_id: item.project_id,
            //   project_title: item.project_title,
            //   freelancer_avatars: item.freelancer_avatars,
            //   projectFreelancers: item.projectFreelancers?.length || 0,
            //   assignees: item.freelancer_avatars?.map((avatar, index) => ({ id: index, avatar_url: avatar })) ?? []
            // });

            const assigneesData = item.projectFreelancers?.map((freelancer, index) => ({ 
              id: freelancer.freelancer_id, 
              avatar_url: freelancer.avatar_url 
            })) ?? [];
            
            console.log('Sending assignees for project', item.project_id, ':', JSON.stringify(assigneesData, null, 2));
            
            return (
              <ProjectCardScreen
                key={item.project_id}
                id={item.project_id}
                title={item.project_title}
                subtitle={item.client_name ?? ' '}
                client_name={item.client_name}
                progress={item.progress_percent ?? 0}
                status={item.status}
                start_date={item.start_at}
                due_date={item.end_at}
                logo_url={undefined}
                total_tasks={item.total_tasks ?? undefined}
                assignees={assigneesData}
                onPress={() => goToTasks(item)}
              />
            );
          })
        )}
      </ScrollView>

      {/* FAB dropdown */}
      {showOptions && (
        <View style={styles.dropdown}>
          <TouchableOpacity style={styles.option} onPress={() => setShowOptions(false)}>
            <Text style={styles.optionText}>New Project</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.option} onPress={() => setShowOptions(false)}>
            <Text style={styles.optionText}>New Task</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Tab (sticky) */}
      <View style={styles.bottomTab}>
        <TouchableOpacity onPress={() => navigation.navigate('AdminHomeScreen')}>
          <Icon name="home" size={26} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('AdminCalendarScreen')}>
          <Icon name="calendar" size={26} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.fab} onPress={() => setShowOptions(prev => !prev)}>
          <Icon name="add" size={32} color="#0072B5" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('AdminNotificationsScreen')}>
          <Icon name="notifications" size={26} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('AdminProfileScreen')}>
          <Icon name="person" size={26} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AdminProjectListScreen;

const styles = StyleSheet.create({
  // LAYOUT
  container: { flex: 1, backgroundColor: '#0B0F17' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // HERO full-bleed, radius hanya bawah
  hero: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 24,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    position: 'relative',
    overflow: 'hidden',
  },
  heroGreeting: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  heroSearchBtn: {
    position: 'absolute',
    right: 18,
    top: 18,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  // Title
  sectionTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    marginLeft: 20,
    marginTop: 10,
    marginBottom: 10,
  },

  // SEARCH
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E9EDF3',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  searchIcon: { color: '#6C7A92', marginRight: 6 },
  searchInput: {
    flex: 1,
    color: '#0B0F17',
    fontSize: 16,
    paddingVertical: 0,
  },
  clearIcon: { color: '#6C7A92', marginLeft: 6 },

  // Segmented tabs
  tabContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: '#E9EDF3',
    padding: 6,
    borderRadius: 20,
    marginBottom: 6,
    width: width - 40,
  },
  tabPill: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  tabPillActive: {
    backgroundColor: '#0A86D7',
  },
  tabPillText: {
    color: '#6C7A92',
    fontWeight: '700',
    fontSize: 16,
  },
  tabPillTextActive: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },

  // LIST
  listContent: { paddingHorizontal: 16, paddingBottom: 110, paddingTop: 8 },
  emptyText: { textAlign: 'center', color: '#96A1B2', marginTop: 24 },

  // BOTTOM TAB + FAB
  bottomTab: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#0072B5',
    paddingVertical: 14,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center',
  },
  fab: {
    backgroundColor: '#fff',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -40,
  },

  // DROPDOWN (FAB menu)
  dropdown: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 4,
    width: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 10,
  },
  option: { paddingVertical: 12, paddingHorizontal: 20 },
  optionText: { fontSize: 14, fontWeight: '600', color: '#0072B5' },
});



