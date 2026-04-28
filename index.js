/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background:', remoteMessage);
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

  if (remoteMessage?.data?.type === "chat_message" || remoteMessage?.data?.type === "astro_chat_message" || remoteMessage?.data?.type === "admin_chat_message") {
        await AsyncStorage.setItem(
          "OPEN_CHAT_DATA",
          JSON.stringify(remoteMessage.data)
        );
        await notifee.displayNotification({
            title: remoteMessage?.data.senderName || "New Message",
            body: remoteMessage?.data.message || "You received a message",
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

notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type === EventType.ACTION_PRESS || type === EventType.PRESS) {
        const data = detail.notification?.data;
        console.log("Background Event Data::", data);
        if (detail.pressAction?.id === "accept") {
            await AsyncStorage.setItem(
                "INCOMING_CALL_DATA",
                JSON.stringify(data)
            );
            await notifee.cancelNotification(detail.notification.id);
        }
        if (detail.pressAction?.id === "reject") {
            await notifee.cancelNotification(detail.notification.id);
            await AsyncStorage.removeItem("INCOMING_CALL_DATA");
        }
        if (detail.pressAction?.id === "open_chat" || type === EventType.PRESS) {
            if (data?.type === "chat_message" || data?.type === "astro_chat_message" || data?.type === "admin_chat_message") {
                await AsyncStorage.setItem(
                    "OPEN_CHAT_DATA",
                    JSON.stringify(data)
                );
            }
            await notifee.cancelNotification(detail.notification.id);
        }
    }
});

AppRegistry.registerComponent(appName, () => App);
