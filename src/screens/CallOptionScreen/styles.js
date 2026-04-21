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
    justifyContent: 'center',
  },
  mobileNumberText: {
    fontSize: hp(2.4),
    fontWeight: '800',
    color: COLORS.text,
    marginLeft: wp(5),
  },
  mainView: {
    width: '75%',
    height: '80%',
    justifyContent: 'space-between',
    alignSelf: 'center',
    alignItems: 'center',
  },
  controls: {
    width: '100%',
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
  },
  endButton: {
    backgroundColor: 'red',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: 'green',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backImage: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
    tintColor: COLORS.white,
  }
});

export const landscapeStyles = StyleSheet.create({
  safeAreaStyle: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
  mobileNumberText: {
    fontSize: hp(2.4),
    fontWeight: '800',
    color: COLORS.white,
    marginLeft: wp(5),
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
  backImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    tintColor: COLORS.white,
  }
});
