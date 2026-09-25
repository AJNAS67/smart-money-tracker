import React, { useEffect } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../../store/useStore';
import { Typography } from '../../components/common/Typography';
import { GlassCard } from '../../components/glass/GlassCard';
import { colors } from '../../theme/colors';
import { Budget } from '../../database/schema';

export const BudgetsScreen = () => {
  const { budgets, transactions, categories, refreshBudgets } = useStore();
  const navigation = useNavigation<any>();

  useEffect(() => {
    refreshBudgets();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const renderBudget = ({ item }: { item: Budget }) => {
    const category = categories.find(c => c.id === item.categoryId);
    
    // Calculate spent amount
    // For MVP, we assume MONTHLY period and current month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const spentAmount = transactions
      .filter(t => {
        const d = new Date(t.date);
        return t.categoryId === item.categoryId 
          && t.type === 'EXPENSE'
          && d.getMonth() === currentMonth 
          && d.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const progress = Math.min(spentAmount / item.limitAmount, 1);
    const progressPercent = Math.round(progress * 100);
    
    // Determine color based on progress
    let progressColor = colors.success;
    if (progress >= 0.8 && progress < 1) progressColor = colors.warning;
    if (progress >= 1) progressColor = colors.danger;

    return (
      <GlassCard style={styles.budgetCard}>
        <View style={styles.budgetHeader}>
          <View style={styles.categoryInfo}>
            <View style={[styles.iconContainer, { backgroundColor: category?.color || colors.primary }]}>
              <Ionicons name={(category?.icon as any) || 'pricetag'} size={16} color={colors.white} />
            </View>
            <Typography variant="subtitle" style={{ color: colors.text }}>
              {category?.name || 'Unknown'}
            </Typography>
          </View>
          <Typography variant="caption" style={{ color: colors.textMuted }}>
            {progressPercent}%
          </Typography>
        </View>

        <View style={styles.amountsRow}>
          <Typography variant="caption" style={{ color: colors.text }}>
            Spent: <Typography variant="caption" style={{ color: colors.white, fontWeight: 'bold' }}>{formatCurrency(spentAmount)}</Typography>
          </Typography>
          <Typography variant="caption" style={{ color: colors.textMuted }}>
            Limit: {formatCurrency(item.limitAmount)}
          </Typography>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: progressColor }]} />
        </View>
        
        {progress >= 0.8 && (
          <View style={styles.alertContainer}>
            <Ionicons name="warning-outline" size={12} color={progressColor} style={{ marginRight: 4 }} />
            <Typography variant="caption" style={{ color: progressColor, fontSize: 10 }}>
              {progress >= 1 ? 'Budget Exceeded!' : 'Nearing Limit'}
            </Typography>
          </View>
        )}
      </GlassCard>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h2" color={colors.white}>Budgets</Typography>
      </View>

      <FlatList
        data={budgets}
        keyExtractor={(item) => item.id}
        renderItem={renderBudget}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="pie-chart-outline" size={48} color={colors.textMuted} />
            <Typography variant="subtitle" style={{ marginTop: 16 }}>No budgets set</Typography>
            <Typography variant="caption" align="center" style={{ marginTop: 8 }}>
              Create a budget to keep your spending in check.
            </Typography>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddBudget')}
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
  budgetCard: {
    padding: 16,
    marginBottom: 16,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  amountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  alertContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
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
