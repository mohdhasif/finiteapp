import React, { useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, Animated, Dimensions, PanResponder
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

const { height, width } = Dimensions.get('window');
type ProjectTaskListScreenRouteProp = RouteProp<RootStackParamList, 'ProjectTaskListScreen'>;

const ProjectTaskListScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const START_TOP = height * 0.25;
    const BOTTOM_TOP = height * 0.25;
    const slideAnim = useRef(new Animated.Value(BOTTOM_TOP)).current;
    const lastPosition = useRef(BOTTOM_TOP);
    const route = useRoute<ProjectTaskListScreenRouteProp>();

    const [filterVisible, setFilterVisible] = React.useState(false);
    const [selectedFilter, setSelectedFilter] = React.useState('All Tasks');

    useEffect(() => {
        slideAnim.setValue(BOTTOM_TOP);
    }, []);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                let newY = lastPosition.current + gestureState.dy;
                const minY = 0;
                const maxY = BOTTOM_TOP;
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
                        toValue: BOTTOM_TOP,
                        useNativeDriver: false,
                    }).start(() => (lastPosition.current = BOTTOM_TOP));
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
                {/* Left: Info */}
                <View style={styles.cardLeft}>
                    <Text style={styles.title}>{route.params.project}</Text>
                    <Text style={styles.subtitle}>August postings</Text>

                    <Text style={styles.label}>Assigned to</Text>
                    <View style={styles.avatarGroup}>
                        <View style={[styles.avatar, { backgroundColor: '#0066a2' }]} />
                        <View style={[styles.avatar, { backgroundColor: '#000' }]} />
                        <View style={[styles.avatar, { backgroundColor: '#00aaff' }]} />
                    </View>

                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Icon name="calendar-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                            <Text style={styles.metaText}>Jan 13, 2025</Text>
                        </View>

                        <View style={styles.metaItem}>
                            <Icon name="checkmark-circle" size={16} color="#4aa9ff" style={{ marginRight: 6 }} />
                            <Text style={styles.metaText}>24 Tasks</Text>
                        </View>
                    </View>
                </View>

                {/* Right: Progress ring */}
                <View style={styles.progressRing}>
                    <View style={styles.circle}>
                        <Text style={styles.progressText}>50%</Text>
                    </View>
                </View>
            </View>

            {/* Bottom Task Drawer */}
            <Animated.View
                style={[styles.taskContainer, { transform: [{ translateY: slideAnim }] }]}
            >
                <View {...panResponder.panHandlers} style={styles.handle}>
                    <Icon name="remove-outline" size={40} color="#999" />
                </View>

                <View style={styles.taskHeader}>
                    <Text style={styles.taskHeaderTitle}>Tasks</Text>
                    <TouchableOpacity
                        style={styles.filterButton}
                        onPress={() => setFilterVisible(!filterVisible)}
                    >
                        <Text style={styles.filterButtonText}>{selectedFilter}</Text>
                        <Icon
                            name={filterVisible ? 'chevron-up-outline' : 'chevron-down-outline'}
                            size={16}
                            color="#999"
                        />
                    </TouchableOpacity>

                    {filterVisible && (
                        <View style={styles.dropdownMenu}>
                            {['All Tasks', 'Ongoing', 'Completed'].map((option, index) => (
                                <TouchableOpacity
                                    key={option}
                                    style={[
                                        styles.dropdownItem,
                                        selectedFilter === option && styles.dropdownItemActive,
                                        index === 0 && styles.dropdownItemFirst, // rounded top
                                        index === 2 && styles.dropdownItemLast,  // rounded bottom
                                    ]}
                                    onPress={() => {
                                        setSelectedFilter(option);
                                        setFilterVisible(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.dropdownItemText,
                                            selectedFilter === option && styles.dropdownItemTextActive,
                                        ]}
                                    >
                                        {option}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

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
    container: { flex: 1, backgroundColor: '#073B61' },
    // topCard: { height: height * 0.4, padding: 20 },
    // title: { fontSize: 28, color: '#fff', fontWeight: 'bold' },
    // subtitle: { fontSize: 16, color: '#ccc', marginTop: 4 },
    // progressRing: {
    //     width: 90, height: 90, borderRadius: 45,
    //     backgroundColor: '#fff', justifyContent: 'center',
    //     alignItems: 'center', alignSelf: 'flex-end', marginTop: -50, elevation: 5,
    // },
    // progressText: { color: '#073B61', fontWeight: 'bold', fontSize: 18 },
    taskContainer: {
        position: 'absolute',
        left: 0, right: 0, height: height,
        backgroundColor: '#e1e1e1',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 20,
        elevation: 10,
    },
    handle: {
        alignSelf: 'center',
        marginBottom: 10,
        width: '100%',
        alignItems: 'center',
    },
    taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    taskHeaderTitle: { fontSize: 22, fontWeight: 'bold', color: '#073B61' },
    // taskFilter: { flexDirection: 'row', alignItems: 'center' },
    // taskFilterText: { color: '#999', marginRight: 4 },
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




    taskFilter: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#fff',
        borderRadius: 8,
        elevation: 2,
    },

    taskFilterText: {
        marginRight: 6,
        fontSize: 14,
        color: '#333',
    },

    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        backgroundColor: 'transparent',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
    },

    filterButtonText: {
        color: '#999',
        fontSize: 14,
        marginRight: 6,
    },

    dropdownMenu: {
        position: 'absolute',
        top: 45, // adjust ikut posisi butang
        right: 20,
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
        width: 160,
        zIndex: 10,
    },

    dropdownItem: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: 'transparent',
    },

    dropdownItemFirst: {
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },

    dropdownItemLast: {
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
    },

    dropdownItemActive: {
        backgroundColor: '#0072B5',
    },

    dropdownItemText: {
        fontSize: 14,
        color: '#0072B5',
    },

    dropdownItemTextActive: {
        color: '#fff',
    },




    topCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        // backgroundColor: '#0072B5',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },

    cardLeft: {
        flex: 1,
    },

    title: {
        fontSize: 20,
        color: '#fff',
        fontWeight: 'bold',
    },

    subtitle: {
        fontSize: 14,
        color: '#e1e1e1',
        marginTop: 2,
        marginBottom: 10,
    },

    label: {
        color: '#fff',
        fontWeight: '600',
        marginTop: 10,
        marginBottom: 6,
    },

    metaRow: {
        flexDirection: 'row',
        gap: 16,
    },

    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },

    metaText: {
        color: '#fff',
        fontSize: 13,
    },

    progressRing: {
        justifyContent: 'center',
        alignItems: 'center',
    },

    circle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 8,
        borderColor: '#004d7a',
        borderTopColor: '#4aa9ff',
        justifyContent: 'center',
        alignItems: 'center',
    },

    progressText: {
        fontWeight: 'bold',
        color: '#fff',
        fontSize: 16,
    },







    taskCard: {
        backgroundColor: '#0C4E86',
        flexDirection: 'row',
        padding: 3,
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
});

export default ProjectTaskListScreen;
