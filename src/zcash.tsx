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
} from 'react-native';

import { Addresses, BalanceEvent, InitializerConfig,
         StatusEvent,
         SynchronizerCallbacks,
         TransactionEvent,
         UpdateEvent} from 'react-native-zcash/lib/src/types'; 

import { makeSynchronizer as makeZcashSyncer,
         Synchronizer as ZcashSyncer,
} from 'react-native-zcash';


class ZcashWallet extends Component {

     state: {
         zcashSyncer: ZcashSyncer,
         balance: string,
         orchardBalance: string, 
         saplingBalance: string,
         chainheight: number,
         height: number,
         unifiedAddress: string,
         saplingAddress: string,
         transparentAddress: string

     }

      constructor (props: any) {
        super(props)

          this.state = {
              zcashSyncer: new ZcashSyncer('zcash', 'mainnet'),
              balance: '0',
              saplingBalance: '0',
              orchardBalance: '0',
              chainheight: 0,
              height: 0,
              unifiedAddress: '',
              saplingAddress: '',
              transparentAddress: ''
          }

          this.startSyncer = this.startSyncer.bind(this)
          this.setSyncer = this.setSyncer.bind(this)
          this.setBalance = this.setBalance.bind(this)
          this.setOrchardBalance = this.setOrchardBalance.bind(this)
          this.setSaplingBalance = this.setSaplingBalance.bind(this)
          this.setHeight = this.setHeight.bind(this)
          this.setChainHeight = this.setChainHeight.bind(this)
          this.getChainHeight = this.getChainHeight.bind(this)
          this.subscribeToStatus = this.subscribeToStatus.bind(this)
          this.setUnifiedAddress = this.setUnifiedAddress.bind(this)
          this.setSaplingAddress = this.setSaplingAddress.bind(this)
          this.setTransparentAddress = this.setTransparentAddress.bind(this)
          this.getAddresses = this.getAddresses.bind(this)

      }

  zcashConfig: InitializerConfig = {
    networkName: 'mainnet',
    defaultHost: 'zec.rocks',
    defaultPort: 443,
    mnemonicSeed: 'view yellow sponsor daring tiny exercise method connect neutral genuine piano fresh virtual loyal entry bird nerve cliff axis image toe sausage duck elephant',
    alias: 'zcash',
    birthdayHeight: 2500000,
    newWallet: false
  };

  listener: SynchronizerCallbacks = {
    onStatusChanged: (status: StatusEvent) => {
      console.log("ZCash -  Listener - Status Event:" + status);
    },
    onUpdate: (event: UpdateEvent) => {
        console.log("ZCash - Listener - Update Event: Scan Progress " + event.scanProgress);
        this.setHeight(event.scanProgress);
    },
    onTransactionsChanged: (transactions: TransactionEvent) => {
      console.log("ZCash - Listener - Transaction Event: "+ transactions);
    },
    onBalanceChanged: (balance: BalanceEvent) => {
      console.log("Zcash - Listener - Balance Event: Total Zatoshi " + balance.totalZatoshi);
      console.log("Zcash - Listener - Balance Event: Orchard Zatoshi " + balance.orchardTotalZatoshi);
      console.log("Zcash - Listener - Balance Event: Sapling Zatoshi " + balance.saplingTotalZatoshi);
      this.setBalance(balance.totalZatoshi);
      this.setOrchardBalance(balance.orchardTotalZatoshi);
      this.setSaplingBalance(balance.saplingTotalZatoshi);
    }
  };

  setSyncer (b:ZcashSyncer) {this.setState({zcashSyncer: b})}
  setBalance (b:string) {this.setState({balance: b})}
  setOrchardBalance (b:string) {this.setState({orchardBalance: b})}
  setSaplingBalance (b:string) {this.setState({saplingBalance: b})}
  setHeight (b:number) {this.setState({height:b})}
  setChainHeight (b:number) {this.setState({chainheight:b})}
  setUnifiedAddress (b:string) {this.setState({unifiedAddress: b})}
  setSaplingAddress (b:string) {this.setState({saplingAddress: b})}
  setTransparentAddress (b:string) {this.setState({transparentAddress: b})}





  async startSyncer() {
    const newPirateSyncer: ZcashSyncer = await makeZcashSyncer(this.zcashConfig);
    this.setSyncer(newPirateSyncer);
  }

  async getChainHeight() {
    const newHeight = await this.state.zcashSyncer.getLatestNetworkHeight('zcash');
    this.setChainHeight(newHeight);
    console.log("Zcash - " + this.state.chainheight);
    setTimeout(this.getChainHeight, 10000);
  }

  async getAddresses() {
    try {
      const addresses = await this.state.zcashSyncer.deriveUnifiedAddress()
      this.setUnifiedAddress(addresses.unifiedAddress)
      this.setSaplingAddress(addresses.saplingAddress)
      this.setTransparentAddress(addresses.transparentAddress)
      console.log("ZCash Unified Address - " + addresses.unifiedAddress)
      console.log("ZCash Sapling Address - " + addresses.saplingAddress)
      console.log("ZCash Transparent Address - " + addresses.transparentAddress)
    } catch (e) {
      console.log("Zcash - getAddresses error: " + e)
    }
    setTimeout(this.getAddresses, 10000);
  }

  subscribeToStatus() {
    this.state.zcashSyncer.subscribe(this.listener)
  }

  componentDidMount() {
    this.startSyncer()
    this.getChainHeight()
    this.getAddresses()
    this.subscribeToStatus()
  }
  render () {
               return (
                 <SafeAreaView>
                    <Text>Zcash</Text>
                    <Text>Total Balance: {this.state.balance}</Text>
                    <Text>Orchard Balance: {this.state.orchardBalance}</Text>
                    <Text>Sapling Balance: {this.state.saplingBalance}</Text>
                    <Text>Wallet Height {this.state.height} </Text>
                    <Text>Chain Height {this.state.chainheight} </Text>
                    <Text />
                    <Text>Unified Address: {this.state.unifiedAddress}</Text>
                    <Text />
                    <Text>Sapling Address: {this.state.saplingAddress}</Text>
                    <Text />
                    <Text>Transparent Address: {this.state.transparentAddress}</Text>
                 </SafeAreaView>
               )
           }
}




const ZcashPage = () => {
        
    return (<ZcashWallet />)
    
}




export default ZcashPage


// = extends Component {

//     state: {
//         pirateSyncer: PirateSyncer,
//         balance: number
//     }

//     constructor (props: Props) {
//         super(props)

        

//         this.state = {
//             pirateSyncer: new PirateSyncer('piratechain', 'mainnet'),
//             balance: 0
//         }

//         this.startPirateSyncer = this.startPirateSyncer.bind(this)
//         this.subscribeToStatus = this.subscribeToStatus.bind(this)
//         this.getBalance = this.getBalance.bind(this)
//     }
  
//         setSyncer (b:PirateSyncer) {this.setState({pirateSyncer: b})}
//         setBalance (b:number) {this.setState({balance: b})}

//         listener: SynchronizerCallbacks = {
//           onStatusChanged: (status: SynchronizerStatus) => {
//             console.log(`Sync Status Changed: ${status}`);
//           },
//           onUpdate: (event: UpdateEvent) => {
//             console.log(`Sync Update: ${event}`);
//           }
//         }

//         async startPirateSyncer() {

//           const pirateConfig: InitializerConfig = {
//             networkName: 'mainnet',
//             defaultHost: 'lightd1.pirate.black',
//             defaultPort: 443,
//             mnemonicSeed: 'view yellow sponsor daring tiny exercise method connect neutral genuine piano fresh virtual loyal entry bird nerve cliff axis image toe sausage duck elephant',
//             alias: 'piratechainß',
//             birthdayHeight: 200000
//           };

//           const pirateSyncer = await makePirateSyncer(pirateConfig);
//           this.setSyncer(pirateSyncer);
//         }
          
//         async getBalance() {
//           const balance = await this.state.pirateSyncer.getBalance();
//           this.setState({balance: balance});
//           console.log(balance);
//           setTimeout(this.getBalance, 10000);
//         }

//         subscribeToStatus() {
//           this.state.pirateSyncer.subscribe(this.listener);
//         }

//         componentDidMount() {
//             this.setBalance(0)
//             this.startPirateSyncer()
//             this.subscribeToStatus()
//             this.getBalance
//         }
  
//         componentWillUnmount() {
            
//         }
  
  
//       render () {
//           return (
//             <SafeAreaView>
//                <Text>Pirate Chain</Text>
//                <Text>Balance: {this.state.balance}</Text>
//             </SafeAreaView>
//           )
//       }
//     }
  
