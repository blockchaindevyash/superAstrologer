import React, { useCallback, useEffect, useRef } from 'react'
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
  Modal,
  Button,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { startChat, sendMessage, endChat, fetchSessionHistory, onAddCommonFormApi, onGetCommonApi } from '../../api/api'
import topics from './topic'
import COLORS from '../../config/colors';
import video from '../../images/video.png';
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import { getApp } from '@react-native-firebase/app';
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const Chat = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { astrologer, walletBalance } = route?.params || {}
  const { id, name, img } = astrologer || {}
  const adminRef = useRef(null);
  const allAdminRef = useRef([]);
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
  const [wallet, setWallet] = React.useState(walletBalance || null)
  const [endingChat, setEndingChat] = React.useState(false)
  const [messageList, setMessageList] = React.useState([]);
  const [messageLoading, setMessageLoading] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [receiverData, setReceiverData] = React.useState(null);
  const [showModal, setShowModal] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState(null);
  const [adminData, setAdminData] = React.useState(null);
  const [refresh, setRefresh] = React.useState(false);

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

  const handleBackEndChat = (e) => {
    console.log('handleEndChat called, endingChat:', endingChat)
    if (endingChat) return

    // Use setTimeout to ensure Alert is shown when Activity is ready
    setTimeout(() => {
      Alert.alert(
        'End Chat',
        'Are you sure you want to end this conversation?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'End Chat',
            style: 'destructive',
            onPress: async () => {
              console.log('End Chat confirmed')
              setEndingChat(true)
              try {
                let sid = session_id
                console.log('session_id from state:', sid, session_id)
                if (!sid) sid = route?.params?.session_id
                console.log('session_id from route:', sid, session_id)
                if (!sid) {
                  const savedSid = await AsyncStorage.getItem('session_id')
                  console.log('session_id from AsyncStorage:', savedSid)
                  if (savedSid) sid = savedSid
                }
                if (!sid) {
                  console.warn('No session_id available, skipping endChat')
                  Alert.alert('Error', 'No active session found')
                  setEndingChat(false)
                  return
                }
                console.log('Calling endChat with session_id:', sid)
                setSessionId(null);
                await endChat(sid)
                console.log('endChat successful')
                stopTimer()
                setIsEnded(true)
                navigation.dispatch(e.data.action);
                // navigation.navigate('Astrologers')
              } catch (error) {
                console.error('Error ending chat:', error)
                Alert.alert('Error', 'Failed to end chat. Please try again.')
              } finally {
                setEndingChat(false)
              }
            }
          }
        ]
      )
    }, 100)
  }

  const handleEndChat = () => {
    console.log('handleEndChat called, endingChat:', endingChat)
    if (endingChat) return

    // Use setTimeout to ensure Alert is shown when Activity is ready
    setTimeout(() => {
      Alert.alert(
        'End Chat',
        'Are you sure you want to end this conversation?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'End Chat',
            style: 'destructive',
            onPress: async () => {
              console.log('End Chat confirmed')
              setEndingChat(true)
              try {
                let sid = session_id
                console.log('session_id from state:', sid, session_id)
                if (!sid) sid = route?.params?.session_id
                console.log('session_id from route:', sid, session_id)
                if (!sid) {
                  const savedSid = await AsyncStorage.getItem('session_id')
                  console.log('session_id from AsyncStorage:', savedSid)
                  if (savedSid) sid = savedSid
                }
                if (!sid) {
                  console.warn('No session_id available, skipping endChat')
                  Alert.alert('Error', 'No active session found')
                  setEndingChat(false)
                  return
                }
                console.log('Calling endChat with session_id:', sid)
                setSessionId(null);
                await endChat(sid)
                console.log('endChat successful')
                stopTimer()
                setIsEnded(true)
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate('History');
                }
                // navigation.navigate('Astrologers')
              } catch (error) {
                console.error('Error ending chat:', error)
                Alert.alert('Error', 'Failed to end chat. Please try again.')
              } finally {
                setEndingChat(false)
              }
            }
          }
        ]
      )
    }, 100)
  }

  const onVideoCallFunction = async () => {
    try {
      const admin = adminRef.current;

      const functionsInstance = getFunctions(getApp());
      const generateToken = httpsCallable(functionsInstance, 'generateToken');
      const response = await generateToken({
        appId: '1241194d17a64f37b07cd58e95a6e1b2',
        appCertificate: 'ac6ff36ba7754fa4b54cfa0736e5e083',
        uid: 0,
      });

      const token = response.data.data.token;
      console.log('Get push_notification::', admin);
      let data = {
        agoraToken: token,
        channelName: response.data.data.channelName,
        uid: userProfile?.uid,
        name: 'Me',
      };
      const accessToken = await getAccessToken();

      await fetch(
        "https://fcm.googleapis.com/v1/projects/super-astro-8243f/messages:send",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            message: {
              token: admin?.push_notification,
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
                type: "incoming_call",
                callerName: userProfile?.name,
                agoraToken: token,
                channelName: response.data.data.channelName,
                callerUid: String(userProfile?.uid),
                title: 'Incoming Video Call',
              }
            }
          }),
        }
      );
      navigation.navigate('VideoCallScreen', { data: data });
    } catch (error) {
      console.log('onVideoCallFunction Error:', error);
    }
  };

  // set header button to view astrologer profile
  React.useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitleContainer}>
          {img && <Image source={{ uri: img }} style={styles.headerImage} />}
          <View>
            <TouchableOpacity onPress={() => navigation.navigate('Profile', { astrologer })} activeOpacity={0.7}>
              <Text style={styles.headerTitleText}>{name || 'Astrologer'}</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: '#4CAF50', fontWeight: '600' }}>• Online</Text>
              {wallet !== null && (
                <Text style={{ fontSize: 11, color: '#666', fontWeight: '500', marginLeft: 8 }}>
                  Available Balance: ₹{wallet}
                </Text>
              )}
            </View>
          </View>
        </View>
      ),
      headerRight: () => (
        isEnded ? null : (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity style={{ marginRight: 15 }} onPress={() => onVideoCallFunction()}>
              <Image style={{
                width: 22,
                height: 22,
                resizeMode: 'contain',
              }} source={video} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleEndChat}
              disabled={endingChat}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 15,
                backgroundColor: endingChat ? '#F5F5F5' : '#FFEBEE',
                // marginRight: 10,
                flexDirection: 'row',
                alignItems: 'center',
                opacity: endingChat ? 0.6 : 1
              }}
            >
              {endingChat && (
                <ActivityIndicator
                  size="small"
                  color="#D32F2F"
                  style={{ marginRight: 6 }}
                />
              )}
              <Text style={{ color: '#D32F2F', fontWeight: '700', fontSize: 11 }}>
                {endingChat ? 'Ending...' : 'End Chat'}
              </Text>
            </TouchableOpacity>
          </View>
        )
      ),
      headerStyle: {
        backgroundColor: '#fff',
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
      }
    })
  }, [navigation, astrologer, session_id, img, name, endingChat, wallet, isEnded])

  useEffect(() => {
    if (!session_id) return;
    console.log('SessionEnd Back Button', session_id);
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Prevent default behavior (leaving screen)
      e.preventDefault();

      // Show your modal
      handleBackEndChat(e);
    });

    return unsubscribe;
  }, [navigation, session_id, endingChat, isEnded]);

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

        // if (firstCate) {
        //   const categoryTopics = topics.find(t => t.cate_name === firstCate)
        //   if (categoryTopics) {
        //     setAvailableTopics(categoryTopics.topics || [])
        //   }
        // }

        // // push the profile message
        // const userMsg = {
        //   id: `u${Date.now()}`,
        //   from: 'user',
        //   text: `Name = ${parsed.name}\nDOB = ${fmtDateString(parsed.dob)}\nTime = ${fmtTimeString(parsed.time)}\nPlace = ${parsed.place}\nGender = ${parsed.gender}`,
        //   time: Date.now(),
        // }
        // setMessages([userMsg])
        // If no session provided via params, show topics to start a chat
        const sid = route?.params?.session_id
        if (!sid) {
          handleTopicSelect();
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
        console.log('Get onGetChatHistory', response.data.admin);
        const apiMessages = response.data.data.data;
        // const messagesWithDates = addDateSeparators(apiMessages);
        // Convert to oldest → newest
        if (apiMessages.length === 0) {
          const userProfileData = await AsyncStorage.getItem('userProfile');
          if (userProfileData) {
            const userProfile = JSON.parse(userProfileData);
            setInput(`Name = ${userProfile?.name}\nDOB = ${fmtDateString(userProfile?.dob)}\nTime = ${fmtTimeString(userProfile?.time)}\nPlace = ${userProfile?.place}\nGender = ${userProfile?.gender}`);
            setRefresh(!refresh);
            sendUserMessage();
          }
        } else {
          const admins = response.data.admin || [];
          const orderedMessages = [...apiMessages].reverse();
          setMessageList(orderedMessages);
          setAdminData(response.data.admin);
          allAdminRef.current = admins;
          adminRef.current = admins.find(
            (item) => item?.phone === "6355216949"
          );
          setRefresh(!refresh);
          setReceiverData(response.data.receiver);
          setIsLoading(false);
          setTimeout(() => {
            listRef.current?.scrollToOffset({
              offset: 99999,
              animated: true,
            });
          }, 100);
          // setMessageList(response.data.data.data);
        }
      }
    } catch (error) {
      setIsLoading(false);
      console.log('Chat History Error:', error);
    }
  };

  const addDateSeparators = (messages) => {
    const newData = [];

    for (let i = 0; i < messages.length; i++) {
      const currentItem = messages[i];
      // const currentDate = moment(currentItem.created_at).format('YYYY-MM-DD');

      newData.push(currentItem);

      const nextItem = messages[i + 1];

      if (!nextItem) {
        // Last message → add separator
        newData.push({
          id: `date-${currentItem.created_at}`,
          type: 'date',
          date: currentItem.created_at,
        });
      } else {
        // const nextDate = moment(nextItem.created_at).format('YYYY-MM-DD');
        if (currentItem.created_at !== nextDate) {
          newData.push({
            id: `date-${currentItem.created_at}`,
            type: 'date',
            date: currentItem.created_at,
          });
        }
      }
    }

    return newData;
  };



  // If session_id is provided via route params, fetch its history regardless of user profile
  React.useEffect(() => {
    console.log('Get Session::', route?.params?.session_id);
    const sid = route?.params?.session_id
    if (!sid) return
    let canceled = false

    const loadHistory = async () => {
      setSessionId(sid)
      const statusParam = route?.params?.status
      const ended = String(statusParam).toLowerCase() === 'ended'
      setIsEnded(ended)
      setShowTopics(false)
      console.log('Get Session::', sid);
      try {
        const historyRes = await fetchSessionHistory(sid)
        if (canceled) return
        const items = Array.isArray(historyRes?.data) ? historyRes.data : (Array.isArray(historyRes) ? historyRes : [])
        const mapped = items.map((it, idx) => ({
          id: `h${sid}_${idx}`,
          from: (String(it.sender).toLowerCase() === 'user') ? 'user' : 'astrologer',
          text: it.message || it.text || it.summary || '',
          time: it.time ? Date.parse(it.time) : Date.now()
        })).filter(m => m.text)
        if (mapped.length) setMessages(mapped)

        // If session is active and we have a server start time, start timer from that
        if (!ended) {
          const startedStr = historyRes?.session_started_at || historyRes?.started_at || (historyRes?.meta?.session_started_at)
          let startMs = null
          if (typeof startedStr === 'string' && startedStr.trim().length) {
            const iso = startedStr.replace(' ', 'T')
            const parsed = Date.parse(iso)
            if (!isNaN(parsed)) startMs = parsed
            else {
              try {
                const [datePart, timePart] = startedStr.split(' ')
                const [y, m, d] = (datePart || '').split('-').map(Number)
                const [hh, mm, ss] = (timePart || '').split(':').map(Number)
                const dt = new Date()
                dt.setFullYear(y)
                dt.setMonth((m || 1) - 1)
                dt.setDate(d || 1)
                dt.setHours(hh || 0, mm || 0, ss || 0, 0)
                startMs = dt.getTime()
              } catch { }
            }
          }
          startTimer(startMs || undefined)
        }
      } catch (err) {
        if (!canceled) console.error('Error loading session history:', err)
      }
    }

    loadHistory()
    return () => { canceled = true }
  }, [route?.params?.session_id, route?.params?.status])

  useEffect(() => {
    // 1. Ensure backticks are used for string interpolation
    const channelName = `astrochat.${userProfile?.id}`;

    // Ensure backticks or string quotes are used for the URL
    const socket = new WebSocket('wss://single.callingagents.in/app/fskqxclddltkjq0g3zoe?protocol=7&client=mobile&version=1.0');
    if (userProfile?.id) {
      socket.onopen = () => {
        console.log("WebSocket connection established. Requesting to join:", astrologer);
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
        console.log("Raw Socket Event >>", data);

        // 3. Log a confirmation when the server lets you into the channel
        if (data.event === "pusher_internal:subscription_succeeded") {
          console.log(`✅ Successfully subscribed to ${data.channel}`);
        }

        if (data.event === "message.sent" || data.event === ".message.sent") {
          console.log("✅ Adding new message:", data)
          const actualMessage = JSON.parse(data.data);
          console.log("✅ Adding new message:", actualMessage)
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
              offset: 99999,
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
    // 2. THIS IS THE MOST CRITICAL FIX: Add these dependencies
  }, [userProfile?.id]);

  // Function to display messages sequentially
  const displayMessagesSequentially = (responseText) => {
    const messageParts = responseText.split('|').map(part => part.trim()).filter(part => part.length > 0)

    if (messageParts.length === 0) return

    // Display first message immediately
    const firstMsg = {
      id: `a${Date.now()}`,
      from: 'astrologer',
      text: messageParts[0],
      time: Date.now(),
    }
    setMessages(prev => [...prev, firstMsg])

    // Display remaining messages with 1 second delay each
    messageParts.slice(1).forEach((part, index) => {
      setTimeout(() => {
        const msg = {
          id: `a${Date.now()}_${index}`,
          from: 'astrologer',
          text: part,
          time: Date.now(),
        }
        setMessages(prev => [...prev, msg])
      }, (index + 1) * 1500)
    })
  }

  const showWalletAlert = (msg) => {
    const message = msg || 'Insufficient wallet balance. Please add funds to continue.'
    Alert.alert(
      'Add Money Required',
      message,
      [
        {
          text: 'Go to Wallet',
          onPress: () => navigation.navigate('Wallet'),
          style: 'default',
        },
      ],
      { cancelable: false }
    )
  }

  const handleTopicSelect = async (topic) => {
    setShowTopics(false)
    // Start timer as soon as user selects a topic
    startTimer()
    const msg = { id: `u${Date.now()}`, from: 'user', time: Date.now() }
    setMessages(prev => [...prev, msg])

    // simulate astrologer typing with delay
    setTimeout(() => {
      setTyping(true)
    }, 1000)

    try {
      // Format user info for API
      const formatDateForAPI = (dateStr) => {
        if (!dateStr) return ''
        const d = new Date(dateStr)
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }

      const formatTimeForAPI = (timeStr) => {
        if (!timeStr) return ''
        const d = new Date(timeStr)
        const hours = String(d.getHours()).padStart(2, '0')
        const mins = String(d.getMinutes()).padStart(2, '0')
        return `${hours}:${mins}`
      }
      // const userInfo = {
      //   name: userProfile.name,
      //   dob: formatDateForAPI(userProfile.dob),
      //   tob: formatTimeForAPI(userProfile.time),
      //   pob: userProfile.place,
      //   gender: userProfile.gender.toLowerCase()
      // }
      const response = await startChat(astrologer.id)
      setTyping(false)
      if (response?.error) {
        showWalletAlert(response.error)
        setIsEnded(true)
        stopTimer()
        return
      }
      if (response.session_id) {
        setSessionId(response.session_id.toString())
      }
      // if (response.astrologer_reply) {
      //   displayMessagesSequentially(response.astrologer_reply)
      // } else {
      //   const reply = {
      //     id: `a${Date.now()}`,
      //     from: 'astrologer',
      //     text: 'Thanks for your message.',
      //     time: Date.now(),
      //   }
      //   setMessages(prev => [...prev, reply])
      // }
    } catch (error) {
      console.error('Error sending message:', error)
      setTyping(false)
      const apiMsg = error?.response?.data?.error
      const status = error?.response?.status
      if (apiMsg || status === 402) {
        showWalletAlert(apiMsg)
        setIsEnded(true)
        stopTimer()
        return
      }
      const errorReply = {
        id: `a${Date.now()}`,
        from: 'astrologer',
        text: 'Sorry, I encountered an error. Please try again.',
        time: Date.now(),
      }
      setMessages(prev => [...prev, errorReply])
    }
  }

  // const sendUserMessage = async () => {
  //   const txt = input.trim()
  //   if (!txt) return
  //   if (isEnded) return

  //   const msg = {id: `u${Date.now()}`, from: 'user', text: txt, time: Date.now()}
  //   setMessages(prev => [...prev, msg])
  //   setInput('')

  //   // simulate astrologer typing with delay
  //   setTimeout(() => {
  //     setTyping(true)
  //   }, 1000)

  //   try {
  //     const response = await sendMessage(session_id, txt)

  //     setTyping(false)

  //     // Update wallet balance if returned in response
  //     if (response?.balance !== undefined) {
  //       setWallet(response.balance)
  //     }

  //     if (response?.error) {
  //       showWalletAlert(response.error)
  //       setIsEnded(true)
  //       stopTimer()
  //       return
  //     }

  //     if (response.message) {
  //       displayMessagesSequentially(response.message)
  //     } else {
  //       const reply = {
  //         id: `a${Date.now()}`,
  //         from: 'astrologer',
  //         text: 'Thanks for your message.',
  //         time: Date.now(),
  //       }
  //       setMessages(prev => [...prev, reply])
  //     }
  //   } catch (error) {
  //     console.error('Error sending message:', error)
  //     setTyping(false)
  //     const apiMsg = error?.response?.data?.error
  //     const status = error?.response?.status
  //     if (apiMsg || status === 402) {
  //       showWalletAlert(apiMsg)
  //       setIsEnded(true)
  //       stopTimer()
  //       return
  //     }
  //     const errorReply = {
  //       id: `a${Date.now()}`,
  //       from: 'astrologer',
  //       text: 'Sorry, I encountered an error. Please try again.',
  //       time: Date.now(),
  //     }
  //     setMessages(prev => [...prev, errorReply])
  //   }
  // }

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
      const admins = allAdminRef.current || [];
      setMessageLoading(true);
      // let raw = JSON.stringify({
      //   receiver_id: receiverData?.id,
      //   message: messageText
      // });
      var formdata = new FormData();
      formdata.append("receiver_id", astrologer.id);
      formdata.append("message", input);
      const response = await onAddCommonFormApi('send-message', formdata);
      if (response.data.status) {
        setInput('');
        console.log('Get Message::', response.data);
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
            offset: 99999,
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
                  type: "astro_chat_message",
                  senderId: String(userProfile?.id),
                  senderName: userProfile?.name,
                  chatId: String(receiverData?.id),
                  message: response.data.data?.message,
                  extraInfo: JSON.stringify(receiverData)
                }
              }
            }),
          }
        );

        const notifyPromises = admins
          .filter(admin =>
            admin?.push_notification &&
            admin?.id !== userProfile?.id // skip self if needed
          )
          .map(admin =>
            fetch(
              "https://fcm.googleapis.com/v1/projects/super-astro-8243f/messages:send",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                  message: {
                    token: admin.push_notification,
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
                      type: "admin_chat_message",
                      senderId: String(userProfile?.id),
                      senderName: userProfile?.name,
                      chatId: String(receiverData?.id),
                      message: response.data.data?.message,
                      extraInfo: JSON.stringify(receiverData)
                    }
                  }
                }),
              }
            )
          );

        await Promise.all(notifyPromises); // 🚀 parallel calls
      }
    } catch (error) {
      console.log('onSendMessage Error:', error);
      setMessageLoading(false);
    }
  };

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
    <SafeAreaView style={[styles.safe, { paddingBottom: insets.bottom }]}>
      {/* <KeyboardAvoidingView style={styles.wrapper} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}> */}
   
      <View style={styles.topBar}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isEnded ? '#9E9E9E' : '#4CAF50', marginRight: 8 }} />
        <Text style={{ fontSize: 13, fontWeight: '600', color: isEnded ? '#9E9E9E' : '#4CAF50', flex: 1 }}>{isEnded ? 'Ended' : 'Live'}</Text>
        <Text style={styles.timerText}>{formatElapsed(elapsed)}</Text>
      </View>
      <View style={styles.chatArea}>
        <FlatList
          ref={listRef}
          data={messageList}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps={'handled'}
          maintainVisibleContentPosition={{
            minIndexForVisible: 1,
          }}
          bounces={false}
        />

        {/* {typing && (
            <View style={[styles.msgRow, styles.msgRowLeft]}>
              {img && <Image source={{ uri: img }} style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8, marginBottom: 2 }} />}
              <View style={[styles.bubble, styles.astroBubble, { paddingVertical: 8 }]}>
                <Text style={[styles.astroText, { fontStyle: 'italic', fontSize: 13 }]}>typing...</Text>
              </View>
            </View>
          )} */}
      </View>

      {/* {showTopics && availableTopics.length > 0 && (
          <View style={styles.topicsContainer}>
            <Text style={styles.topicsHeader}>Select a topic to start:</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.topicsScroll}
            >
              {availableTopics.map((topic, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.topicChip}
                  onPress={() => handleTopicSelect(topic)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.topicChipText}>{topic}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )} */}

      {/* {!showTopics && ( */}
      <View style={[styles.inputRow, { bottom: insets.bottom }]}>
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
          disabled={messageLoading || !input.trim()}
        >
          <Text style={styles.sendText}>➤</Text>
        </TouchableOpacity>
      </View>
      {/* )} */}
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

export default Chat

function formatElapsed(sec) {
  const s = sec % 60
  const m = Math.floor(sec / 60)
  const mm = m < 10 ? `0${m}` : `${m}`
  const ss = s < 10 ? `0${s}` : `${s}`
  return `${mm}:${ss}`
}