import React, {useState} from 'react';
import {
  Component
} from 'react';

import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  LogBox,
  NativeModules,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Clipboard,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import SendScreen from './SendScreen';
import ReceiveScreen from './ReceiveScreen';
import TransactionList from './TransactionList';
import TransactionDetail from './TransactionDetail';
import WalletSetup from './WalletSetup';
import WalletManager from './WalletManager';
import CreateWallet from './CreateWallet';
import LoadingScreen from './LoadingScreen';
import { ScreenState } from '../App';

// Debug: Check if RNPiratechain module is available
console.log('Available NativeModules:', Object.keys(NativeModules));
console.log('RNPiratechain module:', NativeModules.RNPiratechain);

// Suppress NativeEventEmitter warnings from react-native-piratechain
LogBox.ignoreLogs([
  '`new NativeEventEmitter()` was called with a non-null argument without the required `addListener` method',
  '`new NativeEventEmitter()` was called with a non-null argument without the required `removeListeners` method',
]);

import { InitializerConfig,
         SynchronizerCallbacks,
         StatusEvent,
         UpdateEvent,
         ErrorEvent,
         ConfirmedTransaction,
         BlockRange} from 'react-native-piratechain/lib/src/types'; 
import { makeSynchronizer as makePirateSyncer,
         Synchronizer as PirateSyncer,
} from 'react-native-piratechain';

// Debug: Check imports
console.log('makePirateSyncer:', typeof makePirateSyncer);
console.log('PirateSyncer:', typeof PirateSyncer);

interface MainScreenProps {
  // Wallet data from App
  balance: string;
  height: number;
  chainheight: number;
  saplingAddress: string;
  transactions: any[];
  isLoadingTransactions: boolean;
  isInitialized: boolean;
  
  // Actions
  onNavigate: (screen: ScreenState, data?: any) => void;
  onShowSend: () => void;
  onShowReceive: () => void;
  onShowTransactionDetail: (transaction: any) => void;
  onSwitchWallet: () => void;
  onLoadComplete: () => void;
  onRefreshTransactions: () => void;
  onRefreshBalance: () => void;
  onRescan: () => void;
}

class PirateWallet extends Component<MainScreenProps> {

     state: {
         showMenu: boolean,
     }

      constructor (props: MainScreenProps) {
        super(props)

          this.state = {
              showMenu: false,
          }
      }

  // ====================
  // UI-ONLY METHODS
  // ====================

  toggleMenu = () => {
    this.setState({ showMenu: !this.state.showMenu });
  }

  toggleSendScreen = () => {
    this.setState({ showMenu: false });
    this.props.onShowSend();
  }

  toggleReceiveScreen = () => {
    this.setState({ showMenu: false });
    this.props.onShowReceive();
  }

  handleTransactionPress = (transaction: any) => {
    console.log("PirateChain - Transaction pressed:", transaction.id);
    this.setState({ showMenu: false });
    this.props.onShowTransactionDetail(transaction);
  }

  handleSwitchWallet = async () => {
    try {
      console.log("PirateChain - Switch wallet requested");
      this.setState({ showMenu: false });
      
      // Call the parent's switch wallet handler
      this.props.onSwitchWallet();
    } catch (error) {
      console.error("PirateChain - Error switching wallet:", error);
    }
  }

  handleExportSeed = () => {
    this.setState({ showMenu: false });
    Alert.alert('Export Seed', 'This feature will be implemented soon');
  }

  handleExportPrivateKey = () => {
    this.setState({ showMenu: false });
    Alert.alert('Export Private Key', 'This feature will be implemented soon');
  }

  render () {
      console.log('PirateChain - MainScreen RENDER called');

      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.headerBar}>
            <TouchableOpacity 
              style={styles.hamburgerMenu}
              onPress={this.toggleMenu}
            >
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
            </TouchableOpacity>
            
            {/* Sync Status - Centered */}
            <Text style={[
              styles.headerSyncStatus,
              this.props.chainheight > 0 && (this.props.height / this.props.chainheight) < 1 
                ? styles.headerSyncStatusSyncing 
                : styles.headerSyncStatusSynced
            ]}>
              Syncing {this.props.height} {this.props.chainheight > 0 ? ((this.props.height / this.props.chainheight) * 100).toFixed(2) : '0.00'}%
            </Text>
            
            <View style={[
              styles.statusDot,
              this.props.chainheight > 0 && (this.props.height / this.props.chainheight) < 1 
                ? styles.statusDotSyncing 
                : styles.statusDotSynced
            ]} />
          </View>

          {/* Centered Wallet Menu Modal */}
          {this.state.showMenu && (
            <View style={styles.menuOverlay}>
              <View style={styles.menuModal}>
                <View style={styles.menuModalHeader}>
                  <Text style={styles.menuModalTitle}>Wallet Options</Text>
                  <TouchableOpacity 
                    style={styles.menuCloseButton}
                    onPress={this.toggleMenu}
                  >
                    <Text style={styles.menuCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.menuModalContent}>
                  <TouchableOpacity 
                    style={styles.menuModalButton}
                    onPress={this.handleSwitchWallet}
                  >
                    <View style={styles.menuButtonIcon}>
                      <Text style={styles.menuButtonIconText}>⇄</Text>
                    </View>
                    <View style={styles.menuButtonContent}>
                      <Text style={styles.menuModalButtonText}>Switch Wallet</Text>
                      <Text style={styles.menuModalButtonSubtext}>
                        Change to a different wallet
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.menuModalButton}
                    onPress={this.handleExportSeed}
                  >
                    <View style={styles.menuButtonIcon}>
                      <Text style={styles.menuButtonIconText}>🔑</Text>
                    </View>
                    <View style={styles.menuButtonContent}>
                      <Text style={styles.menuModalButtonText}>Export Seed Phrase</Text>
                      <Text style={styles.menuModalButtonSubtext}>
                        View and backup your recovery phrase
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.menuModalButton}
                    onPress={this.handleExportPrivateKey}
                  >
                    <View style={styles.menuButtonIcon}>
                      <Text style={styles.menuButtonIconText}>🔐</Text>
                    </View>
                    <View style={styles.menuButtonContent}>
                      <Text style={styles.menuModalButtonText}>Export Private Key</Text>
                      <Text style={styles.menuModalButtonSubtext}>
                        View your wallet private key
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.menuModalButton}
                    onPress={this.props.onRescan}
                  >
                    <View style={styles.menuButtonIcon}>
                      <Text style={styles.menuButtonIconText}>↻</Text>
                    </View>
                    <View style={styles.menuButtonContent}>
                      <Text style={styles.menuModalButtonText}>Rescan Blockchain</Text>
                      <Text style={styles.menuModalButtonSubtext}>
                        Refresh wallet data from blockchain
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Fixed Top Section */}
          <View style={styles.fixedTopSection}>
            {/* Balance Display */}
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceAmount}>
                {(parseInt(this.props.balance || '0') / 100000000).toFixed(8)}
              </Text>
              <Text style={styles.balanceCurrency}>ARRR</Text>
              <Text style={styles.balanceSubtext}>Pirate Chain</Text>
            </View>
          </View>

          {/* Scrollable Transaction List */}
          <View style={styles.transactionListContainer}>
            <TransactionList
              transactions={this.props.transactions}
              isLoading={this.props.isLoadingTransactions}
              onTransactionPress={this.handleTransactionPress}
              onRefresh={this.props.onRefreshTransactions}
              isRefreshing={this.props.isLoadingTransactions}
            />
          </View>

          {/* Bottom Navigation */}
          <View style={styles.bottomNav}>
            <TouchableOpacity style={styles.navButton}>
              <Text style={styles.navIcon}>⌂</Text>
              <Text style={styles.navLabel}>Wallet</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.navButton}
              onPress={this.toggleSendScreen}
              disabled={!this.props.isInitialized}
            >
              <Text style={styles.navIcon}>⊡</Text>
              <Text style={styles.navLabel}>Send</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.navButton}
              onPress={this.toggleReceiveScreen}
              disabled={!this.props.isInitialized}
            >
              <Text style={styles.navIcon}>↓</Text>
              <Text style={styles.navLabel}>Receive</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.navButton}>
              <Text style={styles.navIcon}>⊕</Text>
              <Text style={styles.navLabel}>Explorer</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E27', // Deep navy/black background
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    backgroundColor: '#0F1535',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.1)',
  },
  hamburgerMenu: {
    gap: 6,
    padding: 8,
  },
  menuLine: {
    width: 28,
    height: 3,
    backgroundColor: '#F7B32B', // Bright gold
    borderRadius: 2,
  },
  headerSyncStatus: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
    flex: 1,
    fontFamily: 'sans-serif',
  },
  headerSyncStatusSyncing: {
    color: '#ff4444', // Red while syncing
  },
  headerSyncStatusSynced: {
    color: '#00D9FF', // Blue when synced
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 5,
  },
  statusDotSyncing: {
    backgroundColor: '#ff4444', // Red while syncing
    shadowColor: '#ff4444',
  },
  statusDotSynced: {
    backgroundColor: '#00D9FF', // Blue when synced
    shadowColor: '#00D9FF',
  },
  fixedTopSection: {
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 12,
  },
  transactionListContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  syncStatus: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00D9FF',
    marginBottom: 24,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  balanceContainer: {
    marginBottom: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(15, 21, 53, 0.6)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(247, 179, 43, 0.2)',
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: '800',
    color: '#F7B32B',
    fontFamily: 'sans-serif',
    letterSpacing: 1,
    textShadowColor: 'rgba(247, 179, 43, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  balanceCurrency: {
    fontSize: 22,
    fontWeight: '700',
    color: '#00D9FF',
    fontFamily: 'sans-serif',
    marginBottom: 12,
    letterSpacing: 2,
  },
  balanceSubtext: {
    fontSize: 15,
    color: '#7A8BA8',
    fontFamily: 'sans-serif',
    marginTop: 4,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  historyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F7B32B',
    fontFamily: 'sans-serif',
  },
  historyArrow: {
    fontSize: 24,
    color: '#F7B32B',
    fontWeight: '700',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#0F1535',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(247, 179, 43, 0.15)',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  navIcon: {
    fontSize: 24,
    color: '#7A8BA8',
    marginBottom: 6,
  },
  navLabel: {
    fontSize: 11,
    color: '#7A8BA8',
    fontFamily: 'sans-serif',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 65,
    right: 16,
    backgroundColor: '#0F1535',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(247, 179, 43, 0.3)',
    minWidth: 200,
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#F7B32B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(247, 179, 43, 0.1)',
    backgroundColor: 'transparent',
  },
  menuItemText: {
    color: '#F7B32B',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'sans-serif',
    letterSpacing: 0.5,
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 14, 39, 0.95)',
    zIndex: 2000,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  menuModal: {
    backgroundColor: '#0F1535',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#F7B32B',
    width: '90%',
    maxWidth: 400,
    shadowColor: '#F7B32B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  menuModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(247, 179, 43, 0.2)',
  },
  menuModalContent: {
    padding: 12,
  },
  menuModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F7B32B',
    fontFamily: 'sans-serif',
    letterSpacing: 0.5,
  },
  menuCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuCloseText: {
    fontSize: 24,
    color: '#ff4444',
    fontWeight: '700',
  },
  menuModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(15, 21, 53, 0.6)',
    marginHorizontal: 8,
    marginVertical: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(247, 179, 43, 0.3)',
  },
  menuButtonIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F7B32B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#F7B32B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  menuButtonIconText: {
    fontSize: 32,
    color: '#0A0E27',
    fontWeight: '700',
  },
  menuButtonContent: {
    flex: 1,
  },
  menuModalButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F7B32B',
    fontFamily: 'sans-serif',
    marginBottom: 4,
  },
  menuModalButtonSubtext: {
    fontSize: 14,
    color: '#7A8BA9',
    fontFamily: 'sans-serif',
  },
});

export default PirateWallet;