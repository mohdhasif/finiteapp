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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { getProjectSummaries } from '../services/projectService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ClientProjectCardScreen from '../component/ClientProjectCardScreen';

const { width } = Dimensions.get('window');

type Project = {
  project_id: number;
  project_title: string;
  client_name?: string | null;
  progress_percent?: number; // 0..100
  status?: 'Ongoing' | 'Completed' | 'Pending' | string;
  start_at?: string | null;
  end_at?: string | null;
  due_date?: string | null;
  total_tasks?: number;
  completed_tasks?: number;
  freelancer_count?: number;
  freelancer_avatars?: string[];
  extra_freelancers?: number;
};

const tabs = ['All', 'Ongoing', 'Completed'] as const;
type Tab = (typeof tabs)[number];

const ProjectListScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [displayName, setDisplayName] = useState('User');
  const [activeTab, setActiveTab] = useState<Tab>('All');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');

  const fetchData = async (isRefreshing = false) => {
    try {
      const token = (await AsyncStorage.getItem('userToken'))?.trim() || '';
      if (!isRefreshing) setLoading(true);
      const result = await getProjectSummaries(token);
      
      setProjects(Array.isArray(result) ? result : []);
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
      const userInfoString = await AsyncStorage.getItem('userInfo');
      const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
      const name = userInfo?.client?.company_name || 'User';
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
    navigation.navigate('FreelancerProjectTaskListScreen', { projectId: p.project_id, projectTitle: p.project_title });
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
          filteredProjects.map(item => (
            <ClientProjectCardScreen
              key={item.project_id}
              id={item.project_id}
              title={item.project_title}
              subtitle={item.client_name ?? ' '}
              client_name={item.client_name}
              progress={item.progress_percent ?? 0}
              status={item.status}
              start_date={item.start_at}
              due_date={item.due_date}
              logo_url={undefined}
              total_tasks={item.total_tasks ?? undefined}
              assignees={item.freelancer_avatars?.map((avatar, index) => ({ id: index, avatar_url: avatar })) ?? []}
              onPress={() => goToTasks(item)}
            />
          ))
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('FreelancerNotificationsScreen')}>
          <Icon name="notifications-outline" size={26} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('FreelancersHomeScreen')}>
          <Icon name="home-outline" size={26} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('FreelancerProfileScreen')}>
          <Icon name="person-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ProjectListScreen;

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

  // BOTTOM NAVIGATION
  bottomNav: {
    position: 'absolute', bottom: 0, width: '100%', height: 70, backgroundColor: '#007baf',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 10,
  },
  navItem: { alignItems: 'center', justifyContent: 'center' },
});
