import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Line as SvgLine,
  Text as SvgText,
} from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { Transaction, Category } from '../../../database/schema';
import { Typography } from '../../../components/common/Typography';
import { GlassCard } from '../../../components/glass/GlassCard';

const { width } = Dimensions.get('window');
const SLIDE_WIDTH = width - 72; // Width inside GlassCard content padding

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
  const [chartType, setChartType] = useState<'BAR' | 'LINE'>('BAR');
  const scrollRef = useRef<ScrollView>(null);

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

  // Compact currency formatter for line chart labels (e.g. ₹5.2k, ₹8k)
  const formatCompact = (val: number) => {
    if (val === 0) return '₹0';
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) {
      const k = (val / 1000).toFixed(val % 1000 === 0 ? 0 : 1);
      return `₹${k}k`;
    }
    return `₹${val}`;
  };

  // Multi-Line Chart Geometry
  const LINE_CHART_HEIGHT = 160;
  const PAD_X = 26;
  const PAD_TOP = 26;
  const PAD_BOTTOM = 26;
  const drawWidth = SLIDE_WIDTH - PAD_X * 2;
  const drawHeight = LINE_CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;
  const stepX = drawWidth / (last6Months.length - 1);

  const expensePoints = last6Months.map((m, i) => ({
    x: PAD_X + i * stepX,
    y: PAD_TOP + drawHeight * (1 - m.expense / maxTrendAmount),
    val: m.expense,
    month: m.label,
    date: m.date,
    isSelected: m.isSelected,
  }));

  const incomePoints = last6Months.map((m, i) => ({
    x: PAD_X + i * stepX,
    y: PAD_TOP + drawHeight * (1 - m.income / maxTrendAmount),
    val: m.income,
    month: m.label,
    date: m.date,
    isSelected: m.isSelected,
  }));

  // Smooth Catmull-Rom to Cubic Bezier curve path generator
  const getSmoothLinePath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i > 0 ? pts[i - 1] : pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = i < pts.length - 2 ? pts[i + 2] : p2;

      const tension = 0.2;
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const getSmoothAreaPath = (pts: { x: number; y: number }[]) => {
    const linePath = getSmoothLinePath(pts);
    if (!linePath) return '';
    const bottomY = PAD_TOP + drawHeight;
    return `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${bottomY} L ${pts[0].x.toFixed(1)} ${bottomY} Z`;
  };

  const smoothExpenseLine = getSmoothLinePath(expensePoints);
  const smoothExpenseArea = getSmoothAreaPath(expensePoints);
  const smoothIncomeLine = getSmoothLinePath(incomePoints);
  const smoothIncomeArea = getSmoothAreaPath(incomePoints);

  // Switch between Bar & Line slides
  const handleToggleSlide = (mode: 'BAR' | 'LINE') => {
    setChartType(mode);
    const targetX = mode === 'LINE' ? SLIDE_WIDTH : 0;
    scrollRef.current?.scrollTo({ x: targetX, animated: true });
  };

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const mode = Math.round(offsetX / SLIDE_WIDTH) === 1 ? 'LINE' : 'BAR';
    setChartType(mode);
  };

  // Currently focused month in the trend
  const selectedTrendMonth = last6Months.find((m) => m.isSelected) || last6Months[last6Months.length - 1];

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

      {/* 6-Month Trend Card: Sliding Carousel (Bars <-> Multi-Line Chart) */}
      <GlassCard style={styles.chartCard} contentStyle={styles.chartCardContent}>
        {/* Card Header with View Switcher */}
        <View style={styles.chartHeader}>
          <View>
            <Typography variant="subtitle" color={colors.white} style={{ fontWeight: '700' }}>
              6-Month Trend
            </Typography>
            <Typography variant="caption" style={{ color: colors.textMuted }}>
              {chartType === 'LINE' ? 'Smooth Multi-Line Curves' : 'Comparative Bar Chart'}
            </Typography>
          </View>

          {/* Toggle Buttons: [ Bars ] [ Multi-Line ] */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, chartType === 'BAR' && styles.toggleBtnActive]}
              onPress={() => handleToggleSlide('BAR')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="bar-chart-outline"
                size={14}
                color={chartType === 'BAR' ? colors.white : colors.textMuted}
                style={{ marginRight: 4 }}
              />
              <Typography
                variant="caption"
                style={[styles.toggleBtnText, chartType === 'BAR' && styles.toggleBtnTextActive]}
              >
                Bars
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleBtn, chartType === 'LINE' && styles.toggleBtnActive]}
              onPress={() => handleToggleSlide('LINE')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="trending-up-outline"
                size={14}
                color={chartType === 'LINE' ? colors.white : colors.textMuted}
                style={{ marginRight: 4 }}
              />
              <Typography
                variant="caption"
                style={[styles.toggleBtnText, chartType === 'LINE' && styles.toggleBtnTextActive]}
              >
                Line
              </Typography>
            </TouchableOpacity>
          </View>
        </View>

        {/* Legend & Selected Month Pill */}
        <View style={styles.subHeaderRow}>
          {/* Active Month Info Badge */}
          <View style={styles.activeMonthPill}>
            <Typography variant="caption" style={{ color: colors.white, fontWeight: '700', fontSize: 11 }}>
              {selectedTrendMonth.label}:
            </Typography>
            <Typography variant="caption" style={{ color: colors.danger, fontWeight: '700', marginLeft: 4, fontSize: 11 }}>
              Exp {formatCurrency(selectedTrendMonth.expense)}
            </Typography>
            <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.4)', marginHorizontal: 3 }}>
              •
            </Typography>
            <Typography variant="caption" style={{ color: colors.success, fontWeight: '700', fontSize: 11 }}>
              Inc {formatCurrency(selectedTrendMonth.income)}
            </Typography>
          </View>

          {/* Chart Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
              <Typography variant="caption" style={{ color: colors.textMuted, fontSize: 11 }}>
                Expense
              </Typography>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <Typography variant="caption" style={{ color: colors.textMuted, fontSize: 11 }}>
                Income
              </Typography>
            </View>
          </View>
        </View>

        {/* Sliding Charts Carousel */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScrollEnd}
          style={styles.carouselScrollView}
        >
          {/* SLIDE 1: Comparative Bar Chart */}
          <View style={[styles.slideContainer, { width: SLIDE_WIDTH }]}>
            <View style={styles.trendBarsRow}>
              {last6Months.map((m, idx) => {
                const expHeight = Math.max(Math.round((m.expense / maxTrendAmount) * 90), 4);
                const incHeight = Math.max(Math.round((m.income / maxTrendAmount) * 90), 4);

                return (
                  <TouchableOpacity
                    key={`month-bar-${idx}`}
                    style={[styles.trendColumn, m.isSelected && styles.trendColumnSelected]}
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
                      style={[styles.monthBarLabel, m.isSelected && styles.monthBarLabelSelected]}
                    >
                      {m.label}
                    </Typography>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* SLIDE 2: Smooth Multi-Line Chart with Values */}
          <View style={[styles.slideContainer, { width: SLIDE_WIDTH }]}>
            <View style={styles.lineChartBox}>
              <Svg width={SLIDE_WIDTH} height={LINE_CHART_HEIGHT}>
                <Defs>
                  {/* Expense Gradient */}
                  <SvgLinearGradient id="expenseAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor={colors.danger} stopOpacity="0.25" />
                    <Stop offset="100%" stopColor={colors.danger} stopOpacity="0.0" />
                  </SvgLinearGradient>

                  {/* Income Gradient */}
                  <SvgLinearGradient id="incomeAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor={colors.success} stopOpacity="0.25" />
                    <Stop offset="100%" stopColor={colors.success} stopOpacity="0.0" />
                  </SvgLinearGradient>
                </Defs>

                {/* Horizontal Baseline */}
                <SvgLine
                  x1={PAD_X}
                  y1={PAD_TOP + drawHeight}
                  x2={SLIDE_WIDTH - PAD_X}
                  y2={PAD_TOP + drawHeight}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth={1}
                />

                {/* Vertical Guidelines for Selected Month */}
                {expensePoints.map(
                  (p, idx) =>
                    p.isSelected && (
                      <SvgLine
                        key={`guide-${idx}`}
                        x1={p.x}
                        y1={PAD_TOP - 6}
                        x2={p.x}
                        y2={PAD_TOP + drawHeight}
                        stroke="rgba(255, 255, 255, 0.18)"
                        strokeWidth={1}
                        strokeDasharray="3 3"
                      />
                    )
                )}

                {/* Area Fills under smooth lines */}
                {smoothExpenseArea ? <Path d={smoothExpenseArea} fill="url(#expenseAreaGrad)" /> : null}
                {smoothIncomeArea ? <Path d={smoothIncomeArea} fill="url(#incomeAreaGrad)" /> : null}

                {/* Smooth Curve Lines */}
                {smoothExpenseLine ? (
                  <Path
                    d={smoothExpenseLine}
                    fill="none"
                    stroke={colors.danger}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />
                ) : null}

                {smoothIncomeLine ? (
                  <Path
                    d={smoothIncomeLine}
                    fill="none"
                    stroke={colors.success}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />
                ) : null}

                {/* Data Points and Smooth Values */}
                {/* 1. Expense Points & Values */}
                {expensePoints.map((p, idx) => (
                  <React.Fragment key={`exp-point-${idx}`}>
                    {/* Outer Glow Circle if Selected */}
                    {p.isSelected && (
                      <Circle cx={p.x} cy={p.y} r={8} fill={colors.danger} opacity={0.25} />
                    )}

                    {/* Point Circle */}
                    <Circle
                      cx={p.x}
                      cy={p.y}
                      r={p.isSelected ? 5 : 3.5}
                      fill={colors.danger}
                      stroke={colors.white}
                      strokeWidth={1.5}
                    />

                    {/* Smooth Expense Value Label above point */}
                    {p.val > 0 && (
                      <SvgText
                        x={p.x}
                        y={p.y - 7}
                        fill={colors.danger}
                        fontSize="9"
                        fontWeight="700"
                        textAnchor="middle"
                      >
                        {formatCompact(p.val)}
                      </SvgText>
                    )}
                  </React.Fragment>
                ))}

                {/* 2. Income Points & Values */}
                {incomePoints.map((p, idx) => (
                  <React.Fragment key={`inc-point-${idx}`}>
                    {/* Outer Glow Circle if Selected */}
                    {p.isSelected && (
                      <Circle cx={p.x} cy={p.y} r={8} fill={colors.success} opacity={0.25} />
                    )}

                    {/* Point Circle */}
                    <Circle
                      cx={p.x}
                      cy={p.y}
                      r={p.isSelected ? 5 : 3.5}
                      fill={colors.success}
                      stroke={colors.white}
                      strokeWidth={1.5}
                    />

                    {/* Smooth Income Value Label below point (so it doesn't collide with expense) */}
                    {p.val > 0 && (
                      <SvgText
                        x={p.x}
                        y={p.y + 13}
                        fill={colors.success}
                        fontSize="9"
                        fontWeight="700"
                        textAnchor="middle"
                      >
                        {formatCompact(p.val)}
                      </SvgText>
                    )}

                    {/* Month Label on X-axis */}
                    <SvgText
                      x={p.x}
                      y={LINE_CHART_HEIGHT - 4}
                      fill={p.isSelected ? colors.primary : colors.textMuted}
                      fontSize="10"
                      fontWeight={p.isSelected ? '700' : '500'}
                      textAnchor="middle"
                    >
                      {p.month}
                    </SvgText>
                  </React.Fragment>
                ))}
              </Svg>

              {/* Touch overlay to select months by tapping columns */}
              <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                <View style={styles.touchOverlayRow}>
                  {last6Months.map((m, idx) => (
                    <TouchableOpacity
                      key={`touch-month-${idx}`}
                      style={styles.touchCol}
                      onPress={() => onSelectDate(m.date)}
                      activeOpacity={0.7}
                    />
                  ))}
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Carousel Pagination Dots & Swipe Hint */}
        <View style={styles.carouselFooter}>
          <View style={styles.paginationDots}>
            <View style={[styles.pageDot, chartType === 'BAR' && styles.pageDotActive]} />
            <View style={[styles.pageDot, chartType === 'LINE' && styles.pageDotActive]} />
          </View>
          <Typography variant="caption" style={styles.swipeHintText}>
            Swipe card to switch between Bar & Smooth Line chart
          </Typography>
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
    alignItems: 'center',
    marginBottom: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    padding: 3,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: colors.primary,
  },
  toggleBtnText: {
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 11,
  },
  toggleBtnTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  subHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  activeMonthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 4,
  },
  carouselScrollView: {
    width: SLIDE_WIDTH,
  },
  slideContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendBarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 125,
    width: '100%',
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
  lineChartBox: {
    width: SLIDE_WIDTH,
    height: 160,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchOverlayRow: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
  },
  touchCol: {
    flex: 1,
    height: '100%',
  },
  carouselFooter: {
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 6,
  },
  paginationDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  pageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 3,
  },
  pageDotActive: {
    width: 16,
    backgroundColor: colors.primary,
  },
  swipeHintText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10,
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
