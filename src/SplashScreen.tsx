import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.3);

  useEffect(() => {
    // Animate logo appearing
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Wait 2.5 seconds then fade out and call onFinish
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 2500);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Pirate Skull ASCII Art - Simplified for mobile */}
        <View style={styles.skullContainer}>
          <View style={styles.skullTop}>
            <View style={styles.eyeSocket} />
            <View style={styles.eyeSocket} />
          </View>
          <View style={styles.skullMiddle}>
            <View style={styles.nose} />
          </View>
          <View style={styles.skullBottom}>
            <View style={styles.tooth} />
            <View style={styles.tooth} />
            <View style={styles.tooth} />
            <View style={styles.tooth} />
          </View>
        </View>
        <Animated.Text style={[styles.title, { opacity: fadeAnim }]}>
          PIRATE CHAIN
        </Animated.Text>
        <Animated.Text style={[styles.subtitle, { opacity: fadeAnim }]}>
          Privacy is your right
        </Animated.Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  skullContainer: {
    width: 120,
    height: 140,
    marginBottom: 30,
  },
  skullTop: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 10,
  },
  eyeSocket: {
    width: 35,
    height: 40,
    backgroundColor: '#D4AF37',
    borderRadius: 20,
    transform: [{ rotate: '5deg' }],
  },
  skullMiddle: {
    alignItems: 'center',
    marginBottom: 10,
  },
  nose: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderBottomWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#D4AF37',
    transform: [{ rotate: '180deg' }],
  },
  skullBottom: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  tooth: {
    width: 18,
    height: 25,
    backgroundColor: '#D4AF37',
    borderRadius: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: 2,
    marginTop: 20,
    marginBottom: 8,
    fontFamily: 'sans-serif',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    letterSpacing: 1,
    fontFamily: 'sans-serif',
  },
});

export default SplashScreen;
