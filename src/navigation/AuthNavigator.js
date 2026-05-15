import React, { useState, useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View } from 'react-native';
import { Loader } from '../config/service';
import Welcome from "../screens/welcome/Welcome";
import Home from "../screens/home/Home";
import Astrologers from "../screens/astrologer/Astrologer";
import Chat from "../screens/astrologer/chat";
import Info from "../screens/home/info";
import Profile from "../screens/astrologer/profile";
import History from "../screens/astrologer/History";
import AiHistory from "../screens/astrologer/AiHistory";
import AiHistoryDetails from "../screens/astrologer/AiHistoryDetails";
import Match from "../screens/match/Match";
import Detail from "../screens/match/Detail";
import Kundali from "../screens/kundali/Kundali";
import ViewKundali from "../screens/kundali/ViewKundali";
import Predication from "../screens/predication/Predication";
import ViewPredication from "../screens/predication/ViewPredication";
import Horoscope from "../screens/home/Horoscope";
import ChatHistory from "../screens/astroLogin/ChatHistory";
import AstroChat from "../screens/astroLogin/AstroChat";
import AdminChatHistory from "../screens/superAdmin/AdminChatHistory";
import AdminMessageList from "../screens/superAdmin/AdminMessageList";
import Baby from "../screens/home/Baby";
import Login from "../screens/auth/Login";
import Otp from "../screens/auth/Otp";
import Account from "../screens/auth/Account";
import Setting from "../screens/auth/Setting";
import Wallet from "../screens/auth/Wallet";
import Push from "../screens/auth/Push";
import Contact from "../screens/auth/Contact";
import VideoCallScreen from "../screens/VideoCallScreen";
import CallOptionScreen from "../screens/CallOptionScreen";

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Welcome');

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const loginType = await AsyncStorage.getItem('loginType');
      if (token) {
        if (loginType == 'user') {
          setInitialRoute('Home');
        } else if (loginType == 'admin') {
          setInitialRoute('AdminChatHistory');
        } else {
          setInitialRoute('ChatHistory');
        }
      } else {
        setInitialRoute('Welcome');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setInitialRoute('Welcome');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Loader />
    );
  }

  return (
    <Stack.Navigator initialRouteName={initialRoute}>

      {/* FIRST SCREEN */}
      <Stack.Screen name="Welcome" component={Welcome} options={{ headerShown: false }} />

      <Stack.Screen name="Home" component={Home} options={{ headerShown: false }} />
      <Stack.Screen name="Astrologers" component={Astrologers} options={{ headerShown: false }} />
      <Stack.Screen
        name="Chat"
        component={Chat}
        options={({ route }) => ({ title: route?.params?.name || 'Start Chat' })}
      />
      <Stack.Screen name="History" component={History} options={{ headerShown: false }} />
      <Stack.Screen name="AiHistory" component={AiHistory} options={{ headerShown: false }} />
      <Stack.Screen name="AiHistoryDetails" component={AiHistoryDetails} options={{ headerShown: false }} />
      <Stack.Screen name="ChatHistory" component={ChatHistory} options={{ headerShown: false }} />
      <Stack.Screen name="AstroChat" component={AstroChat} options={({ route }) => ({ title: route?.params?.name || 'Unknown User' })} />
      <Stack.Screen name="AdminChatHistory" component={AdminChatHistory} options={{ headerShown: false }} />
      <Stack.Screen name="AdminMessageList" component={AdminMessageList} options={({ route }) => ({ title: route?.params?.name || 'Unknown User' })} />
      <Stack.Screen name="VideoCallScreen" component={VideoCallScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CallOptionScreen" component={CallOptionScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Profile" component={Profile} options={{ title: 'Astrologer profile' }} />
      <Stack.Screen name="Match" component={Match} options={{ headerShown: false }} />
      <Stack.Screen name="Predication" component={Predication} options={{ headerShown: false }} />
      <Stack.Screen name="Info" component={Info} options={{ headerShown: false }} />
      <Stack.Screen name="Kundali" component={Kundali} options={{ headerShown: false }} />
      <Stack.Screen name="ViewKundali" component={ViewKundali} options={{ headerShown: false }} />
      <Stack.Screen name="ViewPredication" component={ViewPredication} options={{ headerShown: false }} />
      <Stack.Screen name="Horoscope" component={Horoscope} options={{ headerShown: false }} />
      <Stack.Screen name="Detail" component={Detail} options={{ headerShown: false }} />
      <Stack.Screen name="Baby" component={Baby} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
      <Stack.Screen name="Otp" component={Otp} options={{ headerShown: false }} />
      <Stack.Screen name="Account" component={Account} options={{ headerShown: false }} />
      <Stack.Screen name="Setting" component={Setting} options={{ headerShown: false }} />
      <Stack.Screen name="Wallet" component={Wallet} options={{ headerShown: false }} />
      <Stack.Screen name="Push" component={Push} options={{ headerShown: false }} />
      <Stack.Screen name="Contact" component={Contact} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
