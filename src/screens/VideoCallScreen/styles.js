import {Dimensions, Platform, StyleSheet} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from '../../components/Pixel/index';
import COLORS from '../../config/colors';

const { width, height } = Dimensions.get('window');

export const portraitStyles = StyleSheet.create({
  safeAreaStyle: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
  headerView: {
    width: '100%',
    paddingHorizontal: wp(4),
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    height: hp(7),
    backgroundColor: COLORS.primary
  },
  switchButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backImage: {
    width: wp(6),
    height: hp(3),
    resizeMode: 'contain',
    tintColor: COLORS.white,
  },
  mobileNumberText: {
    fontSize: hp(2.4),
    fontWeight: '800',
    color: COLORS.white,
    marginLeft: wp(5),
  },
  localVideo: {
    width: 120,
    height: 180,
    position: 'absolute',
    top: 100,
    right: 20,
    zIndex: 10,
    backgroundColor: 'black',
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    width: '70%',
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
  },
  endButton: {
    backgroundColor: 'red',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export const landscapeStyles = StyleSheet.create({
  safeAreaStyle: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
  headerView: {
    width: '100%',
    paddingHorizontal: hp(4),
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    height: hp(10),
  },
  backImage: {
    width: wp(3),
    height: hp(4),
    resizeMode: 'contain',
    tintColor: COLORS.white,
  },
  mobileNumberText: {
    fontSize: hp(2.8),
    fontWeight: '800',
    color: COLORS.black,
    marginLeft: wp(1.5),
  },
});
