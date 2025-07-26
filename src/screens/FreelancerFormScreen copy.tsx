import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Dimensions,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { submitJoinForm } from '../services/joinService';
import type { JoinFormPayload } from '../services/joinService';

const { width } = Dimensions.get('window');

const rolesLeft = ['Graphic Designer', 'Video', 'Copywriter', 'Photographer', 'Programmer'];
const rolesRight = [
    'Multimedia Designer',
    '2D / 3D Designer',
    'Content Strategies',
    'Digital Marketer',
    'Web Developer',
];

const JoinFormScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        portfolio: '',
    });
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const handleChange = (key: keyof typeof form, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const toggleRole = (role: string) => {
        setSelectedRoles(prev =>
            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        );
    };

    const handleSubmit = async () => {
        if (!form.name || !form.email || !form.phone) {
            Alert.alert('Error', 'Please fill in all required fields.');
            return;
        }

        const payload: JoinFormPayload = {
            ...form,
            roles: selectedRoles,
        };

        try {
            setLoading(true);
            await submitJoinForm(payload);
            Alert.alert('Success', 'You have joined successfully!');
            navigation.navigate('HomeScreen'); // Navigate to HomeScreen after successful submission
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>
                All The Pros <Text style={styles.highlight}>in One Place</Text>
            </Text>

            <TextInput
                style={styles.input}
                placeholder="Name"
                placeholderTextColor="#0072B5"
                value={form.name}
                onChangeText={text => handleChange('name', text)}
            />
            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#0072B5"
                value={form.email}
                onChangeText={text => handleChange('email', text)}
            />
            <TextInput
                style={styles.input}
                placeholder="Phone"
                placeholderTextColor="#0072B5"
                value={form.phone}
                onChangeText={text => handleChange('phone', text)}
            />
            <TextInput
                style={styles.input}
                placeholder="Portfolio"
                placeholderTextColor="#0072B5"
                value={form.portfolio}
                onChangeText={text => handleChange('portfolio', text)}
            />

            <View style={styles.roleWrapper}>
                <View style={styles.roleColumn}>
                    {rolesLeft.map((role, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.roleButton,
                                selectedRoles.includes(role) && styles.roleButtonSelected,
                            ]}
                            onPress={() => toggleRole(role)}
                        >
                            <Text
                                style={[
                                    styles.roleText,
                                    selectedRoles.includes(role) && styles.roleTextSelected,
                                ]}
                            >
                                {role}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <View style={styles.roleColumn}>
                    {rolesRight.map((role, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.roleButton,
                                selectedRoles.includes(role) && styles.roleButtonSelected,
                            ]}
                            onPress={() => toggleRole(role)}
                        >
                            <Text
                                style={[
                                    styles.roleText,
                                    selectedRoles.includes(role) && styles.roleTextSelected,
                                ]}
                            >
                                {role}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
                <Text style={styles.buttonText}>
                    {loading ? 'Submitting...' : 'Join Now'}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#000',
        minHeight: '100%',
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ccc',
        textAlign: 'center',
        marginBottom: 20,
    },
    highlight: {
        color: '#0072B5',
    },
    input: {
        width: width - 40,
        backgroundColor: '#fff',
        borderRadius: 30,
        paddingHorizontal: 20,
        paddingVertical: 14,
        fontSize: 16,
        marginBottom: 12,
        color: '#0072B5',
    },
    roleWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 20,
        gap: 20,
    },
    roleColumn: {
        flex: 1,
        gap: 12,
    },
    roleButton: {
        borderWidth: 1,
        borderColor: '#0072B5',
        borderRadius: 30,
        paddingVertical: 10,
        alignItems: 'center',
        backgroundColor: 'black',
    },
    roleButtonSelected: {
        backgroundColor: '#0072B5',
    },
    roleText: {
        color: '#0072B5',
        fontWeight: '600',
    },
    roleTextSelected: {
        color: '#fff',
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

export default JoinFormScreen;
