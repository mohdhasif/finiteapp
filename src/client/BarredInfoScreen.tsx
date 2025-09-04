import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';

const BarredInfoScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { logout } = useAuth();

  const handleNavigateToProjects = () => {
    Alert.alert(
      'Access Restricted',
      'Your account is currently restricted. You cannot access project lists.',
      [{ text: 'OK' }]
    );
  };

  const handleNavigateToProfile = () => {
    navigation.navigate('ProfileScreen');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: logout
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Icon name="lock-closed-outline" size={56} color="#073B61" />
      <Text style={styles.title}>Account Restricted</Text>
      <Text style={styles.subtitle}>
        Your client account is restricted. You can only view your profile and FAQ.
        Project lists, task lists, and notifications are disabled. Please contact support to restore access.
      </Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.primaryAction} onPress={() => Linking.openURL('mailto:support@finite.my')}>
          <Icon name="mail-outline" size={18} color="#fff" />
          <Text style={styles.primaryActionText}>Contact Support</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryAction} onPress={handleNavigateToProfile}>
          <Icon name="person-outline" size={18} color="#0072B5" />
          <Text style={styles.secondaryActionText}>View Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tertiaryAction} onPress={handleNavigateToProjects}>
          <Icon name="folder-outline" size={18} color="#6B7A90" />
          <Text style={styles.tertiaryActionText}>Try Access Projects</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.logoutAction} onPress={handleLogout}>
          <Icon name="log-out-outline" size={18} color="#dc3545" />
          <Text style={styles.logoutActionText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default BarredInfoScreen;

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F2F6FA' },
  title: { fontSize: 22, color: '#073B61', fontWeight: '800', marginTop: 12 },
  subtitle: { color: '#6B7A90', textAlign: 'center', marginTop: 8, lineHeight: 20, marginBottom: 32 },
  
  buttonContainer: {
    width: '100%',
    maxWidth: 280,
    gap: 12,
  },
  
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0072B5',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
  },
  primaryActionText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#0072B5',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
  },
  secondaryActionText: { color: '#0072B5', fontWeight: '600', fontSize: 16 },
  
  tertiaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#6B7A90',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
  },
  tertiaryActionText: { color: '#6B7A90', fontWeight: '500', fontSize: 16 },
  
  logoutAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#dc3545',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
  },
  logoutActionText: { color: '#dc3545', fontWeight: '600', fontSize: 16 },
});


