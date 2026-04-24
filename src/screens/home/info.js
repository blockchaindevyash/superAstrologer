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
  ScrollView,
  Dimensions
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import DateTimePicker from '@react-native-community/datetimepicker'
import Ionicons from 'react-native-vector-icons/Ionicons'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import COLORS from '../../config/colors';
import { Loader, AppStatusBar, BackButton } from '../../config/service';
import { updateAccount } from '../../api/api'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width } = Dimensions.get('window');

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

function formatDate(d) {
  if (!d) return ''
  const day = d.getDate()
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const mon = months[d.getMonth()]
  const year = d.getFullYear()
  return `${day} ${mon}, ${year}`
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

const Info = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [name, setName] = React.useState('')
  const [dob, setDob] = React.useState(null)
  const [showDobPicker, setShowDobPicker] = React.useState(false)
  const [time, setTime] = React.useState(null)
  const [showTimePicker, setShowTimePicker] = React.useState(false)
  const [place, setPlace] = React.useState('')
  const [gender, setGender] = React.useState('')

  React.useEffect(() => {
    loadProfile()
  }, [])

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

  const save = async () => {
    const profile = { name, dob: dob ? dob.toString() : '', time: time ? time.toString() : '', place, gender }
    try {
      await updateAccount(name, '');
      await AsyncStorage.setItem('userProfile', JSON.stringify(profile))
      const astroId = route?.params?.astroId
      if (astroId) {
        navigation.navigate('Chat', { id: astroId, name: profile.name })
      } else {
        navigation.navigate('Astrologers')
      }
    } catch (e) {
      console.log(e)
    }
  }

  const isFormValid = name && dob && time && place && gender;

  return (
    <SafeAreaView style={[styles.safe, {paddingBottom: insets.bottom, paddingTop: insets.top}]}>
      <AppStatusBar backgroundColor={COLORS.white} barStyle="dark-content" />
      <View style={styles.header}>
        <BackButton navigation={navigation} />
        <Text style={styles.headerTitle}>Consultation Details</Text>
        <View style={{ width: 40 }} />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.infoCard}>
            <MaterialIcons name="info-outline" size={24} color={COLORS.primary} />
            <Text style={styles.infoText}>
              Please provide your accurate birth details. This helps our astrologers generate a precise kundali for you.
            </Text>
          </View>
          <View style={styles.formContainer}>
            <InputField
              label="Full Name"
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              icon="person-outline"
            />
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
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.continueBtn, !isFormValid && styles.continueDisabled]}
            onPress={save}
            activeOpacity={0.8}
            disabled={!isFormValid}
          >
            <Text style={styles.continueText}>Continue to Consultation</Text>
            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      {showDobPicker && (
        <DateTimePicker
          value={dob || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'spinner'}
          maximumDate={new Date()}
          onChange={(e, val) => {
            setShowDobPicker(false)
            if (val) setDob(val)
          }}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={time || new Date()}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'spinner'}
          onChange={(e, val) => {
            setShowTimePicker(false)
            if (val) setTime(val)
          }}
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
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF4F0',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE0D3',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
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
})

export default Info