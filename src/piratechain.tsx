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

import { InitializerConfig,
         SynchronizerCallbacks,
         SynchronizerStatus,
         UpdateEvent} from 'react-native-piratechain/lib/src/types'; 
import { makeSynchronizer as makePirateSyncer,
         Synchronizer as PirateSyncer,
} from 'react-native-piratechain';


class PirateWallet extends Component {

     state: {
         pirateSyncer: PirateSyncer,
         balance: string,
         chainheight: number,
         height: number,
         saplingAddress: string
     }

      constructor (props: any) {
        super(props)

          this.state = {
              pirateSyncer: new PirateSyncer('piratechain', 'mainnet'),
              balance: '0',
              chainheight: 0,
              height: 0,
              saplingAddress: ''
          }

          this.startSyncer = this.startSyncer.bind(this)
          this.setSyncer = this.setSyncer.bind(this)
          this.setBalance = this.setBalance.bind(this)
          this.setHeight = this.setHeight.bind(this)
          this.setChainHeight = this.setChainHeight.bind(this)
          this.getChainHeight = this.getChainHeight.bind(this)
          this.getBalance = this.getBalance.bind(this)
          this.subscribeToStatus = this.subscribeToStatus.bind(this)
          this.setSaplingAddress = this.setSaplingAddress.bind(this)
          this.getAddresses = this.getAddresses.bind(this)
      }

  pirateConfig: InitializerConfig = {
    networkName: 'mainnet',
    defaultHost: 'lightd1.pirate.black',
    defaultPort: 443,
    mnemonicSeed: 'view yellow sponsor daring tiny exercise method connect neutral genuine piano fresh virtual loyal entry bird nerve cliff axis image toe sausage duck elephant',
    alias: 'piratechain',
    birthdayHeight: 2700000
  };

  listener: SynchronizerCallbacks = {
    onStatusChanged: (status: SynchronizerStatus) => {
      console.log("PirateChain - " + `Listener - Sync Status Changed: ${status.alias}`);
    },
    onUpdate: (event: UpdateEvent) => {
      if(event.hasOwnProperty('lastDownloadedHeight')) {
          console.log("PirateChain - " + `Listener - Sync Update: ${event.lastDownloadedHeight}`);
          this.setHeight(event.lastDownloadedHeight)
      }
    }
  };

  setSyncer (b:PirateSyncer) {this.setState({pirateSyncer: b})}
  setBalance (b:string) {this.setState({balance: b})}
  setHeight (b:number) {this.setState({height:b})}
  setChainHeight (b:number) {this.setState({chainheight:b})}
  setSaplingAddress (b:string) {this.setState({saplingAddress: b})}

  async startSyncer() {
    const newPirateSyncer: PirateSyncer = await makePirateSyncer(this.pirateConfig);
    this.setSyncer(newPirateSyncer)
  }

  async getBalance() {
    try {
        const newBalance = await this.state.pirateSyncer.getBalance();
        this.setBalance(newBalance.totalZatoshi);
        console.log("PirateChain - " + this.state.balance);
    } catch (e) {
        console.log("PirateChain - " + "Get Balance error " + e)
    }
    setTimeout(this.getBalance, 10000);
  }

  async getChainHeight() {
      try {
        const newHeight = await this.state.pirateSyncer.getLatestNetworkHeight('piratechain');
        this.setChainHeight(newHeight);
        console.log("PirateChain - " + "Chain Height " + this.state.chainheight);
    } catch (e) {
        console.log("PirateChain - " + "Get Chain Heigh error - " + e)
    }
    setTimeout(this.getChainHeight, 10000);
  }

  async getAddresses() {
    try {
      const addresses = await this.state.pirateSyncer.deriveUnifiedAddress()
      //this.setUnifiedAddress(addresses.unifiedAddress)
      this.setSaplingAddress(addresses.saplingAddress)
      //this.setTransparentAddress(addresses.transparentAddress)
      //console.log("ZCash Unified Address - " + addresses.unifiedAddress)
      console.log("Pirate Sapling Address - " + addresses.saplingAddress)
      //console.log("ZCash Transparent Address - " + addresses.transparentAddress)
    } catch (e) {
      console.log("Pirate - getAddresses error: " + e)
    }
    setTimeout(this.getAddresses, 10000);
  }

  subscribeToStatus() {
    this.state.pirateSyncer.subscribe(this.listener);
  }

  componentDidMount() {
    this.startSyncer()
    this.getBalance()
    this.getChainHeight()
    this.getAddresses()
    this.subscribeToStatus()
  }
  render () {
      return (
        <SafeAreaView>
          <Text>Pirate Chain</Text>
          <Text>Balance: {this.state.balance}</Text>
          <Text>Wallet Height {this.state.height} </Text>
          <Text>Chain Height {this.state.chainheight} </Text>
          <Text />
          <Text>Sapling Address: {this.state.saplingAddress}</Text>
        </SafeAreaView>
      )
  }
}


const PiratePage = () => {
    return (<PirateWallet />)
}

export default PiratePage