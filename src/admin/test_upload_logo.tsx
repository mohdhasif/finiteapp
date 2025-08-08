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
import { API_ENDPOINTS } from '../constants/apiConfig';

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

  const uploadLogo = async (
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

    const formData = new FormData();
    formData.append('logo', {
      uri: logo.uri,
      name: logo.fileName || 'logo.jpg',
      type: logo.type || 'image/jpeg',
    } as any); // 👈 cast as any to satisfy TS

    try {
      setUploading(true);

      const res = await fetch(API_ENDPOINTS.uploadLogo, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await res.json();
      setUploading(false);

      if (result.success) {
        Alert.alert('Success', result.message);
      } else {
        Alert.alert('Failed', result.error || 'Something went wrong');
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
      <Button title="Upload Logo" onPress={() => uploadLogo(logo, setUploading)} />
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
