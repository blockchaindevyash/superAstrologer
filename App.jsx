import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { StripeProvider } from '@stripe/stripe-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AppNavigator from './src/navigation/AppNavigator';
import { getApiKeys } from './src/api/api';
import { Loader } from './src/config/service';

export default function App() {
  const [stripeKey, setStripeKey] = useState(null);

  useEffect(() => {
    const initApp = async () => {
      try {
        const res = await getApiKeys();
         console.log('App init :', res);
        setStripeKey(res.data.stripe_key);
      } catch (error) {
        console.log('❌ App init error:', error);
      }
    };
    initApp();
  }, []);

  if (!stripeKey) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Loader />
      </View>
    );
  }

  return (
    <StripeProvider publishableKey={stripeKey}>
      <AppNavigator />
    </StripeProvider>
  );
}
