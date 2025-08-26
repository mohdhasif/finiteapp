import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions,
    ImageBackground,
    StatusBar,
    Animated
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useEffect, useRef, useState } from 'react';

const { width } = Dimensions.get('window');

const HomeScreen = () => {

    const fadeAnim = useRef(new Animated.Value(1)).current;
    const [textIndex, setTextIndex] = useState(0);

    const texts = [
        { welcome: 'Welcome to', brand: 'FINITE' },
        { welcome: 'How can I help', brand: 'you today?' },
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            // Fade out (slow)
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 800, // slow fade out
                useNativeDriver: true,
            }).start(() => {
                // Change text after fade out
                setTextIndex((prev) => (prev + 1) % texts.length);

                // Fade in (slow)
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 800, // slow fade in
                    useNativeDriver: true,
                }).start();
            });
        }, 3000); // slower interval between each switch

        return () => clearInterval(interval);
    }, []);

    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    return (
        <ImageBackground
            source={require('../assets/bg.png')}
            style={styles.container}
            resizeMode="cover"
        >
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

            {/* Logo Ring Layer (center overlapping) */}
            <View style={styles.centered}>
                <View style={styles.outerRing}>
                    <View style={styles.innerCircle}>
                        <Image
                            source={require('../assets/logo.png')}
                            style={styles.logo}
                        />
                    </View>
                </View>
            </View>

            {/* First Layer */}
            <View style={styles.firstLayer}>
                {/* Top Card */}
                <LinearGradient
                    colors={['#6BCDF4', '#3F6DB5']}
                    style={styles.topCard}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 0, y: 0 }}
                >
                    <Animated.Text style={[styles.welcomeText, { opacity: fadeAnim }]}>
                        {texts[textIndex].welcome}
                    </Animated.Text>
                    <Animated.Text style={[
                        texts[textIndex].brand === 'you today?' ? styles.welcomeText2 : styles.brandText,
                        { opacity: fadeAnim },
                    ]}>
                        {texts[textIndex].brand}
                    </Animated.Text>
                </LinearGradient>

                {/* Bottom Card */}
                <View style={styles.bottomCard}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('AboutUs')}
                        style={styles.touchableCard}
                    >
                        <LinearGradient
                            colors={['rgba(21,53,76,0)', 'rgba(21,53,76,1)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            style={styles.infoCard}
                        >
                            <Text style={styles.cardText}>About Us</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() =>
                            navigation.navigate('ServiceScreen')
                        }
                        style={styles.touchableCard}
                    >
                        <LinearGradient
                            colors={['rgba(21,53,76,0)', 'rgba(21,53,76,1)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            style={styles.infoCard}
                        >
                            <Text style={styles.cardText}>Services</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Client Login Button */}
            <TouchableOpacity
                style={styles.loginButton}
                onPress={() => navigation.navigate('LoginScreen')}
            >
                <Text style={styles.loginText}>Client Login</Text>
            </TouchableOpacity>
        </ImageBackground>
    );
};

export default HomeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#050A19',
        alignItems: 'center',
        justifyContent: 'center',
    },
    firstLayer: {
        width: '100%',
        alignItems: 'center',
        marginTop: -180,
    },
    topCard: {
        width: width * 0.8,
        height: 190,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    // welcomeText: {
    //     color: '#fff',
    //     fontSize: 20,
    //     fontWeight: '600',
    //     textShadowColor: '#000',
    //     textShadowOffset: { width: 0, height: 1 },
    //     textShadowRadius: 3,
    //     marginBottom: 5,
    // },
    // brandText: {
    //     color: '#00BFFF',
    //     fontSize: 28,
    //     fontWeight: 'bold',
    //     textShadowColor: '#000',
    //     textShadowOffset: { width: 0, height: 1 },
    //     textShadowRadius: 4,
    //     marginBottom: 90,
    // },
    bottomCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        width: width * 0.85,
    },
    touchableCard: {
        flex: 1,
        marginHorizontal: 4,
        borderRadius: 15,
        overflow: 'hidden',
    },
    infoCard: {
        width: '100%',
        height: 190,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardText: {
        color: '#00BFFF',
        fontSize: 18,
        fontWeight: '600',
        textShadowColor: '#000',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    centered: {
        position: 'absolute',
        top: 260,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 10,
    },
    outerRing: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#2D8ACF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#6BCDF4',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 30,
        elevation: 25,
    },
    innerCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#08101F',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 100,
        height: 100,
        resizeMode: 'contain',
    },
    loginButton: {
        position: 'absolute',
        bottom: 50,
        borderColor: '#00BFFF',
        borderWidth: 2,
        borderRadius: 30,
        paddingVertical: 12,
        paddingHorizontal: 30,
    },
    loginText: {
        color: '#00BFFF',
        fontSize: 16,
        fontWeight: '600',
    },

    welcomeText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
        textShadowColor: '#000',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
        marginBottom: 5,
    },
    brandText: {
        fontWeight: '700',
        textDecorationColor: '#3FA9F5',
        color: '#00BFFF',
        fontSize: 28,
        textShadowColor: '#000',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
        marginBottom: 90,
    },

    welcomeText2: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
        textShadowColor: '#000',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
        marginBottom: 95,
    },
});
