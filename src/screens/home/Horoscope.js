
import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
  TextInput,
  KeyboardAvoidingView
} from 'react-native'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import Ionicons from 'react-native-vector-icons/Ionicons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import DateTimePicker from '@react-native-community/datetimepicker'
import RenderHTML from 'react-native-render-html'
import { generateHoroscope } from '../../api/api'
import COLORS from '../../config/colors'
import { AppStatusBar, BackButton, Loader } from '../../config/service'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width } = Dimensions.get('window');

const HOROSCOPE_PERIODS = [
  'Today',
  'This Week',
  'This Month',
  'This Year',
  'Next 6 Month',
]

function fmtDate(d) {
  if (!d) return ''
  const day = d.getDate()
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${day} ${months[d.getMonth()]}, ${d.getFullYear()}`
}

function fmtTime(d) {
  if (!d) return ''
  let hrs = d.getHours()
  const mins = d.getMinutes()
  const am = hrs >= 12 ? 'PM' : 'AM'
  hrs = hrs % 12
  if (hrs === 0) hrs = 12
  const m = mins < 10 ? `0${mins}` : mins
  return `${hrs}:${m} ${am}`
}

const InputField = ({ label, value, placeholder, onChangeText, icon, onPress, editable = true }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TouchableOpacity
      activeOpacity={editable ? 1 : 0.7}
      onPress={onPress}
      style={[styles.inputWrapper, !editable && styles.disabledInput]}
    >
      <Ionicons name={icon} size={20} color={COLORS.primary} style={styles.inputIcon} />
      {editable ? (
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={value}
          onChangeText={onChangeText}
          style={styles.textInput}
        />
      ) : (
        <Text style={[styles.textInput, !value && { color: '#999' }]}>
          {value || placeholder}
        </Text>
      )}
    </TouchableOpacity>
  </View>
)

export default function Horoscope({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [name, setName] = React.useState('')
  const [dob, setDob] = React.useState(null)
  const [showDobPicker, setShowDobPicker] = React.useState(false)
  const [time, setTime] = React.useState(null)
  const [showTimePicker, setShowTimePicker] = React.useState(false)
  const [place, setPlace] = React.useState('')
  const [gender, setGender] = React.useState('')
  const [language, setLanguage] = React.useState('English')
  const [profile, setProfile] = React.useState(null)
  const [loading, setLoading] = React.useState(false)
  const [htmlContent, setHtmlContent] = React.useState('')
  const [selectedPeriod, setSelectedPeriod] = React.useState('Today')
  const [showUserInfo, setShowUserInfo] = React.useState(false)
  const [costs, setCosts] = React.useState(null)

  React.useEffect(() => {
    loadProfile()
    loadCostsAndWallet()
  }, [])

  const loadCostsAndWallet = async () => {
    try {
      if (route?.params?.costs) {
        setCosts(route.params.costs)
      }
    } catch (e) {
      console.log('Error loading costs/wallet', e)
    }
  }

  const loadProfile = async () => {
    try {
      const saved = await AsyncStorage.getItem('userProfile')
      if (saved) {
        const p = JSON.parse(saved)
        setProfile(p)
        if (p.name) setName(p.name)
        if (p.place) setPlace(p.place)
        if (p.gender) setGender(p.gender)
        if (p.dob) setDob(new Date(p.dob))
        if (p.time) setTime(new Date(p.time))
      }
    } catch (e) {
      console.log('Error loading profile', e)
    }
  }

  const fetchHoroscope = async (period) => {
    if (!name || !dob || !time || !place || !gender || !language) {
      Alert.alert('Details Required', 'Please complete your profile to get personalized horoscope.')
      return
    }

    // Save profile
    const profileData = { name, dob: dob ? dob.toString() : '', time: time ? time.toString() : '', place, gender }
    await AsyncStorage.setItem('userProfile', JSON.stringify(profileData))

    setLoading(true)
    setHtmlContent('')
    try {
      const formData = {
        name,
        dob: dob ? fmtDate(dob) : '',
        tob: time ? fmtTime(time) : '',
        pob: place,
        gender,
        language,
        timeline: period,
      }
      const response = await generateHoroscope(formData)
      setHtmlContent(response.data)
    } catch (error) {
      console.error('Horoscope Error:', error)
      Alert.alert('Error', 'Unable to fetch your horoscope. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period)
    setHtmlContent('') // Reset content when period changes
  }

  return (
    <SafeAreaView style={[styles.safe, {paddingBottom: insets.bottom, paddingTop: insets.top}]}>
      <AppStatusBar backgroundColor={COLORS.white} barStyle="dark-content" />
      <View style={styles.header}>
        <BackButton navigation={navigation} />
        <Text style={styles.headerTitle}>Daily Horoscope</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Info')}
          style={styles.profileBtn}
        >
          <MaterialIcons name="account-circle" size={30} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="stars" size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.pageTitle}>Celestial Guidance</Text>
          <Text style={styles.lead}>
            Explore what the stars have in store for you today and beyond.
          </Text>
        </View>
        {/* Cost Display */}
        {costs?.horoscope_cost && (
          <View style={styles.costBanner}>
            <View style={styles.costLeft}>
              <Ionicons name="pricetag" size={20} color={COLORS.primary} />
              <Text style={styles.costLabel}>Generation Cost:</Text>
            </View>
            <Text style={styles.costValue}>
              {costs.currency || '₹'}{costs.horoscope_cost}
            </Text>
          </View>
        )}
        {/* Insufficient Balance Warning */}
        {costs?.wallet !== null && costs?.horoscope_cost && costs.wallet < costs.horoscope_cost && (
          <View style={styles.warningBanner}>
            <View style={styles.warningContent}>
              <Ionicons name="warning" size={24} color={COLORS.primary} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.warningTitle}>Insufficient Balance</Text>
                <Text style={styles.warningText}>
                  Your wallet balance ({costs.currency || '₹'}{costs.wallet}) is less than required amount ({costs.currency || '₹'}{costs.horoscope_cost})
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.addBalanceBtn}
              onPress={() => navigation.navigate('Wallet')}
            >
              <Ionicons name="wallet" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.addBalanceText}>Add Balance</Text>
            </TouchableOpacity>
          </View>
        )}
        {profile && (
          <View style={styles.accordionWrapper}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => setShowUserInfo(!showUserInfo)}
              activeOpacity={0.7}
            >
              <View style={styles.accordionHeaderLeft}>
                <Ionicons name="person" size={20} color={COLORS.primary} />
                <Text style={styles.accordionTitle}>{name || 'Enter Your Details'}</Text>
              </View>
              <Ionicons
                name={showUserInfo ? "chevron-up" : "chevron-down"}
                size={20}
                color={COLORS.text}
              />
            </TouchableOpacity>
            {showUserInfo && (
              <View style={styles.accordionContent}>
                <InputField
                  label="Full Name"
                  placeholder="Enter full name"
                  value={name}
                  onChangeText={setName}
                  icon="person-outline"
                />
                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <InputField
                      label="Date of Birth"
                      placeholder="Select Date"
                      value={dob ? fmtDate(dob) : ''}
                      icon="calendar-outline"
                      editable={false}
                      onPress={() => setShowDobPicker(true)}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <InputField
                      label="Time of Birth"
                      placeholder="Select Time"
                      value={time ? fmtTime(time) : ''}
                      icon="time-outline"
                      editable={false}
                      onPress={() => setShowTimePicker(true)}
                    />
                  </View>
                </View>
                <InputField
                  label="Place of Birth"
                  placeholder="City, State, Country"
                  value={place}
                  onChangeText={setPlace}
                  icon="location-outline"
                />
                <Text style={styles.inputLabel}>Gender</Text>
                <View style={styles.genderContainer}>
                  {['Male', 'Female', 'Other'].map((g) => {
                    const active = gender === g
                    return (
                      <TouchableOpacity
                        key={g}
                        onPress={() => setGender(g)}
                        style={[
                          styles.genderBtn,
                          active ? styles.genderBtnActive : styles.genderBtnInactive
                        ]}
                      >
                        <Ionicons
                          name={g === 'Male' ? 'male' : g === 'Female' ? 'female' : 'transgender'}
                          size={18}
                          color={active ? COLORS.white : COLORS.text}
                        />
                        <Text style={[
                          styles.genderText,
                          active ? styles.genderTextActive : styles.genderTextInactive
                        ]}>
                          {g}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>
            )}
          </View>
        )}
        {/* Language Selection */}
        {costs?.language && costs.language.length > 0 && (
          <View style={styles.languageWrapper}>
            <Text style={styles.inputLabel}>Preferred Language</Text>
            <View style={styles.languageContainer}>
              {costs.language.map((lang) => {
                const active = language === lang
                return (
                  <TouchableOpacity
                    key={lang}
                    onPress={() => setLanguage(lang)}
                    style={[
                      styles.languageChip,
                      active ? styles.languageChipActive : styles.languageChipInactive
                    ]}>
                    <Ionicons
                      name="language"
                      size={16}
                      color={active ? COLORS.white : COLORS.primary}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[
                      styles.languageText,
                      active ? styles.languageTextActive : styles.languageTextInactive
                    ]}>
                      {lang}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        )}
        <View style={styles.periodsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.periodScroll}>
            {HOROSCOPE_PERIODS.map(period => {
              const active = selectedPeriod === period
              return (
                <TouchableOpacity
                  key={period}
                  style={[styles.periodChip, active && styles.periodChipActive]}
                  onPress={() => handlePeriodChange(period)}
                  disabled={loading}
                >
                  <Text style={[styles.periodText, active && styles.periodTextActive]}>
                    {period}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>

        {!(costs?.wallet !== null && costs?.horoscope_cost && costs.wallet < costs.horoscope_cost) && (
          <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
            <TouchableOpacity
              style={[styles.fetchBtn, loading && styles.fetchBtnDisabled]}
              onPress={() => fetchHoroscope(selectedPeriod)}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <>
                  <Text style={styles.fetchBtnText}>Get {selectedPeriod} Horoscope</Text>
                  <MaterialIcons name="auto-fix-high" size={18} color={COLORS.white} style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.contentContainer}>
          {loading ? (
            <Loader text="Consulting the cosmos..." fullScreen={false} />
          ) : htmlContent ? (
            <View style={styles.horoscopeCard}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="auto-fix-normal" size={20} color={COLORS.primary} />
                <Text style={styles.cardHeaderTitle}>{selectedPeriod} Forecast</Text>
              </View>
              <RenderHTML
                contentWidth={width - 80}
                source={{ html: htmlContent }}
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
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="brightness-2" size={60} color="#E5E7EB" />
              <Text style={styles.emptyText}>
                {profile ? 'Select a period and click the button above' : 'Please complete your profile first'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {showDobPicker && (
        <DateTimePicker
          value={dob || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'spinner'}
          maximumDate={new Date()}
          onChange={(e, v) => { setShowDobPicker(false); if (v) setDob(v) }}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={time || new Date()}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'spinner'}
          onChange={(e, v) => { setShowTimePicker(false); if (v) setTime(v) }}
        />
      )}
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
    paddingHorizontal: 8,
    height: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  profileBtn: {
    padding: 8,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 20,
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
  accordionWrapper: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  accordionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  accordionContent: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginTop: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    paddingHorizontal: 12,
    height: 56,
  },
  disabledInput: {
    backgroundColor: '#F9FAFB',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    textAlignVertical: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  genderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  genderBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  genderBtnInactive: {
    backgroundColor: '#F9FAFB',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  genderTextActive: {
    color: COLORS.white,
  },
  genderTextInactive: {
    color: COLORS.text,
  },
  costBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    marginHorizontal: 24,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  costLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  costLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginLeft: 8,
  },
  costValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  warningBanner: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    marginHorizontal: 24,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  warningContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
  },
  addBalanceBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addBalanceText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  languageWrapper: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  languageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 10,
  },
  languageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  languageChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  languageChipInactive: {
    backgroundColor: '#F9FAFB',
  },
  languageText: {
    fontSize: 14,
    fontWeight: '600',
  },
  languageTextActive: {
    color: COLORS.white,
  },
  languageTextInactive: {
    color: COLORS.text,
  },
  periodsWrapper: {
    marginBottom: 24,
  },
  periodScroll: {
    paddingHorizontal: 24,
  },
  periodChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  periodChipActive: {
    backgroundColor: '#FFF4F0',
    borderColor: COLORS.primary,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  periodTextActive: {
    color: COLORS.primary,
  },
  fetchBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  fetchBtnDisabled: {
    backgroundColor: '#FFD6C6',
    shadowOpacity: 0,
    elevation: 0,
  },
  fetchBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },
  contentContainer: {
    paddingHorizontal: 24,
  },
  horoscopeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
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
  loaderContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loaderText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.muted,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
  },
  setupBtn: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  setupBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
})
