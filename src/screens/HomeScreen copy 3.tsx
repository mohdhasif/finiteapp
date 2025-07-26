import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, ImageBackground } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
    return (
        <ImageBackground
            source={require('../assets/bg.png')}
            style={styles.container}
            resizeMode="cover"
        >
            {/* First Layer */}
            <View style={styles.firstLayer}>
                {/* Top Card */}
                <View style={styles.topCard}>
                    <LinearGradient
                        colors={['#6BCDF4', '#3F6DB5']}
                        style={styles.gradientCard}
                        start={{ x: 0, y: 1 }}     // 👈 bawah
                        end={{ x: 0, y: 0 }}   // 👈 atas
                    >
                        <Text style={styles.welcomeText}>Welcome to</Text>
                        <Text style={styles.brandText}>FINITE</Text>
                    </LinearGradient>
                </View>

                {/* Bottom Card */}
                <View style={styles.bottomCard}>
                    <LinearGradient
                        colors={['rgba(21,53,76,0)', 'rgba(21,53,76,1)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={styles.infoCard}
                    >
                        <Text style={styles.cardText}>About Us</Text>
                    </LinearGradient>

                    <LinearGradient
                        colors={['rgba(21,53,76,0)', 'rgba(21,53,76,1)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={styles.infoCard}
                    >
                        <Text style={styles.cardText}>Services</Text>
                    </LinearGradient>
                </View>

            </View>

            {/* Second Layer - Logo */}
            <View style={styles.centered}>
                <View style={styles.ringContainer}>
                    <Image source={require('../assets/ring.png')} style={styles.ring} />
                    <Image source={require('../assets/logo.png')} style={styles.logo} />
                </View>
            </View>

            {/* Client Login Button */}
            <TouchableOpacity style={styles.loginButton}>
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
        position: 'relative',
        marginTop: 80,
    },
    topCard: {
        width: width * 0.8,
        height: 190,
        backgroundColor: '#2A6DB3',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ translateY: 90 }],
    },
    welcomeText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
        textShadowColor: '#000',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
        transform: [{ translateY: -20 }],
    },
    brandText: {
        color: '#00BFFF',
        fontSize: 28,
        fontWeight: 'bold',
        textShadowColor: '#000',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
        transform: [{ translateY: -20 }],
    },
    bottomCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 100,
        width: width * 0.85,
    },
    infoCard: {
        flex: 1,
        height: 190,
        backgroundColor: '#0B1F3A',
        borderRadius: 15,
        marginHorizontal: 8,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
    },
    cardText: {
        color: '#00BFFF',
        fontSize: 18,
        fontWeight: '600',
        textShadowColor: '#000',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    logoWrapper: {
        position: 'absolute',
        top: '35%',
        zIndex: 2,
        backgroundColor: '#0A1F3B',
        borderRadius: 100,
        padding: 20,
        shadowColor: '#00BFFF',
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
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
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ translateY: -150 }],
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
    gradientCard: {
        flex: 1,
        width: '100%',
        height: '100%',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
