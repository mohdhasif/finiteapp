import React, { useCallback, useRef, useEffect, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  Modal,
  Animated,
  Text,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBadgeCount } from '../services/notificationService';

const { width } = Dimensions.get('window');

interface TabItem {
  id: string;
  icon: string;
  screen: keyof RootStackParamList;
  isActive?: boolean;
}

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  onPress: () => void;
}

interface OptimizedBottomTabProps {
  tabs: TabItem[];
  quickActions: QuickAction[];
  activeTab?: string;
  onTabPress?: (tabId: string) => void;
  onNotificationBadgeUpdate?: (badgeCount: number) => void;
}

const OptimizedBottomTab: React.FC<OptimizedBottomTabProps> = ({
  tabs = [],
  quickActions = [],
  activeTab,
  onTabPress,
  onNotificationBadgeUpdate,
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [showQuickActions, setShowQuickActions] = React.useState(false);
  const [notificationBadge, setNotificationBadge] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Performance optimization: Memoize handlers
  const handleTabPress = useCallback((tab: TabItem) => {
    if (onTabPress) {
      onTabPress(tab.id);
    } else {
      navigation.navigate(tab.screen as any);
    }
  }, [navigation, onTabPress]);

  const handleQuickActionPress = useCallback((action: QuickAction) => {
    setShowQuickActions(false);
    action.onPress();
  }, []);

  const handleFabPress = useCallback(() => {
    setShowQuickActions(true);
  }, []);

  const handleBackdropPress = useCallback(() => {
    setShowQuickActions(false);
  }, []);

  // Load notification badge count
  const loadNotificationBadge = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        const badgeCount = await getBadgeCount(token);
        
        // Ensure badge count is a valid number
        const validBadgeCount = typeof badgeCount === 'number' && !isNaN(badgeCount) ? badgeCount : 0;
        setNotificationBadge(validBadgeCount);
        onNotificationBadgeUpdate?.(validBadgeCount);
      }
    } catch (error) {
      setNotificationBadge(0);
    }
  }, [onNotificationBadgeUpdate]);

  // Load notification badge on focus
  useFocusEffect(
    useCallback(() => {
      loadNotificationBadge();
    }, [loadNotificationBadge])
  );

  // Helper function to render tab with badge
  const renderTabWithBadge = useCallback((tab: TabItem, index: number) => {
    const isNotificationTab = tab.icon === 'notifications' || tab.screen === 'AdminNotificationsScreen';
    const showBadge = isNotificationTab && notificationBadge > 0;
    
    return (
      <TouchableOpacity
        key={`tab-${tab.id}-${index}`}
        style={[
          styles.tabItem,
          tab.isActive && styles.activeTabItem,
        ]}
        onPress={() => handleTabPress(tab)}
        activeOpacity={0.7}
      >
        <View style={styles.tabIconContainer}>
          <Icon
            name={tab.icon as any}
            size={26}
            color={tab.isActive ? '#fff' : 'rgba(255,255,255,0.7)'}
          />
          {/* Always render badge container to prevent child count mismatch */}
          <View style={[styles.badge, { opacity: showBadge ? 1 : 0 }]}>
            <Text style={styles.badgeText}>
              {notificationBadge > 99 ? '99+' : notificationBadge}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [handleTabPress, notificationBadge]);

  // Animate modal appearance
  useEffect(() => {
    if (showQuickActions) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showQuickActions, fadeAnim, scaleAnim]);

  // Safety check: ensure we have valid tabs
  if (!Array.isArray(tabs) || tabs.length === 0) {
    // Remove console.warn for production - return null instead
    return null;
  }

  return (
    <>
      {/* Bottom Tab */}
      <View style={styles.bottomTab}>
        {tabs.length > 0 && renderTabWithBadge(tabs[0], 0)}
        {tabs.length > 1 && renderTabWithBadge(tabs[1], 1)}
        
        {/* FAB Button - Center */}
        <TouchableOpacity
          style={styles.fab}
          onPress={handleFabPress}
          activeOpacity={0.8}
        >
          <Icon name="add" size={32} color="#0072B5" />
        </TouchableOpacity>

        {tabs.length > 2 && renderTabWithBadge(tabs[2], 2)}
        {tabs.length > 3 && renderTabWithBadge(tabs[3], 3)}
      </View>

      {/* Quick Actions Modal */}
      <Modal
        visible={showQuickActions}
        transparent
        animationType="none"
        onRequestClose={handleBackdropPress}
      >
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.quickActionsContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }],
                  },
                ]}
              >
                {quickActions.map((action, index) => (
                  <TouchableOpacity
                    key={`action-${action.id}-${index}`}
                    style={styles.quickActionItem}
                    onPress={() => handleQuickActionPress(action)}
                    activeOpacity={0.7}
                  >
                    <Icon name={action.icon as any} size={20} color="#0072B5" />
                    <Text style={styles.quickActionText}>{action.title}</Text>
                  </TouchableOpacity>
                ))}
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  bottomTab: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#0072B5',
    height: 60,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  activeTabItem: {
    // Active state styling if needed
  },
  tabIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF4757',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    // Ensure badge is always rendered but hidden when not needed
    pointerEvents: 'none',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  fab: {
    backgroundColor: '#fff',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  quickActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  quickActionText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#0072B5',
  },
});

export default OptimizedBottomTab;
