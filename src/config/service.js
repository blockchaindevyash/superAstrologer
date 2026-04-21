import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import COLORS from '../config/colors';

/* =======================
   Loader Component
======================= */
export const Loader = ({ text = 'Loading...', fullScreen = true }) => {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <MaterialIcons name="wb-sunny" size={40} color={COLORS.primary} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
};

/* =======================
   Back Button Component
======================= */
export const BackButton = ({ navigation, style, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.backBtn, style]}
      onPress={() => {
        if (typeof onPress === 'function') {
          onPress();
          return;
        }
        if (navigation?.canGoBack && navigation.canGoBack()) {
          navigation.goBack();
        } else if (navigation?.goBack) {
          navigation.goBack();
        }
      }}
    >
      <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
    </TouchableOpacity>
  );
};

/* =======================
   Status Bar Component
======================= */
export const AppStatusBar = ({
  backgroundColor = COLORS.secondary,
  barStyle = 'dark-content',
}) => {
  return (
    <StatusBar
      backgroundColor={backgroundColor}
      barStyle={barStyle}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
});
