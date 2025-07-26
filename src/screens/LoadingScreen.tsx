import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  ImageBackground,
  Animated,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

type LoadingScreenRouteProp = RouteProp<RootStackParamList, 'LoadingScreen'>;

const { width, height } = Dimensions.get('window');

const LoadingScreen = () => {
  const { login } = useAuth();
  const route = useRoute<LoadingScreenRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const opacityAnim = useRef(new Animated.Value(1)).current;

  const { setUserRoleManual } = useAuth();

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     if (route.params.role === 'client') {
  //       login('client');
  //     } else if (route.params.role === 'admin') {
  //       login('admin');
  //     } else if (route.params.role === 'freelancer') {
  //       login('freelancer');
  //     }
  //   }, 2000);

  //   return () => clearTimeout(timer);
  // }, [navigation]);

  useEffect(() => {
    const redirectAfterDelay = async () => {
      const role = await AsyncStorage.getItem('userRole');

      console.log('ROLE:', role);

      setTimeout(() => {
        if (role) {
          setUserRoleManual(role); // ✅ trigger AppNavigator
        }
      }, 1000); // 2 saat
    };

    redirectAfterDelay();
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <ImageBackground
      source={require('../assets/bg-login.png')}
      style={styles.container}
    >
      <View style={styles.center}>
        <Animated.View style={[styles.glow, { opacity: opacityAnim }]}>
          <Image
            source={require('../assets/logo-loading.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width,
    height,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00f0ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  logo: {
    width: width * 0.5,
    height: height * 0.5,
  },
});

export default LoadingScreen;
