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
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  IRtcEngine,
  RtcSurfaceView,
  RtcConnection,
  IRtcEngineEventHandler,
  RenderModeType,
} from 'react-native-agora';
import AsyncStorage from '@react-native-async-storage/async-storage';

const appId = '1241194d17a64f37b07cd58e95a6e1b2';

const VideoCallScreen = ({ navigation, route }) => {
  const orientation = useOrientation();
  const isPortrait = orientation === 'portrait';
  const styles = isPortrait ? portraitStyles : landscapeStyles;
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [engine, setEngine] = useState(null);
  const [joined, setJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState(null);
  const [muted, setMuted] = useState(false);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
    }, [])
  );

  useEffect(() => {
    setupAgora();
    return () => {
      engine?.leaveChannel();
      engine?.release();
    };
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.CAMERA,
      ]);
    }
  };

  const setupAgora = async () => {
    try {
      let agoraData = route.params?.data;

      console.log("Agora Data::", agoraData);

      await requestPermissions();

      const rtcEngine = createAgoraRtcEngine();
      rtcEngine.initialize({ appId });

      rtcEngine.enableVideo();
      rtcEngine.setupLocalVideo({
        uid: 0,
        renderMode: RenderModeType.RenderModeHidden,
      });
      rtcEngine.startPreview();
      rtcEngine.setChannelProfile(
        ChannelProfileType.ChannelProfileCommunication
      );

      rtcEngine.setClientRole(
        ClientRoleType.ClientRoleBroadcaster
      );

      // ✅ Register events BEFORE join
      rtcEngine.registerEventHandler({
        onJoinChannelSuccess: (connection, elapsed) => {
          console.log("Join channel success");
          setJoined(true);
        },
        onUserJoined: (connection, uid) => {
          console.log("Remote user joined:", uid, "current user", agoraData?.uid);
          setRemoteUid(uid);
        },
        onUserOffline: (connection, uid) => {
          console.log("Remote user left:", uid);
          setRemoteUid(null);
          engine?.leaveChannel();
          engine?.release();
          navigation.goBack();
        },
        onError: (err) => {
          console.log("Agora Error:", err);
        },
      });

      // ✅ Join channel correctly
      await rtcEngine.joinChannel(
        agoraData?.agoraToken,
        agoraData?.channelName,
        Number(agoraData?.uid),
        {
          publishMicrophoneTrack: true,
          publishCameraTrack: true,
          autoSubscribeAudio: true,
          autoSubscribeVideo: true,
        }
      );
      setEngine(rtcEngine);

    } catch (error) {
      console.log("Setup Agora Error:", error);
    }
  };

  const endCall = () => {
    engine.leaveChannel();
    engine.release();
    navigation.goBack();
  };

  const switchCamera = () => {
    if (engine) {
      engine.switchCamera();
    }
  };

  const muteCamera = () => {
    if (engine) {
      engine.muteLocalVideoStream(!muted);
      setMuted(!muted);
    }
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
      {/* Remote Video Full Screen */}
      {remoteUid !== null && (
        <RtcSurfaceView
          style={styles.remoteVideo}
          canvas={{uid: remoteUid}}
        />
      )}
      {/* Local Video Small Preview */}
      {joined && (
        <RtcSurfaceView
          style={styles.localVideo}
          canvas={{uid: 0}}
          zOrderMediaOverlay={true}
        />
      )}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.switchButton}
          onPress={switchCamera}>
          <Image source={flip} style={styles.backImage}/>
        </TouchableOpacity>

        <TouchableOpacity style={styles.endButton} onPress={endCall}>
          <Image source={phone} style={styles.backImage}/>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.switchButton}
          onPress={muteCamera}>
          <Image source={muted ? volumeMute : volume} style={styles.backImage}/>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default VideoCallScreen;
