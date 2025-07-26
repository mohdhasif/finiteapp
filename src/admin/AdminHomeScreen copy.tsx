import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

const clients = [
    { id: 1, name: 'Client 1', logo: require('../assets/user.png') },
    { id: 2, name: 'Client 1', logo: require('../assets/user.png') },
    { id: 3, name: 'Client 1', logo: require('../assets/user.png') },
    { id: 4, name: 'Client 1', logo: require('../assets/user.png') },
];

const projects = [
    { id: 1, title: 'Social Media', client: 'Client 1', progress: 50 },
    { id: 2, title: 'App Project', client: 'Client 2', progress: 50 },
];

const tasks = [
    { id: 1, title: 'Content Strategy', progress: 60, checked: true },
    { id: 2, title: 'Content Strategy', progress: 60, checked: true },
];

const AdminHomeScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [showOptions, setShowOptions] = useState(false);

    const [filterVisible, setFilterVisible] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('All Tasks');

    const taskList = ['Content Strategy', 'Design', 'Videoshoot', 'Video Editing'];
    const [checkedStates, setCheckedStates] = useState<boolean[]>(taskList.map(() => false));
    1
    return (
        <View style={styles.container}>
            {/* HEADER */}
            <LinearGradient colors={['#003865', '#0072B5']} style={styles.header}>
                <View style={styles.userRow}>
                    <Image source={require('../assets/user.png')} style={styles.avatar} />
                    <View>
                        <Text style={styles.username}>User 1</Text>
                        <Text style={styles.welcome}>Welcome Back!</Text>
                    </View>
                </View>

                <View style={styles.clientHeader}>
                    <Text style={styles.clientTitle}>FINITE’s Clients</Text>
                    <TouchableOpacity>
                        <Text style={styles.addText}>Add Client</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                    {clients.map((client) => (
                        <View key={client.id} style={styles.clientCard}>
                            <View style={styles.clientCircle}>
                                <Image source={client.logo} style={styles.clientLogo} />
                            </View>
                            <Text style={styles.clientName}>{client.name}</Text>
                        </View>
                    ))}
                </ScrollView>
            </LinearGradient>

            {/* PROJECTS */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Projects</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('AdminProjectListScreen')}>
                        <Text style={styles.seeAll}>See all</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.projectRow}>
                    {projects.map((proj) => (
                        <View key={proj.id} style={styles.projectCard}>
                            <Text style={styles.projectTitle}>{proj.title}</Text>
                            <Text style={styles.projectClient}>{proj.client}</Text>
                            <Text style={styles.projectTasks}>📅 Jan 13, 2025</Text>
                            <Text style={styles.projectTasks}>✅ 24 Tasks</Text>

                            {/* Dummy Avatar Row */}
                            <View style={styles.avatarGroup}>
                                <View style={[styles.avatarMini, { backgroundColor: '#ccc' }]} />
                                <View style={[styles.avatarMini, { backgroundColor: '#0af' }]} />
                                <View style={[styles.avatarMini, { backgroundColor: '#0072B5' }]}>
                                    <Text style={{ color: '#fff', fontSize: 12 }}>+</Text>
                                </View>
                            </View>

                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${proj.progress}%` }]} />
                            </View>
                            <Text style={styles.progressPercent}>{proj.progress}%</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* TASKS */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Tasks</Text>
                    <Text style={styles.seeAll}>See all</Text>
                </View>
            </View>

            {/* BOTTOM TAB */}
            <View style={styles.bottomTab}>
                <TouchableOpacity onPress={() => navigation.navigate('AdminHomeScreen')}>
                    <Icon name="home" size={26} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity>
                    <Icon name="calendar" size={26} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => setShowOptions(!showOptions)}
                >
                    <Icon name="add" size={32} color="#0072B5" />
                </TouchableOpacity>

                <TouchableOpacity>
                    <Icon name="notifications" size={26} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('AdminProfileScreen')}>
                    <Icon name="person" size={26} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default AdminHomeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F0F0',
    },
    header: {
        padding: 20,
        paddingBottom: 30,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 50, height: 50, borderRadius: 25, marginRight: 15,
    },
    username: {
        color: '#fff', fontSize: 18, fontWeight: 'bold',
    },
    welcome: {
        color: '#fff', fontSize: 14,
    },
    clientHeader: {
        flexDirection: 'row', justifyContent: 'space-between', marginTop: 20,
    },
    clientTitle: {
        color: '#fff', fontSize: 18, fontWeight: 'bold',
    },
    addText: {
        color: '#fff', fontSize: 14,
    },
    clientCard: {
        alignItems: 'center', marginHorizontal: 10,
    },
    clientCircle: {
        width: 70, height: 70, borderRadius: 35,
        borderWidth: 3, borderColor: '#fff',
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: '#fff',
    },
    clientLogo: {
        width: 50, height: 50, borderRadius: 25,
    },
    clientName: {
        marginTop: 6, fontSize: 12, color: '#444',
        backgroundColor: '#fff', paddingHorizontal: 12,
        paddingVertical: 2, borderRadius: 20,
    },
    section: {
        padding: 20,
    },
    sectionHeader: {
        flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 18, fontWeight: 'bold', color: '#005A9C',
    },
    seeAll: {
        color: '#999',
    },
    projectRow: {
        flexDirection: 'row', gap: 20,
    },
    projectCard: {
        backgroundColor: '#0072B5', borderRadius: 15, padding: 15, width: cardWidth,
    },
    projectTitle: {
        color: '#fff', fontSize: 16, fontWeight: 'bold',
    },
    projectClient: {
        color: '#fff', fontSize: 12,
    },
    projectTasks: {
        color: '#fff', fontSize: 12,
    },
    avatarGroup: {
        flexDirection: 'row', marginVertical: 6, gap: 4,
    },
    avatarMini: {
        width: 20, height: 20, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center',
    },
    progressBar: {
        height: 6,
        borderRadius: 5,
        backgroundColor: '#ccc',
        marginTop: 14,
        overflow: 'hidden',
    },
    bottomTab: {
        flexDirection: 'row', justifyContent: 'space-around',
        backgroundColor: '#0072B5', paddingVertical: 14,
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        position: 'absolute', bottom: 0, width: '100%',
        alignItems: 'center',
    },
    progressFill: {
        width: '70%',
        height: '100%',
        backgroundColor: '#4aa9ff',
    },
    progressPercent: {
        color: '#fff', textAlign: 'right', fontSize: 12,
    },
    fab: {
        backgroundColor: '#fff',
        width: 64, height: 64, borderRadius: 32,
        alignItems: 'center', justifyContent: 'center',
        marginTop: -40,
    },

});
