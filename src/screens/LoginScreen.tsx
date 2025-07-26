import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ImageBackground,
    TouchableOpacity,
    Dimensions,
    Image,
    Button,
    Alert
} from 'react-native';
import Modal from 'react-native-modal';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import FabMenu from '../component/FabMenu';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Icon from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {

    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [isModalVisible, setModalVisible] = useState(false);

    const { login } = useAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [validUsers, setvalidUsers] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // useEffect(() => {
    //     if (isModalVisible) {
    //         const timer = setTimeout(() => {
    //             navigation.navigate('LoadingScreen'); // ganti dengan nama screen sebenar
    //             setModalVisible(false); // optional: tutup modal kalau perlu
    //         }, 2000); // 2 saat selepas modal appear
    //         return () => clearTimeout(timer); // clear bila unmount
    //     }
    // }, [isModalVisible]);

    const handleLogin = () => {
        if (!username || !password) {
            Alert.alert('Error', 'Please enter both username and password');
            return;
        }

        let role = null;

        if (username === 'client@gmail.com') {
            role = 'client';
        } else if (username === 'admin@gmail.com') {
            role = 'admin';
        } else if (username === 'freelancer@gmail.com') {
            role = 'freelancer';
        }

        if (!role) {
            Alert.alert('Login Failed', 'Invalid user');
            return;
        }

        setvalidUsers(role); // kalau kau masih nak simpan ke state
        setModalVisible(true);
    };


    const handleNext = () => {
        setModalVisible(false);
        navigation.navigate('LoadingScreen', { role: validUsers }); // Navigate to the next screen
        // Contoh hardcoded role untuk testing
        // if (username === 'client') {
        //     login('client');
        // } else if (username === 'admin') {
        //     login('admin');
        // } else if (username === 'freelancer') {
        //     login('freelancer');
        // } else {
        //     Alert.alert('Login Failed', 'Invalid user');
        // }

        // Add navigation or next action here
    };

    return (
        <ImageBackground
            source={require('../assets/bg-login.png')}
            style={styles.container}
            resizeMode="cover"
        >
            <View style={styles.innerContainer}>
                <Image
                    source={require('../assets/finite-logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />

                <Text style={styles.label}>Username</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your username"
                    placeholderTextColor="#aaa"
                    value={username}
                    onChangeText={setUsername}
                />

                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordWrapper}>
                    <TextInput
                        style={styles.passwordInput}
                        placeholder="Enter your password"
                        placeholderTextColor="#aaa"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                    />
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeIcon}
                    >
                        <Icon
                            name={showPassword ? 'eye-off' : 'eye'}
                            size={22}
                            color="#888"
                        />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                    <Text style={styles.loginText}>Login</Text>
                </TouchableOpacity>

                <TouchableOpacity>
                    <Text style={styles.forgotText}>Forgot Password</Text>
                </TouchableOpacity>
            </View>

            {/* Modal */}
            <Modal
                isVisible={isModalVisible}
                onBackdropPress={() => setModalVisible(false)}
                animationIn="slideInUp"
                animationOut="slideOutDown"
                useNativeDriver
                style={styles.modal}
            >
                <View style={styles.modalContent}>
                    {/* ✅ Guna image atau unicode checkmark */}
                    {/* <Image source={require('../assets/checkmark.png')} style={{ width: 50, height: 50, marginBottom: 20 }} /> */}
                    <Text style={styles.checkmark}>✓</Text>
                    <Text style={styles.modalTitle}>Successfully Login!</Text>
                    <Text style={styles.modalSub}>Ready to be stargazed!</Text>
                    <TouchableOpacity
                        style={styles.modalButton}
                        onPress={handleNext}>
                        <Text style={styles.modalButtonText}>Next</Text>
                    </TouchableOpacity>
                </View>
            </Modal>

            <FabMenu />
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    innerContainer: {
        width: '80%',
        alignItems: 'center',
    },
    logo: {
        width: 120,
        height: 40,
        marginBottom: 30,
    },
    label: {
        alignSelf: 'flex-start',
        color: '#fff',
        fontSize: 14,
        marginTop: 10,
        marginBottom: 4,
        marginLeft: 10,
    },
    input: {
        width: '100%',
        height: 45,
        backgroundColor: '#fff',
        borderRadius: 25,
        paddingHorizontal: 20,
    },
    loginButton: {
        width: '100%',
        backgroundColor: '#2D71B7',
        borderRadius: 25,
        paddingVertical: 12,
        marginTop: 20,
        alignItems: 'center',
    },
    loginText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    forgotText: {
        marginTop: 12,
        color: '#ccc',
        fontSize: 13,
    },

    // Modal Styles
    modal: {
        justifyContent: 'flex-end',
        margin: 0,
    },
    modalContent: {
        backgroundColor: '#2D71B7',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 30,
        alignItems: 'center',
    },
    checkmark: {
        fontSize: 48,
        color: '#fff',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    modalSub: {
        fontSize: 14,
        color: '#fff',
        marginTop: 5,
        marginBottom: 20,
    },
    modalButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 30,
        paddingVertical: 10,
        borderRadius: 25,
    },
    modalButtonText: {
        color: '#2D71B7',
        fontWeight: 'bold',
        fontSize: 16,
    },

    passwordWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 4,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    passwordInput: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 16,
    },
    eyeIcon: {
        padding: 8,
    },
});

export default LoginScreen;
