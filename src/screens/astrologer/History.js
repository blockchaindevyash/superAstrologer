import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';

import COLORS from '../../config/colors';
import { Loader, AppStatusBar, BackButton } from '../../config/service';
import AsyncStorage from '@react-native-async-storage/async-storage'
import { fetchAccount, fetchChatHistory, onGetCommonApi } from '../../api/api'
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const History = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [history, setHistory] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [wallet, setWallet] = React.useState('');
  const [error, setError] = React.useState(null)

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const load = async () => {
    try {
      const profileData = await AsyncStorage.getItem('user_data');
      const parseData = JSON.parse(profileData);
      setLoading(true)
      setError(null)
      const res = await onGetCommonApi(`chat-list`)
      console.log('parseData', res.data.data)
      const items = Array.isArray(res?.data?.data) ? res.data.data : []
      setHistory(items)
    } catch (e) {
      console.log('Error:', e.response);
      setError('Failed to load history')
    } finally {
      setLoading(false)
    }
  }  

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchAccount();
        console.log('fetchAccount', res);
        const wb = res?.wallet;
        let bal = null;
        if (typeof wb === 'number') bal = wb;
        else if (wb && typeof wb === 'object') {
          const possible = wb.balance ?? wb.amount ?? wb.wallet ?? null;
          if (possible != null) {
            const match = String(possible).match(/[\d,.]+/);
            const num = match ? parseFloat(match[0].replace(/,/g, '')) : NaN;
            bal = isNaN(num) ? 0 : num;
          }
        }
        if (typeof wb === 'string') {
          const match = wb.match(/\d[\d,]*\.?\d*/);
          console.log('Parsed wallet balance from string:', match);
          const num = match ? parseFloat(match[0].replace(/,/g, '')) : NaN;
          console.log('Parsed wallet balance from string:', num);
          bal = isNaN(num) ? 0 : num;
        }
        console.log('Parsed wallet balance:', bal);
        if (bal != null && !isNaN(bal)) setWallet(bal);
      } catch (e) {
        setError('Failed to load account');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleView = async (item) => {
    try {
      if (item?.session_id) {
        await AsyncStorage.setItem('session_id', String(item?.session_id))
      }
      const astroId = item?.user.id;
      if (wallet != null && wallet < 30) {
        Alert.alert(
          'Insufficient Balance',
          'Your wallet balance is lower than per minute cost.',
          [
            { text: 'Add balance', onPress: () => navigation.navigate('Wallet') },
            { text: 'Cancel', style: 'cancel' },
          ],
          { cancelable: true }
        );
        return;
      }
      navigation.navigate('Chat', {
        session_id: item?.session_id,
        status: item?.status,
        astrologer_id: astroId,
        walletBalance: wallet,
        astrologer: { id: astroId, name: item.user.name, img: item?.img }
      })
    } catch (e) {}
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom, paddingTop: insets.top }]}>
      <AppStatusBar />
      {/* Header */}
      <View style={styles.header}>
        <BackButton navigation={navigation} />
        <Text style={styles.headerTitle}>Chat History</Text>
        <View style={{ width: 40 }} />
      </View>
      {loading ? (
        <Loader />
      ) : error ? (
        <View style={{ padding: 16 }}>
          <Text style={{color: 'red'}}>{error}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {history.length === 0 && (
            <Text style={{ color: COLORS.muted }}>No history available.</Text>
          )}
          {history.map((h) => (
            <HistoryCard key={h.chat_id} item={h} onView={() => handleView(h)} />
          ))}
        </ScrollView>
      )}
    </View>
  )
}

export default History;

/* ===================== COMPONENT ===================== */

const HistoryCard = ({ item, onView }) => {
  const isActive = String(item?.status).toLowerCase() === 'active'
  const minuteOrActive = isActive ? 'Active' : (item?.minute || '')
 
  const fmtDateTimeString = (ts) => {
    if (!ts) return '';

    const d = new Date(ts);

    // Date
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    // Time
    let hrs = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, '0');

    const ampm = hrs >= 12 ? 'AM' : 'PM';

    hrs = hrs % 12;
    if (hrs === 0) hrs = 12;

    return `${day}/${month}/${year} ${hrs}:${mins} ${ampm}`;
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        {item?.user?.img ? (
          <Image source={{ uri: item.user.img }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: '#eee' }]} />
        )}

        <View style={{ flex: 1 }}>
          <View style={styles.cardHeader}>
            <Text style={styles.name}>{item?.user.name || 'Astrologer'}</Text>
            {/* <Text style={[styles.duration, isActive ? styles.activeBadge : null]}>{minuteOrActive} min</Text> */}
          </View>

          {item?.last_message ? (
            <Text style={styles.summary} numberOfLines={2}>
              {item.last_message}
            </Text>
          ) : (
            <Text style={[styles.summary, { color: COLORS.muted }]}>
              No summary
            </Text>
          )}
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.date}>{fmtDateTimeString(item?.last_message_time) || ''}</Text>
        {isActive ? (
          <TouchableOpacity style={[styles.viewBtn, styles.viewBtnActive]} onPress={onView}>
            <Text style={styles.viewText}>View</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.viewBtn, { backgroundColor: '#eee' }]} onPress={onView}>
            <Text style={[styles.viewText, { color: '#777' }]}>View</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.secondary,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.secondary,
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
    paddingBottom: 40,
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
    width: 56,
    height: 56,
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
});
