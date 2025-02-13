import React, {useEffect, useRef} from 'react';
import {View, StyleSheet, Animated, Easing} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const SkeletonLoader = ({
  width,
  height,
  borderRadius,
}: {
  width: number;
  height: number;
  borderRadius: number;
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ).start();
  }, [animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-2 * width, width],
  });

  return (
    <View style={[styles.container, {width, height, borderRadius}]}>
      <View style={styles.shimmer}>
        <Animated.View
          style={[styles.shine, {transform: [{translateX}], width}]}>
          <LinearGradient
            colors={[
              'transparent',
              '#00ffda',
              '#29e2e3',
              '#2994e3',
              'transparent',
            ]}
            style={[styles.background, {borderRadius}]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
          />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: 'white',
    opacity: 0.5,
  },
});

export default SkeletonLoader;
