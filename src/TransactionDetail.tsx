import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Clipboard,
  Alert,
  SafeAreaView,
} from 'react-native';

interface Transaction {
  rawTransactionId: string;
  blockTimeInSeconds: number;
  minedHeight: number;
  value: string;
  toAddress?: string;
  memos: string[];
  fee?: string;
  inputsCount?: number;
  outputsCount?: number;
}

interface TransactionDetailProps {
  transaction: Transaction;
  onBack: () => void;
}

const TransactionDetail: React.FC<TransactionDetailProps> = ({ transaction, onBack }) => {
  const formatAmount = (value: string): string => {
    const zatoshi = parseInt(value);
    const arrr = Math.abs(zatoshi / 100000000).toFixed(8);
    return arrr;
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  const isPositive = parseInt(transaction.value) < 0;
  const zatoshi = parseInt(transaction.value);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Transaction Details</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Amount Section */}
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>
            {isPositive ? 'RECEIVED' : 'SENT'}
          </Text>
          <Text
            style={[
              styles.amountValue,
              isPositive ? styles.amountPositive : styles.amountNegative,
            ]}
          >
            {isPositive ? '+' : '-'}{formatAmount(transaction.value)} ARRR
          </Text>
          <Text style={styles.amountZatoshi}>
            {Math.abs(zatoshi).toLocaleString()} zatoshi
          </Text>
        </View>

        {/* Transaction ID */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction ID</Text>
          <TouchableOpacity
            style={styles.copyableField}
            onPress={() => copyToClipboard(transaction.rawTransactionId, 'Transaction ID')}
          >
            <Text style={styles.txIdText} selectable>
              {transaction.rawTransactionId}
            </Text>
            <Text style={styles.copyHint}>Tap to copy</Text>
          </TouchableOpacity>
        </View>

        {/* Block Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Block Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Block Height:</Text>
            <Text style={styles.infoValue}>{transaction.minedHeight}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Timestamp:</Text>
            <Text style={styles.infoValue}>
              {formatDate(transaction.blockTimeInSeconds)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Unix Time:</Text>
            <Text style={styles.infoValue}>{transaction.blockTimeInSeconds}</Text>
          </View>
        </View>

        {/* Address Information */}
        {transaction.toAddress && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {isPositive ? 'From Address' : 'To Address'}
            </Text>
            <TouchableOpacity
              style={styles.copyableField}
              onPress={() => copyToClipboard(transaction.toAddress!, 'Address')}
            >
              <Text style={styles.addressText} selectable>
                {transaction.toAddress}
              </Text>
              <Text style={styles.copyHint}>Tap to copy</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Memo */}
        {transaction.memos && transaction.memos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Memo</Text>
            {transaction.memos.map((memo, index) => (
              <View key={index} style={styles.memoContainer}>
                {memo ? (
                  <TouchableOpacity
                    style={styles.copyableField}
                    onPress={() => copyToClipboard(memo, 'Memo')}
                  >
                    <Text style={styles.memoText} selectable>
                      {memo}
                    </Text>
                    <Text style={styles.copyHint}>Tap to copy</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.noMemoText}>No memo</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Transaction Accounting */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Accounting</Text>
          
          <View style={styles.accountingRow}>
            <Text style={styles.accountingLabel}>Inputs:</Text>
            <Text style={styles.accountingValue}>
              {transaction.inputsCount || 'N/A'}
            </Text>
          </View>
          
          <View style={styles.accountingRow}>
            <Text style={styles.accountingLabel}>Outputs:</Text>
            <Text style={styles.accountingValue}>
              {transaction.outputsCount || 'N/A'}
            </Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.accountingRow}>
            <Text style={styles.accountingLabel}>Transaction Value:</Text>
            <Text style={[
              styles.accountingValue,
              isPositive ? styles.valuePositive : styles.valueNegative
            ]}>
              {isPositive ? '+' : '-'}{formatAmount(transaction.value)} ARRR
            </Text>
          </View>
          
          {transaction.fee && (
            <View style={styles.accountingRow}>
              <Text style={styles.accountingLabel}>Network Fee:</Text>
              <Text style={styles.feeValue}>
                {formatAmount(transaction.fee)} ARRR
              </Text>
            </View>
          )}
          
          {!isPositive && transaction.fee && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Debit:</Text>
              <Text style={styles.totalValue}>
                -{((Math.abs(zatoshi) + parseInt(transaction.fee)) / 100000000).toFixed(8)} ARRR
              </Text>
            </View>
          )}
        </View>

        {/* Transaction Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Status</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Direction:</Text>
            <Text
              style={[
                styles.infoValue,
                isPositive ? styles.typeReceived : styles.typeSent,
              ]}
            >
              {isPositive ? 'Received' : 'Sent'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <Text style={[styles.infoValue, styles.statusConfirmed]}>
              Confirmed
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E27',
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
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 8,
    color: '#F7B32B',
    letterSpacing: 0.5,
    fontFamily: 'sans-serif',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  amountSection: {
    backgroundColor: '#0F1535',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00D9FF',
    marginBottom: 8,
    letterSpacing: 1.5,
    fontFamily: 'sans-serif',
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'sans-serif-medium',
  },
  amountPositive: {
    color: '#4caf50',
  },
  amountNegative: {
    color: '#ff6b6b',
  },
  amountZatoshi: {
    fontSize: 14,
    color: '#7A8BA9',
    fontFamily: 'sans-serif',
  },
  section: {
    backgroundColor: '#0F1535',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00D9FF',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontFamily: 'sans-serif',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#7A8BA9',
    flex: 1,
    fontFamily: 'sans-serif',
  },
  infoValue: {
    fontSize: 14,
    color: '#ffffff',
    flex: 2,
    textAlign: 'right',
    fontFamily: 'sans-serif',
  },
  copyableField: {
    backgroundColor: 'rgba(15, 21, 53, 0.6)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  txIdText: {
    fontSize: 12,
    color: '#F7B32B',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 12,
    color: '#F7B32B',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  copyHint: {
    fontSize: 10,
    color: '#7A8BA9',
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: 'sans-serif',
  },
  memoContainer: {
    marginTop: 4,
  },
  memoText: {
    fontSize: 14,
    color: '#ffffff',
    fontFamily: 'sans-serif',
    marginBottom: 8,
  },
  noMemoText: {
    fontSize: 14,
    color: '#7A8BA9',
    fontStyle: 'italic',
    fontFamily: 'sans-serif',
  },
  typeReceived: {
    color: '#4caf50',
    fontWeight: '600',
  },
  typeSent: {
    color: '#ff6b6b',
    fontWeight: '600',
  },
  statusConfirmed: {
    color: '#4caf50',
    fontWeight: '600',
  },
  accountingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 4,
  },
  accountingLabel: {
    fontSize: 14,
    color: '#7A8BA9',
    fontFamily: 'sans-serif',
  },
  accountingValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  valuePositive: {
    color: '#4caf50',
  },
  valueNegative: {
    color: '#ff6b6b',
  },
  feeValue: {
    fontSize: 14,
    color: '#F7B32B',
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.3)',
  },
  totalLabel: {
    fontSize: 15,
    color: '#00D9FF',
    fontWeight: '700',
    fontFamily: 'sans-serif',
  },
  totalValue: {
    fontSize: 15,
    color: '#ff6b6b',
    fontWeight: '700',
    fontFamily: 'sans-serif',
  },
});

export default TransactionDetail;
