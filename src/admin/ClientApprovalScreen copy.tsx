import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { Modal, Portal, Button, Provider as PaperProvider, List } from 'react-native-paper';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { updateClient, approveClient } from '../services/clientService';

const { width } = Dimensions.get('window');

type ClientApprovalScreenRouteProp = RouteProp<RootStackParamList, 'ClientApprovalScreen'>;

type Client = {
  id: number;
  name: string;
  email: string;
  phone: string;
  company_name: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'non-active';
  logo_url: string | null;
  client_type: 'individual' | 'company';
};

const statusOptions = ['pending', 'approved', 'rejected', 'active', 'non-active'];
const typeOptions = ['individual', 'company'];

const ClientApprovalScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ClientApprovalScreenRouteProp>();
  const { client } = route.params;

  const [companyName, setCompanyName] = useState(client.company_name ?? '');
  const [phone, setPhone] = useState(client.phone ?? '');
  const [logoUrl, setLogoUrl] = useState(client.logo_url);
  const [loading, setLoading] = useState(false);

  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusValue, setStatusValue] = useState(client.status ?? 'pending');

  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [clientType, setClientType] = useState(client.client_type ?? 'company');

  const handleUpdate = async () => {

    console.log('client:', client);

    setLoading(true);
    const result = await updateClient({
      client_id: client.client_id,
      company_name: companyName,
      phone,
      status: statusValue,
      client_type: clientType,
      logo_url: logoUrl,
    });

    if (result.success) {
      Alert.alert('Success', 'Client updated successfully');
    } else {
      Alert.alert('Error', result.error || 'Update failed');
    }

    setLoading(false);
  };

  const handleApprove = async () => {
    setLoading(true);
    console.log('client:', client);
    const result = await approveClient(client.client_id);

    if (result.success) {
      setStatusValue('active');
      Alert.alert('Approved', 'Client is now active');
    } else {
      Alert.alert('Error', result.error || 'Approval failed');
    }

    setLoading(false);
  };

  const pickLogo = () => {
    launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (response.assets && response.assets.length > 0) {
        const selected = response.assets[0];
        setLogoUrl(selected.uri || null);
      }
    });
  };

  return (
    <PaperProvider>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Client Details</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollWrapper}>
          <LinearGradient colors={['#007bff', '#00c6ff']} style={styles.card}>
            <Text style={styles.title}>{client.name}</Text>
            <Text style={styles.label}>Email: {client.email}</Text>

            {logoUrl && <Image source={{ uri: logoUrl }} style={styles.logo} resizeMode="contain" />}
            <TouchableOpacity style={styles.uploadBtn} onPress={pickLogo}>
              <Text style={styles.uploadText}>Upload Logo</Text>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Company Name</Text>
            <TextInput value={companyName} onChangeText={setCompanyName} style={styles.input} />

            <Text style={styles.inputLabel}>Phone</Text>
            <TextInput value={phone} onChangeText={setPhone} style={styles.input} keyboardType="phone-pad" />

            <Text style={styles.inputLabel}>Status</Text>
            <Button mode="outlined" onPress={() => setStatusModalVisible(true)} style={styles.option}>
              {statusValue?.toUpperCase() ?? 'SELECT STATUS'}
            </Button>

            <Text style={styles.inputLabel}>Client Type</Text>
            <Button mode="outlined" onPress={() => setTypeModalVisible(true)} style={styles.option}>
              {clientType?.toUpperCase() ?? 'SELECT TYPE'}
            </Button>

            {loading ? (
              <ActivityIndicator color="#fff" style={{ marginVertical: 20 }} />
            ) : (
              <>
                <TouchableOpacity style={styles.button} onPress={handleUpdate}>
                  <Text style={styles.buttonText}>Update</Text>
                </TouchableOpacity>

                {statusValue === 'pending' && (
                  <TouchableOpacity style={[styles.button, { backgroundColor: '#28a745' }]} onPress={handleApprove}>
                    <Text style={styles.buttonText}>Approve Client</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </LinearGradient>
        </ScrollView>

        <Portal>
          <Modal visible={statusModalVisible} onDismiss={() => setStatusModalVisible(false)} contentContainerStyle={styles.modalContainer}>
            {statusOptions.map((option) => (
              <List.Item
                key={option}
                title={option.toUpperCase()}
                onPress={() => {
                  setStatusValue(option);
                  setStatusModalVisible(false);
                }}
              />
            ))}
          </Modal>

          <Modal visible={typeModalVisible} onDismiss={() => setTypeModalVisible(false)} contentContainerStyle={styles.modalContainer}>
            {typeOptions.map((option) => (
              <List.Item
                key={option}
                title={option.toUpperCase()}
                onPress={() => {
                  setClientType(option);
                  setTypeModalVisible(false);
                }}
              />
            ))}
          </Modal>
        </Portal>
      </KeyboardAvoidingView>
    </PaperProvider>
  );
};

export default ClientApprovalScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollWrapper: {
    flexGrow: 1,
    padding: 20,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  label: {
    color: '#fff',
    marginBottom: 6,
  },
  inputLabel: {
    marginTop: 15,
    color: '#fff',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 5,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#0052cc',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  uploadBtn: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 10,
    marginBottom: 10,
  },
  uploadText: {
    color: '#007bff',
    fontWeight: 'bold',
  },
  logo: {
    width: 100,
    height: 100,
    marginVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },


  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },

  option: {
    backgroundColor: '#fff',
    borderRadius: 10,
  }
});