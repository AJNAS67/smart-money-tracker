import React, { useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
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
  const [filter, setFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [timeFilter, setTimeFilter] = useState<'ALL' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'>('MONTH');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  useEffect(() => {
    refreshTransactions();
    refreshCategories();
  }, []);

  const now = new Date();
  
  const filteredTransactions = transactions.filter(t => {
    if (filter !== 'ALL' && t.type !== filter) return false;
    if (categoryFilter !== 'ALL' && t.categoryId !== categoryFilter) return false;
    
    const d = new Date(t.date);
    if (timeFilter === 'YEAR') return d.getFullYear() === now.getFullYear();
    if (timeFilter === 'MONTH') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (timeFilter === 'WEEK') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return d >= oneWeekAgo && d <= now;
    }
    if (timeFilter === 'DAY') {
      return d.toDateString() === now.toDateString();
    }
    return true;
  }).sort((a, b) => b.date - a.date);

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
        <GlassCard style={styles.transactionCard} contentStyle={styles.cardContent}>
          <View style={[styles.iconContainer, { backgroundColor: category?.color || colors.primary }]}>
            <Ionicons name={(category?.icon as any) || 'cash-outline'} size={20} color={colors.white} />
          </View>
          <View style={styles.infoContainer}>
            <Typography variant="body" style={{ color: colors.white, fontWeight: 'bold' }}>
              {category?.name || 'Uncategorized'}
            </Typography>
            {item.note ? (
              <Typography variant="caption" style={{ color: colors.textMuted, marginTop: 2 }}>
                {item.note}
              </Typography>
            ) : null}
            <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
              {account?.name} • {new Date(item.date).toLocaleDateString()}
            </Typography>
          </View>
          <View style={styles.amountContainer}>
            <Typography variant="subtitle" style={{ color: isIncome ? colors.success : colors.white, fontWeight: 'bold' }}>
              {isIncome ? '+' : '-'}{formatCurrency(item.amount)}
            </Typography>
            <TouchableOpacity onPress={() => deleteTransaction(item.id)} style={styles.deleteButton}>
              <Ionicons name="trash" size={16} color={colors.danger} />
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

      <View style={styles.filtersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          {(['ALL', 'INCOME', 'EXPENSE'] as const).map(f => (
            <TouchableOpacity 
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Typography variant="caption" style={{ color: filter === f ? colors.white : colors.textMuted }}>{f}</Typography>
            </TouchableOpacity>
          ))}
          <View style={styles.filterDivider} />
          {(['DAY', 'WEEK', 'MONTH', 'YEAR', 'ALL'] as const).map(f => (
            <TouchableOpacity 
              key={f}
              style={[styles.filterChip, timeFilter === f && styles.filterChipActive]}
              onPress={() => setTimeFilter(f)}
            >
              <Typography variant="caption" style={{ color: timeFilter === f ? colors.white : colors.textMuted }}>{f === 'ALL' ? 'ALL TIME' : f}</Typography>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.filtersScroll, { marginTop: 12 }]}>
          <TouchableOpacity 
            style={[styles.filterChip, categoryFilter === 'ALL' && styles.filterChipActive]}
            onPress={() => setCategoryFilter('ALL')}
          >
            <Typography variant="caption" style={{ color: categoryFilter === 'ALL' ? colors.white : colors.textMuted }}>ALL CATEGORIES</Typography>
          </TouchableOpacity>
          {categories.filter(c => filter === 'ALL' || c.type === filter).map(c => (
            <TouchableOpacity 
              key={c.id}
              style={[styles.filterChip, categoryFilter === c.id && { backgroundColor: c.color, borderColor: c.color }]}
              onPress={() => setCategoryFilter(c.id)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name={c.icon as any} size={12} color={categoryFilter === c.id ? colors.white : c.color} style={{ marginRight: 4 }} />
                <Typography variant="caption" style={{ color: categoryFilter === c.id ? colors.white : colors.textMuted }}>{c.name}</Typography>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredTransactions}
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
  },
  filtersWrapper: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  filtersScroll: {
    paddingHorizontal: 24,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 8,
    alignSelf: 'center',
  },
  listContainer: {
    padding: 16,
  },
  transactionCard: {
    marginBottom: 12,
    borderRadius: 16,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContainer: {
    flex: 1,
  },
  amountContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  deleteButton: {
    marginTop: 8,
    padding: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 8,
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
