import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    SafeAreaView,
} from 'react-native';
import Modal from 'react-native-modal';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

const { width } = Dimensions.get('window');

const MyProfileScreen = () => {
    const [isModalVisible, setModalVisible] = useState(false);
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();


    const handleSave = () => {
        setModalVisible(true);
    };

    const handleNext = () => {
        setModalVisible(false);
        navigation.navigate('ProfileScreen'); // Navigate to the next screen
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.header}>My Profile</Text>

                <View style={styles.avatarContainer}>
                    <Image source={require('../assets/user.png')} style={styles.avatar} />
                    <TouchableOpacity style={styles.editCircle} />
                </View>

                {/* Basic Details */}
                <Text style={styles.sectionTitle}>Basic Details</Text>

                <Text style={styles.label}>Full Name</Text>
                <TextInput style={styles.input} value="Jane Smith" editable={false} />

                <Text style={styles.label}>Date of Birth</Text>
                <TextInput style={styles.input} value="23 July 2025" editable={false} />

                <Text style={styles.label}>Gender</Text>
                <View style={styles.genderRow}>
                    <View style={[styles.genderButton, styles.disabledGender]}>
                        <Text style={styles.disabledText}>Male</Text>
                    </View>
                    <View style={[styles.genderButton, styles.activeGender]}>
                        <Text style={styles.activeText}>Female</Text>
                    </View>
                </View>

                {/* Contact Details */}
                <Text style={styles.sectionTitle}>Contact Details</Text>

                <Text style={styles.label}>Mobile Number</Text>
                <TextInput style={styles.input} value="+60 11234 5678" editable={false} />

                <Text style={styles.label}>Email</Text>
                <TextInput
                    style={styles.input}
                    value="janesmith@gmail.com"
                    editable={false}
                />
            </ScrollView>

            {/* Static Save Button */}
            <View style={styles.bottomWrapper}>
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}>
                    <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
            </View>

            {/* Modal */}
            <Modal
                isVisible={isModalVisible}
                onBackdropPress={() => setModalVisible(false)}
                animationIn="slideInUp"
                animationOut="slideOutDown"
                useNativeDriver
                style={styles.modal}
            >
                <View style={styles.modalContent}>
                    <Text style={styles.checkmark}>✓</Text>
                    <Text style={styles.modalTitle}>Successfully Saved!</Text>
                    <Text style={styles.modalSub}>Your profile has been updated.</Text>
                    <TouchableOpacity style={styles.modalButton} onPress={handleNext}>
                        <Text style={styles.modalButtonText}>Next</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#EAEAEA',
    },
    content: {
        padding: 20,
        paddingBottom: 100, // enough space above save button
    },
    header: {
        fontSize: 22,
        fontWeight: '700',
        color: '#0066A0',
        marginBottom: 20,
        alignSelf: 'center',
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 25,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    editCircle: {
        width: 20,
        height: 20,
        backgroundColor: '#fff',
        borderRadius: 10,
        position: 'absolute',
        bottom: 5,
        right: width / 2 - 105,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0066A0',
        marginTop: 20,
        marginBottom: 10,
    },
    label: {
        fontSize: 14,
        marginBottom: 5,
        color: '#333',
    },
    input: {
        width: '100%',
        height: 45,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#ddd',
        color: '#555',
    },
    genderRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    genderButton: {
        flex: 1,
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    disabledGender: {
        backgroundColor: '#E2E2E2',
    },
    activeGender: {
        backgroundColor: '#0072B5',
    },
    disabledText: {
        color: '#999',
        fontWeight: '600',
    },
    activeText: {
        color: '#fff',
        fontWeight: '600',
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
    // Modal Styles
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

export default MyProfileScreen;
