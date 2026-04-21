import React from 'react'
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import DateTimePicker from '@react-native-community/datetimepicker'
import Ionicons from 'react-native-vector-icons/Ionicons'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import { generatePredication } from '../../api/api'
import COLORS from '../../config/colors'
import { AppStatusBar, BackButton } from '../../config/service'

const { width } = Dimensions.get('window');

const TYPES = ['Financial', 'Career', 'Love', 'Health', 'General']
const PERIODS = ['Current Year', 'Coming Year', 'Current Month', 'Coming Six Month', 'Coming 2 Month']

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

export default function Predication({ navigation, route }) {
  const [type, setType] = React.useState('General')
  const [period, setPeriod] = React.useState('Current Year')
  const [name, setName] = React.useState('')
  const [dob, setDob] = React.useState(null)
  const [showDobPicker, setShowDobPicker] = React.useState(false)
  const [time, setTime] = React.useState(null)
  const [showTimePicker, setShowTimePicker] = React.useState(false)
  const [place, setPlace] = React.useState('')
  const [gender, setGender] = React.useState('')
  const [language, setLanguage] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [costs, setCosts] = React.useState(null)
  const [showPersonalDetails, setShowPersonalDetails] = React.useState(false)

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

  const canGenerate = !!type && !!period && name && dob && time && place && gender && language
  const wallet = costs?.wallet
  const hasInsufficientBalance = wallet !== null && costs?.predication_cost && wallet < costs.predication_cost

  const onGenerate = async () => {
    setLoading(true)
    try {
      const profile = { name, dob: dob ? dob.toString() : '', time: time ? time.toString() : '', place, gender }
      await AsyncStorage.setItem('userProfile', JSON.stringify(profile))

      const formData = {
        name,
        dob: dob ? fmtDate(dob) : '',
        tob: time ? fmtTime(time) : '',
        pob: place,
        gender,
        language,
        category: type,
        timeline: period,
      }
      console.log('Pridication:::', formData);
      const response = await generatePredication(formData)

      if (!response) {
        throw new Error('No response from server')
      }

      if (response.status === false) {
        Alert.alert('Error', response.message || 'Failed to generate predication')
        return
      }
      console.log('Get Response:', response);
      navigation.navigate('ViewPredication', {
        predicationData: response.data,
        personalDetails: formData,
      })
    } catch (error) {
      console.error('Error generating predication:', error.response)
      let errorMessage = 'Failed to generate predication. Please try again.'
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      Alert.alert('Error', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <AppStatusBar backgroundColor={COLORS.white} barStyle="dark-content" />
      <View style={styles.header}>
        <BackButton navigation={navigation} />
        <Text style={styles.headerTitle}>Future Prediction</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroSection}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="psychology" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.pageTitle}>AI-Powered Insights</Text>
            <Text style={styles.lead}>
              Get detailed predictions about your future based on your astrological chart.
            </Text>
          </View>

          {/* Cost Display */}
          {costs?.predication_cost && (
            <View style={styles.costBanner}>
              <View style={styles.costLeft}>
                <Ionicons name="pricetag" size={20} color={COLORS.primary} />
                <Text style={styles.costLabel}>Generation Cost:</Text>
              </View>
              <Text style={styles.costValue}>
                {costs.currency || '₹'}{costs.predication_cost}
              </Text>
            </View>
          )}

          {/* Insufficient Balance Warning */}
          {wallet !== null && costs?.predication_cost && wallet < costs.predication_cost && (
            <View style={styles.warningBanner}>
              <View style={styles.warningContent}>
                <Ionicons name="warning" size={24} color={COLORS.primary} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.warningTitle}>Insufficient Balance</Text>
                  <Text style={styles.warningText}>
                    Your wallet balance ({costs.currency || '₹'}{wallet}) is less than required amount ({costs.currency || '₹'}{costs.predication_cost})
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
            {/* Personal Details Accordion */}
            <TouchableOpacity 
              style={styles.accordionHeader}
              onPress={() => setShowPersonalDetails(!showPersonalDetails)}
              activeOpacity={0.7}
            >
              <View style={styles.accordionHeaderLeft}>
                <Ionicons name="person" size={20} color={COLORS.primary} />
                <Text style={styles.accordionTitle}>{name || 'Enter Your Details'}</Text>
              </View>
              <Ionicons 
                name={showPersonalDetails ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={COLORS.text} 
              />
            </TouchableOpacity>

            {showPersonalDetails && (
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
                        ]}
                      >
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

            <View style={styles.sectionDivider} />

            <Text style={styles.inputLabel}>Prediction Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={{ paddingBottom: 5 }}>
              {TYPES.map(t => {
                const active = type === t
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setType(t)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Timeline</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={{ paddingBottom: 5 }}>
              {PERIODS.map(p => {
                const active = period === p
                return (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setPeriod(p)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{p}</Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>
        </ScrollView>

        {!hasInsufficientBalance && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.continueBtn, (!canGenerate || loading) && styles.continueDisabled]}
              onPress={onGenerate}
              disabled={!canGenerate || loading}
              activeOpacity={0.8}
            >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.continueText}>Generate Prediction</Text>
                <Ionicons name="sparkles" size={20} color={COLORS.white} />
              </>
            )}
          </TouchableOpacity>
        </View>
        )}
      </KeyboardAvoidingView>

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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    height: 56,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 110,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
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
  sectionDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 24,
  },
  chipScroll: {
    flexDirection: 'row',
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  chipActive: {
    backgroundColor: '#FFF4F0',
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  chipTextActive: {
    color: COLORS.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
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
  },
  continueText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
    marginRight: 8,
  },
  continueDisabled: {
    backgroundColor: '#FFD6C6',
    shadowOpacity: 0,
    elevation: 0,
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
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 16,
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
    marginBottom: 20,
  },
})

