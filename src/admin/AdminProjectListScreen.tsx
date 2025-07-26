import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    FlatList
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { getProjects } from '../services/projectApi'; // adjust path jika perlu

const { width } = Dimensions.get('window');

const allProjects = [
    {
        title: 'Social Media',
        subtitle: 'August postings',
        progress: 50,
        date: 'Jan 13, 2025',
        tasks: 24,
        status: 'Ongoing',
    },
    {
        title: 'App Project',
        subtitle: 'Digital Product Design',
        progress: 100,
        date: 'Jan 13, 2025',
        tasks: 24,
        status: 'Completed',
    },
    {
        title: 'Marketing Campaign',
        subtitle: 'Q3 Strategy',
        progress: 30,
        date: 'Jan 13, 2025',
        tasks: 18,
        status: 'Ongoing',
    },
];

const AdminProjectListScreen = () => {


    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await getProjects();
                setProjects(result); // result mestilah array
            } catch (err: any) {
                setError(err.message || 'Something went wrong');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [activeTab, setActiveTab] = useState<'All' | 'Ongoing' | 'Completed'>('All');
    const [showOptions, setShowOptions] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const filteredProjects =
        activeTab === 'All'
            ? allProjects
            : allProjects.filter(project => project.status === activeTab);

    if (loading) {
        return <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 50 }} />;
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>❌ {error}</Text>
            </View>
        );
    }
    return (
        <View style={styles.container}>

            {/* Floating Action Button Menu */}
            {showOptions && (
                <View style={styles.dropdown}>
                    <TouchableOpacity
                        style={styles.option}
                    // onPress={() => {
                    //     setShowOptions(false);
                    //     navigation.navigate('NewProjectScreen'); // Ganti ikut nama sebenar
                    // }}
                    >
                        <Text style={styles.optionText}>New Project</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.option}
                    // onPress={() => {
                    //     setShowOptions(false);
                    //     navigation.navigate('NewTaskScreen'); // Ganti ikut nama sebenar
                    // }}
                    >
                        <Text style={styles.optionText}>New Task</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.greeting}>Hello, User!</Text>
                <TouchableOpacity>
                    <Image
                        source={require('../assets/search-icon.png')}
                        style={styles.searchIcon}
                    />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                {['All', 'Ongoing', 'Completed'].map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tabButton, activeTab === tab && styles.tabActive]}
                        onPress={() => setActiveTab(tab as 'All' | 'Ongoing' | 'Completed')}
                    >
                        <Text style={activeTab === tab ? styles.tabActiveText : styles.tabText}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Projects List */}
            <ScrollView contentContainerStyle={styles.projectList}>
                {filteredProjects.map((project, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.card}
                        onPress={() => navigation.navigate('AdminProjectTaskListScreen', { project: project.title })}
                        activeOpacity={0.8}
                    >
                        <View style={styles.cardLeft}>
                            <Text style={styles.cardTitle}>{project.title}</Text>
                            <Text style={styles.cardSubtitle}>{project.subtitle}</Text>
                            <Text style={styles.cardAssigned}>Assigned to</Text>
                            <View style={styles.avatarRow}>
                                <View style={styles.avatar} />
                                <View style={[styles.avatar, { backgroundColor: '#000' }]} />
                                <View style={[styles.avatar, { backgroundColor: '#007bff' }]} />
                                <View style={styles.addAvatar}>
                                    <Text style={styles.plus}>+</Text>
                                </View>
                            </View>
                            <View style={styles.cardFooter}>
                                <Text style={styles.dateText}>📅 {project.date}</Text>
                                <Text style={styles.taskText}>✔️ {project.tasks} Tasks</Text>
                            </View>
                        </View>
                        <View style={styles.progressRing}>
                            <Text style={styles.progressText}>{project.progress}%</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>


            <FlatList
                data={projects}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.container}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.carddsd}>
                        <Text style={styles.title}>{item.title}</Text>
                        <Text style={styles.subtitle}>Client: {item.client_name}</Text>
                        <Text style={styles.subtitle}>Progress: {item.progress || 0}%</Text>
                    </TouchableOpacity>
                )}
            />

            {/* Floating Menu */}
            {showMenu && (
                <View style={styles.dropdown}>
                    <TouchableOpacity
                        style={styles.option}
                    // onPress={() => {
                    //     setShowMenu(false);
                    //     navigation.navigate('NewProjectScreen');
                    // }}
                    >
                        <Text style={styles.optionText}>New Project</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.option}
                    // onPress={() => {
                    //     setShowMenu(false);
                    //     navigation.navigate('NewTaskScreen');
                    // }}
                    >
                        <Text style={styles.optionText}>New Task</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Bottom Tab */}
            <View style={styles.bottomTab}>
                <TouchableOpacity
                    onPress={() => navigation.navigate('AdminHomeScreen')}>
                    <Icon name="home" size={26} color="#fff" />
                </TouchableOpacity>
                < TouchableOpacity >
                    <Icon name="calendar" size={26} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => setShowOptions(!showOptions)}
                >
                    <Icon name="add" size={32} color="#0072B5" />
                </TouchableOpacity>

                < TouchableOpacity >
                    <Icon name="notifications" size={26} color="#fff" />
                </TouchableOpacity>
                < TouchableOpacity >
                    <Icon name="person" size={26} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default AdminProjectListScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000015',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#0066b2',
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    greeting: {
        fontSize: 24,
        color: '#fff',
        fontWeight: 'bold',
    },
    searchIcon: {
        width: 22,
        height: 22,
        tintColor: '#fff',
    },
    tabs: {
        flexDirection: 'row',
        marginVertical: 16,
        justifyContent: 'center',
    },
    tabButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#e2e2e2',
        borderRadius: 20,
        marginHorizontal: 6,
    },
    tabActive: {
        backgroundColor: '#007bff',
    },
    tabText: {
        color: '#333',
        fontWeight: '500',
    },
    tabActiveText: {
        color: '#fff',
        fontWeight: '700',
    },
    projectList: {
        paddingBottom: 100,
        paddingHorizontal: 16,
    },
    card: {
        backgroundColor: '#f2f2f2',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },
    cardLeft: {
        flex: 1,
        paddingRight: 10,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#007bff',
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#444',
        marginBottom: 8,
    },
    cardAssigned: {
        fontSize: 12,
        color: '#222',
        marginBottom: 6,
    },
    avatarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatar: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#444',
        marginRight: 6,
    },
    addAvatar: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#007bff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    plus: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dateText: {
        fontSize: 12,
        color: '#777',
    },
    taskText: {
        fontSize: 12,
        color: '#007bff',
    },
    progressRing: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 6,
        borderColor: '#007bff',
        borderLeftColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressText: {
        fontWeight: 'bold',
        color: '#000',
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

    bottomTab: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#0072B5',
        paddingVertical: 14,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        position: 'absolute',
        bottom: 0,
        width: '100%',
        alignItems: 'center',
    },
    fab: {
        backgroundColor: '#fff',
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -40,
    },
    dropdown: {
        position: 'absolute',
        bottom: 100,
        alignSelf: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingVertical: 4,
        width: 140,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 10,
        zIndex: 10,
    },
    option: {
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    optionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0072B5',
    },



    carddsd: {
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 12,
        borderRadius: 10,
        elevation: 3,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#555',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: 'red',
    },
});
