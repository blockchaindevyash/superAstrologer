import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';

export const setupIncomingCallListener = (navigationRef) => {
console.log("Get setupIncomingCallListener:");
  // FCM message listener
  const unsubscribeMessage = messaging().onMessage(async (remoteMessage) => {
    console.log("Get onMEssage:", remoteMessage);
    const data = remoteMessage?.data;

    // ---------------- INCOMING CALL ----------------
    if (data?.type === "incoming_call") {

      await notifee.displayNotification({
        title: data.title || "Incoming Call",
        body: `${data.callerName} is calling you`,
        android: {
          channelId: "incoming_calls",
          importance: AndroidImportance.HIGH,
          category: "call",
          ongoing: true,
          autoCancel: false,
          fullScreenAction: { id: "default" },
          actions: [
            {
              title: "Accept",
              pressAction: { id: "accept" }
            },
            {
              title: "Reject",
              pressAction: { id: "reject" }
            }
          ]
        },
        data: data
      });
    }

    // ---------------- CHAT MESSAGE ----------------
    if (data?.type === "chat_message" || data?.type === "astro_chat_message" || data?.type === "admin_chat_message") {

      await notifee.displayNotification({
        title: data.senderName || "New Message",
        body: data.message || "You received a new message",
        android: {
          channelId: "chat_messages",
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: "open_chat",
            launchActivity: "default"
          }
        },
        data: data
      });
    }
  });

  // ---------------- FOREGROUND ACTION HANDLER ----------------
  const unsubscribeForeground = notifee.onForegroundEvent(async ({ type, detail }) => {

    const userId = await AsyncStorage.getItem("userId");

    if (type === EventType.ACTION_PRESS || type === EventType.PRESS) {
      const data = detail.notification?.data;
      console.log("Foreground Event Data::", data);

      // -------- ACCEPT CALL --------
      if (detail.pressAction?.id === "accept") {
        if (navigationRef.isReady()) {
            navigationRef.navigate("VideoCallScreen", {
              data: {
                agoraToken: data?.agoraToken,
                channelName: data?.channelName,
                uid: Number(userId),
                name: data?.callerName,
              }
            });
        }
      }

      // -------- REJECT CALL --------
      if (detail.pressAction?.id === "reject") {
        console.log("Call Rejected");
      }
      // -------- OPEN CHAT --------
      if (detail.pressAction?.id === "open_chat" || type === EventType.PRESS) {
        if (data?.type === 'chat_message') {
          navigationRef.navigate("Chat", {
            astrologer_id: data?.senderId,
            astrologer: {id: data?.senderId, name: data?.senderName, img: data?.senderImg || null},
          });
        }
        if (data?.type === 'astro_chat_message') {
          navigationRef.navigate("AstroChat", {
            name: data?.senderName,
            astrologer: {id: data?.senderId, name: data?.senderName, img: data?.senderImg || null},
          });
        }
        if (data?.type === 'admin_chat_message') {
          const extra = JSON.parse(data?.extraInfo || '{}');
          const hasExtra = Object.keys(extra).length > 0;
          navigationRef.navigate("AdminMessageList", {
            name: extra?.name || '',
            astrologer: hasExtra ? extra : {id: data?.chatId},
            user: {id: data?.senderId, name: data?.senderName},
          });
        } 
      }

      await notifee.cancelNotification(detail.notification.id);
    }
  });

  return () => {
    unsubscribeMessage();
    unsubscribeForeground();
  };
};