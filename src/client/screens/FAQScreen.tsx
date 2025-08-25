import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

const { width } = Dimensions.get('window');

const FAQScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [expandedIndex, setExpandedIndex] = useState<number | null>(0); // auto expand first item

    const faqs = [
        {
            question: 'How to add another account?',
            answer:
                'To add another account, do contact the admin for help if you would like to add account. You may email your concerns at info.finite@gmail.com.',
        },
        {
            question: 'Why I can’t edit in this app?',
            answer:
                'Editing is currently restricted based on your user role. Please contact admin to request access.',
        },
        {
            question: 'How to connect with other members?',
            answer:
                'You may connect with other members through the "Community" tab in the app, if available in your account.',
        },
    ];

    const toggleExpand = (index: number) => {
        setExpandedIndex(index === expandedIndex ? null : index);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>FAQ</Text>
            <ScrollView contentContainerStyle={styles.content}>
                {faqs.map((item, index) => (
                    <View key={index} style={styles.card}>
                        <TouchableOpacity
                            onPress={() => toggleExpand(index)}
                            style={styles.questionBox}
                        >
                            <Text style={styles.questionText}>{index + 1}. {item.question}</Text>
                        </TouchableOpacity>
                        {expandedIndex === index && (
                            <View style={styles.answerBox}>
                                <Text style={styles.answerText}>{item.answer}</Text>
                            </View>
                        )}
                    </View>
                ))}
            </ScrollView>


            <View style={styles.bottomWrapper}>
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={() => navigation.goBack()}>
                    <Text style={styles.saveText}>Back</Text>
                </TouchableOpacity>
            </View>

        </View>
    );
};

export default FAQScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E2E2E2',
        paddingHorizontal: 20,
        paddingTop: 40,
        paddingBottom: 80,
    },
    header: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        color: '#0072B5',
        marginBottom: 20,
    },
    content: {
        paddingBottom: 40,
    },
    card: {
        marginBottom: 10,
    },
    questionBox: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
    },
    questionText: {
        fontSize: 16,
        color: '#000',
    },
    answerBox: {
        backgroundColor: '#DCDCDC',
        marginTop: 6,
        padding: 14,
        borderRadius: 16,
    },
    answerText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    backButton: {
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
        width: width * 0.5,
        backgroundColor: '#0072B5',
        paddingVertical: 14,
        borderRadius: 30,
        alignItems: 'center',
    },
    backText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
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
});
