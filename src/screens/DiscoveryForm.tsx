import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ImageBackground,
    Dimensions,
    SafeAreaView,
    StatusBar,
    Alert,
    ActivityIndicator
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { submitDiscoveryForm } from '../services/api';

const { width } = Dimensions.get('window');

type DiscoveryFormRouteProp = RouteProp<RootStackParamList, 'DiscoveryForm'>;

const serviceLookup: Record<string, string> = {
    '1': 'Branding – Brand Identity',
    '2': 'Social Media – Content / Influencer / Strategy',
    '3': 'Advertising – Digital Advertising & Outdoor',
    '4': 'Website – Landing Page & Full Website',
    '5': 'Photo & Video – Product / Corporate Shoot',
    '6': 'Brand Activation – Sampling Booth, Roadshow, etc',
    '7': 'Mobile App – Ready to Use / Custom',
    '8': 'Production – Printing / Merchandise',
    '9': 'Events – Launching, Conference, Dinner',
    '10': 'Jingle – Get your daily postings',
    '11': 'Mainstream Media – TV / Radio / Digital Portal',
    '12': 'Others – A-la-Cart (Bespoke)',
};

    // Import same as original

const DiscoveryForm = () => {
    const route = useRoute<DiscoveryFormRouteProp>();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { selectedServices } = route.params;

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [message, setMessage] = useState('');
    const [clientType, setClientType] = useState<'individual' | 'company'>('individual');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!name || !email || !phone || !message) {
            Alert.alert('Missing Info', 'Please fill in all fields.');
            return;
        }

        const formData = {
            clientType,
            name,
            email,
            phone,
            message,
            selectedServices,
        };

        try {
            setLoading(true);
            const result = await submitDiscoveryForm(formData);
            setLoading(false);
            Alert.alert(
                'Submitted!',
                'Your form has been submitted successfully.',
                [{ text: 'OK', onPress: () => navigation.navigate('HomeScreen') }],
                { cancelable: false }
            );
        } catch (error: any) {
            setLoading(false);
            Alert.alert('Submission Error', error.message || 'Something went wrong');
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
            <ImageBackground source={require('../assets/bg.png')} style={styles.container} resizeMode="cover">
                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={styles.title}>Discovery Call Form</Text>

                    {/* Switch Button */}
                    <View style={styles.switchContainer}>
                        <TouchableOpacity
                            style={[
                                styles.switchButton,
                                clientType === 'individual' && styles.switchButtonActive,
                            ]}
                            onPress={() => setClientType('individual')}
                        >
                            <Text
                                style={[
                                    styles.switchText,
                                    clientType === 'individual' && styles.switchTextActive,
                                ]}
                            >
                                Individual
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.switchButton,
                                clientType === 'company' && styles.switchButtonActive,
                            ]}
                            onPress={() => setClientType('company')}
                        >
                            <Text
                                style={[
                                    styles.switchText,
                                    clientType === 'company' && styles.switchTextActive,
                                ]}
                            >
                                Company
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Inputs */}
                    <TextInput
                        style={styles.input}
                        placeholder={clientType === 'individual' ? 'Name' : 'Company Name'}
                        placeholderTextColor="#008CFF"
                        value={name}
                        onChangeText={setName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="#008CFF"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Phone"
                        placeholderTextColor="#008CFF"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                    />
                    <TextInput
                        style={[styles.input, styles.messageInput]}
                        placeholder="Message"
                        placeholderTextColor="#008CFF"
                        value={message}
                        onChangeText={setMessage}
                        multiline
                    />

                    {/* Selected Services */}
                    <View style={styles.servicesContainer}>
                        <Text style={styles.selectedTitle}>Selected Services:</Text>
                        {selectedServices.map((id, idx) => (
                            <Text key={idx} style={styles.serviceItem}>
                                • {serviceLookup[id] || `Service ID: ${id}`}
                            </Text>
                        ))}
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="#00BFFF" />
                        ) : (
                            <Text style={styles.submitText}>Book Discovery Call</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </ImageBackground>
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        width,
        padding: 20,
    },
    content: {
        paddingTop: 60,
        paddingBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 30,
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 30,
    },
    switchButton: {
        paddingVertical: 10,
        paddingHorizontal: 25,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#00BFFF',
        marginHorizontal: 10,
    },
    switchButtonActive: {
        backgroundColor: '#10384C',
    },
    switchText: {
        fontSize: 16,
        color: '#00BFFF',
        fontWeight: '600',
    },
    switchTextActive: {
        color: '#fff',
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 30,
        paddingHorizontal: 20,
        paddingVertical: 14,
        fontSize: 16,
        color: '#000',
        marginBottom: 20,
    },
    messageInput: {
        height: 120,
        textAlignVertical: 'top',
    },
    servicesContainer: {
        marginBottom: 30,
    },
    selectedTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#00BFFF',
        marginBottom: 10,
    },
    serviceItem: {
        fontSize: 14,
        color: '#fff',
        marginBottom: 4,
    },
    submitButton: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: '#00BFFF',
        borderRadius: 30,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 10,
    },
    submitText: {
        color: '#00BFFF',
        fontSize: 18,
        fontWeight: '600',
    },
});

export default DiscoveryForm;
