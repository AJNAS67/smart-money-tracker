import React, { useEffect } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../../store/useStore';
import { Typography } from '../../components/common/Typography';
import { GlassCard } from '../../components/glass/GlassCard';
import { colors } from '../../theme/colors';
import { Transaction } from '../../database/schema';

export const TransactionsScreen = () => {
  const { transactions, categories, accounts, refreshTransactions, refreshCategories, deleteTransaction } = useStore();
  const navigation = useNavigation<any>();

  useEffect(() => {
    refreshTransactions();
    refreshCategories();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(Math.abs(amount));
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const category = categories.find(c => c.id === item.categoryId);
    const account = accounts.find(a => a.id === item.accountId);
    const isIncome = item.type === 'INCOME';

    return (
      <Animated.View entering={FadeInDown.delay(item.id ? 100 : 0).duration(400)}>
        <GlassCard style={styles.transactionCard}>
          <View style={[styles.iconContainer, { backgroundColor: category?.color || colors.primary }]}>
          <Ionicons name={(category?.icon as any) || 'cash-outline'} size={24} color={colors.white} />
        </View>
        <View style={styles.infoContainer}>
          <Typography variant="subtitle" style={{ color: colors.text }}>
            {category?.name || 'Uncategorized'}
          </Typography>
          <Typography variant="caption" style={{ color: colors.textMuted }}>
            {account?.name} • {new Date(item.date).toLocaleDateString()}
          </Typography>
        </View>
        <View style={styles.amountContainer}>
          <Typography variant="subtitle" style={{ color: isIncome ? colors.success : colors.danger }}>
            {isIncome ? '+' : '-'}{formatCurrency(item.amount)}
          </Typography>
          <TouchableOpacity onPress={() => deleteTransaction(item.id)} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
          </TouchableOpacity>
          </View>
        </GlassCard>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h2" color={colors.white}>Transactions</Typography>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransaction}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
            <Typography variant="subtitle" style={{ marginTop: 16 }}>No transactions yet</Typography>
            <Typography variant="caption" align="center" style={{ marginTop: 8 }}>
              Add a transaction to start tracking your expenses and income.
            </Typography>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddTransaction')}
      >
        <Ionicons name="add" size={32} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  listContainer: {
    padding: 16,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContainer: {
    flex: 1,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  deleteButton: {
    marginTop: 4,
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
