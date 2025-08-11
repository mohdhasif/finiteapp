import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

const { width } = Dimensions.get('window');
type AdminTaskDetailsScreenRouteProp = RouteProp<RootStackParamList, 'AdminTaskDetailsScreen'>;

const AdminTaskDetailsScreen = () => {
    const [showLinks, setShowLinks] = useState(true);
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<AdminTaskDetailsScreenRouteProp>();

    const [showMenu, setShowMenu] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    return (
        <View style={styles.container}>

            {/* Floating Action Button Menu */}
            {showOptions && (
                <View style={styles.dropdown}>
                    <TouchableOpacity
                        style={styles.option}
                        onPress={() => {
                            setShowOptions(false);
                            navigation.navigate('AdminCreateProjectScreen'); // Ganti ikut nama sebenar
                        }}
                    >
                        <Text style={styles.optionText}>New Project</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.option}
                        onPress={() => {
                            setShowOptions(false);
                            navigation.navigate('AddTaskScreen'); // Ganti ikut nama sebenar
                        }}
                    >
                        <Text style={styles.optionText}>New Task</Text>
                    </TouchableOpacity>
                </View>
            )}

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <Text style={styles.header}>Task Details</Text>
                <Text style={styles.title}>{route.params.task_title}</Text>

                {/* Description */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        <Text style={styles.bullet}>● </Text>Description
                    </Text>
                    <Text style={styles.description}>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...
                    </Text>
                </View>

                {/* Assigned + Due */}
                <View style={styles.row}>
                    <View>
                        <Text style={styles.subTitle}>Assigned to</Text>
                        <View style={styles.avatarRow}>
                            <View style={[styles.avatar, { backgroundColor: 'black' }]} />
                            <View style={[styles.avatar, { backgroundColor: '#1E90FF' }]} />
                            <View style={[styles.avatar, { backgroundColor: '#00CED1' }]} />
                            <TouchableOpacity style={styles.addAvatar}>
                                <Text style={styles.plus}>+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View>
                        <Text style={styles.subTitle}>Due date</Text>
                        <View style={styles.dateRow}>
                            <Icon name="calendar-outline" color="#fff" size={16} />
                            <Text style={styles.dateText}> Jan 13, 2025</Text>
                        </View>
                        <View style={styles.dateRow}>
                            <Icon name="time-outline" color="#fff" size={16} />
                            <Text style={styles.dateText}> 12pm</Text>
                        </View>
                    </View>
                </View>

                {/* Attachments */}
                <TouchableOpacity style={styles.card}>
                    <Text style={styles.cardTitle}>● Attachments</Text>
                    <Icon name="chevron-forward" size={20} color="#fff" />
                </TouchableOpacity>

                {/* Links */}
                <TouchableOpacity style={styles.card} onPress={() => setShowLinks(!showLinks)}>
                    <Text style={styles.cardTitle}>● Links</Text>
                    <Icon name={showLinks ? "chevron-down" : "chevron-forward"} size={20} color="#fff" />
                </TouchableOpacity>

                {showLinks && (
                    <View style={styles.linkBox}>
                        {["Link 1", "Link 2", "Link3"].map((link, idx) => (
                            <TouchableOpacity key={idx} style={styles.linkItem} onPress={() => Linking.openURL('#')}>
                                <Text style={styles.linkText}>{link}</Text>
                                <Icon name="arrow-down-circle-outline" color="#333" size={20} />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Notes */}
                <TouchableOpacity style={styles.card}>
                    <Text style={styles.cardTitle}>● Notes</Text>
                    <Icon name="chevron-forward" size={20} color="#fff" />
                </TouchableOpacity>
            </ScrollView>

            {/* Floating Menu */}
            {showMenu && (
                <View style={styles.dropdown}>
                    <TouchableOpacity
                        style={styles.option}
                        onPress={() => {
                            setShowMenu(false);
                            navigation.navigate('AdminCreateProjectScreen');
                        }}
                    >
                        <Text style={styles.optionText}>New Project</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.option}
                        onPress={() => {
                            setShowMenu(false);
                            navigation.navigate('AddTaskScreen');
                        }}
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

export default AdminTaskDetailsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0B2C3F',
    },
    scrollContent: {
        padding: 20,
    },
    header: {
        fontSize: 26,
        color: '#fff',
        fontWeight: 'bold',
    },
    title: {
        fontSize: 20,
        color: '#fff',
        marginBottom: 20,
    },
    section: {
        backgroundColor: '#0E4766',
        padding: 15,
        borderRadius: 10,
        borderColor: '#1DA1F2',
        borderWidth: 1,
        marginBottom: 20,
    },
    sectionTitle: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 8,
    },
    bullet: {
        color: '#fff',
        fontSize: 16,
    },
    description: {
        color: '#ccc',
        fontSize: 14,
        lineHeight: 20,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    subTitle: {
        color: '#ccc',
        marginBottom: 5,
    },
    avatarRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 25,
        height: 25,
        borderRadius: 20,
        marginRight: 5,
    },
    addAvatar: {
        backgroundColor: '#1DA1F2',
        width: 25,
        height: 25,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    plus: {
        color: '#fff',
        fontWeight: 'bold',
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    dateText: {
        color: '#fff',
        marginLeft: 5,
    },
    card: {
        backgroundColor: '#12668C',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTitle: {
        color: '#fff',
        fontSize: 16,
    },
    linkBox: {
        backgroundColor: '#ddd',
        padding: 10,
        borderRadius: 10,
        marginBottom: 20,
    },
    linkItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    linkText: {
        color: '#007bff',
        fontSize: 15,
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
});
