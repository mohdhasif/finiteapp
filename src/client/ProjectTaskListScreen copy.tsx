import React, { useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, Animated, Dimensions, PanResponder
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

const { height, width } = Dimensions.get('window');
type ProjectTaskListScreenRouteProp = RouteProp<RootStackParamList, 'ProjectTaskListScreen'>;

const ProjectTaskListScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const START_TOP = height * 0.3;
    const slideAnim = useRef(new Animated.Value(START_TOP)).current;
    const lastPosition = useRef(START_TOP);
    const route = useRoute<ProjectTaskListScreenRouteProp>();

    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: START_TOP,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, []);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                let newY = lastPosition.current + gestureState.dy;
                const minY = 0;
                const maxY = START_TOP;
                newY = Math.max(minY, Math.min(newY, maxY));
                slideAnim.setValue(newY);
            },
            onPanResponderRelease: (_, gestureState) => {
                const threshold = 80;
                if (gestureState.dy < -threshold) {
                    Animated.spring(slideAnim, {
                        toValue: 0,
                        useNativeDriver: false,
                    }).start(() => (lastPosition.current = 0));
                } else if (gestureState.dy > threshold) {
                    Animated.spring(slideAnim, {
                        toValue: START_TOP,
                        useNativeDriver: false,
                    }).start(() => (lastPosition.current = START_TOP));
                } else {
                    Animated.spring(slideAnim, {
                        toValue: lastPosition.current,
                        useNativeDriver: false,
                    }).start();
                }
            }
        })
    ).current;

    return (
        <View style={styles.container}>
            {/* Top Card */}
            <View style={styles.topCard}>
                <Text style={styles.title}>{route.params.project}</Text>
                <Text style={styles.subtitle}>August postings</Text>

                <View style={styles.progressRing}>
                    <Text style={styles.progressText}>50%</Text>
                </View>
            </View>

            {/* Bottom Task Drawer */}
            <Animated.View style={[styles.taskContainer, { top: slideAnim }]}>
                {/* PanResponder only on this handle */}
                <TouchableOpacity style={styles.handle} {...panResponder.panHandlers}>
                    <Icon name="remove-outline" size={40} color="#999" />
                </TouchableOpacity>

                <View style={styles.taskHeader}>
                    <Text style={styles.taskHeaderTitle}>Tasks</Text>
                    <TouchableOpacity style={styles.taskFilter}>
                        <Text style={styles.taskFilterText}>All Tasks</Text>
                        <Icon name="chevron-down-outline" size={16} color="#999" />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    {['Content Strategy', 'Design', 'Videoshoot', 'Video Editing'].map((task, idx) => (
                        <TouchableOpacity
                            key={idx}
                            style={styles.taskCard}
                            onPress={() => navigation.push('TaskDetailsScreen', { task })}
                        >
                            <LinearGradient
                                colors={['#0d87c8', '#002b4f']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0, y: 1 }}
                                style={styles.taskCardInner}
                            >
                                <View style={styles.taskRow}>
                                    <View style={styles.checkboxWrapper}>
                                        <Icon name="checkmark" size={16} color="#fff" />
                                    </View>
                                    <Text style={styles.taskTitle}>{task}</Text>
                                    <View style={styles.avatarGroup}>
                                        <View style={[styles.avatar, { backgroundColor: '#0066a2' }]} />
                                        <View style={[styles.avatar, { backgroundColor: '#000' }]} />
                                        <View style={[styles.avatar, { backgroundColor: '#00aaff' }]} />
                                    </View>
                                    <Icon name="chevron-forward" size={20} color="#fff" />
                                </View>
                                <View style={styles.progressBar}>
                                    <View style={styles.progressFill} />
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </Animated.View>

            {/* Bottom Nav */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('NotificationsScreen')}>
                    <Icon name="notifications-outline" size={26} color="#fff" />
                    <View style={styles.redDot} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ProjectListScreen')}>
                    <Icon name="home-outline" size={26} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ProfileScreen')}>
                    <Icon name="person-outline" size={26} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#073B61',
    },
    topCard: {
        height: height * 0.4,
        padding: 20,
    },
    title: {
        fontSize: 28,
        color: '#fff',
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 16,
        color: '#ccc',
        marginTop: 4,
    },
    progressRing: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'flex-end',
        marginTop: -50,
        elevation: 5,
    },
    progressText: {
        color: '#073B61',
        fontWeight: 'bold',
        fontSize: 18,
    },
    taskContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: height,
        backgroundColor: '#e1e1e1',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 20,
        elevation: 10,
    },
    handle: {
        alignSelf: 'center',
        marginBottom: 10,
    },
    taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    taskHeaderTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#073B61',
    },
    taskFilter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    taskFilterText: {
        color: '#999',
        marginRight: 4,
    },







    taskCard: {
        backgroundColor: '#0C4E86',
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
        marginBottom: 18,
        borderRadius: 20,
        overflow: 'hidden',
    },
    taskCardInner: {
        padding: 16,
        borderRadius: 20,
    },
    taskRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    checkboxWrapper: {
        width: 26,
        height: 26,
        borderRadius: 6,
        backgroundColor: '#007bff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    taskTitle: {
        color: '#fff',
        fontSize: 16,
        flex: 1,
        marginLeft: 10,
        fontWeight: 'bold',
    },
    progressBar: {
        height: 6,
        borderRadius: 5,
        backgroundColor: '#ccc',
        marginTop: 14,
        overflow: 'hidden',
    },
    progressFill: {
        width: '70%',
        height: '100%',
        backgroundColor: '#4aa9ff',
    },
    avatarGroup: {
        flexDirection: 'row',
        marginHorizontal: 10,
    },
    avatar: {
        width: 16,
        height: 16,
        borderRadius: 8,
        marginLeft: -4,
        borderWidth: 1,
        borderColor: '#fff',
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

export default ProjectTaskListScreen;
