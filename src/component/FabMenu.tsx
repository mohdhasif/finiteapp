import React, { useRef, useState } from 'react';
import {
    View,
    TouchableOpacity,
    Animated,
    StyleSheet,
    Text,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

const FabMenu = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [open, setOpen] = useState(false);
    const animation = useRef(new Animated.Value(0)).current;

    const toggleMenu = () => {
        const toValue = open ? 0 : 1;

        Animated.spring(animation, {
            toValue,
            friction: 5,
            useNativeDriver: true,
        }).start();

        setOpen(!open);
    };

    const buttonStyle = (translateY: number) => ({
        transform: [{
            translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, translateY],
            })
        }],
        opacity: animation,
    });

    return (
        <View style={styles.container}>
            {/* Button 1 */}
            <Animated.View style={[styles.secondaryButton, buttonStyle(-60)]}>
                <TouchableOpacity
                    style={styles.buttonRow}
                    onPress={() => navigation.navigate('HomeScreen')}
                >
                    <Icon name="home" size={20} color="#fff" style={styles.icon} />
                    <Text style={styles.buttonText}>Home</Text>
                </TouchableOpacity>
            </Animated.View>

            {/* <Animated.View style={[styles.secondaryButton, buttonStyle(-120)]}>
                <TouchableOpacity style={styles.buttonRow}>
                    <Icon name="chatbubble" size={20} color="#fff" style={styles.icon} />
                    <Text style={styles.buttonText}>Chat</Text>
                </TouchableOpacity>
            </Animated.View> */}


            {/* Main FAB */}
            <TouchableOpacity style={styles.fab} onPress={toggleMenu}>
                <Animated.View
                    style={{
                        transform: [
                            {
                                rotate: animation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0deg', '45deg'],
                                }),
                            },
                        ],
                    }}
                >
                    <Icon name="add" size={28} color="#fff" />
                </Animated.View>
            </TouchableOpacity>
        </View>
    );
};

export default FabMenu;

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        alignItems: 'flex-end',
    },
    fab: {
        width: 60,
        height: 60,
        backgroundColor: '#007AFF',
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
    },
    secondaryButton: {
        position: 'absolute',
        right: 0,
    },
    buttonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#444',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 24,
        marginBottom: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    icon: {
        marginRight: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
});

