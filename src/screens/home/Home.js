import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import AsyncStorage from '@react-native-async-storage/async-storage'
import COLORS from '../../config/colors';
import {Loader,AppStatusBar} from '../../config/service';
import { fetchHomepageData, logout as apiLogout} from '../../api/api';
import { OneSignal, LogLevel } from 'react-native-onesignal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Image mapping for categories
const categoryImages = {
  'chat': require('../../../assets/chat.jpg'),
  'kundali': require('../../../assets/kundali.jpg'),
  'predication': require('../../../assets/pre.jpg'),
  'horoscope': require('../../../assets/horo.jpg'),
  'mm': require('../../../assets/mm.jpg'),
  'b': require('../../../assets/b.jpg'),
};

const categories = [
  { id: '1', name: 'Ask Astrologer', icon: 'chat', screen: 'Astrologers' },
  { id: '2', name: 'Make Kundali', icon: 'kundali', screen: 'Kundali' },
  { id: '3', name: 'Predications', icon: 'predication', screen: 'Predication' },
  { id: '4', name: 'Horoscope', icon: 'horoscope', screen: 'Horoscope' },
  { id: '5', name: 'Match Making', icon: 'mm', screen: 'Match' },
  { id: '6', name: 'Baby Name', icon: 'b', screen: 'Baby' },
];

const TabButton = ({ icon, label, active, onPress }) => (
  <TouchableOpacity style={styles.tabButton} onPress={onPress}>
    <Ionicons name={icon} size={22} color={active ? COLORS.primary : COLORS.muted} />
    <Text style={[styles.tabLabel, active && { color: COLORS.primary }]}>{label}</Text>
  </TouchableOpacity>
);

export default function Home({ navigation }) {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [activeChats, setActiveChats] = React.useState([])
  const [costs, setCosts] = React.useState(null)
  const [refreshing, setRefreshing] = React.useState(false)

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
      setLoading(false)
    })
    return () => { mounted = false }
  }, [])

  // Fetch homepage data on mount and when screen gains focus (always, without loader)
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadHomepageData()
    })
    
    // Also load on mount
    loadHomepageData()
    
    return unsubscribe
  }, [navigation])

  const loadHomepageData = async () => {
    try {
      const response = await fetchHomepageData()

      OneSignal.Debug.setLogLevel(LogLevel.Verbose);
      OneSignal.initialize(response.push_api);
      await OneSignal.Notifications.requestPermission(true);
      OneSignal.User.addTag('user_id', response.user_id);

      if (response && response.active) {
        setActiveChats(response.active)
      }
      if (response && response.cost) {
        setCosts(response.cost)
      }
    } catch (error) {
      console.error('Error loading homepage data:', error);
      if (error.response?.data?.message == 'Unauthenticated.') {
        try {
          try { await apiLogout(); } catch (_) { }
          await AsyncStorage.multiRemove(['token', 'userProfile', 'user', 'userData']);
        } catch (_) { }
        navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
      }
    }
  }

  const handleChatResume = (session) => {
    navigation.navigate('Chat', { 
      session_id: session.session_id,
      astrologer_id: session.astrologer_id,
      status: session.status,
      astrologer: {id: session.astrologer_id, name: session.name, img: session.img }
    })
  }

  if (loading) {
    return <Loader />
  }

  function formatDate(d) {
    if (!d) return ''
    const day = d.getDate()
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const mon = months[d.getMonth()]
    const year = d.getFullYear()
    return `${day}-${mon}-${year}`
  }

  const summaryText = profile ? [profile.name, profile.dob ? formatDate(new Date(profile.dob)) : null, profile.place].filter(Boolean).join(' | ') : null

  return (
    <SafeAreaView style={[styles.safe, {paddingBottom: insets.bottom, paddingTop: insets.top}]}>
      <AppStatusBar backgroundColor='#fff'/>
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
          <TouchableOpacity 
            onPress={() => navigation.navigate('Info')} 
            style={styles.profileBadge}>
            <Ionicons name="person-circle-outline" size={42} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        {profile && (
          <View style={styles.profileSummaryRow}>
            <Ionicons name="location-outline" size={14} color={COLORS.muted} style={{marginRight: 4}} />
            <Text style={styles.profileSummaryText}>{profile.place || 'Location not set'}</Text>
          </View>
        )}
      </View>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.scrollContent, activeChats?.length > 0 && { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >     
        <TouchableOpacity 
          style={styles.heroBanner}
          onPress={() => navigation.navigate('Astrologers')}
          activeOpacity={0.9}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroTitle}>Connect with Experts</Text>
              <Text style={styles.heroSubtitle}>Live chat with Top Astrologers</Text>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>Start Chat Now</Text>
              </View>
            </View>
            <View style={styles.heroButton}>
              <Ionicons name="chatbubbles" size={24} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>
        <Text style={styles.sectionHeading}>Our Services</Text>
        {/* Categories Grid */}
        <View style={styles.servicesGrid}>
          {categories.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.serviceCard}
              onPress={() => navigation.navigate(item.screen,{costs})}
              activeOpacity={0.7}
            >
              <View style={styles.serviceImageWrapper}>
                <Image source={categoryImages[item.icon]} style={styles.serviceImage} />
                <View style={[styles.serviceOverlay, {backgroundColor: 'rgba(0,0,0,0.05)'}]} />
              </View>
              <View style={styles.serviceCardFooter}>
                <Text style={styles.serviceLabel}>{item.name}</Text>
                <Ionicons name="chevron-forward" size={14} color={COLORS.muted} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
        {/* Branding */}
        <View style={styles.footerBranding}>
          <Text style={styles.brandingText}>ASTROTALKY</Text>
          <Text style={styles.brandingSubText}>AI POWERED ASTROLOGY</Text>
        </View>
      </ScrollView>
      {/* Active Chat Sessions Footer */}
      {activeChats && activeChats.length > 0 && (
        <View style={styles.activeFooterBar}>
          <View style={styles.activeFooterHeader}>
            <View style={styles.liveDot} />
            <Text style={styles.activeFooterTitle}>Active Chat Sessions</Text>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.activeScroll}>
            {activeChats.map((session) => (
              <TouchableOpacity 
                key={session.id}
                style={[styles.activeItem, styles.activeItemLive]}
                onPress={() => handleChatResume(session)}
                activeOpacity={0.8}>
                {session.img ? (
                  <Image 
                    source={{ uri: session.img }} 
                    style={styles.activeItemAvatar}
                  />
                ) : (
                  <View style={[styles.activeItemAvatar, { backgroundColor: '#eee' }]}/>
                )}
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.activeItemName} numberOfLines={1}>
                    {session.name || 'Astrologer'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                    <View style={[styles.liveDot, { backgroundColor: '#FFFFFF', marginRight: 4 }]} />
                    <Text style={styles.liveText}>Live Session</Text>
                  </View>
                </View>
                <View style={styles.activeItemAction}>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      {/* Bottom Navigation */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="home" size={24} color={COLORS.primary} />
          <Text style={[styles.navLabel, {color: COLORS.primary}]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('History')}>
          <Ionicons name="chatbubble-outline" size={24} color={COLORS.muted} />
          <Text style={styles.navLabel}>Chat History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Match')}>
          <Ionicons name="heart-half-outline" size={24} color={COLORS.muted} />
          <Text style={styles.navLabel}>Matching</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => { navigation.navigate('Account') }}>
          <Ionicons name="person-outline" size={24} color={COLORS.muted} />
          <Text style={styles.navLabel}>Account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
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
  profileSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  profileSummaryText: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '500',
  },
  heroBanner: {
    marginHorizontal: 20,
    marginTop: 5,
    marginBottom: 25,
    backgroundColor: "#ffe6c5ff",
    borderRadius: 24,
    padding: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#000',
    marginTop: 4,
    marginBottom: 12,
  },
  heroBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  heroBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  heroButton: {
    backgroundColor: COLORS.primary,
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginLeft: 20,
    marginBottom: 15,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  serviceCard: {
    width: '50%',
    padding: 8,
    alignItems: 'center',
  },
  serviceImageWrapper: {
    width: '90%',
    height: 140,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.secondary,
  },
  serviceImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  serviceOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  serviceCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  serviceLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  footerBranding: {
    marginTop: 30,
    alignItems: 'center',
    opacity: 0.05,
  },
  brandingText: {
    fontSize: 42,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 10,
  },
  brandingSubText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 5,
    marginTop: -5,
  },
  activeFooterBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 80,
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
    backgroundColor: '#0EA5E9',
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
  navBar: {
    height: 80,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: 20,
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
});