import React, { useCallback, useEffect } from 'react'
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Keyboard,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { startChat, sendMessage, endChat, fetchSessionHistory, onAddCommonFormApi, onGetCommonApi } from '../../api/api'
import COLORS from '../../config/colors';
import { useFocusEffect } from '@react-navigation/native'
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import { getApp } from '@react-native-firebase/app';

const AstroChat = ({ route, navigation }) => {
  const { astrologer } = route?.params || {}
  const { id, name, img } = astrologer || {}

  // State declarations
  const [messages, setMessages] = React.useState([])
  const [userProfile, setUserProfile] = React.useState(null)
  const [session_id, setSessionId] = React.useState(null)
  const [availableTopics, setAvailableTopics] = React.useState([])
  const [showTopics, setShowTopics] = React.useState(false)
  const [input, setInput] = React.useState('')
  const [typing, setTyping] = React.useState(false)
  const [elapsed, setElapsed] = React.useState(0)
  const [isEnded, setIsEnded] = React.useState(false)
  const [endingChat, setEndingChat] = React.useState(false)
  const [messageList, setMessageList] = React.useState([]);
  const [messageLoading, setMessageLoading] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [receiverData, setReceiverData] = React.useState(null);

  const listRef = React.useRef(null)
  const timerRef = React.useRef(null)
  const timerStartRef = React.useRef(null)
  const inputRef = React.useRef(null);

  const startTimer = (startMs) => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    timerStartRef.current = typeof startMs === 'number' && startMs > 0 ? startMs : Date.now()
    setElapsed(0)
    timerRef.current = setInterval(() => {
      if (!timerStartRef.current) return
      setElapsed(Math.floor((Date.now() - timerStartRef.current) / 1000))
    }, 1000)
  }

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    timerStartRef.current = null
  }

  const fmtDateString = (ds) => {
    if (!ds) return ''
    const d = new Date(ds)
    const day = d.getDate()
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const mon = months[d.getMonth()]
    const year = d.getFullYear()
    return `${day}-${mon}-${year}`
  }

  const fmtTimeString = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    let hrs = d.getHours()
    const mins = d.getMinutes()
    const ampm = hrs >= 12 ? 'PM' : 'AM'
    hrs = hrs % 12
    if (hrs === 0) hrs = 12
    const m = mins < 10 ? `0${mins}` : mins
    return `${hrs}:${m} ${ampm}`
  }

  // on mount: load profile from storage (independent of session history)
  React.useEffect(() => {
    let mounted = true
    AsyncStorage.getItem('user_data').then(async str => {
      if (!mounted) return
      try {
        const parsed = JSON.parse(str)
        if (!parsed) return
        setUserProfile(parsed)
        console.log('Get UserDataL::::', parsed);
        // Load topics based on astrologer.cates (use first category only)
        const firstCate = astrologer?.cates && astrologer.cate_name.length > 0 ? astrologer.cate_name[0] : null
        const sid = route?.params?.session_id
        if (!sid) {
          setShowTopics(true)
        }
      } catch (e) {
        console.error('Error loading profile:', e)
      }
    })
    return () => { mounted = false }
  }, [])

  useFocusEffect(
    useCallback(() => {
      onGetChatHistory();
    }, [])
  );

  const onGetChatHistory = async () => {
    try {
      setIsLoading(true);
      const response = await onGetCommonApi(`chat-history/${astrologer?.id}?page=1&per_page=100`);
      if (response.data.status) {
        console.log('Get onGetChatHistory', response.data.receiver);
        const apiMessages = response.data.data.data;
        // const messagesWithDates = addDateSeparators(apiMessages);
        // Convert to oldest → newest
        const orderedMessages = [...apiMessages].reverse();

        setMessageList(orderedMessages);
        setReceiverData(response.data.receiver);
        setIsLoading(false);
        setTimeout(() => {
          listRef.current?.scrollToOffset({
            offset: 9999999,
            animated: true,
          });
        }, 100);
        // setMessageList(response.data.data.data);
      }
    } catch (error) {
      setIsLoading(false);
      console.log('Chat History Error:', error);
    }
  };

  useEffect(() => {
    // 1. Ensure backticks are used for string interpolation
    const channelName = `astrochat.${userProfile?.id}`;

    // Ensure backticks or string quotes are used for the URL
    const socket = new WebSocket('wss://single.callingagents.in/app/fskqxclddltkjq0g3zoe?protocol=7&client=mobile&version=1.0');
    if (userProfile?.id) {
      socket.onopen = () => {
        console.log("WebSocket connection established. Requesting to join:", userProfile);
        const subscribeMessage = JSON.stringify({
          event: "pusher:subscribe",
          data: {
            channel: channelName
          }
        });
        socket.send(subscribeMessage);
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Raw Socket Event >>", data.event);

        // 3. Log a confirmation when the server lets you into the channel
        if (data.event === "pusher_internal:subscription_succeeded") {
          console.log(`✅ Successfully subscribed to ${data.channel}`);
        }

        if (data.event === "message.sent" || data.event === ".message.sent") {
          const actualMessage = JSON.parse(data.data);
          const newMessage = actualMessage.data;

          // Prevent echoing your own message twice if you already appended it locally
          if (newMessage.sender_id === userProfile?.id) {
            return;
          }

          setMessageList(prevMessages => {
            const alreadyExists = prevMessages.some(
              msg => msg.id === newMessage.id
            );

            if (alreadyExists) {
              console.log("⚠ Message already exists, skipping:", newMessage.id);
              return prevMessages;
            }

            console.log("✅ Adding new message:", newMessage.id);

            return [...prevMessages, newMessage];
          });
          setTimeout(() => {
            listRef.current?.scrollToOffset({
              offset: 9999999,
              animated: true,
            });
          }, 100);
        }
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      socket.onclose = () => {
        console.log("WebSocket connection closed");
      };
    }
    return () => {
      socket.close();
    };
  }, [userProfile?.id]);

  async function getAccessToken() {
    try {
      const functionsInstance = getFunctions(getApp());
      const generateToken = httpsCallable(functionsInstance, 'generateAccessToken');

      const result = await generateToken();

      console.log("Access Token:", result.data.token);

      return result.data.token;

    } catch (error) {
      console.log("Error:", error);
    }
  }

  const sendUserMessage = async () => {
    inputRef.current?.blur();
    Keyboard.dismiss();
    if (!input.trim()) return;

    try {
      setMessageLoading(true);
      var formdata = new FormData();
      formdata.append("receiver_id", astrologer.id);
      formdata.append("message", input);
      const response = await onAddCommonFormApi('send-message', formdata);
      if (response.data.status) {
        setInput('');
        console.log('Get Messgae::', response.data);
        let dataObject = {
          id: response.data.data.id,
          sender_id: response.data.data.sender_id,
          receiver_id: response.data.data?.receiver_id,
          message: response.data.data?.message,
          filetype: 'text',
          is_seen: 0,
          type: "you",
          created_at: response.data.data?.created_at
        };
        setMessageList(prev => [...prev, dataObject]);
        setMessageLoading(false);
        setTimeout(() => {
          listRef.current?.scrollToOffset({
            offset: 9999999,
            animated: true,
          });
        }, 100);
        // setTimeout(() => {
        //   flatListRef.current?.scrollToOffset({
        //     offset: 0,
        //     animated: true,
        //   });
        // }, 100);

        // ---------------- SEND PUSH NOTIFICATION ----------------
        const accessToken = await getAccessToken();

        await fetch(
          "https://fcm.googleapis.com/v1/projects/super-astro-8243f/messages:send",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              message: {
                token: receiverData?.push_notification,
                android: {
                  priority: "high",
                },
                apns: {
                  payload: {
                    aps: {
                      sound: "default"
                    }
                  }
                },
                data: {
                  type: "chat_message",
                  senderId: String(userProfile?.id),
                  senderName: userProfile?.name,
                  chatId: String(receiverData?.id),
                  message: response.data.data?.message,
                }
              }
            }),
          }
        );
      }
    } catch (error) {
      console.log('onSendMessage Error:', error);
      setMessageLoading(false);
    }
  };

  React.useEffect(() => {
    // scroll to bottom when messages change
    if (listRef.current && listRef.current.scrollToOffset) {
      listRef.current.scrollToOffset({ offset: 99999, animated: true })
    }
  }, [messages, typing])

  // cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const renderItem = ({ item }) => {
    let isUser = item.sender_id == userProfile?.id;
    if (item.type === 'date') {
      return (
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>
            {formatDateLabel(item.date)}
          </Text>
        </View>
      );
    }
    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowRight : styles.msgRowLeft]}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.astroBubble]}>
          <Text style={[styles.msgText, isUser ? styles.userText : styles.astroText]}>{item?.message}</Text>
          <Text style={[styles.timeText, isUser ? styles.userTimeText : null]}>{fmtTimeString(item.created_at)}</Text>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* <KeyboardAvoidingView style={styles.wrapper} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}> */}
      <View style={styles.chatArea}>
        <FlatList
          ref={listRef}
          data={messageList}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        />
      </View>
      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          value={input}
          onChangeText={setInput}
          placeholder={"Type your message..."}
          style={styles.input}
          placeholderTextColor="#A0A0A0"
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn]}
          onPress={sendUserMessage}
          activeOpacity={0.8}
          disabled={isEnded || !input.trim()}
        >
          <Text style={styles.sendText}>➤</Text>
        </TouchableOpacity>
      </View>
      {/* </KeyboardAvoidingView> */}
    </SafeAreaView>
  )
}

// elapsed seconds state and formatter


const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FB' },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  headerImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  topBar: {
    height: 40,
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  timerText: { color: '#666', fontSize: 13, fontWeight: '500' },
  wrapper: { flex: 1 },
  chatArea: { flex: 1 },
  messagesContainer: { padding: 16, paddingBottom: 10 },
  msgRow: { flexDirection: 'row', marginVertical: 8, alignItems: 'flex-end' },
  msgRowLeft: { justifyContent: 'flex-start' },
  msgRowRight: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '82%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  astroBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  userBubble: {
    backgroundColor: '#E7F9E7',
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: '#D4EED4'
  },
  msgText: { fontSize: 16, lineHeight: 22 },
  astroText: { color: '#2D2D2D' },
  userText: { color: '#1B4D1B' },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    color: '#A0A0A0',
  },
  userTimeText: {
    color: '#76A076',
    textAlign: 'right',
  },
  topicsContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingVertical: 16,
    paddingHorizontal: 10,
  },
  topicsHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  topicsScroll: {
    paddingHorizontal: 6,
  },
  topicChip: {
    backgroundColor: '#FFF4F1',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#FFE0D6',
  },
  topicChipText: {
    color: '#FF5722',
    fontSize: 13,
    fontWeight: '600',
  },
  inputRow: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    flexDirection: 'row',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 25 : 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#fff',
    alignItems: 'center'
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F7F8FA',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    fontSize: 15,
    color: '#333'
  },
  sendBtn: {
    marginLeft: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF5722',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF5722',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendText: { color: '#fff', fontWeight: '700', fontSize: 18, marginLeft: 2 },
})

export default AstroChat

function formatElapsed(sec) {
  const s = sec % 60
  const m = Math.floor(sec / 60)
  const mm = m < 10 ? `0${m}` : `${m}`
  const ss = s < 10 ? `0${s}` : `${s}`
  return `${mm}:${ss}`
}