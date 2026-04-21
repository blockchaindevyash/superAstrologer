import React, { useContext, useEffect } from 'react';
import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
import AuthNavigator from './AuthNavigator';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { setupIncomingCallListener } from './NotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionsAndroid, Platform } from 'react-native';

const navigationRef =
  createNavigationContainerRef();

export default function AppNavigator() {
  useEffect(() => {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
    }
    async function createChannel() {
      await notifee.createChannel({
        id: 'incoming_calls',
        name: 'Incoming Calls',
        importance: AndroidImportance.HIGH,
      });

      // Chat channel
      await notifee.createChannel({
        id: 'chat_messages',
        name: 'Chat Messages',
        importance: AndroidImportance.HIGH,
      });
    }

    createChannel();

    const unsubscribe = setupIncomingCallListener(navigationRef);
    // Handle notification press (foreground/background/quit)
    const onForegroundEvent = async ({ type, detail }) => {
      if (type === EventType.PRESS) {
        await handleNotificationPress(detail.notification);
      }
    };

    const onBackgroundEvent = async ({ type, detail }) => {
      if (type === EventType.ACTION_PRESS || type === EventType.PRESS) {
        await handleNotificationPress(detail.notification);
      }
    };

    const unsubscribeForeground = notifee.onForegroundEvent(onForegroundEvent);
    const unsubscribeBackground = notifee.onBackgroundEvent(onBackgroundEvent);

    // Firebase background handler (for data-only or display in killed/background)
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      if (remoteMessage?.data?.type === "incoming_call") {
        await notifee.displayNotification({
          title: "Incoming Call",
          body: `${remoteMessage.data.callerName} is calling you`,
          android: {
            channelId: "incoming_calls",
            importance: 4,
            category: "call",
            ongoing: true,
            autoCancel: false,
            fullScreenAction: { id: "default" },
            actions: [
              {
                title: "Accept",
                pressAction: {
                  id: "accept",
                  launchActivity: "default"
                }
              },
              {
                title: "Reject",
                pressAction: { id: "reject" }
              }
            ]
          },
          data: remoteMessage.data
        });
      }

      // ---------------- CHAT MESSAGE ----------------
      if (remoteMessage?.data?.type === "chat_message") {

        await notifee.displayNotification({
          title: (remoteMessage?.data.senderName) || "New Message",
          body: (remoteMessage?.data.message) || "You received a message",
          android: {
            channelId: "chat_messages",
            importance: AndroidImportance.HIGH,
            pressAction: {
              id: "open_chat",
              launchActivity: "default"
            }
          },
          data: remoteMessage?.data
        });
      }
    });

    return () => {
      unsubscribeForeground(); // ✅ correct
      unsubscribeBackground(); // ✅ correct
      unsubscribe();
    };
  }, []);

  // Extracted handler (reusable)
  const handleNotificationPress = async (notification) => {
    const data = notification?.data || notification?.android?.data;
    const userId = await AsyncStorage.getItem("userId");

    if (data?.type != 'chat_message') {
      navigationRef.navigate("VideoCallScreen", {
        data: {
          agoraToken: data?.agoraToken,
          channelName: data?.channelName,
          uid: Number(userId),
          name: data?.callerName,
        }
      });
    }
    // Cancel notification
    await notifee.cancelNotification(notification.id);
  };

  return (
    <NavigationContainer ref={navigationRef}>
      <AuthNavigator />
    </NavigationContainer>
  );
}
  