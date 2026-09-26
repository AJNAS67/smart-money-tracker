import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';
import { Typography } from '../../components/common/Typography';
import { GlassCard } from '../../components/glass/GlassCard';
import { colors } from '../../theme/colors';
import { Transaction } from '../../database/schema';
import { PolarChart, Pie, CartesianChart, Bar } from 'victory-native';

const { width } = Dimensions.get('window');

// We will use standard React Native components for visual representation if Victory Native has peer dependency issues,
// but for now let's build the layout and simple bar representations.

export const DashboardScreen = () => {
  const { totalBalance, transactions, categories, accounts, refreshAccounts, refreshTransactions, refreshCategories } = useStore();
  const navigation = useNavigation<any>();
  const [timeFilter, setTimeFilter] = useState<'WEEK' | 'MONTH' | 'YEAR' | 'ALL'>('MONTH');

  useEffect(() => {
    refreshAccounts();
    refreshTransactions();
    refreshCategories();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(Math.abs(amount));
  };

  const recentTransactions = transactions.slice(0, 5);

  const now = new Date();
  
  const filteredTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    if (timeFilter === 'ALL') return true;
    if (timeFilter === 'YEAR') return d.getFullYear() === now.getFullYear();
    if (timeFilter === 'MONTH') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (timeFilter === 'WEEK') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return d >= oneWeekAgo && d <= now;
    }
    return true;
  });

  const monthlyIncome = filteredTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const monthlyExpense = filteredTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  // Expense breakdown by category for the pie chart
  const expenseByCategory = categories
    .filter(c => c.type === 'EXPENSE')
    .map(category => {
      const amount = filteredTransactions
        .filter(t => t.type === 'EXPENSE' && t.categoryId === category.id)
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        value: amount,
        color: category.color || colors.primary,
        label: category.name,
      };
    })
    .filter(item => item.value > 0);

  // If no expenses, show a default gray ring
  const pieData = expenseByCategory.length > 0 
    ? expenseByCategory 
    : [{ value: 1, color: 'rgba(255,255,255,0.1)', label: 'No Data' }];

  // Income vs Expense for the last 6 months
  // Note: Skia requires a custom .ttf font file for axis labels. Since we don't have one, we will render the chart without axis labels for now.
  
  const barData = [
    { month: 'Jan', income: 4000, expense: 2500 },
    { month: 'Feb', income: 4200, expense: 2100 },
    { month: 'Mar', income: 4100, expense: 2800 },
    { month: 'Apr', income: 4500, expense: 3100 },
    { month: 'May', income: 4800, expense: 2900 },
    { month: 'Jun', income: 5000, expense: monthlyExpense > 0 ? monthlyExpense : 3200 }, // Demo data for now
  ];

  const renderTransaction = (item: Transaction) => {
    const category = categories.find(c => c.id === item.categoryId);
    const account = accounts.find(a => a.id === item.accountId);
    const isIncome = item.type === 'INCOME';

    return (
      <View key={item.id} style={styles.transactionRow}>
        <View style={[styles.iconContainer, { backgroundColor: category?.color || colors.primary }]}>
          <Ionicons name={(category?.icon as any) || 'cash-outline'} size={20} color={colors.white} />
        </View>
        <View style={styles.infoContainer}>
          <Typography variant="body" style={{ color: colors.text }}>
            {category?.name || 'Uncategorized'}
          </Typography>
          <Typography variant="caption" style={{ color: colors.textMuted }}>
            {account?.name}
          </Typography>
        </View>
        <View style={styles.amountContainer}>
          <Typography variant="body" style={{ color: isIncome ? colors.success : colors.white, fontWeight: 'bold' }}>
            {isIncome ? '+' : '-'}{formatCurrency(item.amount)}
          </Typography>
          <Typography variant="caption" style={{ color: colors.textMuted }}>
            {new Date(item.date).toLocaleDateString()}
          </Typography>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Typography variant="caption" style={styles.greeting}>Welcome back,</Typography>
          <Typography variant="h2" color={colors.white}>MoneyFlow</Typography>
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      <GlassCard style={styles.balanceCard}>
        <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.7)' }}>Total Net Worth</Typography>
        <Typography variant="h1" color={colors.white} style={{ marginVertical: 8 }}>{formatCurrency(totalBalance)}</Typography>
        
        <View style={styles.monthlyStatsRow}>
          <View style={styles.monthlyStat}>
            <View style={styles.statIconIncome}>
              <Ionicons name="arrow-down" size={16} color={colors.success} />
            </View>
            <View>
              <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.7)' }}>Income</Typography>
              <Typography variant="body" style={{ color: colors.success }}>{formatCurrency(monthlyIncome)}</Typography>
            </View>
          </View>
          <View style={styles.monthlyStat}>
            <View style={styles.statIconExpense}>
              <Ionicons name="arrow-up" size={16} color={colors.danger} />
            </View>
            <View>
              <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.7)' }}>Expense</Typography>
              <Typography variant="body" style={{ color: colors.danger }}>{formatCurrency(monthlyExpense)}</Typography>
            </View>
          </View>
        </View>
      </GlassCard>

      <View style={styles.sectionHeader}>
        <Typography variant="h3" color={colors.white}>Expense Breakdown</Typography>
      </View>

      <GlassCard style={styles.chartCard}>
        <View style={styles.filterTabs}>
          {(['WEEK', 'MONTH', 'YEAR', 'ALL'] as const).map(filter => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterTab, timeFilter === filter && styles.filterTabActive]}
              onPress={() => setTimeFilter(filter)}
            >
              <Typography 
                variant="caption" 
                style={{ color: timeFilter === filter ? colors.white : colors.textMuted, fontWeight: timeFilter === filter ? 'bold' : 'normal' }}
              >
                {filter === 'ALL' ? 'ALL TIME' : filter}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.chartContainer}>
          <PolarChart
            data={pieData}
            colorKey={"color"}
            valueKey={"value"}
            labelKey={"label"}
          >
            <Pie.Chart innerRadius={50} />
          </PolarChart>
        </View>
        <View style={styles.legendContainer}>
          {expenseByCategory.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Typography variant="caption" style={{ color: colors.textMuted, flex: 1 }}>{item.label}</Typography>
              <Typography variant="caption" style={{ color: colors.text }}>{formatCurrency(item.value)}</Typography>
            </View>
          ))}
          {expenseByCategory.length === 0 && (
             <Typography variant="caption" style={{ color: colors.textMuted, textAlign: 'center' }}>
               {`No expenses for this ${timeFilter.toLowerCase()}`}
             </Typography>
          )}
        </View>
      </GlassCard>

      <View style={styles.sectionHeader}>
        <Typography variant="h3" color={colors.white}>Income vs Expense</Typography>
      </View>

      <GlassCard style={styles.chartCard}>
        <View style={styles.barChartContainer}>
          <CartesianChart
            data={barData}
            xKey="month"
            yKeys={["income", "expense"]}
            domainPadding={{ left: 20, right: 20 }}
            axisOptions={{
              tickCount: 4,
              lineColor: 'rgba(255,255,255,0.1)',
            }}
          >
            {({ points, chartBounds }) => (
              <>
                <Bar
                  points={points.income}
                  chartBounds={chartBounds}
                  color={colors.success}
                  barWidth={12}
                />
                <Bar
                  points={points.expense}
                  chartBounds={chartBounds}
                  color={colors.danger}
                  barWidth={12}
                />
              </>
            )}
          </CartesianChart>
        </View>
        <View style={[styles.legendContainer, { flexDirection: 'row', justifyContent: 'center', marginTop: 16 }]}>
          <View style={[styles.legendItem, { marginRight: 24, marginBottom: 0 }]}>
            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
            <Typography variant="caption" style={{ color: colors.textMuted }}>Income</Typography>
          </View>
          <View style={[styles.legendItem, { marginBottom: 0 }]}>
            <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
            <Typography variant="caption" style={{ color: colors.textMuted }}>Expense</Typography>
          </View>
        </View>
      </GlassCard>

      <View style={styles.sectionHeader}>
        <Typography variant="h3" color={colors.white}>Recent Transactions</Typography>
        <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
          <Typography variant="body" color={colors.primary}>See All</Typography>
        </TouchableOpacity>
      </View>

      <GlassCard style={styles.transactionsCard}>
        {recentTransactions.length > 0 ? (
          recentTransactions.map(renderTransaction)
        ) : (
          <View style={styles.emptyState}>
            <Typography variant="body" style={{ color: colors.textMuted }}>No transactions yet</Typography>
          </View>
        )}
      </GlassCard>
      
      <View style={styles.spacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    color: colors.textMuted,
    marginBottom: 4,
  },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    padding: 24,
    marginBottom: 32,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  monthlyStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  monthlyStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconIncome: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statIconExpense: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  transactionsCard: {
    padding: 16,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
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
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  chartCard: {
    padding: 16,
    marginBottom: 32,
  },
  chartContainer: {
    height: 200,
    width: '100%',
    marginBottom: 16,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  filterTabActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  barChartContainer: {
    height: 220,
    width: '100%',
    marginBottom: 8,
  },
  legendContainer: {
    paddingHorizontal: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  spacer: {
    height: 40,
  },
});
