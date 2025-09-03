// src/screens/AdminProjectListScreen.tsx
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
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
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { getProjectSummaries, getProjectFreelancers } from '../services/projectService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SwipeableProjectCard from '../component/SwipeableProjectCard';
import { BASE_URL } from '../constants/apiConfig';
import { useDebouncedState } from '../hooks/useOptimizedState';
import { useAsyncState } from '../hooks/useOptimizedState';
import { performanceMonitor } from '../utils/performance';
import OptimizedBottomTab from '../components/OptimizedBottomTab';

const { width } = Dimensions.get('window');

// Type definitions for API responses
type ProjectFreelancer = {
  freelancer_id: number;
  user_id: number;
  avatar_url: string | null;
  // Some APIs return avatar under this key
  freelancer_avatar_url?: string | null;
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
  due_date?: string | null;
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

  // Performance optimized state management
  const { data: projects, loading, error, execute: fetchProjects } = useAsyncState<Project[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  // Define tab configuration
  const tabConfig = [
    {
      id: 'home',
      icon: 'home',
      screen: 'AdminHomeScreen' as keyof RootStackParamList,
    },
    {
      id: 'calendar',
      icon: 'calendar',
      screen: 'AdminCalendarScreen' as keyof RootStackParamList,
    },
    {
      id: 'notifications',
      icon: 'notifications',
      screen: 'AdminNotificationsScreen' as keyof RootStackParamList,
    },
    {
      id: 'profile',
      icon: 'person',
      screen: 'AdminProfileScreen' as keyof RootStackParamList,
    },
  ];

  // Define quick actions
  const quickActions = [
    {
      id: 'new-project',
      title: 'New Project',
      icon: 'folder-open',
      onPress: () => navigation.navigate('AdminCreateProjectScreen'),
    },
    {
      id: 'new-task',
      title: 'New Task',
      icon: 'add-circle',
      onPress: () => navigation.navigate('AddTaskScreen'),
    },
  ];

  // Debounced search for better performance
  const [query, setQuery, debouncedQuery] = useDebouncedState('', 300);
  const [showSearch, setShowSearch] = useState(false);

  // Performance monitoring
  const renderCount = useRef(0);
  renderCount.current++;

  // Utility function to get avatar source
  const getAvatarSource = (avatarUrl: string | null) => {
    if (!avatarUrl) {
      return require('../assets/user.png');
    }
    // Construct full URL if it's a relative path
    const fullUrl = avatarUrl.startsWith('http') ? avatarUrl : `${BASE_URL}${avatarUrl}`;
    return { uri: fullUrl };
  };

  const fetchData = useCallback(async (isRefreshing = false) => {
    performanceMonitor.startTimer('fetchAdminProjects');

    try {
      if (!isRefreshing) setRefreshing(true);

      const token = (await AsyncStorage.getItem('userToken'))?.trim() || '';

      await fetchProjects(async () => {
        // Fetch project summaries first
        const result = await getProjectSummaries(token);
        console.log('result:', JSON.stringify(result, null, 2));

        const projectsData = Array.isArray(result) ? result : [];

        // OPTIMIZATION: Fetch freelancer data for all projects in parallel
        const projectIds = projectsData.map(p => p.project_id);

        // Fetch freelancers for all projects in parallel (much better than sequential)
        const freelancersPromises = projectIds.map(async (projectId) => {
          try {
            const freelancersData = await getProjectFreelancers(token, projectId);

            console.log('freelancersData:', freelancersData);
            
            return {
              projectId,
              freelancers: Array.isArray(freelancersData?.freelancers) ? freelancersData.freelancers : []
            };
          } catch (error) {
            console.error(`Error fetching freelancers for project ${projectId}:`, error);
            return { projectId, freelancers: [] };
          }
        });

        const freelancersResults = await Promise.all(freelancersPromises);

        // Create a map for quick lookup
        const freelancersMap = new Map(
          freelancersResults.map(result => [result.projectId, result.freelancers])
        );

        // Process projects with their freelancers
        return projectsData.map(project => {
          const freelancers = freelancersMap.get(project.project_id) || [];

          // Construct full avatar URLs with BASE_URL, supporting both avatar_url and freelancer_avatar_url
          const avatarUrls = freelancers.map((f: ProjectFreelancer) => {
            const raw = f.avatar_url || f.freelancer_avatar_url || null;
            if (!raw) return null; // default handled by card
            return raw.startsWith('http') ? raw : `${BASE_URL}${raw}`;
          });

          return {
            ...project,
            projectFreelancers: freelancers,
            // Update freelancer_avatars with full URLs (for backward compatibility)
            freelancer_avatars: avatarUrls,
            freelancer_count: freelancers.length,
          };
        });
      });

    } catch (error) {
      console.error('Fetch projects error:', error);
    } finally {
      setRefreshing(false);
      performanceMonitor.endTimer('fetchAdminProjects');
    }
  }, [fetchProjects]);

  useEffect(() => {
    fetchData();
    (async () => {
      const userInfoRaw = await AsyncStorage.getItem('userInfo');
      if (userInfoRaw) {
        try {
          const userInfo = JSON.parse(userInfoRaw);
          setDisplayName(userInfo.name || 'User');
        } catch (error) {
          console.log('Error parsing user info:', error);
          setDisplayName('User');
        }
      } else {
        setDisplayName('User');
      }
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData(true);
    }, []) // Remove activeTab dependency to prevent reloading on tab change
  );

  // Helper function to normalize status for comparison
  const normalizeStatus = (status: string | undefined): string => {
    if (!status) return '';
    const normalized = status.toLowerCase().trim();

    // Map various status formats to tab values
    if (normalized.includes('complete') || normalized.includes('completed') || normalized.includes('finish')) {
      return 'completed';
    }
    if (normalized.includes('ongoing') || normalized.includes('in progress') || normalized.includes('active')) {
      return 'ongoing';
    }
    if (normalized.includes('pending') || normalized.includes('waiting')) {
      return 'pending';
    }

    return normalized;
  };

  // Helper function to format date
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'No due date';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (error) {
      console.log('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Combine search + tabs
  const filteredProjects = useMemo(() => {
    const projectsList = projects || [];

    // Debug: Log status mapping for troubleshooting
    if (activeTab !== 'All') {
      console.log(`Filtering for tab: "${activeTab}"`);
      projectsList.forEach(p => {
        console.log(`Project: "${p.project_title}" - Original Status: "${p.status}" - Normalized: "${normalizeStatus(p.status)}"`);
      });
    }

    const list =
      activeTab === 'All'
        ? projectsList
        : projectsList.filter(p => {
          const projectStatus = normalizeStatus(p.status);
          const tabStatus = activeTab.toLowerCase();
          const matches = projectStatus === tabStatus;
          console.log(`Project "${p.project_title}": ${projectStatus} === ${tabStatus} = ${matches}`);
          return matches;
        });

    if (!debouncedQuery.trim()) return list;

    const q = debouncedQuery.trim().toLowerCase();
    return list.filter(p => {
      const title = (p.project_title || '').toLowerCase();
      const client = (p.client_name || '').toLowerCase();
      return title.includes(q) || client.includes(q);
    });
  }, [projects, activeTab, debouncedQuery]);

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
        {(filteredProjects || []).length === 0 ? (
          <Text style={styles.emptyText}>
            {debouncedQuery ? 'No projects match your search.' : 'No projects found.'}
          </Text>
        ) : (
          (filteredProjects || []).map(item => {
            // console.log('Project item for ProjectCardScreen:', {
            //   project_id: item.project_id,
            //   project_title: item.project_title,
            //   freelancer_avatars: item.freelancer_avatars,
            //   projectFreelancers: item.projectFreelancers?.length || 0,
            //   assignees: item.freelancer_avatars?.map((avatar, index) => ({ id: index, avatar_url: avatar })) ?? []
            // });

            const assigneesData = item.projectFreelancers?.map((freelancer, index) => {
              const raw = freelancer.freelancer_avatar_url || freelancer.avatar_url || null;
              return {
                id: freelancer.freelancer_id,
                avatar_url: raw,
              };
            }) ?? [];

            return (
              <SwipeableProjectCard
                key={item.project_id}
                id={item.project_id}
                title={item.project_title}
                subtitle={item.client_name ?? ' '}
                client_name={item.client_name}
                progress={item.progress_percent ?? 0}
                status={item.status}
                start_date={formatDate(item.start_at)}
                due_date={formatDate(item.due_date)}
                logo_url={undefined}
                total_tasks={item.total_tasks ?? undefined}
                assignees={assigneesData}
                onPress={() => goToTasks(item)}
                onDelete={(id) => {
                  // Handle delete - you can implement the actual delete logic here
                  console.log('Delete project:', id);
                  Alert.alert('Delete Project', 'Delete functionality will be implemented here');
                }}
                onUpdate={(id) => {
                  // Handle update - you can implement the actual update logic here
                  console.log('Update project:', id);
                  Alert.alert('Update Project', 'Update functionality will be implemented here');
                }}
              />
            );
          })
        )}
      </ScrollView>

      {/* Optimized Bottom Tab */}
      <OptimizedBottomTab
        tabs={tabConfig}
        quickActions={quickActions}
        activeTab="projects"
      />
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
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.2,
    lineHeight: 34,
    flexShrink: 1,
    flexWrap: 'wrap',
    maxWidth: width - 100, // Leave space for search button
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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


});



