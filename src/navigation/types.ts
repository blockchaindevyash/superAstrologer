export type RootStackParamList = {
  Home: undefined;
  VideoCallScreen: {
    data: {
      agoraToken: string;
      channelName: string;
      uid: number;
      name: string;
    };
  };
  AudioCallScreen: {
    data: {
      agoraToken: string;
      channelName: string;
      uid: number;
      name: string;
    };
  };
  MessageScreen: {
    id: string;
    from: string;
  };
};

export const NotificationNavigationFlag = {
  isNotificationNavigation: false,
};