import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ImageBackground,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

const { width, height } = Dimensions.get('window');

const HomeScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    return (
        <ImageBackground
            source={require('../assets/bg.png')}
            style={styles.container}
            resizeMode="cover"
        >
            {/* Welcome Card */}
            <ImageBackground
                source={require('../assets/card-top.png')}
                style={styles.topCard}
                imageStyle={{ borderRadius: 20 }}
            >
                <Text style={styles.welcome}>Welcome to</Text>
                <Text style={styles.brand}>FINITE</Text>
            </ImageBackground>

            {/* Logo with glow */}
            <View style={styles.centered}>
                <View style={styles.ringContainer}>
                    <Image source={require('../assets/ring.png')} style={styles.ring} />
                    <Image source={require('../assets/logo.png')} style={styles.logo} />
                </View>
            </View>

            {/* About & Services */}
            <View style={styles.bottomCards}>
                <TouchableOpacity onPress={() => ('About Us Pressed')}>
                    <ImageBackground
                        source={require('../assets/card-bottom-left.png')}
                        style={styles.subCard}
                        imageStyle={{ borderRadius: 20 }}
                    >
                        <Text style={styles.subCardText}>About Us</Text>
                    </ImageBackground>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('ServiceScreen')}>
                    <ImageBackground
                        source={require('../assets/card-bottom-right.png')}
                        style={styles.subCard}
                    // imageStyle={{ borderRadius: 20 }}
                    >
                        <Text style={styles.subCardText}>Services</Text>
                    </ImageBackground>
                </TouchableOpacity>
            </View>

            {/* Client Login */}
            <TouchableOpacity style={styles.loginButton}>
                <Text style={styles.loginText}>Client Login</Text>
            </TouchableOpacity>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width,
        height,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    topCard: {
        marginTop: 110,
        width: 300,
        height: 240,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        overflow: 'hidden',
    },
    welcome: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '400',
        textShadowColor: '#000',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    brand: {
        color: '#00BFFF',
        fontSize: 26,
        fontWeight: 'bold',
        marginTop: 1,
        textShadowColor: '#000',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 3,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ringContainer: {
        width: 210,
        height: 210,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    ring: {
        width: 210,
        height: 210,
        position: 'absolute',
    },
    logo: {
        width: 100,
        height: 100,
        resizeMode: 'contain',
        zIndex: 1,
    },
    bottomCards: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        gap: 24,
        zIndex: 1,
    },
    subCard: {
        width: 150,
        height: 250,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    subCardText: {
        color: '#00BFFF',
        fontSize: 18,
        fontWeight: '600',
        textShadowColor: '#000',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    loginButton: {
        marginTop: 50,
        paddingVertical: 14,
        paddingHorizontal: 48,
        borderRadius: 30,
        borderWidth: 1.5,
        borderColor: '#00BFFF',
        backgroundColor: 'transparent',
    },
    loginText: {
        color: '#00BFFF',
        fontSize: 18,
        fontWeight: '500',
    },
});

export default HomeScreen;