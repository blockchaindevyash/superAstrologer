
import React from 'react'
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  StatusBar
} from 'react-native'
import RenderHTML from 'react-native-render-html'
import Clipboard from '@react-native-clipboard/clipboard'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import Share from 'react-native-share'
import COLORS from '../../config/colors'
import { AppStatusBar, BackButton } from '../../config/service'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width } = Dimensions.get('window');

const Detail = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { matchHtml, user1, user2 } = route.params || {}

  // Strip HTML tags for copy/share
  const stripHtml = (html) => {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  }

  const personalInfo = `You: ${user1?.name || ''} | ${user1?.dob || ''} | ${user1?.place || ''} | ${user1?.gender || ''}\nPartner: ${user2?.name || ''} | ${user2?.dob || ''} | ${user2?.place || ''} | ${user2?.gender || ''}`
  const matchText = stripHtml(matchHtml || '')
  const fullContent = `Match Details\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${personalInfo}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${matchText}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nGenerated from AstroTalky\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`

  const handleCopy = () => {
    Clipboard.setString(fullContent)
    Alert.alert('Success', 'Match analysis copied to clipboard.')
  }

  const handleShare = async () => {
    try {
      await Share.open({ message: fullContent, title: 'Match Compatibility Result' })
    } catch (error) {
      if (error.message === 'User did not share') return
      Alert.alert('Error', 'Failed to share match result.')
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { paddingBottom: insets.bottom, paddingTop: insets.top }]}>
      <AppStatusBar backgroundColor={COLORS.white} barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <BackButton navigation={navigation} />
        </View>
        <Text style={styles.headerTitle}>Match Analysis</Text>
        <TouchableOpacity style={styles.headerRight} onPress={handleShare}>
          <MaterialIcons name="share" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="favorite" size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.pageTitle}>Compatibility Result</Text>
          <Text style={styles.lead}>
            Detailed astrological analysis of your relationship potential based on planetary alignments.
          </Text>
        </View>

        <View style={styles.comparisonBanner}>
          <View style={styles.profileBox}>
            <MaterialIcons name="person" size={24} color={COLORS.primary} />
            <Text style={styles.profileName} numberOfLines={1}>{user1?.name}</Text>
            <Text style={styles.profileMeta}>{user1?.dob}</Text>
          </View>

          <View style={styles.vsCircle}>
            <MaterialIcons name="favorite" size={20} color={COLORS.white} />
          </View>

          <View style={styles.profileBox}>
            <MaterialIcons name="person" size={24} color="#E91E63" />
            <Text style={[styles.profileName, { color: '#E91E63' }]} numberOfLines={1}>{user2?.name}</Text>
            <Text style={styles.profileMeta}>{user2?.dob}</Text>
          </View>
        </View>

        <View style={styles.resultCard}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="psychology" size={20} color={COLORS.primary} />
            <Text style={styles.cardHeaderTitle}>Ashta-Kuta Analysis</Text>
          </View>
          
          <RenderHTML
            contentWidth={width - 80}
            source={{ html: matchHtml || '<div>No match data found</div>' }}
            tagsStyles={{
              body: { color: COLORS.text, fontSize: 15, lineHeight: 24 },
              p: { marginBottom: 12 },
              h1: { fontSize: 22, fontWeight: '800', marginVertical: 12, color: COLORS.text },
              h2: { fontSize: 20, fontWeight: '700', marginVertical: 10, color: COLORS.text },
              h3: { fontSize: 18, fontWeight: '600', marginVertical: 8, color: COLORS.text },
              strong: { fontWeight: '700' },
              b: { fontWeight: '700' },
            }}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.copyBtn} onPress={handleCopy} activeOpacity={0.8}>
          <MaterialIcons name="content-copy" size={20} color={COLORS.text} />
          <Text style={styles.copyBtnText}>Copy Analysis</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
          <Text style={styles.shareBtnText}>Share Report</Text>
          <MaterialIcons name="share" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
  },
  headerLeft: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 10,
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF4F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFE0D3',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  lead: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  comparisonBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    marginHorizontal: 24,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 24,
  },
  profileBox: {
    flex: 1,
    alignItems: 'center',
  },
  profileName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 6,
    textAlign: 'center',
  },
  profileMeta: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  vsCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  resultCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 24,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 12,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  copyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    height: 52,
    borderRadius: 14,
    gap: 8,
  },
  copyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 14,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
})

export default Detail
