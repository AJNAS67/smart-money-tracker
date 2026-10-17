import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';
import { Typography } from '../../components/common/Typography';
import { GlassCard } from '../../components/glass/GlassCard';
import { colors } from '../../theme/colors';
import { Transaction } from '../../database/schema';
import { SavingsGoalsCarousel } from './components/SavingsGoalsCarousel';
import { MonthExpenseSection } from './components/MonthExpenseSection';
import { ExpensePieChartSection } from './components/ExpensePieChartSection';

const { width } = Dimensions.get('window');

export const DashboardScreen = () => {
  const {
    totalBalance,
    transactions,
    categories,
    accounts,
    vaults,
    refreshAccounts,
    refreshTransactions,
    refreshCategories,
    refreshVaults,
  } = useStore();

  const navigation = useNavigation<any>();

  // Active month state for monthly expense analytics
  const [selectedMonthDate, setSelectedMonthDate] = useState<Date>(new Date());
  const [dismissedBills, setDismissedBills] = useState<string[]>([]);
  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(false);

  // Refresh all store datasets whenever this screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshAccounts();
      refreshTransactions();
      refreshCategories();
      refreshVaults();
    }, [])
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
  };

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Current month's totals for the hero card
  const currentMonthTransactions = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const currentMonthIncome = currentMonthTransactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const currentMonthExpense = currentMonthTransactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = currentMonthIncome - currentMonthExpense;
  const savingsRate =
    currentMonthIncome > 0
      ? Math.max(Math.round((netSavings / currentMonthIncome) * 100), 0)
      : 0;

  // Recent transactions (last 5)
  const recentTransactions = transactions.slice(0, 5);

  // Upcoming due credit cards (due within 15 days)
  const creditCards = accounts.filter((a) => a.type === 'CREDIT_CARD' && a.dueDate);
  const upcomingBills = creditCards
    .map((card) => {
      if (!card.dueDate) return null;
      const dueDate = new Date(card.dueDate);
      const dueDay = dueDate.getDate();

      let nextDueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);
      if (nextDueDate.getTime() < now.getTime()) {
        nextDueDate = new Date(now.getFullYear(), now.getMonth() + 1, dueDay);
      }

      const diffTime = nextDueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 15 && !dismissedBills.includes(card.id)) {
        return { ...card, diffDays, dueDay };
      }
      return null;
    })
    .filter(Boolean);

  const renderTransaction = (item: Transaction) => {
    const category = categories.find((c) => c.id === item.categoryId);
    const account = accounts.find((a) => a.id === item.accountId);
    const isIncome = item.type === 'INCOME';
    const isTransfer = item.type === 'TRANSFER';

    let itemColor = colors.danger;
    let iconName = (category?.icon as any) || 'cash-outline';
    let prefix = '-';

    if (isIncome) {
      itemColor = colors.success;
      prefix = '+';
      iconName = (category?.icon as any) || 'arrow-down-circle-outline';
    } else if (isTransfer) {
      itemColor = colors.info;
      prefix = '';
      iconName = 'swap-horizontal-outline';
    }

    return (
      <View key={item.id} style={styles.transactionRow}>
        <View
          style={[
            styles.txIconContainer,
            { backgroundColor: (category?.color || itemColor) + '20' },
          ]}
        >
          <Ionicons
            name={iconName}
            size={20}
            color={category?.color || itemColor}
          />
        </View>

        <View style={styles.txInfoContainer}>
          <Typography variant="body" color={colors.white} style={{ fontWeight: '600' }}>
            {item.note || category?.name || (isTransfer ? 'Transfer' : 'Transaction')}
          </Typography>
          <Typography variant="caption" style={{ color: colors.textMuted }}>
            {account?.name || 'Account'} • {new Date(item.date).toLocaleDateString()}
          </Typography>
        </View>

        <View style={styles.txAmountContainer}>
          <Typography
            variant="body"
            style={{
              color: isIncome ? colors.success : colors.white,
              fontWeight: '700',
            }}
          >
            {prefix}
            {formatCurrency(item.amount)}
          </Typography>
          {category && (
            <Typography variant="caption" style={{ color: colors.textMuted, fontSize: 11 }}>
              {category.name}
            </Typography>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Typography variant="caption" style={styles.greeting}>
            Welcome back,
          </Typography>
          <Typography variant="h2" color={colors.white}>
            MoneyFlow
          </Typography>
        </View>

        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.8}
        >
          <Ionicons name="settings-outline" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Upcoming Bill Alerts */}
      {upcomingBills.length > 0 && (
        <View style={styles.bannerContainer}>
          {upcomingBills.map((bill, index) => (
            <GlassCard key={`bill-${index}`} style={styles.bannerCard} contentStyle={styles.bannerContentStyle}>
              <View style={styles.bannerIconContainer}>
                <Ionicons name="alert-circle" size={24} color="#F97316" />
              </View>
              <View style={styles.bannerContent}>
                <Typography variant="body" style={{ color: colors.white, fontWeight: 'bold' }}>
                  Bill Due Soon!
                </Typography>
                <Typography variant="caption" style={{ color: colors.textMuted, marginTop: 2 }}>
                  Your {bill!.name} bill is due {bill!.diffDays === 0 ? 'today' : `in ${bill!.diffDays} days`} (on the {bill!.dueDay}th).
                </Typography>
              </View>
              <TouchableOpacity
                onPress={() => setDismissedBills([...dismissedBills, bill!.id])}
                style={{ padding: 4 }}
              >
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </GlassCard>
          ))}
        </View>
      )}

      {/* Hero Card: Total Balance & Monthly Expense Flow */}
      <GlassCard style={styles.balanceCard} contentStyle={styles.balanceCardContent}>
        {/* Net Worth Row with Privacy Eye Toggle */}
        <View style={styles.netWorthHeader}>
          <Typography variant="caption" style={styles.balanceLabel}>
            TOTAL NET WORTH
          </Typography>
          <TouchableOpacity
            onPress={() => setIsBalanceHidden(!isBalanceHidden)}
            style={styles.eyeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isBalanceHidden ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color="rgba(255,255,255,0.7)"
            />
          </TouchableOpacity>
        </View>

        <Typography variant="h1" color={colors.white} style={styles.totalBalanceAmount}>
          {isBalanceHidden ? '••••••••' : formatCurrency(totalBalance)}
        </Typography>

        {/* Monthly Performance Split */}
        <View style={styles.monthlyStatsRow}>
          {/* Monthly Expense */}
          <View style={styles.monthlyStatItem}>
            <View style={styles.statIconExpense}>
              <Ionicons name="arrow-up" size={16} color={colors.danger} />
            </View>
            <View>
              <Typography variant="caption" style={styles.statLabel}>
                This Month Spent
              </Typography>
              <Typography variant="subtitle" style={{ color: colors.danger, fontWeight: '700' }}>
                {isBalanceHidden ? '••••' : formatCurrency(currentMonthExpense)}
              </Typography>
            </View>
          </View>

          {/* Monthly Income */}
          <View style={styles.monthlyStatItem}>
            <View style={styles.statIconIncome}>
              <Ionicons name="arrow-down" size={16} color={colors.success} />
            </View>
            <View>
              <Typography variant="caption" style={styles.statLabel}>
                This Month Income
              </Typography>
              <Typography variant="subtitle" style={{ color: colors.success, fontWeight: '700' }}>
                {isBalanceHidden ? '••••' : formatCurrency(currentMonthIncome)}
              </Typography>
            </View>
          </View>
        </View>

        {/* Savings Rate Badge */}
        {currentMonthIncome > 0 && (
          <View style={styles.savingsRateRow}>
            <View style={styles.savingsRateBadge}>
              <Ionicons name="sparkles" size={12} color={colors.accent} style={{ marginRight: 4 }} />
              <Typography variant="caption" style={{ color: colors.accent, fontWeight: '700' }}>
                {savingsRate}% Savings Rate ({formatCurrency(netSavings)} saved)
              </Typography>
            </View>
          </View>
        )}

        {/* Quick Actions Bar */}
        <View style={styles.quickActionsBar}>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate('AddTransaction')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
              <Ionicons name="add" size={18} color={colors.danger} />
            </View>
            <Typography variant="caption" style={styles.quickActionText}>
              Expense
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate('AddTransaction')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
              <Ionicons name="arrow-down" size={18} color={colors.success} />
            </View>
            <Typography variant="caption" style={styles.quickActionText}>
              Income
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate('AddVault')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(0, 212, 170, 0.2)' }]}>
              <Ionicons name="lock-closed" size={16} color={colors.accent} />
            </View>
            <Typography variant="caption" style={styles.quickActionText}>
              New Goal
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate('Accounts')}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(91, 141, 239, 0.2)' }]}>
              <Ionicons name="card" size={16} color={colors.primary} />
            </View>
            <Typography variant="caption" style={styles.quickActionText}>
              Accounts
            </Typography>
          </TouchableOpacity>
        </View>
      </GlassCard>

      {/* Savings Goals Carousel ("if have add money to vault then goals, if multiple the one card slice like each add") */}
      <SavingsGoalsCarousel
        vaults={vaults}
        onAddFunds={(vaultId) => navigation.navigate('AddFunds', { vaultId })}
        onCreateVault={() => navigation.navigate('AddVault')}
        onViewAllVaults={() => navigation.navigate('Vaults')}
        formatCurrency={formatCurrency}
      />

      {/* Expense Breakdown Pie/Donut Chart (Week, Month, Year, All) */}
      <ExpensePieChartSection
        transactions={transactions}
        categories={categories}
        formatCurrency={formatCurrency}
      />

      {/* Month-Based Expense Analytics ("and month based expence show it is better") */}
      <MonthExpenseSection
        selectedDate={selectedMonthDate}
        onSelectDate={setSelectedMonthDate}
        transactions={transactions}
        categories={categories}
        formatCurrency={formatCurrency}
      />

      {/* Recent Transactions Feed */}
      <View style={styles.sectionHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="time-outline" size={18} color={colors.primary} style={{ marginRight: 6 }} />
          <Typography variant="h3" color={colors.white}>
            Recent Transactions
          </Typography>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Transactions')} activeOpacity={0.7}>
          <Typography variant="body" color={colors.primary} style={{ fontWeight: '600' }}>
            See All
          </Typography>
        </TouchableOpacity>
      </View>

      <GlassCard style={styles.transactionsCard} contentStyle={styles.transactionsCardContent}>
        {recentTransactions.length > 0 ? (
          recentTransactions.map(renderTransaction)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={36} color={colors.textMuted} />
            <Typography variant="body" style={{ color: colors.textMuted, marginTop: 8 }}>
              No transactions yet
            </Typography>
          </View>
        )}
      </GlassCard>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 56,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    color: colors.textMuted,
    marginBottom: 2,
  },
  profileBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  bannerContainer: {
    marginBottom: 20,
  },
  bannerCard: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderColor: 'rgba(249, 115, 22, 0.25)',
    marginBottom: 8,
    borderRadius: 16,
  },
  bannerContentStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  bannerIconContainer: {
    marginRight: 12,
  },
  bannerContent: {
    flex: 1,
  },
  balanceCard: {
    marginBottom: 26,
    backgroundColor: 'rgba(99, 102, 241, 0.14)',
    borderColor: 'rgba(99, 102, 241, 0.35)',
    borderRadius: 24,
  },
  balanceCardContent: {
    padding: 20,
  },
  netWorthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.65)',
    letterSpacing: 1,
    fontSize: 11,
    fontWeight: '700',
  },
  eyeBtn: {
    padding: 4,
  },
  totalBalanceAmount: {
    marginVertical: 10,
    fontWeight: '800',
    fontSize: 34,
    lineHeight: 42,
  },
  monthlyStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  monthlyStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 11,
  },
  statIconIncome: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statIconExpense: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  savingsRateRow: {
    marginTop: 12,
  },
  savingsRateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 212, 170, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.25)',
  },
  quickActionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  quickActionBtn: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickActionText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 11,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  transactionsCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    borderRadius: 20,
    marginBottom: 16,
  },
  transactionsCardContent: {
    padding: 14,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  txIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txInfoContainer: {
    flex: 1,
  },
  txAmountContainer: {
    alignItems: 'flex-end',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  bottomSpacer: {
    height: 60,
  },
});
