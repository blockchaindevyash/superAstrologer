import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { fetchAstrologerData } from '../../api/api';
import COLORS from '../../config/colors';
import {Loader,AppStatusBar, BackButton} from '../../config/service';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Astrologer({ navigation }) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = React.useState('All');
  const [categories, setCategories] = React.useState([]);
  const [astrologers, setAstrologers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [showFilters, setShowFilters] = React.useState(false);
  const [sortOption, setSortOption] = React.useState(null); // 'priceAsc' | 'expAsc' | null
  const [selectedLanguage, setSelectedLanguage] = React.useState(null);
  const [selectedType, setSelectedType] = React.useState(null);
  const [languages, setLanguages] = React.useState([]);
  const [types, setTypes] = React.useState([]);
  const [userProfile, setUserProfile] = React.useState(null);
  const [activeChats, setActiveChats] = React.useState([]);
  const [walletBalance, setWalletBalance] = React.useState(null);
  const [walletWarnShown, setWalletWarnShown] = React.useState(false);
  const [freeMinutes, setFreeMinutes] = React.useState(0);

  React.useEffect(() => {
    loadAstrologerData();
    checkUserProfile();
  }, []);

  // Refetch astrologers whenever this screen gains focus
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadAstrologerData();
    });
    return unsubscribe;
  }, [navigation]);

  const checkUserProfile = async () => {
    try {
      const profileStr = await AsyncStorage.getItem('userProfile');
      if (profileStr) {
        setUserProfile(JSON.parse(profileStr));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleChatNavigation = async (astrologer, cate_name) => {
    try {
      const userProfileStr = await AsyncStorage.getItem('userProfile');
      if (!userProfileStr) {
        navigation.navigate('Info');
      } else {
        let storedProfile = null;
        try { storedProfile = JSON.parse(userProfileStr); } catch {}
        const freeAvailable = ((storedProfile?.free_count || userProfile?.free_count || 0) > 0) || (freeMinutes || 0) > 0;
        const perMin = parseFloat(astrologer?.price) || 0;
        const insufficient = walletBalance != null && perMin > 0 && walletBalance < perMin;
        if (insufficient) {
          Alert.alert(
            'Insufficient Balance',
            'Your wallet balance is lower than per minute cost.',
            [
              {text: 'Add balance', onPress: () => navigation.navigate('Wallet')},
              {text: 'Cancel', style: 'cancel'},
            ],
            { cancelable: true }
          );
          return;
        }
        navigation.navigate('Chat', { astrologer, cate_name,walletBalance });
      }
    } catch (error) {
      console.error('Error checking user profile:', error);
      navigation.navigate('Info');
    }
  };

  const loadAstrologerData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await fetchAstrologerData();
      
      // Add 'All' category at the beginning
      const allCategory = { id: 'All', name: 'All' };
      setCategories([allCategory, ...(result.data?.cates || [])]);
      const list = result.data?.astrologers || [];
      setAstrologers(list);
      const active = result.data?.active || [];

      console.log("active data",active);

      setActiveChats(Array.isArray(active) ? active : (active ? [active] : []));

      // Wallet balance parsing from API
      const wb = result?.data?.wallet;
      let bal = null;
      if (typeof wb === 'number') bal = wb;
      else if (wb && typeof wb === 'object') {
        const possible = wb.balance ?? wb.amount ?? wb.wallet ?? null;
        bal = possible != null ? parseFloat(possible) : null;
      }
      if (typeof wb === 'string') {
        const num = parseFloat(wb);
        bal = isNaN(num) ? null : num;
      }
      if (bal != null && !isNaN(bal)) setWalletBalance(bal);

      // Free minutes parsing from API
      let fm = result?.data?.free_minute;
      if (typeof fm === 'string') {
        const num = parseFloat(fm);
        fm = isNaN(num) ? 0 : num;
      } else if (typeof fm !== 'number') {
        fm = 0;
      }
      fm = fm > 0 ? fm : 0;
      setFreeMinutes(fm);

      // derive languages and types from astrologers
      const langSet = new Set();
      const typeSet = new Set();
      list.forEach(a => {
        if (a.language) {
          a.language.split(',').map(s => s.trim()).forEach(l => { if (l) langSet.add(l); });
        }
        if (a.type) typeSet.add(a.type);
      });
      setLanguages(Array.from(langSet));
      setTypes(Array.from(typeSet));
      // Show low balance alert once per screen mount (skip if free minutes available)
      if (bal != null && bal < 50 && !walletWarnShown && fm <= 0) {
        setWalletWarnShown(true);
        setTimeout(() => {
          try {
            Alert.alert(
              'Low Balance',
              'atleast balance should be 100 to start an chat',
              [
                { text: 'Add balance', onPress: () => navigation.navigate('Wallet') },
                { text: 'Leave it', style: 'cancel' },
              ],
              { cancelable: true }
            )
          } catch {}
        }, 0)
      }
    } catch (err) {
      console.error('Error loading astrologer data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const base = selected === 'All' 
    ? astrologers 
    : astrologers.filter(a => a.cates?.includes(selected));

  let filtered = base.filter(a => {
    const langOk = selectedLanguage ? (a.language || '').toLowerCase().includes(selectedLanguage.toLowerCase()) : true;
    const typeOk = selectedType ? (a.type || '').toLowerCase() === selectedType.toLowerCase() : true;
    return langOk && typeOk;
  });

  if (sortOption === 'priceAsc') {
    filtered = filtered.slice().sort((x, y) => (x.price || 0) - (y.price || 0));
  } else if (sortOption === 'priceDesc') {
    filtered = filtered.slice().sort((x, y) => (y.price || 0) - (x.price || 0));
  } else if (sortOption === 'expAsc') {
    filtered = filtered.slice().sort((x, y) => (x.exp || 0) - (y.exp || 0));
  } else if (sortOption === 'expDesc') {
    filtered = filtered.slice().sort((x, y) => (y.exp || 0) - (x.exp || 0));
  }

  if (loading) {
    return <Loader/>
  }

  return (
    <SafeAreaView style={[styles.safe, { paddingBottom: insets.bottom, paddingTop: insets.top }]}>
      <View style={styles.container}>
        <AppStatusBar backgroundColor='#fff' barStyle="dark-content" />
        
        <View style={styles.header}>
          <BackButton navigation={navigation} onPress={() => navigation.navigate('Home')} />
          <Text style={styles.headerTitle}>Chat with Astrologers</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Free minutes banner in header area */}
        {freeMinutes > 0 ? (
          <View style={styles.freeBanner}>
            <Icon name="timer" size={18} color="#065F46" style={{ marginRight: 8 }} />
            <Text style={styles.freeText}>Great! You have {freeMinutes} free minutes. Enjoy your chat! 🎉
</Text>
          </View>
        ) : null}
        
        {/* Top horizontal categories (filters) */}
        <View style={styles.topCats}>
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
            renderItem={({ item }) => {
              const active = item.id === selected;
              return (
                <TouchableOpacity
                  onPress={() => setSelected(item.id)}
                  style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Filter Bar */}
        <View style={styles.filterBar}>
          <View style={styles.filterLabelContainer}>
            <Icon name="tune" size={18} color="#64748B" />
            <Text style={styles.filterLabel}>Sort & Filter</Text>
          </View>
          <View style={styles.filterActions}>
            {(selectedLanguage || selectedType || sortOption) ? (
              <TouchableOpacity onPress={() => { setSelectedLanguage(null); setSelectedType(null); setSortOption(null); }}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(true)}>
              <Icon name="keyboard-arrow-down" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>


        {/* Low balance banner */}
        {walletBalance != null && walletBalance < 50 && freeMinutes <= 0 ? (
          <View style={styles.warnBanner}>
            <Icon name="warning-amber" size={18} color="#B45309" style={{ marginRight: 8 }} />
            <Text style={styles.warnText}>atleast balance should be 100 to start an chat</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Wallet')} style={styles.warnBtn}>
              <Text style={styles.warnBtnText}>Add balance</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Astrologer list */}
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="person-off" size={60} color="#CBD5E1" />
              <Text style={styles.emptyText}>No astrologers found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.astrologerCard} 
              onPress={() => handleChatNavigation(item, selected)}
              activeOpacity={0.9}
            >
              <View style={styles.cardHeader}>
                <View style={styles.avatarContainer}>
                  <Image source={{ uri: item.img }} style={styles.astrologerAvatar} />
                  <View style={styles.onlineBadge} />
                </View>
                
                <View style={styles.mainInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.astrologerName} numberOfLines={1}>{item.name}</Text>
                    <Icon name="verified" size={16} color="#4FA7FF" style={{ marginLeft: 4 }} />
                    <View style={{ flex: 1 }} />
                    <View style={styles.priceTag}>
                      {userProfile?.free_count > 0 ? (
                        <Text style={[styles.priceTagText, { color: '#10B981' }]}>FREE</Text>
                      ) : (
                        <Text style={styles.priceTagText}>
                          {(item?.currency || '₹')}{item?.price}/min
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  <Text style={styles.skillsText} numberOfLines={1}>
                    {item.type || 'Vedic Astrology'}
                  </Text>
                  
                  <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                      <Icon name="translate" size={14} color="#64748B" style={{ marginRight: 4 }} />
                      <Text style={styles.detailValue}>{item.language || 'English'}</Text>
                    </View>
                    <View style={[styles.detailItem, { marginLeft: 15 }]}>
                      <Icon name="history-edu" size={14} color="#64748B" style={{ marginRight: 4 }} />
                      <Text style={styles.detailValue}>{item.exp || '0'} yrs exp</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.cardAction}>
                <View style={styles.statsRow}>
                  <View style={styles.ratingBox}>
                    <Icon name="star" size={14} color="#FFB000" />
                    <Text style={styles.ratingText}>4.5</Text>
                  </View>
                  <Text style={styles.orderText}>{item.total_order} orders</Text>
                </View>
                
                {(() => {
                  const freeAvailable = (userProfile?.free_count || 0) > 0 || (freeMinutes || 0) > 0;
                  const perMin = parseFloat(item?.price) || 0;
                  const insufficient = !freeAvailable && walletBalance != null && perMin > 0 && walletBalance < perMin;
                  return (
                    <TouchableOpacity 
                      style={[styles.chatButton, insufficient ? styles.chatButtonDisabled : null]}
                      onPress={() => handleChatNavigation(item, selected)}
                      disabled={insufficient}
                    >
                      <Icon name="chat" size={16} color={insufficient ? '#6B7280' : '#fff'} style={{ marginRight: 6 }} />
                      <Text style={[styles.chatButtonText, insufficient ? { color: '#6B7280' } : null]}>
                        {insufficient ? 'Insufficient balance' : 'Chat Now'}
                      </Text>
                    </TouchableOpacity>
                  );
                })()}
              </View>
            </TouchableOpacity>
          )}
        />

        {/* Filters Modal */}
        <Modal visible={showFilters} transparent animationType="slide" onRequestClose={() => setShowFilters(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Sort & Filter</Text>
                <TouchableOpacity onPress={() => setShowFilters(false)}>
                  <Icon name="close" size={22} color="#666" />
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
                {/* Sort section */}
                <Text style={styles.sectionTitle}>Price</Text>
                <View style={styles.chipRow}>
                  <TouchableOpacity
                    style={[styles.chip, sortOption === 'priceAsc' ? styles.chipActive : styles.chipInactive]}
                    onPress={() => setSortOption(sortOption === 'priceAsc' ? null : 'priceAsc')}
                  >
                    <Icon name="arrow-upward" size={16} color={sortOption === 'priceAsc' ? '#fff' : '#666'} />
                    <Text style={[styles.chipText, sortOption === 'priceAsc' ? styles.chipTextActive : styles.chipTextInactive]}>Low to High</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.chip, sortOption === 'priceDesc' ? styles.chipActive : styles.chipInactive]}
                    onPress={() => setSortOption(sortOption === 'priceDesc' ? null : 'priceDesc')}
                  >
                    <Icon name="arrow-downward" size={16} color={sortOption === 'priceDesc' ? '#fff' : '#666'} />
                    <Text style={[styles.chipText, sortOption === 'priceDesc' ? styles.chipTextActive : styles.chipTextInactive]}>High to Low</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>Experience</Text>
                <View style={styles.chipRow}>
                  <TouchableOpacity
                    style={[styles.chip, sortOption === 'expAsc' ? styles.chipActive : styles.chipInactive]}
                    onPress={() => setSortOption(sortOption === 'expAsc' ? null : 'expAsc')}
                  >
                    <Icon name="arrow-upward" size={16} color={sortOption === 'expAsc' ? '#fff' : '#666'} />
                    <Text style={[styles.chipText, sortOption === 'expAsc' ? styles.chipTextActive : styles.chipTextInactive]}>Low to High</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.chip, sortOption === 'expDesc' ? styles.chipActive : styles.chipInactive]}
                    onPress={() => setSortOption(sortOption === 'expDesc' ? null : 'expDesc')}
                  >
                    <Icon name="arrow-downward" size={16} color={sortOption === 'expDesc' ? '#fff' : '#666'} />
                    <Text style={[styles.chipText, sortOption === 'expDesc' ? styles.chipTextActive : styles.chipTextInactive]}>High to Low</Text>
                  </TouchableOpacity>
                </View>

                {/* Language section */}
                <Text style={styles.sectionTitle}>Language</Text>
                <View style={styles.chipRow}>
                  {languages.map(l => (
                    <TouchableOpacity
                      key={l}
                      style={[styles.chip, selectedLanguage === l ? styles.chipActive : styles.chipInactive]}
                      onPress={() => setSelectedLanguage(selectedLanguage === l ? null : l)}
                    >
                      <Text style={[styles.chipText, selectedLanguage === l ? styles.chipTextActive : styles.chipTextInactive]}>{l}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Type section */}
                <Text style={styles.sectionTitle}>Astrologer Type</Text>
                <View style={styles.chipRow}>
                  {types.map(t => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.chip, selectedType === t ? styles.chipActive : styles.chipInactive]}
                      onPress={() => setSelectedType(selectedType === t ? null : t)}
                    >
                      <Text style={[styles.chipText, selectedType === t ? styles.chipTextActive : styles.chipTextInactive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.clearBtn} onPress={() => { setSelectedLanguage(null); setSelectedType(null); setSortOption(null); setShowFilters(false); }}>
                  <Text style={styles.clearBtnText}>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyBtn} onPress={() => setShowFilters(false)}>
                  <Text style={styles.applyBtnText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {activeChats && activeChats.length > 0 ? (
          <View style={styles.activeFooterBar}>
            <View style={styles.activeFooterHeader}>
              <Icon name="chat" size={16} color="#0EA5E9" />
              <Text style={styles.activeFooterTitle}>Active Chats</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeScroll}>
              {activeChats.map((a, idx) => {
                const ended = String(a.status).toLowerCase() === 'ended'
                return (
                  <TouchableOpacity
                    key={`${a.session_id}-${idx}`}
                    style={[styles.activeItem, ended ? styles.activeItemEnded : styles.activeItemLive]}
                    activeOpacity={0.85}
                    onPress={() => {
                      navigation.navigate('Chat', {
                        session_id: a.session_id,
                        astrologer_id: a.astrologer_id,
                        status: a.status,
                        astrologer: {id: a.astrologer_id, name: a.name, img: a.img }
                      })
                    }}
                  >
                    {a?.img ? (
                      <Image source={{ uri: a.img }} style={styles.activeItemAvatar} />
                    ) : (
                      <View style={[styles.activeItemAvatar, { backgroundColor: '#eee' }]} />
                    )}
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={styles.activeItemName} numberOfLines={1}>{a?.name || 'Active Chat'}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                        <View style={[styles.liveDot, ended ? { backgroundColor: '#9CA3AF' } : null]} />
                        <Text style={[styles.liveText, ended ? { color: '#9CA3AF' } : null]}>{ended ? 'Ended' : 'Live'}</Text>
                      </View>
                    </View>
                    <View style={[styles.activeItemAction, ended ? { backgroundColor: '#A3A3A3' } : null]}>
                      <Icon name="chevron-right" size={18} color="#fff" />
                    </View>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

// small formatter: 12003 => 12,003
function formatNumber(n) {
  return n?.toString?.().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  topCats: {
    paddingBottom: 8,
    marginTop:10,
    backgroundColor:"#fff"
  },
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 6,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipInactive: {
    backgroundColor: '#fff',
    borderColor: '#E2E8F0',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#fff',
  },
  chipTextInactive: {
    color: '#64748B',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    paddingRight: 8,
  },

  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  filterLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  filterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '600',
  },
  filterButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  sectionTitle: {
    marginTop: 20,
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  clearBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  clearBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
  },
  applyBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  applyBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },

  astrologerCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
  },
  astrologerAvatar: {
    width: 70,
    height: 70,
    borderRadius: 15,
    backgroundColor: '#F8F9FA',
  },
  onlineBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#fff',
  },
  mainInfo: {
    flex: 1,
    marginLeft: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  astrologerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  priceTag: {
    backgroundColor: '#FFF4F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceTagText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  skillsText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailValue: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  cardAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
  },
  orderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  chatButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  chatButtonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#475569',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
  },
  activeFooterBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 6,
  },
  activeFooterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  activeFooterTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0EA5E9',
  },
  activeScroll: {
    paddingVertical: 4,
  },
  activeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    marginRight: 10,
    minWidth: 220,
  },
  activeItemLive: {
    backgroundColor: COLORS.primary,
  },
  activeItemEnded: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeItemAvatar: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  activeItemName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  activeItemAction: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  warnBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    flexDirection: 'row',
    alignItems: 'center',
  },
  freeBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  warnText: {
    flex: 1,
    color: '#92400E',
    fontSize: 13,
    fontWeight: '700',
  },
  freeText: {
    flex: 1,
    color: '#065F46',
    fontSize: 13,
    fontWeight: '700',
  },
  warnBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    marginLeft: 10,
  },
  warnBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
});