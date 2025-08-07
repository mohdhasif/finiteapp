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

  const uploadLogo = async () => {
    if (!logo) {
      Alert.alert('Please select a logo');
      return;
    }

    const formData = new FormData();
    formData.append('logo', {
      uri: logo.uri,
      name: logo.fileName || 'logo.jpg',
      type: logo.type || 'image/jpeg',
    });

    try {
      setUploading(true);
      const res = await fetch('https://fd9315becb7e.ngrok-free.app/upload_logo.php', {
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
      Alert.alert('Error', 'Upload failed');
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Logo</Text>
      <Button title="Choose Logo" onPress={pickImage} />
      {logo && <Image source={{ uri: logo.uri }} style={styles.preview} />}
      <Button title="Upload Logo" onPress={uploadLogo} />
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
