import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WalletInfo {
  id: string;
  name: string;
  mnemonicSeed: string;
  birthdayHeight: number;
  createdAt: number;
}

interface WalletManagerProps {
  onSelectWallet: (wallet: WalletInfo) => void;
  onCreateNew: () => void;
  onImportSeed: () => void;
}

const WalletManager: React.FC<WalletManagerProps> = ({ 
  onSelectWallet, 
  onCreateNew,
  onImportSeed 
}) => {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      const walletsJson = await AsyncStorage.getItem('@wallets_list');
      if (walletsJson) {
        const walletsList = JSON.parse(walletsJson);
        setWallets(walletsList);
      }
    } catch (error) {
      console.error('Error loading wallets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWallet = (walletId: string) => {
    Alert.alert(
      'Delete Wallet',
      'Are you sure you want to delete this wallet? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedWallets = wallets.filter(w => w.id !== walletId);
              await AsyncStorage.setItem('@wallets_list', JSON.stringify(updatedWallets));
              setWallets(updatedWallets);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete wallet');
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading wallets...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Wallets</Text>
        <Text style={styles.subtitle}>
          Select a wallet or create a new one
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {wallets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No wallets found</Text>
            <Text style={styles.emptySubtext}>
              Create a new wallet or import an existing one
            </Text>
          </View>
        ) : (
          wallets.map((wallet) => (
            <View key={wallet.id} style={styles.walletCard}>
              <TouchableOpacity
                style={styles.walletCardContent}
                onPress={() => onSelectWallet(wallet)}
              >
                <View style={styles.walletInfo}>
                  <Text style={styles.walletName}>{wallet.name}</Text>
                  <Text style={styles.walletDate}>
                    Created: {formatDate(wallet.createdAt)}
                  </Text>
                  <Text style={styles.walletHeight}>
                    Birthday: {wallet.birthdayHeight}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteWallet(wallet.id)}
              >
                <Text style={styles.deleteButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={onCreateNew}
        >
          <Text style={styles.primaryButtonText}>Create New Wallet</Text>
          <Text style={styles.primaryButtonSubtext}>(Random Seed)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={onImportSeed}
        >
          <Text style={styles.secondaryButtonText}>Import from Seed</Text>
          <Text style={styles.secondaryButtonSubtext}>(24-word phrase)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E27',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.1)',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F7B32B',
    marginBottom: 8,
    letterSpacing: 0.5,
    fontFamily: 'sans-serif',
  },
  subtitle: {
    fontSize: 14,
    color: '#7A8BA9',
    fontFamily: 'sans-serif',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#7A8BA9',
    fontFamily: 'sans-serif',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#7A8BA9',
    marginBottom: 8,
    fontFamily: 'sans-serif',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#556380',
    textAlign: 'center',
    fontFamily: 'sans-serif',
  },
  walletCard: {
    backgroundColor: '#0F1535',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  walletCardContent: {
    flex: 1,
    padding: 16,
  },
  walletInfo: {
    flex: 1,
  },
  walletName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F7B32B',
    marginBottom: 8,
    fontFamily: 'sans-serif',
  },
  walletDate: {
    fontSize: 12,
    color: '#7A8BA9',
    marginBottom: 4,
    fontFamily: 'sans-serif',
  },
  walletHeight: {
    fontSize: 12,
    color: '#7A8BA9',
    fontFamily: 'sans-serif',
  },
  deleteButton: {
    width: 50,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: '700',
  },
  actionButtons: {
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.1)',
  },
  actionButton: {
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#F7B32B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryButton: {
    backgroundColor: '#0F1535',
    borderWidth: 2,
    borderColor: '#F7B32B',
  },
  secondaryButton: {
    backgroundColor: '#0F1535',
    borderWidth: 2,
    borderColor: '#F7B32B',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F7B32B',
    marginBottom: 4,
    fontFamily: 'sans-serif',
  },
  primaryButtonSubtext: {
    fontSize: 12,
    color: '#00D9FF',
    fontFamily: 'sans-serif',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F7B32B',
    marginBottom: 4,
    fontFamily: 'sans-serif',
  },
  secondaryButtonSubtext: {
    fontSize: 12,
    color: '#00D9FF',
    fontFamily: 'sans-serif',
  },
});

export default WalletManager;
