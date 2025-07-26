import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    FlatList,
    TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

const clients = [
    { id: 1, name: 'Client 1', logo: require('../assets/client1.png') },
    { id: 2, name: 'Client 2', logo: require('../assets/client2.png') },
    { id: 3, name: 'Client 3', logo: require('../assets/client3.png') },
    { id: 4, name: 'Client 4', logo: require('../assets/client4.png') },
];

const projects = [
    { id: 1, title: 'Social Media', client: 'Client 1', progress: 50 },
    { id: 2, title: 'App Project', client: 'Client 2', progress: 50 },
];

const tasks = [
    { id: 1, title: 'Content Strategy', progress: 80 },
    { id: 2, title: 'Content Design', progress: 40 },
];

const UserHomeScreen = () => {
    return (
        <View style={styles.container} >
            <ScrollView>
                {/* Welcome & Profile */}
                < View style={styles.header} >
                    <Image source={require('../assets/user1.png')} style={styles.avatar} />
                    <View>
                        <Text style={styles.username}> User 1 </Text>
                        < Text style={styles.welcome} > Welcome Back! </Text>
                    </View>
                </View>

                {/* Clients */}
                <View style={styles.clientSection}>
                    <View style={styles.clientHeader}>
                        <Text style={styles.sectionTitle}> FINITE’s Clients </Text>
                        < TouchableOpacity >
                            <Text style={styles.addText}> Add Client </Text>
                        </TouchableOpacity>
                    </View>
                    < ScrollView horizontal showsHorizontalScrollIndicator={false} >
                        {
                            clients.map((client) => (
                                <View key={client.id} style={styles.clientCard} >
                                    <Image source={client.logo} style={styles.clientLogo} />
                                    <Text style={styles.clientName} > {client.name} </Text>
                                </View>
                            ))
                        }
                    </ScrollView>
                </View>

                {/* Projects */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}> Projects </Text>
                        < Text style={styles.seeAll} > See all </Text>
                    </View>
                    < View style={styles.projectRow} >
                        {
                            projects.map((proj) => (
                                <View key={proj.id} style={styles.projectCard} >
                                    <Text style={styles.projectTitle} > {proj.title} </Text>
                                    < Text style={styles.projectClient} > {proj.client} </Text>
                                    < Text style={styles.projectTasks} >📅 Jan 13, 2025 </Text>
                                    < Text style={styles.projectTasks} >✅ 24 Tasks </Text>
                                    < View style={styles.progressBar} >
                                        <View style={[styles.progressFill, { width: `${proj.progress}%` }]} />
                                    </View>
                                    < Text style={styles.progressPercent} > {proj.progress} % </Text>
                                </View>
                            ))
                        }
                    </View>
                </View>

                {/* Tasks */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}> Tasks </Text>
                        < Text style={styles.seeAll} > See all </Text>
                    </View>
                    {
                        tasks.map((task) => (
                            <View key={task.id} style={styles.taskCard} >
                                <View style={styles.taskRow} >
                                    <Icon name="checkmark-circle" size={24} color="#0072B5" />
                                    <Text style={styles.taskTitle} > {task.title} </Text>
                                    < Icon name="chevron-forward" size={20} color="#fff" />
                                </View>
                                < View style={styles.taskProgressBar} >
                                    <View style={[styles.taskProgressFill, { width: `${task.progress}%` }]} />
                                </View>
                            </View>
                        ))
                    }
                </View>
            </ScrollView>

            {/* Bottom Tab */}
            <View style={styles.bottomTab}>
                <TouchableOpacity>
                    <Icon name="home" size={26} color="#fff" />
                </TouchableOpacity>
                < TouchableOpacity >
                    <Icon name="calendar" size={26} color="#fff" />
                </TouchableOpacity>

                < TouchableOpacity style={styles.fab} >
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

export default UserHomeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F0F0',
    },
    header: {
        flexDirection: 'row',
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#005A9C',
    },
    avatar: {
        width: 50,
        height: 50,
        marginRight: 15,
        borderRadius: 25,
    },
    username: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    welcome: {
        color: '#fff',
        fontSize: 14,
    },
    clientSection: {
        backgroundColor: '#0072B5',
        paddingVertical: 20,
    },
    clientHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    addText: {
        color: '#fff',
        fontSize: 14,
    },
    clientCard: {
        alignItems: 'center',
        marginHorizontal: 10,
    },
    clientLogo: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#fff',
    },
    clientName: {
        color: '#fff',
        fontSize: 12,
        marginTop: 6,
        backgroundColor: '#fff',
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 20,
        overflow: 'hidden',
    },
    section: {
        padding: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#005A9C',
    },
    seeAll: {
        color: '#999',
        fontSize: 14,
    },
    projectRow: {
        flexDirection: 'row',
        gap: 20,
    },
    projectCard: {
        backgroundColor: '#0072B5',
        borderRadius: 15,
        padding: 15,
        width: cardWidth,
    },
    projectTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    projectClient: {
        color: '#fff',
        fontSize: 12,
        marginBottom: 6,
    },
    projectTasks: {
        color: '#fff',
        fontSize: 12,
    },
    progressBar: {
        backgroundColor: '#ccc',
        height: 6,
        borderRadius: 5,
        marginVertical: 8,
    },
    progressFill: {
        height: 6,
        backgroundColor: '#00BFFF',
        borderRadius: 5,
    },
    progressPercent: {
        color: '#fff',
        textAlign: 'right',
        fontSize: 12,
    },
    taskCard: {
        backgroundColor: '#0072B5',
        padding: 16,
        borderRadius: 15,
        marginBottom: 15,
    },
    taskRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    taskTitle: {
        color: '#fff',
        fontSize: 16,
        marginHorizontal: 10,
        flex: 1,
    },
    taskProgressBar: {
        backgroundColor: '#ccc',
        height: 6,
        marginTop: 10,
        borderRadius: 4,
    },
    taskProgressFill: {
        height: 6,
        backgroundColor: '#00BFFF',
        borderRadius: 4,
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
});
