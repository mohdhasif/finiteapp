import React, { useState } from 'react';
import {
    View,
    Text,
    Image,
    ImageBackground,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import AppIntroSlider from 'react-native-app-intro-slider';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

const { width, height } = Dimensions.get('window');

const slides = [
    {
        key: '1',
        type: 'slide1',
        title: 'Welcome to',
        bold: 'FINITE',
        subtitle: 'Established since 2018, with 10+ years experience in the industry.',
        background: {
            stars: require('../assets/bg.png'),
            wave: require('../assets/slide1-wave.png'),
            bubbles: require('../assets/slide1-bubble.png'),
        },
    },
    {
        key: '2',
        type: 'slide2',
        background: {
            stars: require('../assets/bg.png'),
            card: require('../assets/slide2-card.png'),
            logo: require('../assets/slide2-icon.png'),
            star1: require('../assets/slide2-star1.png'),
            star2: require('../assets/slide2-star2.png'),
            star3: require('../assets/slide2-star3.png'),
        },
        subtitle: 'We provide clients with one-stop services, including Facebook Marketing, Google Ads, SEO, Content Marketing, Social Media, Website Development, App Development, and more. We have a professional team specializing in digital marketing with cortication. Our company have been growing eversince.',

    },
    {
        key: '3',
        type: 'slide3',
        background: {
            stars: require('../assets/bg.png'),
            gallery: require('../assets/slide3-gallery.png'),
        },
    },
];

const AboutUs = () => {

    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [activeSlide, setActiveSlide] = useState(0);

    const renderItem = ({ item }: any) => {
        switch (item.type) {
            case 'slide1':
                return (
                    <ImageBackground source={item.background.stars} style={styles.slide}>
                        <Image source={item.background.wave} style={styles.bgWave} />
                        <Image source={item.background.bubbles} style={styles.bubbles} />
                        <View style={styles.overlay}>
                            <Text style={styles.title}>{item.title}</Text>
                            <Text style={styles.bold}>{item.bold}</Text>
                            <Text style={styles.subtitle}>{item.subtitle}</Text>
                        </View>
                    </ImageBackground>
                );
            case 'slide2':
                return (
                    <ImageBackground source={item.background.stars} style={styles.slide}>
                        <Image source={item.background.card} style={styles.slide2Card} />
                        <Image source={item.background.logo} style={styles.slide2Logo} />
                        <Image source={item.background.star1} style={styles.slide2Star1} />
                        <Image source={item.background.star2} style={styles.slide2Star2} />
                        <Image source={item.background.star3} style={styles.slide2Star3} />

                        {/* Text utama */}
                        <View style={styles.slide2TextWrap}>
                            <Text style={styles.slide2Text}>Build Your{'\n'}Future,{'\n'}Build Your Dream</Text>
                        </View>

                        {/* Subtitle bawah */}
                        <View style={styles.slide2SubtitleWrap}>
                            <Text style={styles.slide2Subtitle}>
                                {item.subtitle}
                            </Text>
                        </View>
                    </ImageBackground>
                );

            case 'slide3':
                return (
                    <ImageBackground source={item.background.stars} style={styles.slide}>
                        <Image source={item.background.gallery} style={styles.gallery} />
                        <View style={styles.overlay}>
                            <Text style={styles.title}>
                                All The Pros{'\n'}<Text style={styles.boldBlue}>in One Place</Text>
                            </Text>
                            <Text style={styles.subtitle}>
                                Get your brand be known with{'\n'}services that caters your Marketing needs.
                            </Text>
                        </View>
                    </ImageBackground>
                );
            default:
                return <View><Text>Error loading slide</Text></View>;
        }
    };

    const renderPagination = (activeIndex: number) => (
        <View style={styles.paginationContainer}>
            <View style={styles.dotsContainer}>
                {slides.map((_, i) => (
                    <View
                        key={i}
                        style={[styles.dot, i === activeIndex && styles.activeDot]}
                    />
                ))}
            </View>

            {/* Button Condition */}
            {activeIndex === 2 ? (
                <>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => navigation.navigate('ServiceScreen')}>
                        <Text style={styles.buttonText}>Get Started</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('FreelancerFormScreen')}>
                        <Text style={styles.secondary}>Join us as a Freelancer</Text>
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => navigation.navigate('HomeScreen')}>
                        <Text style={styles.buttonText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Text style={styles.secondary}></Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
            <AppIntroSlider
                data={slides}
                renderItem={renderItem}
                renderPagination={renderPagination}
                onSlideChange={(index) => setActiveSlide(index)}
                showDoneButton={false}
                showNextButton={false}
                showSkipButton={false}
            />
        </SafeAreaView>
    );
};

export default AboutUs;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    slide: {
        flex: 1,
        width,
        height,
        justifyContent: 'flex-end',
        alignItems: 'center',
        position: 'relative',
    },
    bgWave: {
        position: 'absolute',
        top: 0,
        width,
        height: height * 0.65,
        resizeMode: 'cover',
        zIndex: 0,
    },
    bubbles: {
        position: 'absolute',
        top: 60,
        width,
        height: height * 0.5,
        resizeMode: 'contain',
        zIndex: 1,
    },
    gallery: {
        position: 'absolute',
        top: 40,
        width,
        height: height * 0.6,
        resizeMode: 'contain',
    },
    overlay: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingBottom: 180,
        zIndex: 2,
    },
    title: {
        fontSize: 24,
        color: '#fff',
        fontWeight: '300',
        textAlign: 'center',
    },
    bold: {
        fontSize: 32,
        color: '#0af',
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 5,
    },
    boldBlue: {
        color: '#0af',
        fontWeight: 'bold',
    },
    subtitle: {
        color: '#ccc',
        fontSize: 14,
        textAlign: 'center',
        marginVertical: 10,
    },
    button: {
        marginTop: 20,
        borderColor: '#0af',
        borderWidth: 1.5,
        borderRadius: 24,
        paddingHorizontal: 30,
        paddingVertical: 10,
    },
    buttonText: {
        color: '#0af',
        fontWeight: '600',
    },
    paginationContainer: {
        position: 'absolute',
        bottom: 40,
        width: '100%',
        alignItems: 'center',
        zIndex: 10,
    },
    dotsContainer: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
        backgroundColor: '#333',
    },
    activeDot: {
        width: 20,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#fff',
    },
    // Slide 2
    slide2Card: {
        position: 'absolute',
        top: height * 0.2,
        width: width * 0.9,
        height: height * 0.5,
        resizeMode: 'cover',
    },
    slide2Logo: {
        position: 'absolute',
        top: height * 0.08,
        width: 60,
        height: 60,
        resizeMode: 'contain',
    },
    slide2Star1: {
        position: 'absolute',
        top: height * 0.18,
        right: 40,
        width: 30,
        height: 30,
        resizeMode: 'contain',
    },
    slide2Star2: {
        position: 'absolute',
        bottom: height * 0.38,
        left: 40,
        width: 35,
        height: 35,
        resizeMode: 'contain',
    },
    slide2Star3: {
        position: 'absolute',
        bottom: height * 0.2,
        right: 40,
        width: 25,
        height: 25,
        resizeMode: 'contain',
    },
    slide2TextWrap: {
        position: 'absolute',
        top: height * 0.4,
        paddingHorizontal: 40,
        zIndex: 2,
        width: '100%',
    },
    slide2Text: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#E4E4E4',
        textAlign: 'left',
        lineHeight: 40,
    },
    slide2SubtitleWrap: {
        position: 'absolute',
        bottom: height * 0.2,
        paddingHorizontal: 30,
        width: '100%',
    },

    slide2Subtitle: {
        fontSize: 13,
        color: '#ccc',
        textAlign: 'center',
        lineHeight: 20,
        fontWeight: '400',
        marginBottom: 70
    },
    secondary: {
        color: '#999',
        marginTop: 16,
        fontSize: 16,
        textDecorationLine: 'underline',
    },
});
