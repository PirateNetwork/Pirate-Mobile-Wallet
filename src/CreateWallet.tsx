import 'react-native-get-random-values';
import { Buffer } from '@craftzdog/react-native-buffer';
// @ts-ignore - polyfill for Buffer
global.Buffer = Buffer;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as bip39 from 'bip39';

interface CreateWalletProps {
  onComplete: (name: string, seedPhrase: string, birthdayHeight: number) => void;
  onBack: () => void;
}

const CreateWallet: React.FC<CreateWalletProps> = ({ onComplete, onBack }) => {
  const [walletName, setWalletName] = useState('');
  const [birthdayHeight, setBirthdayHeight] = useState('');
  const [generatedSeed, setGeneratedSeed] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [seedConfirmed, setSeedConfirmed] = useState(false);

  useEffect(() => {
    generateRandomSeed();
  }, []);

  const generateRandomSeed = () => {
    setIsGenerating(true);
    try {
      // Generate a random 256-bit (24-word) BIP39 mnemonic
      const mnemonic = bip39.generateMnemonic(256);
      setGeneratedSeed(mnemonic);
    } catch (error) {
      console.error('Error generating BIP39 mnemonic:', error);
      Alert.alert('Error', 'Failed to generate seed phrase. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreate = () => {
    if (!walletName.trim()) {
      Alert.alert('Error', 'Please enter a wallet name');
      return;
    }

    if (!seedConfirmed) {
      Alert.alert('Error', 'Please confirm you have saved your seed phrase');
      return;
    }

    const height = parseInt(birthdayHeight.trim());
    if (!height || height <= 0) {
      Alert.alert('Error', 'Please enter a valid birthday height');
      return;
    }

    Alert.alert(
      'Create Wallet',
      'Have you saved your seed phrase? You will need it to restore your wallet.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Create',
          onPress: () => onComplete(walletName.trim(), generatedSeed, height),
        },
      ]
    );
  };

  const copyToClipboard = () => {
    // In a real app, use Clipboard API
    Alert.alert('Copied', 'Seed phrase copied to clipboard');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create New Wallet</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.label}>Wallet Name</Text>
          <TextInput
            style={styles.input}
            value={walletName}
            onChangeText={setWalletName}
            placeholder="e.g., My Main Wallet"
            placeholderTextColor="#555"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Birthday Height</Text>
          <TextInput
            style={styles.input}
            value={birthdayHeight}
            onChangeText={setBirthdayHeight}
            placeholder="e.g., 3126435"
            placeholderTextColor="#555"
            keyboardType="numeric"
          />
          <Text style={styles.helperText}>
            Use current block height for new wallets
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.seedHeader}>
            <Text style={styles.label}>Your Seed Phrase</Text>
            <TouchableOpacity onPress={generateRandomSeed}>
              <Text style={styles.regenerateText}>↻ Regenerate</Text>
            </TouchableOpacity>
          </View>
          
          {isGenerating ? (
            <View style={styles.generatingContainer}>
              <ActivityIndicator color="#D4AF37" />
              <Text style={styles.generatingText}>Generating seed phrase...</Text>
            </View>
          ) : (
            <>
              <View style={styles.seedContainer}>
                <Text style={styles.seedText}>{generatedSeed}</Text>
              </View>
              <TouchableOpacity style={styles.copyButton} onPress={copyToClipboard}>
                <Text style={styles.copyButtonText}>Copy to Clipboard</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.warningSection}>
          <Text style={styles.warningTitle}>⚠️ Important</Text>
          <Text style={styles.warningText}>
            • Write down your seed phrase and store it securely
          </Text>
          <Text style={styles.warningText}>
            • Never share your seed phrase with anyone
          </Text>
          <Text style={styles.warningText}>
            • Anyone with your seed phrase can access your funds
          </Text>
          <Text style={styles.warningText}>
            • If you lose it, you cannot recover your wallet
          </Text>
        </View>

        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setSeedConfirmed(!seedConfirmed)}
        >
          <View style={[styles.checkbox, seedConfirmed && styles.checkboxChecked]}>
            {seedConfirmed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            I have saved my seed phrase securely
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.createButton, !seedConfirmed && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={!seedConfirmed}
        >
          <Text style={styles.createButtonText}>Create Wallet</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E27',
  },
  header: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.1)',
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#F7B32B',
    fontFamily: 'sans-serif',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F7B32B',
    fontFamily: 'sans-serif',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
    color: '#00D9FF',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontFamily: 'sans-serif',
  },
  input: {
    backgroundColor: 'rgba(15, 21, 53, 0.6)',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'sans-serif',
  },
  helperText: {
    fontSize: 11,
    color: '#7A8BA9',
    marginTop: 8,
    fontFamily: 'sans-serif',
  },
  seedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  regenerateText: {
    fontSize: 14,
    color: '#F7B32B',
    fontFamily: 'sans-serif',
  },
  generatingContainer: {
    backgroundColor: 'rgba(15, 21, 53, 0.6)',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  generatingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#7A8BA9',
    fontFamily: 'sans-serif',
  },
  seedContainer: {
    backgroundColor: 'rgba(15, 21, 53, 0.6)',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
  },
  seedText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 22,
    fontFamily: 'monospace',
  },
  copyButton: {
    marginTop: 10,
    backgroundColor: 'rgba(15, 21, 53, 0.8)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  copyButtonText: {
    fontSize: 14,
    color: '#F7B32B',
    fontFamily: 'sans-serif',
  },
  warningSection: {
    backgroundColor: 'rgba(255, 68, 68, 0.15)',
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 68, 68, 0.3)',
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ff4444',
    marginBottom: 10,
    fontFamily: 'sans-serif',
  },
  warningText: {
    fontSize: 12,
    color: '#ffb3b3',
    lineHeight: 18,
    marginBottom: 4,
    fontFamily: 'sans-serif',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#F7B32B',
    borderColor: '#F7B32B',
  },
  checkmark: {
    fontSize: 16,
    color: '#0A0E27',
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
    fontFamily: 'sans-serif',
  },
  createButton: {
    backgroundColor: '#F7B32B',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#F7B32B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  createButtonDisabled: {
    backgroundColor: 'rgba(247, 179, 43, 0.3)',
    shadowOpacity: 0,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A0E27',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontFamily: 'sans-serif',
  },
});

export default CreateWallet;
