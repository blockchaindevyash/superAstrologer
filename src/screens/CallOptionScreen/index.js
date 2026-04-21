import {
  View,
  TouchableOpacity,
  Image,
  Text,
  StatusBar,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { portraitStyles, landscapeStyles } from './styles';
import useOrientation from '../../components/OrientationComponent';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import volumeMute from '../../images/volumeMute.png';
import volume from '../../images/volume.png';
import flip from '../../images/flip.png';
import phone from '../../images/phone.png';
import COLORS from '../../config/colors';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const appId = '1241194d17a64f37b07cd58e95a6e1b2';

const CallOptionScreen = ({ navigation, route }) => {
  const orientation = useOrientation();
  const isPortrait = orientation === 'portrait';
  const styles = isPortrait ? portraitStyles : landscapeStyles;
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState(null);
  const [muted, setMuted] = useState(false);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
    }, [])
  );

  const endCall = () => {
    navigation.goBack();
  };

  const startCall = () => {
    console.log('Start Call');
  };

  return (
    <View style={styles.safeAreaStyle}>
      <View
        style={{
          width: '100%',
          paddingTop: insets.top,
          backgroundColor: COLORS.primary,
        }}
      />
      <View style={styles.mainView}>
        <Text style={styles.mobileNumberText}>Incoming Call...</Text>
      <View style={styles.controls}>
        <TouchableOpacity style={styles.startButton} onPress={startCall}>
          <Image source={phone} style={styles.backImage}/>
        </TouchableOpacity>
        <TouchableOpacity style={styles.endButton} onPress={endCall}>
          <Image source={phone} style={styles.backImage}/>
        </TouchableOpacity>
      </View>
      </View>
    </View>
  );
};

export default CallOptionScreen;
