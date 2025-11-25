import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  Modal,
  Linking,
} from 'react-native';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';

interface SendScreenProps {
  onSend: (transaction: {
    fromAddress: string;
    toAddress: string;
    amount: string;
    fee: string;
    memo: string;
  }) => Promise<void>;
  defaultFromAddress?: string;
  onBack: () => void;
}

const SendScreen: React.FC<SendScreenProps> = ({ onSend, defaultFromAddress = '', onBack }) => {
  const [fromAddress, setFromAddress] = useState(defaultFromAddress);
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [fee, setFee] = useState('0.0001'); // Default fee
  const [memo, setMemo] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  const device = useCameraDevice('back');

  // Update from address when prop changes
  useEffect(() => {
    setFromAddress(defaultFromAddress);
  }, [defaultFromAddress]);

  // Request camera permission
  useEffect(() => {
    const requestCameraPermission = async () => {
      const permission = await Camera.requestCameraPermission();
      setHasPermission(permission === 'granted');
    };
    requestCameraPermission();
  }, []);

  const parseQRData = (data: string) => {
    try {
      console.log('PirateChain - Scanned QR data:', data);

      // Check if it's a Pirate Chain payment URI
      if (data.startsWith('piratechain:')) {
        const withoutScheme = data.substring('piratechain:'.length);
        const [address, queryString] = withoutScheme.split('?');

        // Set the address
        if (address) {
          setToAddress(address);
        }

        // Parse query parameters if present
        if (queryString) {
          const params = new URLSearchParams(queryString);
          
          const qrAmount = params.get('amount');
          if (qrAmount) {
            setAmount(qrAmount);
          }

          const qrMemo = params.get('memo');
          if (qrMemo) {
            setMemo(decodeURIComponent(qrMemo));
          }
        }

        Alert.alert('Success', 'Payment request scanned successfully');
        setShowScanner(false);
      } else {
        // Just treat it as an address
        setToAddress(data);
        Alert.alert('Success', 'Address scanned successfully');
        setShowScanner(false);
      }
    } catch (error) {
      console.error('PirateChain - Error parsing QR data:', error);
      Alert.alert('Error', 'Failed to parse QR code data');
    }
  };

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      if (codes.length > 0 && codes[0].value) {
        parseQRData(codes[0].value);
      }
    },
  });

  const handleOpenScanner = async () => {
    if (!hasPermission) {
      Alert.alert(
        'Camera Permission Required',
        'Please grant camera permission to scan QR codes',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }

    setShowScanner(true);
  };

  const validateInputs = (): boolean => {
    if (!fromAddress.trim()) {
      Alert.alert('Error', 'Please enter a from address');
      return false;
    }

    if (!toAddress.trim()) {
      Alert.alert('Error', 'Please enter a destination address');
      return false;
    }

    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return false;
    }

    if (!fee.trim() || isNaN(Number(fee)) || Number(fee) < 0) {
      Alert.alert('Error', 'Please enter a valid fee');
      return false;
    }

    return true;
  };

  const handleSend = async () => {
    if (!validateInputs()) {
      return;
    }

    setIsSending(true);
    try {
      await onSend({
        fromAddress,
        toAddress,
        amount,
        fee,
        memo,
      });
      
      Alert.alert('Success', 'Transaction sent successfully', [
        { text: 'OK', onPress: onBack }
      ]);
      
      // Clear form
      setToAddress('');
      setAmount('');
      setMemo('');
    } catch (error) {
      console.error('Send error:', error);
      Alert.alert('Error', `Failed to send transaction: ${error}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Send Transaction</Text>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>From Address</Text>
          <TextInput
            style={styles.input}
            value={fromAddress}
            onChangeText={setFromAddress}
            placeholder="Your address"
            placeholderTextColor="#999"
            editable={!defaultFromAddress}
          />
        </View>

        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>To Address</Text>
            <TouchableOpacity onPress={handleOpenScanner} style={styles.scanButton}>
              <Text style={styles.scanButtonText}>📷 Scan QR</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            value={toAddress}
            onChangeText={setToAddress}
            placeholder="Recipient address"
            placeholderTextColor="#999"
            multiline
            numberOfLines={2}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Amount (ARRR)</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor="#999"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Fee (ARRR)</Text>
          <TextInput
            style={styles.input}
            value={fee}
            onChangeText={setFee}
            placeholder="0.0001"
            placeholderTextColor="#999"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Memo (Optional)</Text>
          <TextInput
            style={[styles.input, styles.memoInput]}
            value={memo}
            onChangeText={setMemo}
            placeholder="Add a message..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            maxLength={512}
          />
          <Text style={styles.helperText}>{memo.length}/512 characters</Text>
        </View>

        <TouchableOpacity
          style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={isSending}
        >
          {isSending ? (
            <ActivityIndicator color="#0a0a0a" />
          ) : (
            <Text style={styles.sendButtonText}>Send Transaction</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* QR Scanner Modal */}
      <Modal
        visible={showScanner}
        animationType="slide"
        onRequestClose={() => setShowScanner(false)}
      >
        <View style={styles.scannerContainer}>
          {device && hasPermission ? (
            <>
              <Camera
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={showScanner}
                codeScanner={codeScanner}
              />
              <View style={styles.scannerOverlay}>
                <View style={styles.scannerHeader}>
                  <TouchableOpacity
                    onPress={() => setShowScanner(false)}
                    style={styles.scannerCloseButton}
                  >
                    <Text style={styles.scannerCloseText}>✕ Close</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.scannerFrame}>
                  <View style={styles.scannerCorner} />
                </View>
                <Text style={styles.scannerInstructions}>
                  Point camera at QR code to scan payment request
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.scannerError}>
              <Text style={styles.scannerErrorText}>
                {!device ? 'No camera available' : 'Camera permission denied'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowScanner(false)}
                style={styles.scannerCloseButton}
              >
                <Text style={styles.scannerCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E27', // Dark blue-black background
  },
  header: {
    backgroundColor: '#0F1535',
    paddingTop: 12,
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.1)',
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 15,
    color: '#F7B32B',
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 10,
    color: '#F7B32B',
    letterSpacing: 0.5,
    fontFamily: 'sans-serif',
  },
  formGroup: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00D9FF',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontFamily: 'sans-serif',
  },
  scanButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
  memoInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 11,
    color: '#7A8BA9',
    marginTop: 6,
    fontFamily: 'sans-serif',
  },
  sendButton: {
    backgroundColor: '#F7B32B',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 32,
    shadowColor: '#F7B32B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#3A4563',
    shadowOpacity: 0,
  },
  sendButtonText: {
    color: '#0A0E27',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontFamily: 'sans-serif',
  },
  // Scanner styles
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scannerOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scannerHeader: {
    width: '100%',
    paddingTop: 50,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  scannerCloseButton: {
    backgroundColor: '#F7B32B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  scannerCloseText: {
    color: '#0A0E27',
    fontSize: 16,
    fontWeight: '700',
  },
  scannerFrame: {
    width: 280,
    height: 280,
    borderWidth: 2,
    borderColor: '#F7B32B',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  scannerCorner: {
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#F7B32B',
    position: 'absolute',
    top: -2,
    left: -2,
  },
  scannerInstructions: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 80,
    paddingHorizontal: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 15,
    borderRadius: 10,
  },
  scannerError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scannerErrorText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default SendScreen;
