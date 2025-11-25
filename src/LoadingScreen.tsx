import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

interface LoadingScreenProps {
  message?: string;
  isInitialized?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message, 
  isInitialized = false 
}) => {
  const displayMessage = message || (isInitialized ? 'Loading wallet data...' : 'Initializing wallet...');
  
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>P</Text>
      </View>
      <ActivityIndicator size="large" color="#F7B32B" style={styles.spinner} />
      <Text style={styles.loadingText}>{displayMessage}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0E27',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F7B32B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#F7B32B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  logoText: {
    fontSize: 72,
    fontWeight: '700',
    color: '#0A0E27',
    fontFamily: 'sans-serif',
  },
  spinner: {
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 18,
    color: '#F7B32B',
    fontWeight: '600',
    fontFamily: 'sans-serif',
    letterSpacing: 0.5,
  },
});

export default LoadingScreen;
