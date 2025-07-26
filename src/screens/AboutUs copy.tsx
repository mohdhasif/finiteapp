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
    title: 'Welcome to',
    bold: 'FINITE',
    subtitle: 'Established since 2018, with 10+ years experience in the industry.',
    background: {
      stars: require('../assets/bg.png'),
      wave: require('../assets/wave.png'),
      bubbles: require('../assets/bubbles.png'),
    },
    button: 'Back',
  },
];

const AboutUs = () => {
  const renderItem = ({ item }: any) => (
    <ImageBackground source={item.background.stars} style={styles.slide}>
      <Image source={item.background.wave} style={styles.bgWave} />
      <Image source={item.background.bubbles} style={styles.bubbles} />

      <View style={styles.overlay}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.bold}>{item.bold}</Text>
        {item.subtitle && <Text style={styles.subtitle}>{item.subtitle}</Text>}

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>{item.button}</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <AppIntroSlider
        data={slides}
        renderItem={renderItem}
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
});
