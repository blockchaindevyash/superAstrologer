import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Linking,
  Modal,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import COLORS from '../../config/colors';
import { BackButton } from '../../config/service';
import { loginUser } from '../../api/api';
import {getAuth, signInWithPhoneNumber} from '@react-native-firebase/auth';
import { setConfirmation } from './firebaseConfirm';
import messaging from '@react-native-firebase/messaging';

const PRIMARY_COLOR = COLORS.primary;
const TEXT_DARK = COLORS.text;
const GRAY = COLORS.muted;

export default function Login({ navigation, route }) {
  const { country = {}, privacy = '', terms = '' } = route?.params || {};
  const [selectedCountry, setSelectedCountry] = useState({ code: '91', name: 'India' });
  const [showPicker, setShowPicker] = useState(false);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const countryList = Object.entries(country).map(([code, name]) => ({ code, name }));

  const validatePhone = () => {
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 8) {
      setError('Phone number must be at least 8 digits');
      return false;
    }
    if (phoneDigits.length > 12) {
      setError('Phone number must not exceed 12 digits');
      return false;
    }
    setError('');
    return true;
  };

  const androidToken = async () => {
    const token = await messaging().getToken();
    console.log("get Token:", token);
    return token;
  };

  const iosToken = async () => {
    const token = await messaging().getAPNSToken();
    console.log("APNs Token:", token);
    return token;
  };

  const handleContinue = async () => {
    if (!validatePhone()) {
      return;
    }

    try {
      setLoading(true);
      const phoneDigits = phone.replace(/\D/g, '');
      let phoneNumber = `+${selectedCountry.code}${phoneDigits}`;
      
      // const authInstance = getAuth();
      // const confirm = await signInWithPhoneNumber(authInstance, phoneNumber);
      
      // setConfirmation(confirm);

      // navigation.navigate('Otp', {
      //   phone: phoneDigits,
      //   country: selectedCountry.code,
      // });



      const token = Platform.OS === 'android' ? await androidToken() : await iosToken();
      const response = await loginUser(selectedCountry.code, phoneDigits, token);
      console.log('Login response:', response);

      if (response.msg === 'done') {
        // Save token and user_data to AsyncStorage
        await AsyncStorage.setItem('token', response.token);
        await AsyncStorage.setItem('user_data', JSON.stringify(response.user_data));
        await AsyncStorage.setItem("userId",  JSON.stringify(response.user_data.uid));
        await AsyncStorage.setItem('loginType', response.user_data.type);
        if (response.user_data.type == 'user') {
          // Navigate to Home
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
        } else if (response.user_data.type == 'admin') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'AdminChatHistory' }],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'ChatHistory' }],
          });
        }
      } else {
        Alert.alert('Error', response.error || 'Verification failed');
      }





      // Otherwise proceed to OTP if user_id present
      // if (response?.user_id) {
      //   navigation.navigate('Otp', {
      //     user_id: response.user_id,
      //     phone: phoneDigits,
      //     country: selectedCountry.code,
      //   });
      // } else {
      //   const errMsg = response?.error || 'Failed to login. Please try again.';
      //   Alert.alert('Error', errMsg);
      // }
    } catch (error) {
      const errMsg = error?.response?.data?.error || error?.message || 'Something went wrong. Please try again.';
      Alert.alert('Error', errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <SafeAreaView style={styles.container}>
      

      {/* Header */}
      <View style={styles.header}>
        <BackButton navigation={navigation}/>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Enter your mobile number</Text>
          <Text style={styles.subtitle}>
            We'll send you a verification code to confirm your identity.
            Standard rates may apply.
          </Text>
        </View>

        {/* Phone Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>

          <View style={styles.phoneWrapper}>
            {/* Country Code */}
            <TouchableOpacity 
              style={styles.countryBox}
              onPress={() => setShowPicker(true)}
            >
              <Text style={styles.countryCode}>+{selectedCountry.code}</Text>
              <Icon name="expand-more" size={18} color={GRAY} />
            </TouchableOpacity>
            {/* Input */}
            <TextInput
              placeholder="000-000-0000"
              placeholderTextColor="#c7c7c7"
              keyboardType="phone-pad"
              returnKeyType="done"
              style={styles.input}
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                setError('');
              }}
              maxLength={15}
            />
            <Icon name="call" size={20} color={GRAY} style={styles.callIcon} />
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <View style={{ flex: 1 }} />

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.continueButton, loading && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.continueText}>Continue</Text>
                <Icon name="arrow-forward" size={22} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.terms}>
            By clicking "Continue", you agree to our{' '}
            <Text 
              style={styles.link}
              onPress={() => terms && Linking.openURL(terms)}
            >
              Terms of Service
            </Text> and{' '}
            <Text 
              style={styles.link}
              onPress={() => privacy && Linking.openURL(privacy)}
            >
              Privacy Policy
            </Text>.
          </Text>
        </View>
      </View>

      {/* Country Picker Modal */}
      <Modal
        visible={showPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country Code</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Icon name="close" size={24} color={TEXT_DARK} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={countryList}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryItem}
                  onPress={() => {
                    setSelectedCountry(item);
                    setShowPicker(false);
                  }}
                >
                  <Text style={styles.countryName}>{item.name}</Text>
                  <Text style={styles.countryCodeText}>+{item.code}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* iOS Home Indicator */}
      <View style={styles.homeIndicatorWrapper}>
        <View style={styles.homeIndicator} />
      </View>
    </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  titleBlock: {
    marginTop: 10,
    marginBottom: 32,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
    maxWidth: 280,
  },
  inputGroup: {
    marginTop: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    letterSpacing: 1,
    marginBottom: 8,
  },
  phoneWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  countryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    backgroundColor: '#f9fafb',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  flag: {
    width: 24,
    height: 16,
    borderRadius: 2,
    marginRight: 6,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 2,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '500',
    color: TEXT_DARK,
  },
  callIcon: {
    paddingRight: 16,
  },
  footer: {
    paddingBottom: 30,
    paddingTop: 20,
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 10,
    marginBottom: 25,
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
  },
  continueText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  terms: {
    marginTop: 20,
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 16,
  },
  link: {
    textDecorationLine: 'underline',
  },
  homeIndicatorWrapper: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  homeIndicator: {
    width: 120,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#e5e7eb',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_DARK,
  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  countryName: {
    fontSize: 16,
    color: TEXT_DARK,
    flex: 1,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: PRIMARY_COLOR,
  },
});
