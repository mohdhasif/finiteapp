import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';

import { useEffect } from 'react';
// Include the OneSignal package
import { OneSignal, LogLevel } from 'react-native-onesignal';

export default function App() {

  // Enable verbose logging for debugging (remove in production)
  OneSignal.Debug.setLogLevel(LogLevel.Verbose);
  // Initialize with your OneSignal App ID
  OneSignal.initialize('eff1e397-c7ae-468d-9cd5-c673ba80821d');
  // Use this method to prompt for push notifications.
  // We recommend removing this method after testing and instead use In-App Messages to prompt for notification permission.
  OneSignal.Notifications.requestPermission(false);

  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
