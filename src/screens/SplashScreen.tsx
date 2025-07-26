import React, { useEffect, useRef } from 'react';
import {
    View,
    Image,
    StyleSheet,
    Dimensions,
    ImageBackground,
    Animated,
    TouchableOpacity,
    StatusBar,
    SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

const { width, height } = Dimensions.get('window');

type SplashScreenNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    'Splash'
>;

const SplashScreen = () => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const navigation = useNavigation<SplashScreenNavigationProp>();

    useEffect(() => {
        const timeout = setTimeout(() => {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }).start();
        }, 2000);

        return () => clearTimeout(timeout);
    }, []);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
            <ImageBackground
                source={require('../assets/bg.png')}
                style={styles.container}
                resizeMode="cover"
            >
                <View style={styles.centered}>
                    <View style={styles.ringContainer}>
                        <Image source={require('../assets/ring.png')} style={styles.ring} />
                        <Image source={require('../assets/logo.png')} style={styles.logo} />
                    </View>
                </View>

                <Animated.View style={[styles.fingerprintContainer, { opacity: fadeAnim }]}>
                    <TouchableOpacity onPress={() => navigation.navigate('HomeScreen')}>
                        <Image
                            source={require('../assets/fingerprint.png')}
                            style={styles.fingerprint}
                        />
                    </TouchableOpacity>
                </Animated.View>
            </ImageBackground>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width,
        height,
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
    fingerprintContainer: {
        alignItems: 'center',
        marginBottom: 140,
    },
    fingerprint: {
        width: 50,
        height: 50,
        tintColor: '#00BFFF',
    },
});

export default SplashScreen;
