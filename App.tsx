/**
 * Pirate Mobile Wallet App
 * Main application router and screen controller
 */

import React, { Component } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Alert,
  NativeModules,
  LogBox,
} from 'react-native';

import MainScreen from './src/MainScreen';
import SplashScreen from './src/SplashScreen';
import LoadingScreen from './src/LoadingScreen';
import WalletManager from './src/WalletManager';
import CreateWallet from './src/CreateWallet';
import WalletSetup from './src/WalletSetup';
import SendScreen from './src/SendScreen';
import ReceiveScreen from './src/ReceiveScreen';
import TransactionDetail from './src/TransactionDetail';

import AsyncStorage from '@react-native-async-storage/async-storage';

// Suppress NativeEventEmitter warnings from react-native-piratechain
LogBox.ignoreLogs([
  '`new NativeEventEmitter()` was called with a non-null argument without the required `addListener` method',
  '`new NativeEventEmitter()` was called with a non-null argument without the required `removeListeners` method',
]);

import { 
  InitializerConfig,
  SynchronizerCallbacks,
  StatusEvent,
  UpdateEvent,
  ErrorEvent,
  ConfirmedTransaction,
  BlockRange
} from 'react-native-piratechain/lib/src/types'; 

import { 
  makeSynchronizer as makePirateSyncer,
  Synchronizer as PirateSyncer,
} from 'react-native-piratechain';

// Screen state enum
export enum ScreenState {
  SPLASH = 'SPLASH',
  WALLET_MANAGER = 'WALLET_MANAGER',
  CREATE_WALLET = 'CREATE_WALLET',
  WALLET_SETUP = 'WALLET_SETUP',
  LOADING = 'LOADING',
  MAIN = 'MAIN',
  SEND = 'SEND',
  RECEIVE = 'RECEIVE',
  TRANSACTION_DETAIL = 'TRANSACTION_DETAIL',
}

interface AppState {
  currentScreen: ScreenState;
  selectedTransaction: any | null;
  selectedWallet: any | null;
  loadingMessage: string | null;
  
  // Native module state
  pirateSyncer: PirateSyncer | null;
  balance: string;
  chainheight: number;
  height: number;
  saplingAddress: string;
  isInitialized: boolean;
  currentWalletId: string | null;
  transactions: any[];
  isLoadingTransactions: boolean;
}

interface AppProps {}

class App extends Component<AppProps, AppState> {
  mainScreenRef: any = null;

  pirateConfig: InitializerConfig = {
    networkName: 'mainnet',
    defaultHost: 'lightd1.pirate.black',
    defaultPort: 443,
    mnemonicSeed: '',
    alias: 'piratechain',
    birthdayHeight: 0
  };

  listener: SynchronizerCallbacks = {
    onStatusChanged: (status: StatusEvent) => {
      console.log("PirateChain - Sync Status Changed:", status.name);
      
      if (status.name === 'SYNCED' || status.name === 'SYNCING') {
        console.log("PirateChain - Sync status changed, updating data...");
        this.getBalance();
        this.getAddresses();
        
        if (status.name === 'SYNCED') {
          this.loadTransactionsForList();
        }
      }
    },
    onUpdate: (event: UpdateEvent) => {
      if(event.hasOwnProperty('lastDownloadedHeight')) {
          console.log("PirateChain - Sync Update:", event.lastDownloadedHeight);
          this.setState({ height: event.lastDownloadedHeight });
          this.getBalance();
      }
      if(event.hasOwnProperty('networkBlockHeight')) {
          this.setState({ chainheight: event.networkBlockHeight });
      }
    },
    onError: (event: ErrorEvent) => {
      console.error("PirateChain - Sync Error:", event);
      Alert.alert('Sync Error', `${event.message}\n\nPlease try again later.`);
    }
  };

  constructor(props: AppProps) {
    super(props);
    this.state = {
      currentScreen: ScreenState.SPLASH,
      selectedTransaction: null,
      selectedWallet: null,
      loadingMessage: null,
      
      // Native module state
      pirateSyncer: null,
      balance: '0',
      chainheight: 0,
      height: 0,
      saplingAddress: '',
      isInitialized: false,
      currentWalletId: null,
      transactions: [],
      isLoadingTransactions: false,
    };
  }

  componentWillUnmount() {
    // Clean up synchronizer when component unmounts (e.g., hot reload)
    if (this.state.pirateSyncer) {
      console.log("PirateChain - Component unmounting, stopping synchronizer...");
      try {
        this.state.pirateSyncer.stop();
        this.state.pirateSyncer.unsubscribe();
      } catch (e) {
        console.log("PirateChain - Error stopping synchronizer on unmount:", e);
      }
    }
    
    // Also force stop via native module with current alias
    if (this.pirateConfig.alias) {
      try {
        NativeModules.RNPiratechain.stop(this.pirateConfig.alias);
      } catch (e) {
        console.log("PirateChain - Error force stopping on unmount:", e);
      }
    }
  }

  // ====================
  // NATIVE MODULE METHODS
  // ====================

  async startSyncer() {
    try {
      // Try to stop any existing synchronizer in state
      if (this.state.pirateSyncer) {
        try {
          console.log("PirateChain - Stopping existing synchronizer in state...");
          await this.state.pirateSyncer.stop();
          this.state.pirateSyncer.unsubscribe();
          this.setState({ pirateSyncer: null });
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (e) {
          console.log("PirateChain - Error stopping existing synchronizer:", e);
        }
      }
      
      // Force stop via native module - try multiple possible aliases
      const aliasesToTry = [
        this.pirateConfig.alias, // Current wallet's alias (should be just wallet.id)
        'piratechain', // Default alias
      ];
      
      // If we have a stored wallet ID, also try various formats
      if (this.state.currentWalletId) {
        aliasesToTry.push(this.state.currentWalletId); // Just the ID
        aliasesToTry.push(`piratechain_${this.state.currentWalletId}`); // Legacy format
      }
      
      // Remove duplicates
      const uniqueAliases = [...new Set(aliasesToTry)];
      
      console.log("PirateChain - Attempting to stop synchronizers with aliases:", uniqueAliases);
      
      for (const alias of uniqueAliases) {
        try {
          await NativeModules.RNPiratechain.stop(alias);
          console.log(`PirateChain - Successfully stopped alias: ${alias}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (e) {
          const errorMsg = e instanceof Error ? e.message : String(e);
          console.log(`PirateChain - Stop result for ${alias}:`, errorMsg);
        }
      }
      
      // Wait a bit for all stops to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log("PirateChain - Initializing new synchronizer...");
      const newPirateSyncer: PirateSyncer = await makePirateSyncer(this.pirateConfig);
      this.setState({ pirateSyncer: newPirateSyncer, isInitialized: true });
      console.log("PirateChain - Synchronizer initialized successfully");
      
      // Subscribe and get initial data
      console.log("PirateChain - Starting data load...");
      this.subscribeToStatus();
      
      // Get initial data
      try {
        await this.getBalance();
        await this.getAddresses();
        console.log("PirateChain - Initial wallet data loaded successfully");
      } catch (error) {
        console.log("PirateChain - Error loading initial data:", error);
      }
      
      // Show main screen
      console.log("PirateChain - Wallet load complete, showing main screen");
      this.handleWalletLoadComplete();
      
      // Load transactions in background (don't block screen transition)
      this.loadTransactionsForList();
      
    } catch (e) {
      const errorMsg = String(e);
      console.log("PirateChain - Failed to initialize synchronizer:", errorMsg);
      
      if (errorMsg.includes('Wallet not found') || errorMsg.includes('No wallet')) {
        console.log("PirateChain - No wallet found, showing wallet manager");
        this.handleBackToWalletManager();
        return;
      }
      
      if (errorMsg.includes('Another synchronizer')) {
        console.log("PirateChain - Another synchronizer still active, retrying in 10s...");
        // Retry with shorter interval since we've tried stopping all aliases
        setTimeout(() => this.startSyncer(), 10000);
        return;
      }
      
      console.log("PirateChain - Retrying initialization in 5s...");
      setTimeout(() => this.startSyncer(), 5000);
    }
  }

  subscribeToStatus() {
    if (!this.state.pirateSyncer || !this.state.isInitialized) {
      return;
    }
    this.state.pirateSyncer.subscribe(this.listener);
  }

  async getBalance() {
    if (!this.state.pirateSyncer || !this.state.isInitialized) {
      return;
    }
    try {
      const newBalance = await this.state.pirateSyncer.getBalance();
      this.setState({ balance: newBalance.totalZatoshi });
      console.log("PirateChain - Balance:", newBalance.totalZatoshi);
    } catch (e) {
      const errorMsg = String(e);
      console.log("PirateChain - Get Balance error:", errorMsg);
      if (errorMsg.includes('Wallet not found') || errorMsg.includes('No wallet')) {
        console.log("PirateChain - No wallet found, switching to wallet manager");
        this.handleBackToWalletManager();
      }
    }
  }

  async getAddresses() {
    if (!this.state.pirateSyncer || !this.state.isInitialized) {
      return;
    }
    try {
      const addresses = await this.state.pirateSyncer.deriveUnifiedAddress();
      this.setState({ saplingAddress: addresses.saplingAddress });
      console.log("Pirate Sapling Address:", addresses.saplingAddress);
    } catch (e) {
      const errorMsg = String(e);
      console.log("Pirate - getAddresses error:", errorMsg);
      if (errorMsg.includes('Wallet not found') || errorMsg.includes('No wallet')) {
        console.log("PirateChain - No wallet found, switching to wallet manager");
        this.handleBackToWalletManager();
      }
    }
  }

  async fetchTransactions(): Promise<ConfirmedTransaction[]> {
    if (!this.state.pirateSyncer || !this.state.isInitialized) {
      throw new Error('Wallet not initialized');
    }

    try {
      console.log('PirateChain - Fetching transactions...');
      const range: BlockRange = {
        first: this.pirateConfig.birthdayHeight,
        last: this.state.height > 0 ? this.state.height : this.pirateConfig.birthdayHeight + 1000
      };
      
      const transactions = await this.state.pirateSyncer.getTransactions(range);
      console.log(`PirateChain - Found ${transactions.length} transactions`);
      return transactions.sort((a, b) => b.blockTimeInSeconds - a.blockTimeInSeconds);
    } catch (error) {
      console.error('PirateChain - Fetch transactions error:', error);
      throw error;
    }
  }

  loadTransactionsForList = async () => {
    try {
      console.log('PirateChain - loadTransactionsForList called');
      this.setState({ isLoadingTransactions: true });
      const txs = await this.fetchTransactions();
      console.log(`PirateChain - Loaded ${txs.length} transactions for list`);
      this.setState({ 
        transactions: txs,
        isLoadingTransactions: false 
      });
    } catch (error) {
      console.error('PirateChain - Error loading transactions:', error);
      this.setState({ 
        transactions: [],
        isLoadingTransactions: false 
      });
    }
  }

  handleSendTransaction = async (transaction: {
    fromAddress: string;
    toAddress: string;
    amount: string;
    fee: string;
    memo: string;
  }): Promise<void> => {
    if (!this.state.pirateSyncer || !this.state.isInitialized) {
      throw new Error('Wallet not initialized');
    }

    try {
      console.log('PirateChain - Sending transaction:', transaction);
      const zatoshi = Math.floor(parseFloat(transaction.amount) * 100000000).toString();
      const memoToSend = transaction.memo && transaction.memo.trim() !== '' ? transaction.memo : '';
      
      const result = await this.state.pirateSyncer.sendToAddress({
        zatoshi,
        toAddress: transaction.toAddress,
        memo: memoToSend,
        mnemonicSeed: this.pirateConfig.mnemonicSeed,
      });

      console.log('PirateChain - Transaction result:', result);
      this.getBalance();
    } catch (error) {
      console.error('PirateChain - Send transaction error:', error);
      throw error;
    }
  }

  handleRescan = async () => {
    Alert.alert(
      'Rescan Blockchain',
      'This will re-download and verify all blocks from your wallet birthday. This may take several hours. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rescan',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!this.state.pirateSyncer) {
                Alert.alert('Error', 'Wallet not initialized');
                return;
              }
              
              console.log("PirateChain - Calling rescan method...");
              await this.state.pirateSyncer.rescan();
              
              this.setState({
                balance: '0',
                height: 0,
                transactions: []
              });
              
              console.log("PirateChain - Rescan initiated");
              Alert.alert('Rescan Started', 'Blockchain rescan started from birthday height: ' + this.pirateConfig.birthdayHeight);
            } catch (error) {
              console.error("PirateChain - Error during rescan:", error);
              Alert.alert('Error', `Failed to rescan: ${error}`);
              try {
                await this.startSyncer();
              } catch (e) {
                console.error("PirateChain - Failed to restart after error:", e);
              }
            }
          }
        }
      ]
    );
  }

  async saveWalletConfig() {
    try {
      const configToSave = {
        mnemonicSeed: this.pirateConfig.mnemonicSeed,
        birthdayHeight: this.pirateConfig.birthdayHeight,
        walletCreated: true,
      };
      await AsyncStorage.setItem('@wallet_config', JSON.stringify(configToSave));
    } catch (error) {
      console.error('PirateChain - Error saving wallet config:', error);
    }
  }

  async setCurrentWallet(walletId: string) {
    try {
      await AsyncStorage.setItem('@current_wallet_id', walletId);
      this.setState({ currentWalletId: walletId });
    } catch (error) {
      console.error('PirateChain - Error setting current wallet:', error);
    }
  }

  async loadWallet(wallet: any) {
    console.log("PirateChain - Loading wallet:", wallet.name);
    
    this.pirateConfig = {
      networkName: 'mainnet',
      defaultHost: 'lightd1.pirate.black',
      defaultPort: 443,
      mnemonicSeed: wallet.mnemonicSeed,
      alias: wallet.id,
      birthdayHeight: wallet.birthdayHeight || 0
    };
    
    await this.setCurrentWallet(wallet.id);
    await this.saveWalletConfig();
    await this.startSyncer();
  }

  // ====================
  // NAVIGATION METHODS
  // ====================

  navigateToScreen = (screen: ScreenState, data?: any) => {
    console.log('App - Navigating to screen:', screen);
    this.setState({ 
      currentScreen: screen,
      ...(data && { selectedTransaction: data.transaction })
    });
  }

  handleSplashFinish = () => {
    this.navigateToScreen(ScreenState.WALLET_MANAGER);
  }

  handleWalletSelected = async (wallet: any) => {
    console.log('App - handleWalletSelected called with wallet:', wallet.name);
    
    // Store the wallet and show loading screen
    this.setState({ 
      selectedWallet: wallet,
      currentScreen: ScreenState.LOADING,
      loadingMessage: 'Opening wallet...'
    });
    
    // Load the wallet directly
    try {
      await this.loadWallet(wallet);
    } catch (error) {
      console.error('App - Error loading wallet:', error);
      Alert.alert('Error', 'Failed to load wallet: ' + error);
      this.setState({ 
        currentScreen: ScreenState.WALLET_MANAGER,
        selectedWallet: null,
        loadingMessage: null
      });
    }
  }

  handleWalletLoadComplete = () => {
    console.log('App - handleWalletLoadComplete called');
    this.setState({ 
      currentScreen: ScreenState.MAIN,
      loadingMessage: null 
    });
  }

  handleShowSend = () => {
    this.navigateToScreen(ScreenState.SEND);
  }

  handleShowReceive = () => {
    this.navigateToScreen(ScreenState.RECEIVE);
  }

  handleShowTransactionDetail = (transaction: any) => {
    this.navigateToScreen(ScreenState.TRANSACTION_DETAIL, { transaction });
  }

  handleBackToMain = () => {
    this.navigateToScreen(ScreenState.MAIN);
  }

  handleBackToWalletManager = async () => {
    try {
      // Show loading screen while switching
      console.log("PirateChain - Switching wallet, showing loading screen...");
      this.setState({ 
        currentScreen: ScreenState.LOADING,
        loadingMessage: 'Closing wallet...'
      });
      
      // Give UI time to render loading screen
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Stop current synchronizer if active
      if (this.state.pirateSyncer) {
        try {
          console.log("PirateChain - Stopping synchronizer to switch wallet...");
          await this.state.pirateSyncer.stop();
          this.state.pirateSyncer.unsubscribe();
        } catch (e) {
          console.log("PirateChain - Error stopping pirateSyncer:", e);
        }
      }
      
      // Force stop via native module with current alias
      if (this.pirateConfig.alias) {
        try {
          console.log("PirateChain - Force stopping via native module with alias:", this.pirateConfig.alias);
          await NativeModules.RNPiratechain.stop(this.pirateConfig.alias);
        } catch (e) {
          console.log("PirateChain - Native stop result:", e);
        }
      }
      
      // Clear all state
      this.setState({ 
        pirateSyncer: null,
        isInitialized: false,
        balance: '0',
        height: 0,
        chainheight: 0,
        saplingAddress: '',
        transactions: [],
        currentWalletId: null
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log("PirateChain - Navigating to wallet manager...");
      this.setState({ 
        currentScreen: ScreenState.WALLET_MANAGER,
        loadingMessage: null 
      });
    } catch (error) {
      console.error("PirateChain - Error switching to wallet manager:", error);
      // Navigate anyway even if stop fails
      this.setState({ 
        currentScreen: ScreenState.WALLET_MANAGER,
        loadingMessage: null 
      });
    }
  }

  render() {
    console.log('App - RENDER, currentScreen:', this.state.currentScreen);

    // Always render MainScreen once it's been loaded (keep it mounted)
    const showMainScreen = this.state.currentScreen === ScreenState.LOADING || 
                          this.state.currentScreen === ScreenState.MAIN || 
                          this.state.currentScreen === ScreenState.SEND || 
                          this.state.currentScreen === ScreenState.RECEIVE || 
                          this.state.currentScreen === ScreenState.TRANSACTION_DETAIL;

    return (
      <>
        {/* Splash Screen */}
        {this.state.currentScreen === ScreenState.SPLASH && (
          <SplashScreen onFinish={this.handleSplashFinish} />
        )}

        {/* Wallet Manager */}
        {this.state.currentScreen === ScreenState.WALLET_MANAGER && (
          <SafeAreaView style={styles.container}>
            <WalletManager 
              onSelectWallet={this.handleWalletSelected}
              onCreateNew={() => this.navigateToScreen(ScreenState.CREATE_WALLET)}
              onImportSeed={() => this.navigateToScreen(ScreenState.WALLET_SETUP)}
            />
          </SafeAreaView>
        )}

        {/* Create Wallet */}
        {this.state.currentScreen === ScreenState.CREATE_WALLET && (
          <SafeAreaView style={styles.container}>
            <CreateWallet 
              onComplete={this.handleWalletSelected}
              onBack={this.handleBackToWalletManager}
            />
          </SafeAreaView>
        )}

        {/* Wallet Setup */}
        {this.state.currentScreen === ScreenState.WALLET_SETUP && (
          <SafeAreaView style={styles.container}>
            <WalletSetup 
              onComplete={this.handleWalletSelected}
              onBack={this.handleBackToWalletManager}
            />
          </SafeAreaView>
        )}

        {/* Main Screen - keep mounted after first load */}
        {showMainScreen && (
          <SafeAreaView style={[
            styles.container, 
            this.state.currentScreen !== ScreenState.MAIN && { position: 'absolute', opacity: 0 }
          ]}>
            <MainScreen 
              ref={(ref: any) => this.mainScreenRef = ref}
              // Wallet data
              balance={this.state.balance}
              height={this.state.height}
              chainheight={this.state.chainheight}
              saplingAddress={this.state.saplingAddress}
              transactions={this.state.transactions}
              isLoadingTransactions={this.state.isLoadingTransactions}
              isInitialized={this.state.isInitialized}
              // Actions
              onNavigate={this.navigateToScreen}
              onShowSend={this.handleShowSend}
              onShowReceive={this.handleShowReceive}
              onShowTransactionDetail={this.handleShowTransactionDetail}
              onSwitchWallet={this.handleBackToWalletManager}
              onLoadComplete={this.handleWalletLoadComplete}
              onRefreshTransactions={this.loadTransactionsForList}
              onRefreshBalance={this.getBalance}
              onRescan={this.handleRescan}
            />
          </SafeAreaView>
        )}

        {/* Loading Screen - overlay */}
        {this.state.currentScreen === ScreenState.LOADING && (
          <SafeAreaView style={styles.container}>
            <LoadingScreen 
              message={this.state.loadingMessage || undefined}
              isInitialized={this.state.isInitialized}
            />
          </SafeAreaView>
        )}

        {/* Send Screen - overlay */}
        {this.state.currentScreen === ScreenState.SEND && (
          <SafeAreaView style={styles.container}>
            <SendScreen 
              onSend={this.handleSendTransaction}
              defaultFromAddress={this.state.saplingAddress}
              onBack={this.handleBackToMain}
            />
          </SafeAreaView>
        )}

        {/* Receive Screen - overlay */}
        {this.state.currentScreen === ScreenState.RECEIVE && (
          <SafeAreaView style={styles.container}>
            <ReceiveScreen 
              address={this.state.saplingAddress}
              onBack={this.handleBackToMain}
            />
          </SafeAreaView>
        )}

        {/* Transaction Detail - overlay */}
        {this.state.currentScreen === ScreenState.TRANSACTION_DETAIL && (
          <SafeAreaView style={styles.container}>
            <TransactionDetail
              transaction={this.state.selectedTransaction}
              onBack={this.handleBackToMain}
            />
          </SafeAreaView>
        )}
      </>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E27',
  },
});

export default App;
