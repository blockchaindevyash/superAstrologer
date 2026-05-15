import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import COLORS from '../../config/colors';
import { BackButton } from '../../config/service';
import { loginUser, resendCode, verifyCode } from '../../api/api';
import { getAuth, signInWithPhoneNumber } from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging';
import { getConfirmation, setConfirmation } from './firebaseConfirm';

const PRIMARY_COLOR = COLORS.primary;
const OTP_LENGTH = 6;
export default function OtpVerificationScreen({ navigation, route }) {
  const { phone, country } = route?.params || {};
  const inputRefs = useRef([]);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleResendCode = async () => {
    if (!canResend || resending) return;

    try {
      setResending(true);
      let phoneNumber = `+${country}${phone}`;
      const authInstance = getAuth();
      const confirm = await signInWithPhoneNumber(authInstance, phoneNumber);
      setConfirmation(confirm);
      setTimer(60);
      setCanResend(false);
      Alert.alert('Success', 'Verification code has been resent!');
    } catch (error) {
      console.log('Resend error:', error);
      Alert.alert('Error', 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
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

  const handleVerify = async (newOtpValues) => {
    const vcode = newOtpValues.join('');
    console.log('Entered OTP:', vcode);
    if (vcode.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit code');
      setVerifying(false);
      return;
    }
    const token = Platform.OS === 'android' ? await androidToken() : await iosToken();
    console.log("APNs Token:", token);
    const confirm = getConfirmation();
    try {
      setVerifying(true);
       await confirm.confirm(vcode);
      const response = await loginUser(country, phone, token);
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
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Invalid OTP. Please try again.';
      console.log('Get error:', error);
      Alert.alert('Error', errorMsg);
    } finally {
      setVerifying(false);
    }
  };

  const formattedPhone = `+${country} ${phone}`;

  const handleOtpChange = (text, index) => {
    const cleanedText = text.replace(/[^0-9]/g, '');

    if (cleanedText.length > 1) {
      const pastedOtp = cleanedText.slice(0, OTP_LENGTH).split('');

      const newOtpValues = [...otpValues];

      pastedOtp.forEach((digit, i) => {
        newOtpValues[i] = digit;
      });

      setOtpValues(newOtpValues);

      Keyboard.dismiss();

      // Focus last input
      inputRefs.current[OTP_LENGTH - 1]?.focus();

      // Auto verify if complete
      if (pastedOtp.length === OTP_LENGTH) {
        setVerifying(true);
        handleVerify(newOtpValues);
      }

      return;
    }

    const newOtpValues = [...otpValues];
    newOtpValues[index] = cleanedText;

    setOtpValues(newOtpValues);

    if (cleanedText && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // ✅ Auto verify
    if (index === OTP_LENGTH - 1 && cleanedText) {
      Keyboard.dismiss();

      const finalOtp = newOtpValues.join('');

      if (finalOtp.length === OTP_LENGTH) {
        setVerifying(true);
        handleVerify(newOtpValues);
      }
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={styles.header}>
        <BackButton navigation={navigation} />
        <View style={{ width: 40 }} />
      </View>
      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Verify Phone</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{' '}
            <Text style={styles.phone}>{formattedPhone}</Text>
          </Text>
        </View>
        {/* OTP Inputs */}
        <View style={styles.otpContainer}>
          {[0, 1, 2, 3, 4, 5].map((_, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={styles.otpInput}
              keyboardType="number-pad"
              returnKeyType="done"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              maxLength={index === 0 ? 6 : 1}
              textAlign="center"
              value={otpValues[index]}
              onChangeText={(text) => handleOtpChange(text, index)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace' && !otpValues[index] && index > 0) {
                  inputRefs.current[index - 1].focus();
                }
              }}
            />
          ))}
        </View>
        {/* Resend */}
        <View style={styles.resendBlock}>
          <View style={styles.resendRow}>
            <Text style={styles.resendText}>Didn't receive the code?</Text>
            <TouchableOpacity 
              onPress={handleResendCode}
              disabled={!canResend || resending}
            >
              <Text style={[styles.resendLink, (!canResend || resending) && styles.resendLinkDisabled]}>
                {resending ? 'Sending...' : 'Resend Code'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Timer */}
          {timer > 0 && (
            <View style={styles.timerBox}>
              <Icon name="schedule" size={16} color={PRIMARY_COLOR} />
              <View style={styles.timerText}>
                <Text style={styles.time}>{Math.floor(timer / 60).toString().padStart(2, '0')}</Text>
                <Text style={styles.unit}>min</Text>
                <Text style={styles.colon}>:</Text>
                <Text style={styles.time}>{(timer % 60).toString().padStart(2, '0')}</Text>
                <Text style={styles.unit}>sec</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Footer */}
      {/* <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.verifyButton, verifying && styles.verifyButtonDisabled]}
          onPress={() => handleVerify(otpValues)}
          disabled={verifying}
        >
          {verifying ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.verifyText}>Verify & Proceed</Text>
              <Icon name="arrow-forward" size={22} color="#fff" />
            </>
          )}
        </TouchableOpacity>

        <View style={styles.homeIndicatorWrapper}>
          <View style={styles.homeIndicator} />
        </View>
      </View> */}
      {verifying && (
        <View style={styles.indicatorView}>
          <ActivityIndicator color="#fff" size="large" />
        </View>
      )}
    </View>
    </TouchableWithoutFeedback>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  indicatorView: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
  },

  headerBlock: {
    marginBottom: 40,
  },

  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#181210',
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 16,
    color: '#737980',
    maxWidth: 280,
    lineHeight: 22,
  },

  phone: {
    color: '#181210',
    fontWeight: '700',
  },

  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 40,
  },

  otpInput: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    fontSize: 20,
    fontWeight: '700',
    color: '#181210',
    backgroundColor: COLORS.secondary,
  },

  resendBlock: {
    alignItems: 'center',
    gap: 24,
  },

  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  resendText: {
    fontSize: 14,
    color: '#737980',
  },

  resendLink: {
    fontSize: 14,
    color: PRIMARY_COLOR,
    fontWeight: '700',
  },

  resendLinkDisabled: {
    opacity: 0.4,
  },

  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f6f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 30,
    gap: 8,
  },

  timerText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  time: {
    fontSize: 14,
    fontWeight: '700',
    color: '#181210',
  },

  colon: {
    fontSize: 14,
    fontWeight: '700',
    marginHorizontal: 4,
  },

  unit: {
    fontSize: 10,
    fontWeight: '700',
    color: '#737980',
    textTransform: 'uppercase',
  },

  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },

  verifyButton: {
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

  verifyButtonDisabled: {
    opacity: 0.6,
  },

  verifyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },

  homeIndicatorWrapper: {
    marginTop: 24,
    alignItems: 'center',
  },

  homeIndicator: {
    width: 120,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#e5e5e5',
  },
});
