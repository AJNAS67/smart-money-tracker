import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { Transaction, Category } from '../../../database/schema';
import { Typography } from '../../../components/common/Typography';
import { GlassCard } from '../../../components/glass/GlassCard';

export type TimeframeFilter = 'WEEK' | 'MONTH' | 'YEAR' | 'ALL';

interface ExpensePieChartSectionProps {
  transactions: Transaction[];
  categories: Category[];
  formatCurrency: (amount: number) => string;
}

export const ExpensePieChartSection: React.FC<ExpensePieChartSectionProps> = ({
  transactions,
  categories,
  formatCurrency,
}) => {
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('YEAR');
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);

  const now = new Date();

  // Filter transactions based on selected timeframe
  const filteredTransactions = transactions.filter((t) => {
    if (t.type !== 'EXPENSE') return false;
    const d = new Date(t.date);

    if (timeframe === 'ALL') return true;

    if (timeframe === 'YEAR') {
      return d.getFullYear() === now.getFullYear();
    }

    if (timeframe === 'MONTH') {
      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }

    if (timeframe === 'WEEK') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return d >= oneWeekAgo && d <= now;
    }

    return true;
  });

  // Calculate total expense for the timeframe
  const totalExpense = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

  // Group by category and compute totals
  const categoryExpenses = categories
    .filter((c) => c.type === 'EXPENSE')
    .map((category) => {
      const catTransactions = filteredTransactions.filter(
        (t) => t.categoryId === category.id
      );
      const amount = catTransactions.reduce((sum, t) => sum + t.amount, 0);
      const percent = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;

      return {
        id: category.id,
        name: category.name,
        color: category.color || colors.primary,
        icon: category.icon,
        value: amount,
        percent,
        count: catTransactions.length,
      };
    })
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  // Active category for the center of the donut (selected or top spender)
  const activeCategory = selectedCatId
    ? categoryExpenses.find((c) => c.id === selectedCatId) || categoryExpenses[0]
    : categoryExpenses[0];

  const getTimeframeLabel = () => {
    switch (timeframe) {
      case 'WEEK':
        return 'This Week';
      case 'MONTH':
        return 'This Month';
      case 'YEAR':
        return 'This Year';
      case 'ALL':
        return 'All Time';
    }
  };

  // SVG Donut geometry
  const CHART_SIZE = 220;
  const CENTER = CHART_SIZE / 2;
  const RADIUS = 78;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const GAP = categoryExpenses.length > 1 ? 6 : 0;

  // Compute slice offsets
  let cumulativeOffset = 0;
  const slices = categoryExpenses.map((cat) => {
    const sliceLength = totalExpense > 0 ? (cat.value / totalExpense) * CIRCUMFERENCE : 0;
    const strokeDash = Math.max(sliceLength - GAP, 1);
    const offset = cumulativeOffset;
    cumulativeOffset += sliceLength;

    const isSelected = selectedCatId === cat.id;

    return {
      ...cat,
      strokeDash,
      offset,
      isSelected,
    };
  });

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.titleRow}>
          <Ionicons name="pie-chart" size={18} color={colors.primary} style={{ marginRight: 6 }} />
          <Typography variant="h3" color={colors.white}>
            Expense Breakdown
          </Typography>
        </View>
        <Typography variant="caption" style={{ color: colors.textMuted }}>
          {getTimeframeLabel()}
        </Typography>
      </View>

      <GlassCard style={styles.card} contentStyle={styles.cardContent}>
        {/* Timeframe Filter Tabs */}
        <View style={styles.tabsContainer}>
          {(['WEEK', 'MONTH', 'YEAR', 'ALL'] as TimeframeFilter[]).map((tab) => {
            const isActive = timeframe === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => {
                  setTimeframe(tab);
                  setSelectedCatId(null);
                }}
                activeOpacity={0.8}
              >
                <Typography
                  variant="caption"
                  style={[
                    styles.tabButtonText,
                    isActive && styles.tabButtonTextActive,
                  ]}
                >
                  {tab}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Top Summary Banner */}
        <View style={styles.totalDisplay}>
          <Typography variant="caption" style={{ color: colors.textMuted }}>
            Total {getTimeframeLabel()} Expenses
          </Typography>
          <Typography variant="h2" color={colors.white} style={styles.totalAmountText}>
            {formatCurrency(totalExpense)}
          </Typography>
        </View>

        {/* Modern Donut Chart with Centerpiece Hub */}
        <View style={styles.chartArea}>
          <View style={styles.donutContainer}>
            <Svg width={CHART_SIZE} height={CHART_SIZE}>
              <G rotation="-90" origin={`${CENTER}, ${CENTER}`}>
                {/* Background Ring Track */}
                <Circle
                  cx={CENTER}
                  cy={CENTER}
                  r={RADIUS}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth={20}
                  fill="transparent"
                />

                {/* Slices */}
                {slices.map((slice) => {
                  const hasSelection = selectedCatId !== null;
                  const strokeWidth = slice.isSelected ? 26 : 20;
                  const opacity = hasSelection ? (slice.isSelected ? 1 : 0.35) : 1;

                  return (
                    <Circle
                      key={`slice-${slice.id}`}
                      cx={CENTER}
                      cy={CENTER}
                      r={RADIUS}
                      stroke={slice.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${slice.strokeDash} ${CIRCUMFERENCE}`}
                      strokeDashoffset={-slice.offset}
                      strokeLinecap={categoryExpenses.length > 1 ? 'round' : 'butt'}
                      fill="transparent"
                      opacity={opacity}
                    />
                  );
                })}
              </G>
            </Svg>

            {/* Interactive Center Hub */}
            <TouchableOpacity
              style={styles.centerHub}
              activeOpacity={0.85}
              onPress={() => setSelectedCatId(null)}
            >
              {activeCategory ? (
                <View style={styles.centerContent}>
                  <View style={[styles.centerIconBadge, { backgroundColor: activeCategory.color + '25' }]}>
                    <Ionicons
                      name={(activeCategory.icon as any) || 'pricetag-outline'}
                      size={16}
                      color={activeCategory.color}
                    />
                  </View>
                  <Typography variant="caption" color={colors.white} numberOfLines={1} style={styles.centerCategoryName}>
                    {activeCategory.name}
                  </Typography>
                  <Typography variant="h2" color={colors.white} style={styles.centerPercent}>
                    {activeCategory.percent}%
                  </Typography>
                  <Typography variant="caption" style={{ color: activeCategory.color, fontWeight: '700', fontSize: 11 }}>
                    {formatCurrency(activeCategory.value)}
                  </Typography>
                </View>
              ) : (
                <View style={styles.centerContent}>
                  <Ionicons name="wallet-outline" size={24} color={colors.textMuted} />
                  <Typography variant="caption" style={{ color: colors.textMuted, marginTop: 4 }}>
                    No Data
                  </Typography>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Quick Help Tip */}
          {categoryExpenses.length > 0 && (
            <Typography variant="caption" style={styles.helpText}>
              {selectedCatId ? 'Tap center to clear selection' : 'Tap any category below to highlight'}
            </Typography>
          )}
        </View>

        {/* Category Breakdown List */}
        <View style={styles.breakdownList}>
          {categoryExpenses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={32} color={colors.textMuted} />
              <Typography variant="body" color={colors.textMuted} style={{ marginTop: 8 }}>
                No expenses found for {getTimeframeLabel().toLowerCase()}
              </Typography>
            </View>
          ) : (
            categoryExpenses.map((cat, idx) => {
              const isSelected = selectedCatId === cat.id;

              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryRow,
                    idx === categoryExpenses.length - 1 && { borderBottomWidth: 0 },
                    isSelected && styles.categoryRowSelected,
                  ]}
                  onPress={() => setSelectedCatId(isSelected ? null : cat.id)}
                  activeOpacity={0.7}
                >
                  {/* Category Icon */}
                  <View style={[styles.categoryIconBox, { backgroundColor: cat.color + '25' }]}>
                    <Ionicons
                      name={(cat.icon as any) || 'pricetag-outline'}
                      size={18}
                      color={cat.color}
                    />
                  </View>

                  {/* Details */}
                  <View style={styles.categoryInfo}>
                    <View style={styles.categoryInfoTop}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <Typography
                          variant="body"
                          color={colors.white}
                          style={{ fontWeight: isSelected ? '700' : '600' }}
                          numberOfLines={1}
                        >
                          {cat.name}
                        </Typography>
                        {isSelected && (
                          <View style={[styles.selectedPill, { backgroundColor: cat.color + '30' }]}>
                            <Typography variant="caption" style={{ color: cat.color, fontSize: 10, fontWeight: '700' }}>
                              ACTIVE
                            </Typography>
                          </View>
                        )}
                      </View>
                      <Typography variant="body" color={colors.white} style={{ fontWeight: '700' }}>
                        {formatCurrency(cat.value)}
                      </Typography>
                    </View>

                    {/* Progress Line & Percentage */}
                    <View style={styles.progressRow}>
                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${cat.percent}%`, backgroundColor: cat.color },
                          ]}
                        />
                      </View>
                      <Typography variant="caption" style={[styles.percentText, { color: cat.color }]}>
                        {cat.percent}%
                      </Typography>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    borderRadius: 20,
  },
  cardContent: {
    padding: 18,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButtonText: {
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 12,
  },
  tabButtonTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  totalDisplay: {
    alignItems: 'center',
    marginBottom: 8,
  },
  totalAmountText: {
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  chartArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  donutContainer: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerHub: {
    position: 'absolute',
    width: 114,
    height: 114,
    borderRadius: 57,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  centerCategoryName: {
    fontWeight: '600',
    fontSize: 11,
    maxWidth: 96,
    textAlign: 'center',
  },
  centerPercent: {
    fontWeight: '800',
    fontSize: 22,
    lineHeight: 26,
    marginVertical: 1,
  },
  helpText: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
  },
  breakdownList: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  categoryRowSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  selectedPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 6,
  },
  categoryIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryInfoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  percentText: {
    fontSize: 11,
    fontWeight: '700',
    minWidth: 32,
    textAlign: 'right',
  },
});
