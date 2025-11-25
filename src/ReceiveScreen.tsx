import React, { Component } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Clipboard,
  SafeAreaView,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface ReceiveScreenProps {
  address: string;
  onBack: () => void;
}

interface ReceiveScreenState {
  amount: string;
  memo: string;
  showQRCode: boolean;
}

class ReceiveScreen extends Component<ReceiveScreenProps, ReceiveScreenState> {
  constructor(props: ReceiveScreenProps) {
    super(props);
    this.state = {
      amount: '',
      memo: '',
      showQRCode: false,
    };
  }

  generateQRData = () => {
    const { address } = this.props;
    const { amount, memo } = this.state;

    // Create a payment request URI
    // Format: piratechain:address?amount=X&memo=Y
    let qrData = `piratechain:${address}`;
    const params = [];

    if (amount && parseFloat(amount) > 0) {
      params.push(`amount=${amount}`);
    }

    if (memo && memo.trim() !== '') {
      params.push(`memo=${encodeURIComponent(memo.trim())}`);
    }

    if (params.length > 0) {
      qrData += '?' + params.join('&');
    }

    return qrData;
  };

  handleGenerateQR = () => {
    const { amount } = this.state;

    // Validate amount if provided
    if (amount && amount.trim() !== '') {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0');
        return;
      }
    }

    this.setState({ showQRCode: true });
  };

  handleCopyAddress = () => {
    Clipboard.setString(this.props.address);
    Alert.alert('Copied!', 'Address copied to clipboard');
  };

  handleCopyQRData = () => {
    const qrData = this.generateQRData();
    Clipboard.setString(qrData);
    Alert.alert('Copied!', 'Payment request copied to clipboard');
  };

  handleReset = () => {
    this.setState({
      amount: '',
      memo: '',
      showQRCode: false,
    });
  };

  render() {
    const { address, onBack } = this.props;
    const { amount, memo, showQRCode } = this.state;

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Receive ARRR</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Address Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Payment Address</Text>
            <View style={styles.addressContainer}>
              <Text style={styles.addressText} selectable>{address}</Text>
            </View>
            <TouchableOpacity style={styles.copyButton} onPress={this.handleCopyAddress}>
              <Text style={styles.copyButtonText}>Copy Address</Text>
            </TouchableOpacity>
          </View>

          {/* QR Code Generation Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Request (Optional)</Text>
            <Text style={styles.sectionDescription}>
              Generate a QR code with amount and memo for easier payment requests
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount (ARRR)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="#7A8BA9"
                value={amount}
                onChangeText={(text) => this.setState({ amount: text })}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Memo (Optional)</Text>
              <TextInput
                style={[styles.input, styles.memoInput]}
                placeholder="Enter a note for the sender"
                placeholderTextColor="#7A8BA9"
                value={memo}
                onChangeText={(text) => this.setState({ memo: text })}
                multiline
                maxLength={512}
              />
              <Text style={styles.charCount}>{memo.length}/512</Text>
            </View>

            <TouchableOpacity style={styles.generateButton} onPress={this.handleGenerateQR}>
              <Text style={styles.generateButtonText}>Generate QR Code</Text>
            </TouchableOpacity>
          </View>

          {/* QR Code Display */}
          {showQRCode && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment QR Code</Text>
              <View style={styles.qrContainer}>
                <QRCode
                  value={this.generateQRData()}
                  size={250}
                  backgroundColor="white"
                  color="#0A0E27"
                />
              </View>
              
              <Text style={styles.qrDataText} selectable>
                {this.generateQRData()}
              </Text>

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.actionButton} onPress={this.handleCopyQRData}>
                  <Text style={styles.actionButtonText}>Copy Data</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.resetButton]} onPress={this.handleReset}>
                  <Text style={styles.actionButtonText}>Reset</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.helpText}>
                Share this QR code with the sender. They can scan it to automatically fill in the payment details.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E27',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2742',
  },
  backButton: {
    width: 80,
  },
  backButtonText: {
    color: '#F7B32B',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#7A8BA9',
    marginBottom: 15,
    lineHeight: 20,
  },
  addressContainer: {
    backgroundColor: '#1E2742',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  addressText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'monospace',
    lineHeight: 22,
  },
  copyButton: {
    backgroundColor: '#F7B32B',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  copyButtonText: {
    color: '#0A0E27',
    fontSize: 16,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1E2742',
    borderRadius: 12,
    padding: 15,
    color: '#FFFFFF',
    fontSize: 16,
  },
  memoInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#7A8BA9',
    marginTop: 5,
    textAlign: 'right',
  },
  generateButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  qrContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
  },
  qrDataText: {
    fontSize: 12,
    color: '#7A8BA9',
    fontFamily: 'monospace',
    backgroundColor: '#1E2742',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#F7B32B',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#E25C4A',
  },
  actionButtonText: {
    color: '#0A0E27',
    fontSize: 14,
    fontWeight: '700',
  },
  helpText: {
    fontSize: 13,
    color: '#7A8BA9',
    lineHeight: 20,
    textAlign: 'center',
  },
});

export default ReceiveScreen;
