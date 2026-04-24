

import React from 'react'
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
  StatusBar
} from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import Ionicons from 'react-native-vector-icons/Ionicons'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import RenderHTML from 'react-native-render-html'
import Share from 'react-native-share'
import { useRoute, useNavigation } from '@react-navigation/native'
import COLORS from '../../config/colors'
import { AppStatusBar, BackButton } from '../../config/service'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width } = Dimensions.get('window');

const ViewPredication = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute()
  const navigation = useNavigation()
  const { predicationData, personalDetails } = route.params || {}

  // Extract HTML content from response
  const htmlContent = typeof predicationData === 'string' ? predicationData : predicationData?.html || predicationData?.content || predicationData?.response || ''

  const stripHtml = (html) => {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  }

  const personalInfo = personalDetails ? `
PERSONAL DETAILS:
Name: ${personalDetails.name || 'N/A'}
Date of Birth: ${personalDetails.dob || 'N/A'}
Time of Birth: ${personalDetails.time || 'N/A'}
Place of Birth: ${personalDetails.place || 'N/A'}
Gender: ${personalDetails.gender || 'N/A'}
Category: ${personalDetails.type || 'N/A'}
Timeline: ${personalDetails.period || 'N/A'}
  `.trim() : ''

  const textContent = stripHtml(htmlContent)
  const fullExportText = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ ASTROLOGY PREDICTION REPORT ✨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${personalInfo}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DETAILED PREDICTION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${textContent}

━━━━━━━━━━━━━━━━━━━━━
Generated from AstroTalky
━━━━━━━━━━━━━━━━━━━━━
  `.trim()

  const handleCopy = () => {
    Clipboard.setString(fullExportText)
    Alert.alert('Success', 'Prediction copied to clipboard!')
  }

  const handleShare = async () => {
    try {
      const shareOptions = {
        title: 'Prediction Report',
        message: fullExportText,
        subject: `Prediction Report - ${personalDetails?.name || 'User'}`,
      }
      await Share.open(shareOptions)
    } catch (error) {
      if (error.message === 'User did not share') return
      Alert.alert('Error', 'Failed to share prediction.')
    }
  }

  if (!predicationData) {
    return (
      <SafeAreaView style={[styles.safe, { paddingBottom: insets.bottom, paddingTop: insets.top }]}>
        <AppStatusBar backgroundColor={COLORS.white} barStyle="dark-content" />
        <View style={styles.header}>
          <BackButton navigation={navigation} />
          <Text style={styles.headerTitle}>Prediction Report</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.container}>
          <MaterialIcons name="error-outline" size={60} color={COLORS.muted} />
          <Text style={styles.errorText}>No prediction data available</Text>
          <TouchableOpacity 
            style={styles.errorBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.errorBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.safe, { paddingBottom: insets.bottom, paddingTop: insets.top }]}>
      <AppStatusBar backgroundColor={COLORS.white} barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <BackButton navigation={navigation} />
        </View>
        <Text style={styles.headerTitle}>Prediction Analysis</Text>
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
            <MaterialIcons name="psychology" size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.pageTitle}>Your Insights</Text>
          <Text style={styles.lead}>
            Personalized guidance based on your astrological transits and planetary cycles.
          </Text>
        </View>

        {personalDetails && (
          <View style={styles.detailsCard}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="person" size={20} color={COLORS.primary} />
              <Text style={styles.cardHeaderTitle}>Personal Profile</Text>
            </View>
            
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Name</Text>
                <Text style={styles.detailValue} numberOfLines={1}>{personalDetails.name || 'N/A'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Category</Text>
                <Text style={styles.detailValue}>{personalDetails.category || 'N/A'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Timeline</Text>
                <Text style={styles.detailValue}>{personalDetails.timeline || 'N/A'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Gender</Text>
                <Text style={styles.detailValue}>{personalDetails.gender || 'N/A'}</Text>
              </View>
              <View style={[styles.detailItem, { width: '100%' }]}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue} numberOfLines={1}>{personalDetails.place || 'N/A'}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.resultCard}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="psychology" size={20} color={COLORS.primary} />
            <Text style={styles.cardHeaderTitle}>Your Prediction</Text>
          </View>
          
          <RenderHTML
            contentWidth={width - 80}
            source={{ html: htmlContent || '<div>No data found</div>' }}
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
          <Text style={styles.copyBtnText}>Copy Text</Text>
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
    padding: 24,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5EBFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EBD6FF',
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
  detailsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
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
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailItem: {
    width: '48%',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 4,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  resultCard: {
    backgroundColor: COLORS.white,
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
  footer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  copyBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 54,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  copyBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  shareBtn: {
    flex: 1.5,
    flexDirection: 'row',
    height: 54,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  shareBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.muted,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  errorBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
})

export default ViewPredication

