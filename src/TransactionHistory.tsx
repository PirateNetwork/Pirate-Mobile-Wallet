import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

interface Transaction {
  rawTransactionId: string;
  blockTimeInSeconds: number;
  minedHeight: number;
  value: string;
  toAddress?: string;
  memos: string[];
}

interface TransactionHistoryProps {
  onBack: () => void;
  onFetchTransactions: () => Promise<Transaction[]>;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ onBack, onFetchTransactions }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setIsLoading(true);
      }
      setError(null);
      
      const txs = await onFetchTransactions();
      setTransactions(txs);
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError(`Failed to load transactions: ${err}`);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadTransactions(true);
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatAmount = (value: string): string => {
    const zatoshi = parseInt(value);
    const arrr = (zatoshi / 100000000).toFixed(8);
    return zatoshi >= 0 ? `+${arrr}` : arrr;
  };

  const formatTxId = (txId: string): string => {
    if (txId.length <= 16) return txId;
    return `${txId.substring(0, 8)}...${txId.substring(txId.length - 8)}`;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Transaction History</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4AF37" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Transaction History</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadTransactions()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Transaction History</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>Your transaction history will appear here</Text>
          </View>
        ) : (
          transactions.map((tx, index) => (
            <View key={`${tx.rawTransactionId}-${index}`} style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
                <Text style={[
                  styles.amount,
                  parseInt(tx.value) >= 0 ? styles.amountPositive : styles.amountNegative
                ]}>
                  {formatAmount(tx.value)} ARRR
                </Text>
                <Text style={styles.date}>{formatDate(tx.blockTimeInSeconds)}</Text>
              </View>
              
              <View style={styles.transactionDetails}>
                <Text style={styles.label}>Transaction ID:</Text>
                <Text style={styles.txId}>{formatTxId(tx.rawTransactionId)}</Text>
              </View>
              
              <View style={styles.transactionDetails}>
                <Text style={styles.label}>Block Height:</Text>
                <Text style={styles.value}>{tx.minedHeight}</Text>
              </View>
              
              {tx.toAddress && (
                <View style={styles.transactionDetails}>
                  <Text style={styles.label}>To Address:</Text>
                  <Text style={styles.address} numberOfLines={1}>
                    {tx.toAddress}
                  </Text>
                </View>
              )}
              
              {tx.memos && tx.memos.length > 0 && tx.memos[0] && (
                <View style={styles.transactionDetails}>
                  <Text style={styles.label}>Memo:</Text>
                  <Text style={styles.memo}>{tx.memos[0]}</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    backgroundColor: '#1C1C1C',
    paddingTop: 12,
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 15,
    color: '#D4AF37',
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
    color: '#D4AF37',
    letterSpacing: 0.5,
    fontFamily: 'sans-serif',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#888',
    fontFamily: 'sans-serif',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#0a0a0a',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
  transactionCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  amount: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'sans-serif-medium',
  },
  amountPositive: {
    color: '#4caf50',
  },
  amountNegative: {
    color: '#ff6b6b',
  },
  date: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'sans-serif',
  },
  transactionDetails: {
    marginBottom: 10,
  },
  label: {
    fontSize: 10,
    color: '#888',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  value: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '500',
    fontFamily: 'sans-serif',
  },
  txId: {
    fontSize: 12,
    color: '#D4AF37',
    fontFamily: 'monospace',
  },
  address: {
    fontSize: 10,
    color: '#D4AF37',
    fontFamily: 'monospace',
  },
  memo: {
    fontSize: 14,
    color: '#D4AF37',
    fontStyle: 'italic',
    fontFamily: 'sans-serif',
  },
});

export default TransactionHistory;
