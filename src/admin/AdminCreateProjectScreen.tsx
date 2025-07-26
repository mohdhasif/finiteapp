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
} from 'react-native';
import Modal from 'react-native-modal';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import DropDownPicker from 'react-native-dropdown-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

const { width } = Dimensions.get('window');

const CreateProjectScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [client, setClient] = useState(null);
  const [priority, setPriority] = useState(null);
  const [assigned, setAssigned] = useState(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [clientOpen, setClientOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [assignedOpen, setAssignedOpen] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [pickingStartDate, setPickingStartDate] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);

  const handleDateConfirm = (date: Date) => {
    if (pickingStartDate) {
      setStartDate(date);
    } else {
      setEndDate(date);
    }
    setDatePickerVisible(false);
  };

  const handleSave = () => {
    setModalVisible(true);
  };

  const handleNext = () => {
    setModalVisible(false);
    navigation.goBack(); // or navigation.navigate('AdminHomeScreen');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <Text style={styles.header}>Create New Project</Text>

          <Text style={styles.label}>Project Name</Text>
          <TextInput
            style={styles.input}
            value={projectName}
            onChangeText={setProjectName}
            placeholder="Enter project name"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Client</Text>
          <DropDownPicker
            open={clientOpen}
            setOpen={setClientOpen}
            value={client}
            setValue={setClient}
            items={[
              { label: 'Client A', value: 'clientA' },
              { label: 'Client B', value: 'clientB' },
            ]}
            placeholder="Select client"
            listMode="MODAL"
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Project description"
            placeholderTextColor="#999"
            multiline
          />

          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Start date/time</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => {
                  setPickingStartDate(true);
                  setDatePickerVisible(true);
                }}
              >
                <Text>{startDate ? startDate.toLocaleString() : 'Select start date'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.column}>
              <Text style={styles.label}>End date/time</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => {
                  setPickingStartDate(false);
                  setDatePickerVisible(true);
                }}
              >
                <Text>{endDate ? endDate.toLocaleString() : 'Select end date'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.label}>Priority</Text>
          <DropDownPicker
            open={priorityOpen}
            setOpen={setPriorityOpen}
            value={priority}
            setValue={setPriority}
            items={[
              { label: 'High', value: 'high' },
              { label: 'Medium', value: 'medium' },
              { label: 'Low', value: 'low' },
            ]}
            placeholder="Select priority"
            listMode="MODAL"
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
          />

          <Text style={styles.label}>Assigned to</Text>
          <DropDownPicker
            open={assignedOpen}
            setOpen={setAssignedOpen}
            value={assigned}
            setValue={setAssigned}
            items={[
              { label: 'John Doe', value: 'john' },
              { label: 'Jane Smith', value: 'jane' },
            ]}
            placeholder="Select team member"
            listMode="MODAL"
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
          />
        </View>

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
            <Text style={styles.modalSub}>Your project has been created.</Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleNext}>
              <Text style={styles.modalButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        <DateTimePickerModal
          isVisible={datePickerVisible}
          mode="datetime"
          onConfirm={handleDateConfirm}
          onCancel={() => setDatePickerVisible(false)}
        />
      </KeyboardAvoidingView>
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
    paddingBottom: 100,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0066A0',
    marginBottom: 20,
    alignSelf: 'center',
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    color: '#333',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#555',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
  },
  dropdown: {
    borderColor: '#0072B5',
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 15,
  },
  dropdownContainer: {
    borderColor: '#0072B5',
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

export default CreateProjectScreen;
