import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import COLORS from '../../config/colors';
import { Loader, AppStatusBar, BackButton } from '../../config/service';
import AsyncStorage from '@react-native-async-storage/async-storage'
import { fetchChatHistory, fetchChatList, onGetCommonApi } from '../../api/api'
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AdminChatHistory = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [history, setHistory] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)
  const [profile, setProfile] = React.useState(null)
  const [refreshing, setRefreshing] = React.useState(false);
  const [filterHistory, setFilterHistory] = React.useState([]);
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    let mounted = true
    AsyncStorage.getItem('userProfile').then(str => {
      if (!mounted) return
      if (str) {
        try {
          setProfile(JSON.parse(str))
        } catch (e) {
          // ignore
        }
      }
    })
  }, [])

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const incomingCallData = await AsyncStorage.getItem('INCOMING_CALL_DATA');
      const userId = await AsyncStorage.getItem("userId");
      console.log('Token:::', incomingCallData);
      if (incomingCallData) {
        let notificationData = JSON.parse(incomingCallData);
        await AsyncStorage.removeItem('INCOMING_CALL_DATA');
        navigation.navigate('VideoCallScreen', {
          data: {
            agoraToken: notificationData?.agoraToken,
            channelName: notificationData?.channelName,
            uid: Number(userId),
            name: notificationData?.callerName,
          }
        });
      } else {
        const res = await onGetCommonApi('admin-chat-list')
        const items = Array.isArray(res?.data?.data) ? res.data?.data : []
        console.log('Get History Data:', items);
        setHistory(items)
        setFilterHistory(items);
      }
    } catch (e) {
      setError('Failed to load history')
    } finally {
      setLoading(false)
    }
  }

  // const fmtTimeString = (ts) => {
  //   if (!ts) return ''
  //   const d = new Date(ts)
  //   let hrs = d.getHours()
  //   const mins = d.getMinutes()
  //   const ampm = hrs >= 12 ? 'PM' : 'AM'
  //   hrs = hrs % 12
  //   if (hrs === 0) hrs = 12
  //   const m = mins < 10 ? `0${mins}` : mins
  //   return `${hrs}:${m} ${ampm}`
  // }


  // const fmtTimeString = (ts) => {
  //   if (!ts) return '';

  //   const d = new Date(ts);
  //   const now = new Date();

  //   const isToday =
  //     d.getDate() === now.getDate() &&
  //     d.getMonth() === now.getMonth() &&
  //     d.getFullYear() === now.getFullYear();

  //   if (isToday) {
  //     // 👉 Show time
  //     let hrs = d.getHours();
  //     const mins = d.getMinutes();
  //     const ampm = hrs >= 12 ? 'PM' : 'AM';

  //     hrs = hrs % 12;
  //     if (hrs === 0) hrs = 12;

  //     const m = mins < 10 ? `0${mins}` : mins;

  //     return `${hrs}:${m} ${ampm}`;
  //   } else {
  //     // 👉 Show date (DD/MM/YYYY or customize)
  //     const day = d.getDate();
  //     const month = d.getMonth() + 1;
  //     const year = d.getFullYear();

  //     return `${day}/${month}/${year}`;
  //   }
  // };


  const fmtTimeString = (ts) => {
    if (!ts) return '';

    const d = new Date(ts);
    const now = new Date();

    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    if (isToday) {
      let hrs = d.getHours();
      const mins = d.getMinutes();
      const ampm = hrs >= 12 ? 'PM' : 'AM';

      hrs = hrs % 12;
      if (hrs === 0) hrs = 12;

      return `${hrs}:${mins < 10 ? '0' + mins : mins} ${ampm}`;
    }

    if (isYesterday) {
      return "Yesterday";
    }

    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const onSearch = (text) => {
    setSearch(text);

    if (!text) {
      setFilterHistory(history);
      return;
    }

    const searchText = text.toLowerCase();

    const filtered = history.filter(item => {
      const isAstrologer = item?.sender?.user_type === 'astrologer';

      const nameToSearch = isAstrologer
        ? item?.receiver?.name   // 🔥 if sender is astrologer
        : item?.sender?.name;    // 🔥 otherwise sender

      return nameToSearch?.toLowerCase().includes(searchText);
    });

    setFilterHistory(filtered);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom, paddingTop: insets.top }]}>
      <AppStatusBar />
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greetingTitle}>
              {profile?.name ? `Namaste, ${profile.name}` : 'Namaste! Welcome'}
            </Text>
            <Text style={styles.greetingSubText}>
              Explore your cosmic journey today
            </Text>
          </View>
          <View style={styles.profileBadge}>
            <Ionicons name="person-circle-outline" size={42} color={COLORS.primary} />
          </View>
        </View>
      </View>
      {loading ? (
        <Loader />
      ) : error ? (
        <View style={{ padding: 16 }}>
          <Text style={{ color: 'red' }}>{error}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} />
        }>
          <TextInput
            value={search}
            placeholder={'Search...'}
            placeholderTextColor={COLORS.greyColor}
            onChangeText={onSearch}
            style={[styles.searchView, { color: COLORS.black }]}
          />
          {filterHistory.length === 0 && (
            <Text style={{ color: COLORS.muted }}>No history available.</Text>
          )}
          {filterHistory.map((item) => (
            <TouchableOpacity
              style={styles.chatDataView}
              onPress={() => navigation.navigate('AdminMessageList', { name: item?.sender.user_type != 'astrologer' ? item?.sender.name : item.receiver.name, astrologer: item?.sender.user_type == 'astrologer' ? item?.sender : item.receiver, user: item?.sender.user_type != 'astrologer' ? item?.sender : item.receiver })}>
              <View style={{ width: '15%' }}>
                {item?.img ? (
                  <Image source={{ uri: item.img }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: '#eee' }]} />
                )}
              </View>
              <View style={styles.chatSubView}>
                <View style={{ width: '80%' }}>
                  <View style={styles.chatNameView}>
                    <Text style={styles.nameText} numberOfLines={1}>{item?.sender.user_type != 'astrologer' ? `${item.receiver?.name} - ${item.sender?.name}` : `${item.sender?.name} - ${item.receiver?.name}`}</Text>
                    <Text style={styles.lastMessageText}>{fmtTimeString(item.last_message_time)}</Text>
                  </View>
                  <Text style={styles.lastMessageText} numberOfLines={1}>{item.last_message}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      {/* Bottom Navigation */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('AdminChatHistory')}>
          <Ionicons name="chatbubble-outline" size={24} color={COLORS.primary} />
          <Text style={[styles.navLabel, { color: COLORS.primary }]}>Chat History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => { navigation.navigate('Account') }}>
          <Ionicons name="person-outline" size={24} color={COLORS.muted} />
          <Text style={styles.navLabel}>Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default AdminChatHistory;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  greetingSubText: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 2,
  },
  profileBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primaryText,
  },

  content: {
    padding: 16,
    paddingBottom: 100,
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: COLORS.muted,
    marginBottom: 12,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    elevation: 3,
  },

  cardRow: {
    flexDirection: 'row',
    gap: 12,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 28,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },

  name: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primaryText,
  },

  duration: {
    fontSize: 11,
    color: COLORS.primary,
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },

  activeBadge: {
    color: '#2E7D32',
    backgroundColor: '#C8E6C9',
  },

  summary: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 0.9,
    borderColor: "#f3f3f3",
  },

  date: {
    fontSize: 11,
    color: COLORS.muted,
  },

  viewBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  viewBtnActive: {
    backgroundColor: '#2E7D32',
  },

  viewText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  navBar: {
    height: 80,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    alignItems: 'center',
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.muted,
    marginTop: 4,
  },
  chatDataView: {
    width: '100%',
    height: 80,
    flexDirection: 'row',
    paddingHorizontal: 5,
    justifyContent: 'space-between',
    borderBottomWidth: 0.5,
    paddingVertical: 4,
    alignItems: 'center',
  },
  chatSubView: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginLeft: 10,
  },
  chatNameView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
  },
  nameText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primaryText,
    width: '70%',
  },
  lastMessageText: {
    fontSize: 15,
    fontWeight: '400',
    color: COLORS.greyColor,
  },
  searchView: {
    width: '100%',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.greyColor,
    fontFamily: '500',
    fontSize: 17,
    color: COLORS.black,
    borderRadius: 5,
    alignSelf: 'center',
    marginBottom: 10,
  },
});
