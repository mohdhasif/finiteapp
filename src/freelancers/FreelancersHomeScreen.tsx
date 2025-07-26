import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';

const FreelancersHomeScreen = () => {
    const { logout } = useAuth();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Freelancer Area</Text>
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
        </View>
    );
};

export default FreelancersHomeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        marginBottom: 30,
    },
    logoutButton: {
        backgroundColor: '#0a7',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 10,
    },
    logoutText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
