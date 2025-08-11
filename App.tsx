import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useEffect } from 'react';
// Include the OneSignal package
import { OneSignal, LogLevel } from 'react-native-onesignal';
import { API_ENDPOINTS } from './src/constants/apiConfig';
import { Platform } from 'react-native';

async function postJSON(url: string, body: any, token?: string) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { throw new Error(text); }
  if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
  return json;
}

async function getOrCreateInstallId() {
  let id = await AsyncStorage.getItem('install_id');
  if (!id) {
    // UUID simple
    id = 'inst_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    await AsyncStorage.setItem('install_id', id);
  }
  return id;
}

export default function App() {

  // Enable verbose logging for debugging (remove in production)
  OneSignal.Debug.setLogLevel(LogLevel.Verbose);
  // Initialize with your OneSignal App ID
  OneSignal.initialize('eff1e397-c7ae-468d-9cd5-c673ba80821d');
  // Use this method to prompt for push notifications.
  // We recommend removing this method after testing and instead use In-App Messages to prompt for notification permission.
  OneSignal.Notifications.requestPermission(false);

  useEffect(() => {
    const run = async () => {
      try {
        const installId = await getOrCreateInstallId();

        // Tunggu subscription id wujud (kadang-kadang lambat sikit)
        let subscriptionId: string | undefined;
        for (let i = 0; i < 10; i++) {
          // @ts-ignore (bergantung versi SDK)
          subscriptionId = OneSignal.User?.pushSubscription?.id
            // @ts-ignore
            || (await OneSignal.User?.pushSubscription?.getPushSubscriptionId?.());
          if (subscriptionId) break;
          await new Promise(r => setTimeout(r, 800));
        }
        if (!subscriptionId) return;

        // Hantar tanpa token (anonymous). Server terima `user_id = NULL`.
        await postJSON(API_ENDPOINTS.savePushNotifications, {
          install_id: installId,
          subscription_id: subscriptionId,
          platform: Platform.OS,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
      } catch (e) {
        console.warn('sync anon sub failed:', e);
      }
    };
    run();
  }, []);

  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
