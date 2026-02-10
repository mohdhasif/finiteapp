// UploadLogoScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Button,
  Image,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { uploadLogo } from '../services/uploadService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UploadLogoScreen = () => {
  const [logo, setLogo] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = () => {
    launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (!response.didCancel && response.assets && response.assets.length > 0) {
        setLogo(response.assets[0]);
      }
    });
  };

  const uploadLogoHandler = async (
    logo: {
      uri: string;
      fileName?: string;
      type?: string;
    } | null,
    setUploading: (val: boolean) => void
  ) => {
    if (!logo) {
      Alert.alert('Please select a logo');
      return;
    }

    try {
      setUploading(true);
      const token = await AsyncStorage.getItem('userToken') || '';
      const result = await uploadLogo(token, logo);
      setUploading(false);

      if (result.success) {
        Alert.alert('Success', result.message);
      } else {
        Alert.alert('Failed', result.message || 'Something went wrong');
      }
    } catch (error) {
      setUploading(false);
      console.error('Upload error:', error);
      Alert.alert('Error', 'Upload failed');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Logo</Text>
      <Button title="Choose Logo" onPress={pickImage} />
      {logo && <Image source={{ uri: logo.uri }} style={styles.preview} />}
      <Button title="Upload Logo" onPress={() => uploadLogoHandler(logo, setUploading)} />
      {uploading && <ActivityIndicator size="large" style={{ marginTop: 10 }} />}
    </View>
  );
};

export default UploadLogoScreen;

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 20 },
  preview: { width: 200, height: 200, marginVertical: 20 },
});
