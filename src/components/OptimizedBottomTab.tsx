import React, { useCallback, useRef, useEffect } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

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
}

const OptimizedBottomTab: React.FC<OptimizedBottomTabProps> = ({
  tabs,
  quickActions,
  activeTab,
  onTabPress,
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [showQuickActions, setShowQuickActions] = React.useState(false);
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

  return (
    <>
      {/* Bottom Tab */}
      <View style={styles.bottomTab}>
        <TouchableOpacity
          style={[
            styles.tabItem,
            tabs[0]?.isActive && styles.activeTabItem,
          ]}
          onPress={() => handleTabPress(tabs[0])}
          activeOpacity={0.7}
        >
          <Icon
            name={tabs[0]?.icon as any}
            size={26}
            color={tabs[0]?.isActive ? '#fff' : 'rgba(255,255,255,0.7)'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            tabs[1]?.isActive && styles.activeTabItem,
          ]}
          onPress={() => handleTabPress(tabs[1])}
          activeOpacity={0.7}
        >
          <Icon
            name={tabs[1]?.icon as any}
            size={26}
            color={tabs[1]?.isActive ? '#fff' : 'rgba(255,255,255,0.7)'}
          />
        </TouchableOpacity>
        
        {/* FAB Button - Center */}
        <TouchableOpacity
          style={styles.fab}
          onPress={handleFabPress}
          activeOpacity={0.8}
        >
          <Icon name="add" size={32} color="#0072B5" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            tabs[2]?.isActive && styles.activeTabItem,
          ]}
          onPress={() => handleTabPress(tabs[2])}
          activeOpacity={0.7}
        >
          <Icon
            name={tabs[2]?.icon as any}
            size={26}
            color={tabs[2]?.isActive ? '#fff' : 'rgba(255,255,255,0.7)'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            tabs[3]?.isActive && styles.activeTabItem,
          ]}
          onPress={() => handleTabPress(tabs[3])}
          activeOpacity={0.7}
        >
          <Icon
            name={tabs[3]?.icon as any}
            size={26}
            color={tabs[3]?.isActive ? '#fff' : 'rgba(255,255,255,0.7)'}
          />
        </TouchableOpacity>
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
                {quickActions.map((action) => (
                  <TouchableOpacity
                    key={action.id}
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
