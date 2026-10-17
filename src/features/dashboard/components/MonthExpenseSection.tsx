import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { Transaction, Category } from '../../../database/schema';
import { Typography } from '../../../components/common/Typography';
import { GlassCard } from '../../../components/glass/GlassCard';

interface MonthExpenseSectionProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  transactions: Transaction[];
  categories: Category[];
  formatCurrency: (amount: number) => string;
}

export const MonthExpenseSection: React.FC<MonthExpenseSectionProps> = ({
  selectedDate,
  onSelectDate,
  transactions,
  categories,
  formatCurrency,
}) => {
  const now = new Date();
  const isCurrentMonth =
    selectedDate.getMonth() === now.getMonth() &&
    selectedDate.getFullYear() === now.getFullYear();

  // Navigation handlers
  const handlePrevMonth = () => {
    const prev = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
    onSelectDate(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
    onSelectDate(next);
  };

  const handleResetCurrent = () => {
    onSelectDate(new Date());
  };

  const monthLabel = selectedDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Filter transactions for the selected month
  const selMonth = selectedDate.getMonth();
  const selYear = selectedDate.getFullYear();

  const monthTransactions = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === selMonth && d.getFullYear() === selYear;
  });

  const monthExpense = monthTransactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthIncome = monthTransactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = monthIncome - monthExpense;

  // Calculate days in month to determine daily average
  const daysInMonth = new Date(selYear, selMonth + 1, 0).getDate();
  const activeDays = isCurrentMonth ? Math.max(now.getDate(), 1) : daysInMonth;
  const dailyAverage = monthExpense > 0 ? Math.round(monthExpense / activeDays) : 0;

  // Group expenses by category
  const expenseCategories = categories
    .filter((c) => c.type === 'EXPENSE')
    .map((category) => {
      const catTx = monthTransactions.filter(
        (t) => t.type === 'EXPENSE' && t.categoryId === category.id
      );
      const amount = catTx.reduce((sum, t) => sum + t.amount, 0);
      const percent = monthExpense > 0 ? Math.round((amount / monthExpense) * 100) : 0;
      return {
        ...category,
        amount,
        percent,
        count: catTx.length,
      };
    })
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // 6-Month Comparative Trend Data
  const last6Months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    const label = d.toLocaleDateString('en-US', { month: 'short' });

    const mTx = transactions.filter((t) => {
      const td = new Date(t.date);
      return td.getMonth() === m && td.getFullYear() === y;
    });

    const exp = mTx.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    const inc = mTx.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const isSelected = m === selMonth && y === selYear;

    last6Months.push({ date: d, label, expense: exp, income: inc, isSelected });
  }

  const maxTrendAmount = Math.max(
    ...last6Months.map((m) => Math.max(m.expense, m.income)),
    1000 // minimum scale so empty isn't zero
  );

  return (
    <View style={styles.container}>
      {/* Section Header with Month Navigation */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Ionicons name="calendar-outline" size={20} color={colors.primary} style={{ marginRight: 6 }} />
          <Typography variant="h3" color={colors.white}>
            Monthly Analysis
          </Typography>
        </View>

        {!isCurrentMonth && (
          <TouchableOpacity style={styles.resetButton} onPress={handleResetCurrent} activeOpacity={0.8}>
            <Ionicons name="refresh" size={12} color={colors.accent} style={{ marginRight: 4 }} />
            <Typography variant="caption" style={styles.resetButtonText}>
              Current Month
            </Typography>
          </TouchableOpacity>
        )}
      </View>

      {/* Month Selector Bar */}
      <GlassCard style={styles.monthSelectorCard} contentStyle={styles.monthSelectorContent}>
        <TouchableOpacity style={styles.navChevron} onPress={handlePrevMonth} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color={colors.white} />
        </TouchableOpacity>

        <View style={styles.selectedMonthCenter}>
          <Typography variant="subtitle" color={colors.white} style={{ fontWeight: '700' }}>
            {monthLabel}
          </Typography>
          {isCurrentMonth ? (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Typography variant="caption" style={{ color: colors.accent, fontSize: 10, fontWeight: '700' }}>
                CURRENT
              </Typography>
            </View>
          ) : (
            <Typography variant="caption" style={{ color: colors.textMuted, fontSize: 11 }}>
              Past Record
            </Typography>
          )}
        </View>

        <TouchableOpacity style={styles.navChevron} onPress={handleNextMonth} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={20} color={colors.white} />
        </TouchableOpacity>
      </GlassCard>

      {/* Monthly Metrics Grid */}
      <View style={styles.metricsGrid}>
        {/* Month Expense Card */}
        <GlassCard style={[styles.metricCard, { borderColor: 'rgba(239, 68, 68, 0.3)' }]} contentStyle={styles.metricCardContent}>
          <View style={styles.metricHeaderRow}>
            <Typography variant="caption" style={{ color: colors.textMuted }}>
              Spent this Month
            </Typography>
            <View style={[styles.metricIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Ionicons name="arrow-up" size={14} color={colors.danger} />
            </View>
          </View>
          <Typography variant="h2" color={colors.white} style={{ fontWeight: '800', marginTop: 4 }}>
            {formatCurrency(monthExpense)}
          </Typography>
          <Typography variant="caption" style={{ color: colors.textMuted, marginTop: 4 }}>
            Avg {formatCurrency(dailyAverage)} / day
          </Typography>
        </GlassCard>

        {/* Month Net Flow Card */}
        <GlassCard style={[styles.metricCard, { borderColor: netSavings >= 0 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)' }]} contentStyle={styles.metricCardContent}>
          <View style={styles.metricHeaderRow}>
            <Typography variant="caption" style={{ color: colors.textMuted }}>
              Net Savings
            </Typography>
            <View
              style={[
                styles.metricIconBox,
                { backgroundColor: netSavings >= 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)' },
              ]}
            >
              <Ionicons
                name={netSavings >= 0 ? 'trending-up' : 'trending-down'}
                size={14}
                color={netSavings >= 0 ? colors.success : colors.danger}
              />
            </View>
          </View>
          <Typography
            variant="h2"
            style={{
              color: netSavings >= 0 ? colors.success : colors.danger,
              fontWeight: '800',
              marginTop: 4,
            }}
          >
            {netSavings >= 0 ? '+' : ''}
            {formatCurrency(netSavings)}
          </Typography>
          <Typography variant="caption" style={{ color: colors.textMuted, marginTop: 4 }}>
            Income: {formatCurrency(monthIncome)}
          </Typography>
        </GlassCard>
      </View>

      {/* 6-Month Interactive Expense Trend Bar Chart */}
      <GlassCard style={styles.chartCard} contentStyle={styles.chartCardContent}>
        <View style={styles.chartHeader}>
          <View>
            <Typography variant="subtitle" color={colors.white} style={{ fontWeight: '700' }}>
              6-Month Expense Trend
            </Typography>
            <Typography variant="caption" style={{ color: colors.textMuted }}>
              Tap any month to view details
            </Typography>
          </View>

          {/* Chart Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
              <Typography variant="caption" style={{ color: colors.textMuted }}>
                Expense
              </Typography>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <Typography variant="caption" style={{ color: colors.textMuted }}>
                Income
              </Typography>
            </View>
          </View>
        </View>

        {/* Bars Visualizer */}
        <View style={styles.trendBarsRow}>
          {last6Months.map((m, idx) => {
            const expHeight = Math.max(Math.round((m.expense / maxTrendAmount) * 90), 4);
            const incHeight = Math.max(Math.round((m.income / maxTrendAmount) * 90), 4);

            return (
              <TouchableOpacity
                key={`month-bar-${idx}`}
                style={[
                  styles.trendColumn,
                  m.isSelected && styles.trendColumnSelected,
                ]}
                onPress={() => onSelectDate(m.date)}
                activeOpacity={0.75}
              >
                <View style={styles.barGroup}>
                  {/* Expense Bar */}
                  <View
                    style={[
                      styles.trendBar,
                      {
                        height: expHeight,
                        backgroundColor: m.expense > 0 ? colors.danger : 'rgba(239, 68, 68, 0.2)',
                      },
                    ]}
                  />
                  {/* Income Bar */}
                  <View
                    style={[
                      styles.trendBar,
                      {
                        height: incHeight,
                        backgroundColor: m.income > 0 ? colors.success : 'rgba(34, 197, 94, 0.2)',
                      },
                    ]}
                  />
                </View>

                {/* Month Name */}
                <Typography
                  variant="caption"
                  style={[
                    styles.monthBarLabel,
                    m.isSelected && styles.monthBarLabelSelected,
                  ]}
                >
                  {m.label}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </View>
      </GlassCard>

      {/* Category Expense Breakdown */}
      <View style={styles.categorySectionHeader}>
        <Typography variant="subtitle" color={colors.white} style={{ fontWeight: '700' }}>
          {monthLabel} Category Breakdown
        </Typography>
        <Typography variant="caption" style={{ color: colors.textMuted }}>
          {expenseCategories.length} Categories
        </Typography>
      </View>

      <GlassCard style={styles.breakdownCard} contentStyle={styles.breakdownCardContent}>
        {expenseCategories.length === 0 ? (
          <View style={styles.emptyBreakdown}>
            <Ionicons name="pie-chart-outline" size={36} color={colors.textMuted} />
            <Typography variant="body" color={colors.textMuted} style={{ marginTop: 8 }}>
              No expenses recorded in {monthLabel}
            </Typography>
          </View>
        ) : (
          expenseCategories.map((cat, index) => {
            const catColor = cat.color || colors.primary;

            return (
              <View
                key={cat.id}
                style={[
                  styles.categoryRow,
                  index === expenseCategories.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                {/* Icon */}
                <View style={[styles.categoryIcon, { backgroundColor: catColor + '25' }]}>
                  <Ionicons
                    name={(cat.icon as any) || 'pricetag-outline'}
                    size={18}
                    color={catColor}
                  />
                </View>

                {/* Details and Progress */}
                <View style={styles.categoryMain}>
                  <View style={styles.categoryInfoTop}>
                    <Typography variant="body" color={colors.white} style={{ fontWeight: '600' }}>
                      {cat.name}
                    </Typography>
                    <Typography variant="body" color={colors.white} style={{ fontWeight: '700' }}>
                      {formatCurrency(cat.amount)}
                    </Typography>
                  </View>

                  {/* Horizontal Bar with Percentage */}
                  <View style={styles.categoryProgressRow}>
                    <View style={styles.categoryProgressTrack}>
                      <View
                        style={[
                          styles.categoryProgressFill,
                          { width: `${cat.percent}%`, backgroundColor: catColor },
                        ]}
                      />
                    </View>
                    <Typography variant="caption" style={[styles.categoryPercent, { color: catColor }]}>
                      {cat.percent}%
                    </Typography>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 212, 170, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 170, 0.3)',
  },
  resetButtonText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 11,
  },
  monthSelectorCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    borderRadius: 18,
    marginBottom: 16,
  },
  monthSelectorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  navChevron: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedMonthCenter: {
    alignItems: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginRight: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 18,
  },
  metricCardContent: {
    padding: 14,
  },
  metricHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    borderRadius: 20,
    marginBottom: 16,
  },
  chartCardContent: {
    padding: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  trendBarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 10,
    paddingHorizontal: 4,
  },
  trendColumn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 12,
  },
  trendColumnSelected: {
    backgroundColor: 'rgba(91, 141, 239, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(91, 141, 239, 0.4)',
  },
  barGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 90,
  },
  trendBar: {
    width: 8,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  monthBarLabel: {
    color: colors.textMuted,
    marginTop: 6,
    fontSize: 11,
    fontWeight: '500',
  },
  monthBarLabelSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  categorySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  breakdownCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    borderRadius: 20,
  },
  breakdownCardContent: {
    padding: 16,
  },
  emptyBreakdown: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  categoryIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryMain: {
    flex: 1,
  },
  categoryInfoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryProgressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    marginRight: 8,
  },
  categoryProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  categoryPercent: {
    fontSize: 11,
    fontWeight: '700',
    minWidth: 32,
    textAlign: 'right',
  },
});
