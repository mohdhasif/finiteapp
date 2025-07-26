import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

const ProfileScreen = () => {

    type ProfileScreenRouteProp = RouteProp<RootStackParamList, 'ProfileScreen'>;
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<ProfileScreenRouteProp>();

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Profile</Text>

            <View style={styles.profileSection}>
                <Image
                    source={require('../assets/user.png')}
                    style={styles.avatar}
                />
                <View>
                    <Text style={styles.name}>Jane Smith</Text>
                    <Text style={styles.email}>janesmith@email.com</Text>
                    <Text style={styles.role}>Viewer</Text>
                </View>
            </View>

            <View style={styles.menuList}>
                <MenuItem icon="person-outline" label="My Profile" />
                <MenuItem icon="lock-closed-outline" label="Change Password" />
                <MenuItem icon="notifications-outline" label="Notifications" />
                <MenuItem icon="help-circle-outline" label="FAQ" />
                <MenuItem icon="settings-outline" label="Settings" />
                <MenuItem icon="log-out-outline" label="Logout" />
            </View>
        </ScrollView>
    );
};

const MenuItem = ({ icon, label }: { icon: string; label: string }) => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const handlePress = () => {
        if (label === 'Logout') {
            // Contoh: clear token, reset state etc.
            navigation.navigate('LoginScreen')
        } else {
            // Tambah navigasi lain jika perlu
            console.log(`${label} pressed`);
        }
    };

    return (
        <TouchableOpacity style={styles.menuItem} onPress={handlePress}>
            <Icon name={icon} size={22} color="#555" style={styles.menuIcon} />
            <Text style={styles.menuText}>{label}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#f2f3f5',
        flexGrow: 1,
        padding: 20,
        paddingTop: 40,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0077c2',
        alignSelf: 'center',
        marginBottom: 30,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 15,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0077c2',
    },
    email: {
        fontSize: 14,
        color: '#999',
        textDecorationLine: 'line-through',
    },
    role: {
        fontSize: 14,
        color: '#888',
    },
    menuList: {
        gap: 15,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    menuIcon: {
        width: 30,
    },
    menuText: {
        fontSize: 16,
        color: '#0077c2',
        fontWeight: '500',
    },
});

export default ProfileScreen;
