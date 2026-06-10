import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Switch,
} from 'react-native';

import COLORS from '../../config/colors';
import { Loader, AppStatusBar, BackButton } from '../../config/service';
import { fetchAccount, logout as apiLogout } from '../../api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Account = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = React.useState(true);
  const [switchLoading, setSwitchLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [user, setUser] = React.useState(null);
  const [chatCount, setChatCount] = React.useState(0);
  const [wallet, setWallet] = React.useState('');
  const [birthSubtitle, setBirthSubtitle] = React.useState('');
  const [contactData, setContactData] = React.useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = React.useState(false);
  const [deletePassword, setDeletePassword] = React.useState('');
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState('');

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchAccount();
        console.log('fetchAccount', res);
        setUser(res?.user || null);
        setChatCount(res?.chat ?? 0);
        setWallet(res?.wallet ?? '');
        setContactData(res.contact);
      } catch (e) {
        setError('Failed to load account');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              try { await apiLogout(); } catch (_) { }
              await AsyncStorage.multiRemove(['token', 'userProfile', 'user', 'userData']);
            } catch (_) { }
            setUser(null);
            setChatCount(0);
            setWallet('');
            navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
          },
        },
      ]
    );
  };

  React.useEffect(() => {
    const loadProfile = async () => {
      try {
        const str = await AsyncStorage.getItem('userProfile');
        if (!str) return;
        const p = JSON.parse(str);
        const fmtDate = (ds) => {
          if (!ds) return '';
          const d = new Date(ds);
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const part = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
          return part;
        };
        const datePart = fmtDate(p?.dob);
        const placePart = p?.place ? p.place : '';
        const subtitle = [datePart, placePart].filter(Boolean).join(' • ');
        if (subtitle) setBirthSubtitle(subtitle);
      } catch (e) {
        // ignore parse errors
      }
    };
    loadProfile();
  }, []);

  const openDeleteModal = () => {
    setDeletePassword('');
    setDeleteError('');
    setDeleteModalVisible(true);
  };

  const closeDeleteModal = () => {
    if (deleteLoading) return;
    setDeleteModalVisible(false);
  };

  const confirmDeleteAccount = async () => {
    try {
      if ((deletePassword || '').trim() !== 'DELETE') {
        setDeleteError('Please type DELETE in capital letters');
        return;
      }
      setDeleteLoading(true);
      setDeleteError('');
      const res = await (await import('../../api/api')).deleteAccount(deletePassword.trim());
      if (res?.msg === 'error') {
        setDeleteError(res?.error || 'Failed to delete account');
        return;
      }
      if (res?.msg === 'done') {
        Alert.alert('Account Deleted', 'Sorry to see you go. Your account data is deleted. We hope you come back!');
        try { await AsyncStorage.multiRemove(['token', 'userProfile', 'user', 'userData']); } catch (_) { }
        setUser(null);
        setChatCount(0);
        setWallet('');
        setDeleteModalVisible(false);
        navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
      }
    } catch (e) {
      setDeleteError('Something went wrong. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const onChangeAIChat = async (newValue) => {
    try {
      setSwitchLoading(true);
      const res = await (await import('../../api/api')).updateAIChat(newValue == 1 ? 0 : 1);
      if (res?.success) {
        console.log('AI Chat setting updated', res);
        setUser(prev => ({ ...prev, ai_chat: newValue == 1 ? 0 : 1 }));
        setSwitchLoading(false);
      } else {
        Alert.alert('Error', res?.error || 'Failed to update setting');
        setSwitchLoading(false);
      }
    } catch (e) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
      setSwitchLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom, paddingTop: insets.top }]}>
      <AppStatusBar backgroundColor={COLORS.secondary} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => user.user_type == "astrologer" ? navigation.navigate('ChatHistory') : user?.user_type == 'admin' ? navigation.navigate('AdminChatHistory') : navigation.navigate('Home')}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loaderContainer}>
            <Loader />
          </View>
        ) : error ? (
          <View style={{ padding: 20 }}>
            <Text style={{ color: 'red' }}>{error}</Text>
          </View>
        ) : (
          <>
            {/* Profile */}
            <View style={styles.profileSection}>
              <View style={styles.avatarWrapper}>
                {/* Sun icon instead of profile image */}
                <View style={styles.sunIconWrap}>
                  <MaterialIcons name="wb-sunny" size={64} color={COLORS.primary} />
                </View>
                <View style={styles.verifiedBadge}>
                  <MaterialIcons name="verified" size={14} color="#fff" />
                </View>
              </View>
              <Text style={styles.userName}>Welcome{user?.name ? `, ${user.name}` : ''}</Text>
              <View style={styles.zodiacRow}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>+{user.country}-{user.phone}</Text>
                </View>
              </View>
              <Text style={styles.quote}>
                "Guided by the stars, grounded by the earth."
              </Text>
            </View>
            {/* {user?.free_minute > 0 && (
              <TouchableOpacity 
                style={styles.freeMinBanner} 
                onPress={() => navigation.navigate('Astrologers')}
                activeOpacity={0.9}
              >
                <View style={styles.freeMinContent}>
                  <View style={styles.freeMinIconBg}>
                    <MaterialIcons name="auto-awesome" size={24} color="#fff" />
                  </View>
                  <View style={styles.freeMinTextContainer}>
                    <Text style={styles.freeMinTitle}>You have {user.free_minute} Free Minutes!</Text>
                    <Text style={styles.freeMinSubtitle}>The stars are aligned. Start your session today.</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color="#fff" />
                </View>
              </TouchableOpacity>
            )} */}
            {/* Stats from API */}
            {(user?.user_type != 'astrologer' && user?.user_type != 'admin') && (
              <View style={styles.statsCard}>
                <TouchableOpacity
                  style={styles.statItem}
                  onPress={() => navigation.navigate('History')}>
                  <Text style={styles.statValue}>{chatCount}</Text>
                  <Text style={styles.statLabel}>TOTAL CHATS</Text>
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity
                  style={styles.statItem}
                  onPress={() => navigation.navigate('Wallet')}>
                  <Text style={styles.statValue}>{wallet}</Text>
                  <Text style={styles.statLabel}>BALANCE</Text>
                </TouchableOpacity>
              </View>
            )}
            {/* Section */}
            <Text style={styles.sectionTitle}>ACCOUNT SETTINGS</Text>
            <MenuItem
              icon="edit"
              title="Update Profile Detail"
              subtitle="Basic information"
              color={COLORS.primary}
              onPress={() => navigation.navigate('Setting', { user })}
            />
            {(user?.user_type != 'astrologer' && user?.user_type != null) && (
              <MenuSwitchItem
                icon="hdr-auto"
                title="Auto AI Chat"
                subtitle={'Not set'}
                color={COLORS.primary}
                value={user?.ai_chat == 1 ? true : false}
                onPress={() => switchLoading ? null : onChangeAIChat(user?.ai_chat)}
              />
            )}
            {(user?.user_type != 'astrologer' && user?.user_type != 'admin') && (
              <MenuItem
                icon="auto-graph"
                title="Birth Chart Details"
                subtitle={birthSubtitle || 'Not set'}
                color={COLORS.primary}
                onPress={() => navigation.navigate('Info')}
              />
            )}
            {(user?.user_type != 'astrologer' && user?.user_type != 'admin') && (
              <MenuItem
                icon="history"
                title="Chat History"
                subtitle="Review your previous readings"
                color="#6366F1"
                onPress={() => navigation.navigate('History')}
              />
            )}
            {(user?.user_type != 'astrologer' && user?.user_type != 'admin') && (
              <MenuItem
                icon="history"
                title="AI History"
                subtitle="Review your previous readings"
                color="#6366F1"
                onPress={() => navigation.navigate('AiHistory')}
              />
            )}
            {(user?.user_type != 'astrologer' && user?.user_type != 'admin') && (
              <MenuItem
                icon="wallet"
                title="Check Wallet Transactions"
                subtitle={`Available balance ${wallet}`}
                color="#F59E0B"
                onPress={() => navigation.navigate('Wallet')}
              />
            )}
            <Text style={styles.sectionTitle}>PREFERENCES</Text>
            <MenuItem
              icon="notifications"
              title="Alerts & Notifications"
              color="#10B981"
              onPress={() => navigation.navigate('Push')}
            />
            <MenuItem
              icon="help-outline"
              title="Support & FAQ"
              color="#64748B"
              onPress={() => navigation.navigate('Contact', { contactData })}
            />
            <MenuItem
              icon="delete"
              title="Delete My Account"
              color={COLORS.danger}
              onPress={openDeleteModal}
            />
            {/* Logout */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <MaterialIcons name="logout" size={22} color="#fff" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
            <Text style={styles.version}>Version 2.5 (18)</Text>
          </>
        )}
      </ScrollView>
      {/* Delete Account Modal */}
      <Modal transparent visible={deleteModalVisible} animationType="fade" onRequestClose={closeDeleteModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Account</Text>
            <Text style={{ color: '#6B7280' }}>Please type DELETE to confirm.</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Type DELETE"
              placeholderTextColor="#9CA3AF"
              editable={!deleteLoading}
              value={deletePassword}
              onChangeText={setDeletePassword}
            />
            {!!deleteError && <Text style={styles.modalError}>{deleteError}</Text>}
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalCancel]} onPress={closeDeleteModal} disabled={deleteLoading}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalConfirm]} onPress={confirmDeleteAccount} disabled={deleteLoading}>
                {deleteLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

/* Reusable Menu Item */
const MenuSwitchItem = ({ icon, title, subtitle, color, onPress, value }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={[styles.menuIcon, { backgroundColor: `${color}15` }]}>
      <MaterialIcons name={icon} size={30} color={color} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.menuTitle}>{title}</Text>
      {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
    </View>
    <Switch value={value} onValueChange={onPress} thumbColor={value ? color : '#E5E7EB'} />
  </TouchableOpacity>
);

/* Reusable Menu Item */
const MenuItem = ({ icon, title, subtitle, color, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={[styles.menuIcon, { backgroundColor: `${color}15` }]}>
      <MaterialIcons name={icon} size={22} color={color} />
    </View>

    <View style={{ flex: 1 }}>
      <Text style={styles.menuTitle}>{title}</Text>
      {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
    </View>

    <MaterialIcons name="chevron-right" size={22} color="#CBD5E1" />
  </TouchableOpacity>
);

export default Account;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.secondary,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    opacity: 0.6,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  editBtn: {
    height: 40,
    width: 40,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: '#fff',
  },
  sunIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: COLORS.primary,
    padding: 6,
    borderRadius: 20,
  },
  userName: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 16,
  },
  zodiacRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  tag: {
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  tagText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  freeMinBanner: {
    backgroundColor: '#6366F1',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    elevation: 6,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  freeMinContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  freeMinIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  freeMinTextContainer: {
    flex: 1,
  },
  freeMinTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  freeMinSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  quote: {
    marginTop: 12,
    fontStyle: 'italic',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 16,
    elevation: 3,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 6,
    color: '#64748B',
  },
  divider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#94A3B8',
    marginHorizontal: 20,
    marginVertical: 14,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    marginTop: 30,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    marginLeft: 8,
  },
  version: {
    textAlign: 'center',
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 16,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
    color: '#111827',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    color: '#111827',
  },
  modalError: {
    color: '#DC2626',
    marginTop: 8,
    fontSize: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  modalCancel: {
    backgroundColor: '#E5E7EB',
    marginRight: 10,
  },
  modalConfirm: {
    backgroundColor: '#DC2626',
  },
});
