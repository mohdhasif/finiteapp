import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    Dimensions,
    TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';


const { width } = Dimensions.get('window');

const notifications = [
    { id: '1', text: 'Your password has been successfully changed.', time: '10 minutes ago', unread: false },
    { id: '2', text: 'Your password has been successfully changed.', time: '10 minutes ago', unread: false },
    { id: '3', text: 'Your password has been successfully changed.', time: '10 minutes ago', unread: false },
    { id: '4', text: 'Your password has been successfully changed.', time: '10 minutes ago', unread: false },
];

const NotificationsScreen = () => {

    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();


    const renderItem = ({ item }: any) => (
        <View style={styles.notificationCard}>
            <View style={styles.avatarContainer}>
                <View style={styles.avatarCircle}>
                    <Text style={styles.avatarIcon}>👤</Text>
                </View>
                {item.unread && <View style={styles.unreadDot} />}
            </View>
            <View style={styles.notificationText}>
                <Text style={styles.notificationMessage}>{item.text}</Text>
                <Text style={styles.notificationTime}>{item.time}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Notifications</Text>
            {/* <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingHorizontal: 20 }}
            /> */}

            {/* Bottom Nav */}
            <View style={styles.bottomNav}>
                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => navigation.navigate('NotificationsScreen')}>
                    <Icon name="notifications-outline" size={26} color="#fff" />
                    {/* <View style={styles.redDot} /> */}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => navigation.navigate('ProjectListScreen')}>
                    <Icon name="home-outline" size={26} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => navigation.navigate('ProfileScreen')}>
                    <Icon name="person-outline" size={26} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E5E5E5',
        paddingTop: 50,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0077B6',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    notificationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 25,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 15,
    },
    avatarCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#A9D3E9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarIcon: {
        fontSize: 18,
    },
    unreadDot: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#0077B6',
    },
    notificationText: {
        flex: 1,
    },
    notificationMessage: {
        fontSize: 14,
        color: '#0077B6',
        fontWeight: '600',
    },
    notificationTime: {
        fontSize: 12,
        color: '#A0A0A0',
        marginTop: 2,
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        width: width,
        height: 70,
        backgroundColor: '#007baf',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 10,
    },
    navItem: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    redDot: {
        position: 'absolute',
        top: 0,
        right: -2,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'red',
    },
});

export default NotificationsScreen;
