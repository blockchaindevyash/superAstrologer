import React, {useState, useEffect} from 'react';
import {Dimensions} from 'react-native';

const useOrientation = () => {
  const [orientation, setOrientation] = useState(
    Dimensions.get('window').width > Dimensions.get('window').height
      ? 'landscape'
      : 'portrait',
  );

  useEffect(() => {
    const handleOrientationChange = () => {
      const {width, height} = Dimensions.get('window');
      setOrientation(width > height ? 'landscape' : 'portrait');
    };

    Dimensions.addEventListener('change', handleOrientationChange);

    // return () => {
    //   Dimensions.removeEventListener('change', handleOrientationChange);
    // };
  }, []);

  return orientation;
};

export default useOrientation;
