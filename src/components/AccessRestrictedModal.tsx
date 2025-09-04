import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

interface AccessRestrictedModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

const AccessRestrictedModal: React.FC<AccessRestrictedModalProps> = ({
  visible,
  onClose,
  title = "Access Restricted",
  message = "Your account is currently restricted. Please contact support."
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Warning Icon */}
          <View style={styles.iconContainer}>
            <Icon name="warning" size={48} color="#dc3545" />
          </View>
          
          {/* Title */}
          <Text style={styles.title}>{title}</Text>
          
          {/* Message */}
          <Text style={styles.message}>{message}</Text>
          
          {/* OK Button */}
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: width * 0.85,
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default AccessRestrictedModal;
