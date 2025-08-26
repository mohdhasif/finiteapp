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
import { getAllTasksFreelancer, type Task } from '../services/taskService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AdminTaskCard from '../component/AdminTaskCard';

const { width } = Dimensions.get('window');

const tabs = ['All', 'Pending', 'in_progress', 'completed'] as const;
type Tab = (typeof tabs)[number];

const FreelancersHomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [displayName, setDisplayName] = useState('User');
  const [activeTab, setActiveTab] = useState<Tab>('All');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');

  // Filter mapping
  const resolveStatus = (
    f: Tab
  ): 'pending' | 'in_progress' | 'completed' | undefined => {
    if (f === 'All') return undefined;
    if (f === 'Pending') return 'pending';
    return f;
  };

  const fetchData = async (isRefreshing = false) => {
    try {
      const token = (await AsyncStorage.getItem('userToken'))?.trim() || '';
      if (!isRefreshing) setLoading(true);
      
      const status = resolveStatus(activeTab);
      const result = await getAllTasksFreelancer(token, status ? { status } : {});
      
      // Filter tasks to only show tasks assigned to this freelancer
      // This assumes the API returns all tasks and we filter client-side
      // You might want to modify the API to return only freelancer's tasks
      setTasks(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Fetch tasks error:', error);
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
      const name = userInfo?.freelancer?.name || userInfo?.name || 'User';
      setDisplayName(name);
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData(true);
    }, [activeTab])
  );

      // Combine search + tabs
  const filteredTasks = useMemo(() => {
    const list = tasks;

    if (!query.trim()) return list;

    const q = query.trim().toLowerCase();
    return list.filter(t => {
      const title = (t.title || '').toLowerCase();
      const description = (t.description || '').toLowerCase();
      return title.includes(q) || description.includes(q);
    });
  }, [tasks, query]);



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
          accessibilityLabel="Search tasks"
        >
          <Icon name={showSearch ? 'close' : 'search'} size={22} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Section title */}
      <Text style={styles.sectionTitle}>My Tasks</Text>

      {/* Search bar (show/hide) */}
      {showSearch && (
        <View style={styles.searchWrap}>
          <Icon name="search" size={18} style={styles.searchIcon} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search tasks…"
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

      {/* Tasks List */}
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
        {filteredTasks.length === 0 ? (
          <Text style={styles.emptyText}>
            {query ? 'Tiada task sepadan dengan carian.' : 'Tiada task dijumpai.'}
          </Text>
        ) : (
          filteredTasks.map((task, idx) => {
            const isCompleted = (task.status || '').toLowerCase() === 'completed';
            return (
              <AdminTaskCard
                key={task.id ?? idx}
                task={task}
                checked={isCompleted}
                onToggleCheck={() => {}}
                onPress={() =>
                  navigation.navigate('FreelancerTaskDetailsScreen', {
                    task_title: task.title ?? 'Task',
                    task_id: task.id,
                  })}
              />
            );
          })
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

export default FreelancersHomeScreen;

const styles = StyleSheet.create({
  // LAYOUT
  container: { flex: 1, backgroundColor: '#0B0F17' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

      // HERO full-bleed, radius only bottom
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
