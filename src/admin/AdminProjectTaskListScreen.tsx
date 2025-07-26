import React, { useRef, useEffect, useState } from 'react';
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
type AdminProjectTaskListScreenRouteProp = RouteProp<RootStackParamList, 'AdminProjectTaskListScreen'>;

const AdminProjectTaskListScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const START_TOP = height * 0.25;
    const BOTTOM_TOP = height * 0.25;
    const slideAnim = useRef(new Animated.Value(BOTTOM_TOP)).current;
    const lastPosition = useRef(BOTTOM_TOP);
    const route = useRoute<AdminProjectTaskListScreenRouteProp>();

    const [filterVisible, setFilterVisible] = React.useState(false);
    const [selectedFilter, setSelectedFilter] = React.useState('All Tasks');

    const [showMenu, setShowMenu] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

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

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: 150 }} // 🟢 tambah sini
                >
                    {['Content Strategy', 'Design', 'Videoshoot', 'Video Editing', 'Video Editing', 'Video Editing'].map((task, idx) => (
                        <TouchableOpacity
                            key={idx}
                            style={styles.taskCard}
                            activeOpacity={0.9}
                            onPress={() => navigation.push('AdminTaskDetailsScreen', { task })}
                        >
                            <LinearGradient
                                colors={['#0072B5', '#002B4F']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.taskCardInner}
                            >
                                <View style={styles.rowWrapper}>
                                    <View style={styles.row}>
                                        {/* Kiri: Checkbox */}
                                        <View style={styles.leftColumn}>
                                            <View style={styles.checkboxWrapper}>
                                                {/* <Icon name="checkmark" size={14} color="#fff" /> */}
                                            </View>
                                        </View>

                                        {/* Kanan: Title + Avatars + Chevron + Progress */}
                                        <View style={styles.rightColumn}>
                                            <View style={styles.titleRow}>
                                                <Text style={styles.taskTitle}>{task}</Text>
                                                <View style={styles.avatarGroup}>
                                                    <View style={[styles.avatar, { backgroundColor: '#0066a2' }]} />
                                                    <View style={[styles.avatar, { backgroundColor: '#000' }]} />
                                                    <View style={[styles.avatar, { backgroundColor: '#00aaff' }]} />
                                                </View>
                                            </View>

                                            <View style={styles.progressBar}>
                                                <View style={styles.progressFill} />
                                            </View>
                                        </View>

                                        <View style={styles.leftColumn}>
                                            <Icon name="chevron-forward" size={16} color="#fff" />
                                        </View>
                                    </View>
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </Animated.View>

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
                < TouchableOpacity
                    onPress={() => navigation.navigate('AdminProfileScreen')}>
                    <Icon name="person" size={26} color="#fff" />
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




    // new card
    taskCard: {
        marginBottom: 14,
        borderRadius: 16,
        overflow: 'hidden',
    },

    taskCardInner: {
        padding: 12,
        borderRadius: 16,
        height: 100
    },

    row: {
        flexDirection: 'row',
    },

    leftColumn: {
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },

    right2Column: {
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },

    checkboxWrapper: {
        width: 24,
        height: 24,
        borderRadius: 6,
        backgroundColor: '#007bff',
        justifyContent: 'center',
        alignItems: 'center',
    },

    rightColumn: {
        flex: 1,
        justifyContent: 'center',
    },

    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    taskTitle: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
        flex: 1,
        marginRight: 8,
    },

    // avatarGroup: {
    //     flexDirection: 'row',
    //     marginRight: 6,
    // },

    // avatar: {
    //     width: 29,
    //     height: 29,
    //     borderRadius: 16,
    //     marginLeft: -3,
    //     borderWidth: 1,
    //     // borderColor: '#fff',
    // },

    progressBar: {
        marginTop: 8,
        height: 5,
        backgroundColor: '#ccc',
        borderRadius: 3,
        overflow: 'hidden',
        width: '70%'
    },

    progressFill: {
        width: '60%', // boleh jadikan dynamic nanti
        height: '100%',
        backgroundColor: '#4aa9ff',
    },

    rowWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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

    avatarGroup: {
        flexDirection: 'row',
        marginBottom: 14,
    },

    avatar: {
        width: 18,
        height: 18,
        borderRadius: 9,
        marginRight: -4,
        borderWidth: 1,
        borderColor: '#fff',
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

export default AdminProjectTaskListScreen;
