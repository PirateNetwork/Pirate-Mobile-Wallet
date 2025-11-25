import React, { useState } from 'react';
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

interface WalletSetupProps {
  onComplete: (name: string, seedPhrase: string, birthdayHeight: number) => void;
  onBack?: () => void;
}

const WalletSetup: React.FC<WalletSetupProps> = ({ onComplete, onBack }) => {
  const [walletName, setWalletName] = useState('');
  const [seedPhrase, setSeedPhrase] = useState('');
  const [birthdayHeight, setBirthdayHeight] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const validateSeedPhrase = (phrase: string): boolean => {
    const words = phrase.trim().split(/\s+/);
    return words.length === 24 && words.every(word => word.length > 0);
  };

  const validateBirthdayHeight = (height: string): boolean => {
    const num = parseInt(height);
    return !isNaN(num) && num > 0 && num < 10000000;
  };

  const handleCreateWallet = () => {
    const trimmedName = walletName.trim();
    const trimmedPhrase = seedPhrase.trim();
    const trimmedHeight = birthdayHeight.trim();

    if (!trimmedName) {
      Alert.alert('Error', 'Please enter a wallet name');
      return;
    }

    if (!validateSeedPhrase(trimmedPhrase)) {
      Alert.alert(
        'Invalid Seed Phrase',
        'Please enter exactly 24 words separated by spaces.'
      );
      return;
    }

    if (!validateBirthdayHeight(trimmedHeight)) {
      Alert.alert(
        'Invalid Birthday Height',
        'Please enter a valid block height (positive number).'
      );
      return;
    }

    setIsCreating(true);
    
    // Call the completion handler with the wallet name, seed phrase and birthday height
    try {
      onComplete(trimmedName, trimmedPhrase, parseInt(trimmedHeight));
    } catch (error) {
      setIsCreating(false);
      Alert.alert('Error', `Failed to create wallet: ${error}`);
    }
  };

  const getWordCount = (): number => {
    const trimmed = seedPhrase.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.title}>Import from Seed</Text>
          <Text style={styles.subtitle}>
            Enter your 24-word recovery phrase and birthday height to restore your wallet
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Wallet Name</Text>
          <TextInput
            style={styles.input}
            value={walletName}
            onChangeText={setWalletName}
            placeholder="e.g., My Imported Wallet"
            placeholderTextColor="#555"
            autoCapitalize="words"
            editable={!isCreating}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Seed Phrase (24 words)</Text>
          <TextInput
            style={styles.seedInput}
            value={seedPhrase}
            onChangeText={setSeedPhrase}
            placeholder="Enter your 24-word seed phrase..."
            placeholderTextColor="#555"
            multiline
            numberOfLines={6}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isCreating}
          />
          <View style={styles.wordCountContainer}>
            <Text style={[
              styles.wordCount,
              getWordCount() === 24 ? styles.wordCountValid : styles.wordCountInvalid
            ]}>
              {getWordCount()} / 24 words
            </Text>
          </View>
          <Text style={styles.helperText}>
            Separate each word with a space. Make sure to enter all 24 words in the correct order.
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Birthday Height</Text>
          <TextInput
            style={styles.input}
            value={birthdayHeight}
            onChangeText={setBirthdayHeight}
            placeholder="e.g., 3126435"
            placeholderTextColor="#555"
            keyboardType="numeric"
            editable={!isCreating}
          />
          <Text style={styles.helperText}>
            The block height when your wallet was created. Use a lower number if unsure (it will take longer to sync).
          </Text>
        </View>

        <View style={styles.exampleSection}>
          <Text style={styles.exampleTitle}>💡 What is Birthday Height?</Text>
          <Text style={styles.exampleText}>
            The birthday height is the blockchain block number when your wallet was first created. 
            This helps the wallet sync faster by skipping blocks before your wallet existed.
          </Text>
          <Text style={styles.exampleText}>
            • If you know the exact date you created your wallet, use that block height
          </Text>
          <Text style={styles.exampleText}>
            • If unsure, use a lower number (e.g., 3000000) - syncing will just take longer
          </Text>
          <Text style={styles.exampleText}>
            • Check explorer.piratechain.com to find block heights by date
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.createButton, isCreating && styles.createButtonDisabled]}
          onPress={handleCreateWallet}
          disabled={isCreating}
        >
          {isCreating ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <Text style={styles.createButtonText}>Create Wallet</Text>
          )}
        </TouchableOpacity>

        <View style={styles.warningSection}>
          <Text style={styles.warningTitle}>⚠️ Security Warning</Text>
          <Text style={styles.warningText}>
            • Never share your seed phrase with anyone
          </Text>
          <Text style={styles.warningText}>
            • Store your seed phrase safely offline
          </Text>
          <Text style={styles.warningText}>
            • Anyone with your seed phrase can access your funds
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E27',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#F7B32B',
    fontFamily: 'sans-serif',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F7B32B',
    marginBottom: 12,
    letterSpacing: 0.5,
    fontFamily: 'sans-serif',
  },
  subtitle: {
    fontSize: 14,
    color: '#7A8BA9',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'sans-serif',
  },
  formGroup: {
    marginBottom: 28,
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
  seedInput: {
    backgroundColor: 'rgba(15, 21, 53, 0.6)',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#FFFFFF',
    minHeight: 140,
    textAlignVertical: 'top',
    fontFamily: 'monospace',
    lineHeight: 22,
  },
  wordCountContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  wordCount: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  wordCountValid: {
    color: '#4caf50',
  },
  wordCountInvalid: {
    color: '#7A8BA9',
  },
  helperText: {
    fontSize: 11,
    color: '#7A8BA9',
    marginTop: 8,
    lineHeight: 16,
    fontFamily: 'sans-serif',
  },
  exampleSection: {
    backgroundColor: 'rgba(15, 21, 53, 0.6)',
    borderRadius: 12,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 255, 0.2)',
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00D9FF',
    marginBottom: 10,
    fontFamily: 'sans-serif',
  },
  exampleText: {
    fontSize: 12,
    color: '#B8C5D9',
    lineHeight: 18,
    marginBottom: 6,
    fontFamily: 'sans-serif',
  },
  createButton: {
    backgroundColor: '#F7B32B',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#D4AF37',
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
    color: '#0A0E27',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontFamily: 'sans-serif',
  },
  warningSection: {
    backgroundColor: 'rgba(255, 68, 68, 0.15)',
    borderRadius: 12,
    padding: 18,
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
});

export default WalletSetup;
