import React from 'react'
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
  StatusBar
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import RenderHTML from 'react-native-render-html'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { generateBaby } from '../../api/api'
import COLORS from '../../config/colors'
import { AppStatusBar, BackButton } from '../../config/service'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width } = Dimensions.get('window');

function formatDate(d) {
  if (!d) return ''
  const day = d.getDate()
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${day} ${months[d.getMonth()]}, ${d.getFullYear()}`
}

function formatTime(d) {
  if (!d) return ''
  let hrs = d.getHours()
  const mins = d.getMinutes()
  const ampm = hrs >= 12 ? 'PM' : 'AM'
  hrs = hrs % 12
  if (hrs === 0) hrs = 12
  const m = mins < 10 ? `0${mins}` : mins
  return `${hrs}:${m} ${ampm}`
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

const Baby = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const scrollViewRef = React.useRef(null)
  const [dob, setDob] = React.useState(null)
  const [showDobPicker, setShowDobPicker] = React.useState(false)
  const [time, setTime] = React.useState(null)
  const [showTimePicker, setShowTimePicker] = React.useState(false)
  const [place, setPlace] = React.useState('')
  const [gender, setGender] = React.useState('')
  const [language, setLanguage] = React.useState('English')
  const [costs, setCosts] = React.useState(null)

  const [loading, setLoading] = React.useState(false)
  const [htmlContent, setHtmlContent] = React.useState('')
  const canContinue = dob && time && place && gender && language
  const wallet = costs?.wallet
  const hasInsufficientBalance = wallet !== null && costs?.name_cost && wallet < costs.name_cost

  React.useEffect(() => {
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

  const handleSubmit = async () => {
    if (!dob || !time || !place || !gender || !language) {
      Alert.alert('Required', 'Please fill all fields before submitting.')
      return
    }
    setLoading(true)
    setHtmlContent('')
    try {
      const formData = {
        dob: dob ? formatDate(dob) : '',
        tob: time ? formatTime(time) : '',
        pob: place,
        gender,
        language,
      }
      const response = await generateBaby(formData)

      if (response.status === false) {
        Alert.alert('Error', response.message || 'Failed to generate baby name')
        return
      }

      setHtmlContent(response.data)

      // Scroll to show result
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 400, animated: true })
      }, 100)
    } catch (error) {
      console.error('Baby Name Error:', error)
      let errorMessage = 'Failed to get baby name. Please try again.'
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      Alert.alert('Error', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={[styles.safe, {paddingBottom: insets.bottom, paddingTop: insets.top}]}>
      <AppStatusBar backgroundColor={COLORS.white} barStyle="dark-content" />
      <View style={styles.header}>
        <BackButton navigation={navigation} />
        <Text style={styles.headerTitle}>Baby Name Predictor</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroSection}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="child-care" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.pageTitle}>Baby Name Insights</Text>
            <Text style={styles.lead}>
              Find the perfect, auspicious name for your newborn based on celestial alignments.
            </Text>
          </View>

          {/* Cost Display */}
          {costs?.name_cost && (
            <View style={styles.costBanner}>
              <View style={styles.costLeft}>
                <Ionicons name="pricetag" size={20} color={COLORS.primary} />
                <Text style={styles.costLabel}>Generation Cost:</Text>
              </View>
              <Text style={styles.costValue}>
                {costs.currency || '₹'}{costs.name_cost}
              </Text>
            </View>
          )}

          {/* Insufficient Balance Warning */}
          {hasInsufficientBalance && (
            <View style={styles.warningBanner}>
              <View style={styles.warningContent}>
                <Ionicons name="warning" size={24} color={COLORS.primary} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.warningTitle}>Insufficient Balance</Text>
                  <Text style={styles.warningText}>
                    Your wallet balance ({costs.currency || '₹'}{wallet}) is less than required amount ({costs.currency || '₹'}{costs.name_cost})
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
          <View style={styles.formContainer}>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <InputField
                  label="Date of Birth"
                  placeholder="Select Date"
                  value={dob ? formatDate(dob) : ''}
                  icon="calendar-outline"
                  editable={false}
                  onPress={() => setShowDobPicker(true)}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <InputField
                  label="Time of Birth"
                  placeholder="Select Time"
                  value={time ? formatTime(time) : ''}
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
            {/* Language Selection */}
            {costs?.language && costs.language.length > 0 && (
              <>
                <Text style={[styles.inputLabel, { marginTop: 20 }]}>Preferred Language</Text>
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
              </>
            )}
            {!hasInsufficientBalance && (
              <TouchableOpacity
                style={[styles.continueBtn, (!canContinue || loading) && styles.continueDisabled]}
                onPress={handleSubmit}
                activeOpacity={0.8}
                disabled={!canContinue || loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Text style={styles.continueText}>Generate Recommendations</Text>
                    <Ionicons name="sparkles" size={20} color={COLORS.white} style={{ marginLeft: 8 }} />
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {htmlContent ? (
            <View style={styles.resultCard}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="child-care" size={20} color={COLORS.primary} />
                <Text style={styles.cardHeaderTitle}>Suggested Names</Text>
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
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      {showDobPicker && (
        <DateTimePicker
          value={dob || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'spinner'}
          maximumDate={new Date()}
          onChange={(e, val) => { setShowDobPicker(false); if (val) setDob(val) }}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={time || new Date()}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'spinner'}
          onChange={(e, val) => { setShowTimePicker(false); if (val) setTime(val) }}
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
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#B2DFDB',
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
  formContainer: {
    backgroundColor: COLORS.white,
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
    marginBottom: 24,
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
  languageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    marginBottom: 20,
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
  continueBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 8,
  },
  continueText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },
  continueDisabled: {
    backgroundColor: '#FFD6C6',
    shadowOpacity: 0,
    elevation: 0,
  },
  resultCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    marginTop: 32,
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
})

export default Baby
