import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';

interface Transaction {
  rawTransactionId: string;
  blockTimeInSeconds: number;
  minedHeight: number;
  value: string;
  toAddress?: string;
  memos: string[];
}

interface TransactionListProps {
  transactions: Transaction[];
  isLoading: boolean;
  onTransactionPress: (transaction: Transaction) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  isLoading,
  onTransactionPress,
  onRefresh,
  isRefreshing = false,
}) => {
  const formatAmount = (value: string): string => {
    const zatoshi = parseInt(value);
    const arrr = Math.abs(zatoshi / 100000000).toFixed(8);
    return zatoshi < 0 ? `+${arrr}` : `-${arrr}`;
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isPositive = parseInt(item.value) < 0;
    
    return (
      <TouchableOpacity
        style={styles.transactionItem}
        onPress={() => onTransactionPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.transactionContent}>
          <View style={styles.leftContent}>
            <Text style={styles.blockHeight}>Block {item.minedHeight}</Text>
            <Text style={styles.date}>{formatDate(item.blockTimeInSeconds)}</Text>
          </View>
          
          <View style={styles.rightContent}>
            <Text
              style={[
                styles.amount,
                isPositive ? styles.amountPositive : styles.amountNegative,
              ]}
            >
              {formatAmount(item.value)} ARRR
            </Text>
            <Text style={styles.arrow}>›</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#D4AF37" />
      </View>
    );
  }

  if (transactions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No transactions yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      <FlatList
        data={transactions} // Show all transactions
        renderItem={renderTransaction}
        keyExtractor={(item, index) => `${item.rawTransactionId}-${index}`}
        scrollEnabled={true}
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  listContent: {
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F7B32B',
    marginBottom: 16,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontFamily: 'sans-serif',
  },
  transactionItem: {
    backgroundColor: 'rgba(15, 21, 53, 0.8)',
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(247, 179, 43, 0.15)',
    overflow: 'hidden',
  },
  transactionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  leftContent: {
    flex: 1,
  },
  blockHeight: {
    fontSize: 15,
    fontWeight: '700',
    color: '#00D9FF',
    marginBottom: 6,
    fontFamily: 'sans-serif',
    letterSpacing: 0.5,
  },
  date: {
    fontSize: 13,
    color: '#7A8BA8',
    fontFamily: 'sans-serif',
    fontWeight: '500',
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  amount: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'sans-serif',
    letterSpacing: 0.3,
  },
  amountPositive: {
    color: '#00FF88',
    textShadowColor: 'rgba(0, 255, 136, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  amountNegative: {
    color: '#FF6B6B',
    textShadowColor: 'rgba(255, 107, 107, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  arrow: {
    fontSize: 22,
    color: '#7A8BA8',
    fontWeight: '400',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: 'rgba(15, 21, 53, 0.5)',
    borderRadius: 14,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(247, 179, 43, 0.1)',
  },
  emptyText: {
    fontSize: 15,
    color: '#7A8BA8',
    fontFamily: 'sans-serif',
    fontWeight: '600',
  },
  viewAllButton: {
    marginTop: 12,
    padding: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(247, 179, 43, 0.1)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(247, 179, 43, 0.3)',
  },
  viewAllText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F7B32B',
    fontFamily: 'sans-serif',
    letterSpacing: 0.5,
  },
});

export default TransactionList;
