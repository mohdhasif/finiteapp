import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ImageBackground,
    SafeAreaView,
    StatusBar,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');
const cardSize = (width - 60) / 2;

const services = [
    { id: '1', title: 'Branding', subtitle: 'Brand Identity' },
    { id: '2', title: 'Social Media', subtitle: 'Content / Influencer / Strategy' },
    { id: '3', title: 'Advertising', subtitle: 'Digital Advertising & Outdoor' },
    { id: '4', title: 'Website', subtitle: 'Landing Page & Full Website' },
    { id: '5', title: 'Photo & Video', subtitle: 'Product / Corporate Shoot' },
    { id: '6', title: 'Brand Activation', subtitle: 'Sampling Booth, Roadshow, etc' },
    { id: '7', title: 'Mobile App', subtitle: 'Ready to Use / Custom' },
    { id: '8', title: 'Production', subtitle: 'Printing / Merchandise' },
    { id: '9', title: 'Events', subtitle: 'Launching, conference, Dinner' },
    { id: '10', title: 'Jingle', subtitle: 'Get your daily postings' },
    { id: '11', title: 'Mainstream Media', subtitle: 'TV / Radio / Digital Portal' },
    { id: '12', title: 'Others', subtitle: 'A-la-Cart (Bespoke)' },
];

const ServiceScreen = () => {
    const [selected, setSelected] = useState<string[]>([]);
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const toggleSelect = (id: string) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
            <ImageBackground
                source={require('../assets/bg.png')}
                style={styles.container}
                resizeMode="cover"
            >
                <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
                    <Text style={styles.title}>Pick the services you interested in</Text>

                    {services.map((item) => {
                        const isActive = selected.includes(item.id);

                        return (
                            <TouchableOpacity
                                key={item.id}
                                onPress={() => toggleSelect(item.id)}
                                activeOpacity={0.85}
                                style={{ width: cardSize, marginBottom: 20 }}
                            >
                                {isActive ? (
                                    <LinearGradient
                                        colors={['#00BFFF', '#027FFF']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.card}
                                    >
                                        <View style={[styles.circle, styles.activeCircle]}>
                                            <Text style={[styles.circleText, { color: '#fff' }]}>
                                                {item.title[0]}
                                            </Text>
                                        </View>
                                        <Text style={styles.cardTitle}>{item.title}</Text>
                                        <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                                    </LinearGradient>
                                ) : (
                                    <View style={styles.card}>
                                        <View style={styles.circle}>
                                            <Text style={styles.circleText}>{item.title[0]}</Text>
                                        </View>
                                        <Text style={styles.cardTitle}>{item.title}</Text>
                                        <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                <TouchableOpacity
                    style={styles.discoveryButton}
                    onPress={() => {
                        navigation.navigate('DiscoveryForm', { selectedServices: selected });
                    }}
                >
                    <Text style={styles.discoveryText}>Book Discovery Call</Text>
                </TouchableOpacity>
            </ImageBackground>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        paddingTop: 80,
    },
    title: {
        fontSize: 26,
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 30,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    card: {
        borderRadius: 16,
        height: cardSize,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
    },
    circle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#fff',
        marginBottom: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeCircle: {
        backgroundColor: '#000',
        borderWidth: 2,
        borderColor: '#fff',
    },
    circleText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#000',
    },
    cardTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
    },
    cardSubtitle: {
        color: '#ccc',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 4,
    },
    discoveryButton: {
        marginTop: 20,
        backgroundColor: 'transparent',
        borderColor: '#00BFFF',
        borderWidth: 1.5,
        paddingVertical: 14,
        borderRadius: 30,
        alignItems: 'center',
    },
    discoveryText: {
        color: '#00BFFF',
        fontSize: 18,
        fontWeight: '600',
    },
});

export default ServiceScreen;
