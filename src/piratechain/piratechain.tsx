import React from 'react';
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








export default class PiratePage extends Component {

    state: {
        pirateSyncer: PirateSyncer,
        balance: number
    }

    constructor (props: Props) {
        super(props)

        

        this.state = {
            pirateSyncer: new PirateSyncer('piratechain', 'mainnet'),
            balance: 0
        }

        this.startPirateSyncer = this.startPirateSyncer.bind(this)
        this.subscribeToStatus = this.subscribeToStatus.bind(this)
        this.getBalance = this.getBalance.bind(this)
    }
  
        setSyncer (b:PirateSyncer) {this.setState({pirateSyncer: b})}
        setBalance (b:number) {this.setState({balance: b})}

        listener: SynchronizerCallbacks = {
          onStatusChanged: (status: SynchronizerStatus) => {
            console.log(`Sync Status Changed: ${status}`);
          },
          onUpdate: (event: UpdateEvent) => {
            console.log(`Sync Update: ${event}`);
          }
        }

        async startPirateSyncer() {

          const pirateConfig: InitializerConfig = {
            networkName: 'mainnet',
            defaultHost: 'lightd1.pirate.black',
            defaultPort: 443,
            mnemonicSeed: 'view yellow sponsor daring tiny exercise method connect neutral genuine piano fresh virtual loyal entry bird nerve cliff axis image toe sausage duck elephant',
            alias: 'piratechainß',
            birthdayHeight: 200000
          };

          const pirateSyncer = await makePirateSyncer(pirateConfig);
          this.setSyncer(pirateSyncer);
        }
          
        async getBalance() {
          const balance = await this.state.pirateSyncer.getBalance();
          this.setState({balance: balance});
          console.log(balance);
          setTimeout(this.getBalance, 10000);
        }

        subscribeToStatus() {
          this.state.pirateSyncer.subscribe(this.listener);
        }

        componentDidMount() {
            this.setBalance(0)
            this.startPirateSyncer()
            this.subscribeToStatus()
            this.getBalance
        }
  
        componentWillUnmount() {
            
        }
  
  
      render () {
          return (
            <SafeAreaView>
               <Text>Pirate Chain</Text>
               <Text>Balance: {this.state.balance}</Text>
            </SafeAreaView>
          )
      }
    }
  
