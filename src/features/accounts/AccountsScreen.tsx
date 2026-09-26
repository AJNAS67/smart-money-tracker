import React, { useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../../store/useStore';
import { Typography } from '../../components/common/Typography';
import { GlassCard } from '../../components/glass/GlassCard';
import { colors } from '../../theme/colors';
import { Account } from '../../database/schema';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32; // Full width minus padding

export const AccountsScreen = () => {
  const { accounts, totalBalance, refreshAccounts } = useStore();
  const navigation = useNavigation<any>();

  useEffect(() => {
    refreshAccounts();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const creditCards = accounts.filter(a => a.type === 'CREDIT_CARD');
  const otherAccounts = accounts.filter(a => a.type !== 'CREDIT_CARD');

  // Credit Cards Overview Calculations
  const totalLimit = creditCards.reduce((sum, c) => sum + (c.creditLimit || 0), 0);
  const totalOutstanding = creditCards.reduce((sum, c) => sum + c.balance, 0);
  const totalAvailable = totalLimit - totalOutstanding;
  const totalUsedPercent = totalLimit > 0 ? (totalOutstanding / totalLimit) * 100 : 0;

  const renderCreditCard = ({ item, index }: { item: Account, index: number }) => {
    const limit = item.creditLimit || 0;
    const outstanding = item.balance || 0;
    const available = limit - outstanding;
    const usedPercent = limit > 0 ? (outstanding / limit) * 100 : 0;

    let daysLeftText = '';
    if (item.billPaymentDate) {
      const today = new Date();
      const billDate = new Date(item.billPaymentDate);
      const diffTime = billDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0) {
        daysLeftText = `${diffDays} days left`;
      } else {
        daysLeftText = `Overdue`;
      }
    }

    return (
      <Animated.View entering={FadeInDown.delay(index * 100).duration(400)}>
        <GlassCard style={[styles.creditCardDetail, { backgroundColor: '#1A2138' }]}>
          <View style={styles.ccHeader}>
            <View style={styles.ccHeaderLeft}>
              <View style={[styles.ccIconContainer, { backgroundColor: colors.white }]}>
                <Ionicons name={item.icon as any || 'card'} size={20} color={item.color || colors.primary} />
              </View>
              <View>
                <Typography variant="subtitle" style={{ color: colors.white, fontWeight: 'bold' }}>{item.name}</Typography>
                <Typography variant="caption" style={{ color: colors.textMuted }}>{item.bankName || 'Credit Card'}</Typography>
              </View>
            </View>
            <View style={styles.ccHeaderRight}>
              {item.last4Digits && (
                <Typography variant="subtitle" style={{ color: colors.white, fontWeight: 'bold', letterSpacing: 2 }}>
                  .... {item.last4Digits}
                </Typography>
              )}
            </View>
          </View>

          <View style={styles.ccBalancesRow}>
            <View>
              <Typography variant="caption" style={{ color: colors.textMuted }}>Outstanding</Typography>
              <Typography variant="h3" style={{ color: '#FCA5A5', fontWeight: 'bold' }}>{formatCurrency(outstanding)}</Typography>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Typography variant="caption" style={{ color: colors.textMuted }}>Available</Typography>
              <Typography variant="h3" style={{ color: colors.white, fontWeight: 'bold' }}>{formatCurrency(available)}</Typography>
            </View>
          </View>

          <View style={styles.ccProgressContainer}>
            <View style={styles.ccProgressBg}>
              <View style={[styles.ccProgressFill, { width: `${Math.min(usedPercent, 100)}%` }]} />
            </View>
            <View style={styles.ccProgressLabels}>
              <Typography variant="caption" style={{ color: colors.textMuted, fontSize: 10 }}>
                {formatCurrency(available)} available • {Math.round(usedPercent)}% used
              </Typography>
              <Typography variant="caption" style={{ color: colors.textMuted, fontSize: 10 }}>
                Limit {formatCurrency(limit)}
              </Typography>
            </View>
          </View>

          {item.billPaymentDate && (
            <View style={styles.ccBillInfo}>
              <View style={styles.ccBillDateContainer}>
                <Ionicons name="calendar-outline" size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
                <View>
                  <Typography variant="caption" style={{ color: colors.textMuted, fontSize: 10, textTransform: 'uppercase' }}>Next Bill</Typography>
                  <Typography variant="body" style={{ color: colors.white, fontWeight: 'bold' }}>
                    {new Date(item.billPaymentDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Typography>
                </View>
              </View>
              <View style={styles.ccDaysLeftChip}>
                <Typography variant="caption" style={{ color: '#60A5FA', fontWeight: 'bold' }}>{daysLeftText}</Typography>
              </View>
            </View>
          )}
        </GlassCard>
      </Animated.View>
    );
  };

  const renderOtherAccount = ({ item, index }: { item: Account, index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(400)}>
      <GlassCard style={styles.bankCard}>
        <View style={styles.bankHeader}>
          <View style={[styles.bankIconContainer, { backgroundColor: item.color || colors.primary }]}>
            <Ionicons name={(item.icon as any) || 'wallet'} size={24} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Typography variant="subtitle" style={{ color: colors.white, fontWeight: 'bold' }}>{item.name}</Typography>
            <Typography variant="caption" style={{ color: colors.textMuted }}>{item.type}</Typography>
          </View>
          {item.last4Digits && (
            <Typography variant="caption" style={{ color: colors.textMuted }}>
              ••• {item.last4Digits}
            </Typography>
          )}
        </View>
        <View style={styles.bankBalanceContainer}>
          <Typography variant="caption" style={{ color: colors.textMuted }}>Current Balance</Typography>
          <Typography variant="h2" style={{ color: colors.white, fontWeight: 'bold' }}>{formatCurrency(item.balance)}</Typography>
        </View>
      </GlassCard>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography variant="caption" style={{ color: colors.textMuted }}>Total Net Worth</Typography>
        <Typography variant="h1" color={colors.primary}>{formatCurrency(totalBalance)}</Typography>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {accounts.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={48} color={colors.textMuted} />
            <Typography variant="subtitle" style={{ marginTop: 16 }}>No accounts yet</Typography>
            <Typography variant="caption" align="center" style={{ marginTop: 8 }}>
              Add an account to start tracking your net worth.
            </Typography>
          </View>
        )}

        {creditCards.length > 0 && (
          <View style={styles.section}>
            <GlassCard style={styles.overviewCard}>
              <Typography variant="caption" style={{ color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                Credit Card Overview
              </Typography>
              
              <View style={styles.overviewTopRow}>
                <View>
                  <Typography variant="caption" style={{ color: colors.textMuted }}>Outstanding</Typography>
                  <Typography variant="h2" style={{ color: colors.white, fontWeight: 'bold' }}>
                    {formatCurrency(totalOutstanding)}
                  </Typography>
                </View>
                <View style={styles.overviewUsedBadge}>
                  <Typography variant="caption" style={{ color: colors.white, fontWeight: 'bold' }}>
                    {Math.round(totalUsedPercent)}%
                  </Typography>
                  <Typography variant="caption" style={{ color: colors.textMuted, fontSize: 10 }}>USED</Typography>
                </View>
              </View>

              <View style={styles.overviewBottomRow}>
                <View style={styles.overviewBottomBox}>
                  <Typography variant="caption" style={{ color: colors.textMuted }}>Total Limit</Typography>
                  <Typography variant="subtitle" style={{ color: colors.white, fontWeight: 'bold' }}>
                    {formatCurrency(totalLimit)}
                  </Typography>
                </View>
                <View style={styles.overviewBottomBox}>
                  <Typography variant="caption" style={{ color: colors.textMuted }}>Available</Typography>
                  <Typography variant="subtitle" style={{ color: colors.white, fontWeight: 'bold' }}>
                    {formatCurrency(totalAvailable)}
                  </Typography>
                </View>
              </View>
            </GlassCard>

            <View style={styles.sectionHeaderRow}>
              <Typography variant="h2" style={{ color: colors.white, fontWeight: 'bold' }}>Credit Cards</Typography>
              <Typography variant="caption" style={{ color: colors.textMuted }}>{creditCards.length} cards</Typography>
            </View>

            <FlatList
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              data={creditCards}
              keyExtractor={(item) => item.id}
              renderItem={renderCreditCard}
              snapToAlignment="center"
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 16 }}
            />
          </View>
        )}

        {otherAccounts.length > 0 && (
          <View style={[styles.section, { marginTop: creditCards.length > 0 ? 24 : 0 }]}>
            <View style={styles.sectionHeaderRow}>
              <Typography variant="h2" style={{ color: colors.white, fontWeight: 'bold' }}>Bank & Wallets</Typography>
              <Typography variant="caption" style={{ color: colors.textMuted }}>{otherAccounts.length} accounts</Typography>
            </View>

            <FlatList
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              data={otherAccounts}
              keyExtractor={(item) => item.id}
              renderItem={renderOtherAccount}
              snapToAlignment="center"
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 16 }}
            />
          </View>
        )}
        
        {/* Extra space at bottom for FAB */}
        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddAccount')}
      >
        <Ionicons name="add" size={32} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  section: {
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 16,
    marginTop: 16,
  },
  overviewCard: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
  },
  overviewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  overviewUsedBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  overviewBottomRow: {
    flexDirection: 'row',
    gap: 12,
  },
  overviewBottomBox: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  creditCardDetail: {
    width: CARD_WIDTH,
    padding: 20,
    borderRadius: 24,
    marginRight: 16,
    borderColor: '#334155',
    borderWidth: 1,
  },
  ccHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  ccHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ccIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ccHeaderRight: {
    alignItems: 'flex-end',
  },
  ccBalancesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  ccProgressContainer: {
    marginBottom: 24,
  },
  ccProgressBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  ccProgressFill: {
    height: '100%',
    backgroundColor: '#60A5FA',
    borderRadius: 3,
  },
  ccProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ccBillInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 12,
    borderRadius: 16,
  },
  ccBillDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ccDaysLeftChip: {
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  bankCard: {
    width: CARD_WIDTH,
    padding: 24,
    borderRadius: 24,
    marginRight: 16,
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
  },
  bankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  bankIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  bankBalanceContainer: {
    marginTop: 8,
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
