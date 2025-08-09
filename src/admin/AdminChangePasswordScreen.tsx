import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import Modal from 'react-native-modal';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

const AdminChangePasswordScreen = () => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isModalVisible, setModalVisible] = useState(false);
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const handleSave = () => {
        setModalVisible(true);
    };

    const handleNext = () => {
        setModalVisible(false);
        navigation.navigate('AdminProfileScreen');
    };

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.inner}>
                    <Text style={styles.header}>Change Password</Text>

                    <Text style={styles.label}>Old Password</Text>
                    <TextInput
                        style={styles.input}
                        value={oldPassword}
                        onChangeText={setOldPassword}
                        secureTextEntry
                        placeholder="Enter old password"
                    />

                    <Text style={styles.label}>New Password</Text>
                    <TextInput
                        style={styles.input}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry
                        placeholder="Enter new password"
                    />

                    <Text style={styles.label}>Confirm Password</Text>
                    <TextInput
                        style={styles.input}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        placeholder="Confirm new password"
                    />

                    <View style={{ height: 100 }} />
                </ScrollView>

                <View style={styles.bottomWrapper}>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveText}>Save</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            <Modal
                isVisible={isModalVisible}
                onBackdropPress={() => setModalVisible(false)}
                animationIn="slideInUp"
                animationOut="slideOutDown"
                useNativeDriver
                style={styles.modal}
            >
                <View style={styles.modalContent}>
                    <Text style={styles.checkmark}>{'\u2713'}</Text>
                    <Text style={styles.modalTitle}>Successfully Saved!</Text>
                    <Text style={styles.modalSub}>Your password has been updated.</Text>
                    <TouchableOpacity style={styles.modalButton} onPress={handleNext}>
                        <Text style={styles.modalButtonText}>Next</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default AdminChangePasswordScreen;

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#e8e8e8',
    },
    container: {
        flex: 1,
    },
    inner: {
        padding: 24,
        paddingBottom: 40,
    },
    header: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0074c1',
        textAlign: 'center',
        marginBottom: 40,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 6,
        color: '#000',
    },
    input: {
        backgroundColor: '#f4f4f4',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 20,
    },
    bottomWrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#EAEAEA',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#ccc',
    },
    saveButton: {
        backgroundColor: '#0072B5',
        paddingVertical: 14,
        borderRadius: 30,
        alignItems: 'center',
    },
    saveText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },

    modal: {
        justifyContent: 'flex-end',
        margin: 0,
    },
    modalContent: {
        backgroundColor: '#2D71B7',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 30,
        alignItems: 'center',
    },
    checkmark: {
        fontSize: 48,
        color: '#fff',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    modalSub: {
        fontSize: 14,
        color: '#fff',
        marginTop: 5,
        marginBottom: 20,
    },
    modalButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 30,
        paddingVertical: 10,
        borderRadius: 25,
    },
    modalButtonText: {
        color: '#2D71B7',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
