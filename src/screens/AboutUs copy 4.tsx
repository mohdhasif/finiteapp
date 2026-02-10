import React from 'react';
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
        button: 'Back',
    },
    {
        key: '2',
        background: {
            stars: require('../assets/bg.png'),
            card: require('../assets/slide2-card.png'),
            logo: require('../assets/slide2-icon.png'),
            star1: require('../assets/slide2-star1.png'),
            star2: require('../assets/slide2-star2.png'),
            star3: require('../assets/slide2-star3.png'),
        },
        button: 'Back',
    },
    {
        key: '3',
        type: 'slide3',
        background: {
            stars: require('../assets/bg.png'),
            gallery: require('../assets/slide3-gallery.png'),
        },
        button: 'Get Started',
    },
];

const AboutUs = () => {
    const renderItem = ({ item }: any): JSX.Element => {
        if (item.key === '1') {
            return (
                <ImageBackground source={item.background.stars} style={styles.slide}>
                    <Image source={item.background.wave} style={styles.bgWave} />
                    <Image source={item.background.bubbles} style={styles.bubbles} />

                    <View style={styles.overlay}>
                        <Text style={styles.title}>{item.title}</Text>
                        <Text style={styles.bold}>{item.bold}</Text>
                        <Text style={styles.subtitle}>{item.subtitle}</Text>

                        {/* <TouchableOpacity style={styles.button}>
                            <Text style={styles.buttonText}>{item.button}</Text>
                        </TouchableOpacity> */}
                    </View>
                </ImageBackground>
            );
        }

        if (item.key === '2') {
            return (
                <ImageBackground source={item.background.stars} style={styles.slide}>
                    {/* Card */}
                    <Image source={item.background.card} style={styles.slide2Card} />

                    {/* Logo + Stars */}
                    <Image source={item.background.logo} style={styles.slide2Logo} />
                    <Image source={item.background.star1} style={styles.slide2Star1} />
                    <Image source={item.background.star2} style={styles.slide2Star2} />
                    <Image source={item.background.star3} style={styles.slide2Star3} />

                    {/* TEXT ABOVE CARD */}
                    <View style={styles.slide2TextWrap}>
                        <Text style={styles.slide2Text}>Build Your{'\n'}Future,{'\n'}Build Your{'\n'}Dream</Text>
                    </View>

                    {/* Button below */}
                    <View style={styles.overlaySlide2}>
                        {/* <TouchableOpacity style={styles.button}>
                            <Text style={styles.buttonText}>{item.button}</Text>
                        </TouchableOpacity> */}
                    </View>
                </ImageBackground>
            );
        }

        if (item.key === '3') {
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

                        <View style={styles.overlaySlide2}>
                            <TouchableOpacity style={styles.button}>
                                <Text style={styles.buttonText}>{item.button}</Text>
                            </TouchableOpacity>
                        </View>
                        {/* <TouchableOpacity>
                            <Text style={styles.secondary}>Join us as a Freelancer</Text>
                        </TouchableOpacity> */}
                    </View>
                </ImageBackground>
            );
        }

        return <View><Text>Error loading slide</Text></View>;
    };

    const renderPagination = (activeIndex: number) => (
        <View style={styles.paginationContainer}>
            <View style={styles.dotsContainer}>
                {slides.map((_, i) => (
                    <View
                        key={i}
                        style={[
                            styles.dot,
                            i === activeIndex ? styles.activeDot : null,
                        ]}
                    />
                ))}
            </View>

            {/* Button condition */}
            {activeIndex === slides.length - 1 ? (
                <TouchableOpacity style={styles.button} onPress={() => ('Start')}>
                    <Text style={styles.buttonText}>Get Started</Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity style={styles.button} onPress={() => ('Back')}>
                    <Text style={styles.buttonText}>Back</Text>
                </TouchableOpacity>
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
                showDoneButton={false}
                showNextButton={false}
                showSkipButton={false}
                dotStyle={{ backgroundColor: '#444' }}
                activeDotStyle={{ backgroundColor: '#fff', width: 24 }}
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
        left: 0,
        right: 0,
        width,
        height: height * 0.65,
        resizeMode: 'cover',
        zIndex: 0,
    },
    bubbles: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        width,
        height: height * 0.5,
        resizeMode: 'contain',
        zIndex: 1,
    },
    card: {
        position: 'absolute',
        top: 40,
        left: 0,
        right: 0,
        width,
        height: height * 0.6,
        resizeMode: 'contain',
    },
    gallery: {
        position: 'absolute',
        top: 40,
        left: 0,
        right: 0,
        width,
        height: height * 0.6,
        resizeMode: 'contain',
    },
    overlay: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingBottom: 60,
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
    buttonFilled: {
        marginTop: 20,
        backgroundColor: '#0af',
        borderRadius: 24,
        paddingHorizontal: 30,
        paddingVertical: 10,
    },
    buttonTextFilled: {
        color: '#000',
        fontWeight: '600',
    },
    secondary: {
        color: '#999',
        marginTop: 16,
        textDecorationLine: 'underline',
    },
    slide2text: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 40,
        marginTop: height * 0.15,
    },
    // Slide 2
    slide2Card: {
        position: 'absolute',
        top: height * 0.2,
        width: width * 0.95,
        height: height * 0.45,
        resizeMode: 'contain',
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
    overlaySlide2: {
        position: 'absolute',
        bottom: 60,
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    slide2TextWrap: {
        position: 'absolute',
        top: height * 0.32, // adjust ikut card position
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
    paginationContainer: {
        position: 'absolute',
        bottom: 40,
        width: '100%',
        alignItems: 'center',
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
});
