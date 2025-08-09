import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    Switch,
    SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';


const AdminProfileScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [isNotificationOn, setIsNotificationOn] = useState(true);

    const { logout } = useAuth();
    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Profile</Text>

                <View style={styles.profileSection}>
                    <Image source={require('../assets/user.png')} style={styles.avatar} />
                    <View>
                        <Text style={styles.name}>Jane Smith</Text>
                        <Text style={styles.email}>janesmith@email.com</Text>
                        <Text style={styles.role}>Viewer</Text>
                    </View>
                </View>

                <View style={styles.menuList}>
                    <MenuItem icon="person-outline" label="My Profile" />
                    <MenuItem icon="lock-closed-outline" label="Change Password" />
                    <View style={styles.menuItem}>
                        <Icon name="notifications-outline" size={22} color="#555" style={styles.menuIcon} />
                        <Text style={styles.menuText}>Notifications</Text>
                        <View style={{ flex: 1 }} />
                        <Switch
                            value={isNotificationOn}
                            onValueChange={setIsNotificationOn}
                            trackColor={{ false: '#ccc', true: '#0077c2' }}
                            thumbColor="#fff"
                        />
                    </View>
                    <MenuItem icon="help-circle-outline" label="FAQ" />
                </View>

                <TouchableOpacity style={styles.logoutContainer} onPress={logout}>
                    <Icon name="log-out-outline" size={22} color="#555" style={styles.menuIcon} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const MenuItem = ({ icon, label }: { icon: string; label: string }) => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const handlePress = () => {
        if (label === 'Logout') {
            navigation.navigate('LoginScreen');
        } else {
            if (label === 'My Profile') {
                navigation.navigate('AdminMyProfileScreen');
            } else if (label === 'Change Password') {
                navigation.navigate('AdminChangePasswordScreen'); // Assuming you have a ChangePasswordScreen
            } else if (label === 'FAQ') {
                navigation.navigate('AdminFAQScreen'); // Assuming you have a FAQScreen
            }
        }
        // Tambah navigasi jika perlu
    };

    return (
        <TouchableOpacity style={styles.menuItem} onPress={handlePress}>
            <Icon name={icon} size={22} color="#555" style={styles.menuIcon} />
            <Text style={styles.menuText}>{label}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#d4d4d4',
    },
    container: {
        padding: 24,
        paddingBottom: 40,
        flexGrow: 1,
        justifyContent: 'flex-start',
        backgroundColor: '#d4d4d4',
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0077c2',
        alignSelf: 'center',
        marginBottom: 24,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        paddingHorizontal: 10,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        marginRight: 15,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0077c2',
    },
    email: {
        fontSize: 14,
        color: '#999',
    },
    role: {
        fontSize: 14,
        color: '#777',
    },
    menuList: {
        gap: 20,
        marginTop: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 5,
    },
    menuIcon: {
        width: 30,
    },
    menuText: {
        fontSize: 16,
        color: '#0077c2',
        fontWeight: '500',
    },
    logoutContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 'auto',
        paddingVertical: 20,
    },
    logoutText: {
        fontSize: 16,
        color: '#0077c2',
        fontWeight: '500',
    },
});

export default AdminProfileScreen;
