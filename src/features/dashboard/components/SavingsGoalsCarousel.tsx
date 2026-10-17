import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { Vault } from '../../../database/schema';
import { Typography } from '../../../components/common/Typography';
import { GlassCard } from '../../../components/glass/GlassCard';

const { width } = Dimensions.get('window');
const CARD_WIDTH = Math.min(width * 0.82, 340);
const CARD_GAP = 14;

interface SavingsGoalsCarouselProps {
  vaults: Vault[];
  onAddFunds: (vaultId: string) => void;
  onCreateVault: () => void;
  onViewAllVaults: () => void;
  formatCurrency: (amount: number) => string;
}

export const SavingsGoalsCarousel: React.FC<SavingsGoalsCarouselProps> = ({
  vaults,
  onAddFunds,
  onCreateVault,
  onViewAllVaults,
  formatCurrency,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const totalSaved = vaults.reduce((sum, v) => sum + (v.currentAmount || 0), 0);
  const totalTarget = vaults.reduce((sum, v) => sum + (v.targetAmount || 0), 0);
  const overallProgress = totalTarget > 0 ? Math.min(Math.round((totalSaved / totalTarget) * 100), 100) : 0;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (CARD_WIDTH + CARD_GAP));
    if (index >= 0 && index < vaults.length && index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View>
          <View style={styles.titleRow}>
            <Ionicons name="lock-closed" size={18} color={colors.accent} style={{ marginRight: 6 }} />
            <Typography variant="h3" color={colors.white}>
              Savings Goals
            </Typography>
            {vaults.length > 0 && (
              <View style={styles.countBadge}>
                <Typography variant="caption" style={styles.countBadgeText}>
                  {vaults.length}
                </Typography>
              </View>
            )}
          </View>
          {vaults.length > 0 && (
            <Typography variant="caption" style={{ color: colors.textMuted, marginTop: 2 }}>
              Saved {formatCurrency(totalSaved)} ({overallProgress}% of goals)
            </Typography>
          )}
        </View>

        <TouchableOpacity onPress={onViewAllVaults} style={styles.seeAllButton}>
          <Typography variant="body" color={colors.primary} style={{ fontWeight: '600' }}>
            {vaults.length > 0 ? 'View All' : '+ Create'}
          </Typography>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Vaults Content */}
      {vaults.length === 0 ? (
        <GlassCard style={styles.emptyCard} contentStyle={styles.emptyContent}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="wallet-outline" size={32} color={colors.accent} />
          </View>
          <Typography variant="subtitle" color={colors.white} style={{ fontWeight: '700', marginBottom: 4 }}>
            No Savings Goals Yet
          </Typography>
          <Typography variant="caption" style={styles.emptySubtitle}>
            Lock money away for an emergency fund, dream vacation, or big purchase.
          </Typography>
          <TouchableOpacity style={styles.createButton} onPress={onCreateVault} activeOpacity={0.85}>
            <Ionicons name="add-circle-outline" size={18} color={colors.white} style={{ marginRight: 6 }} />
            <Typography variant="body" color={colors.white} style={{ fontWeight: '700' }}>
              Create Your First Goal
            </Typography>
          </TouchableOpacity>
        </GlassCard>
      ) : (
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + CARD_GAP}
            decelerationRate="fast"
            contentContainerStyle={styles.scrollContent}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {vaults.map((vault) => {
              const current = vault.currentAmount || 0;
              const target = vault.targetAmount || 1;
              const percent = Math.min(Math.round((current / target) * 100), 100);
              const remaining = Math.max(target - current, 0);
              const vaultColor = vault.color || colors.primary;
              const isCompleted = current >= target;

              return (
                <GlassCard
                  key={vault.id}
                  style={[styles.vaultCard, { borderColor: isCompleted ? colors.success + '60' : 'rgba(255,255,255,0.15)' }]}
                  contentStyle={styles.vaultCardContent}
                >
                  {/* Card Top Row */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardTitleGroup}>
                      <View style={[styles.vaultIconWrapper, { backgroundColor: vaultColor + '25' }]}>
                        <Ionicons
                          name={isCompleted ? 'trophy' : 'wallet'}
                          size={20}
                          color={isCompleted ? '#F59E0B' : vaultColor}
                        />
                      </View>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Typography
                          variant="subtitle"
                          color={colors.white}
                          numberOfLines={1}
                          style={{ fontWeight: '700' }}
                        >
                          {vault.name}
                        </Typography>
                        <Typography variant="caption" style={{ color: colors.textMuted }}>
                          {isCompleted ? 'Goal Achieved!' : `${formatCurrency(remaining)} to go`}
                        </Typography>
                      </View>
                    </View>

                    {/* Status Badge */}
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: isCompleted ? colors.success + '25' : vaultColor + '20',
                          borderColor: isCompleted ? colors.success + '50' : vaultColor + '40',
                        },
                      ]}
                    >
                      <Typography
                        variant="caption"
                        style={{
                          color: isCompleted ? colors.success : vaultColor,
                          fontWeight: '700',
                          fontSize: 11,
                        }}
                      >
                        {isCompleted ? '100% Done' : `${percent}%`}
                      </Typography>
                    </View>
                  </View>

                  {/* Saved vs Target Display */}
                  <View style={styles.amountDisplayRow}>
                    <View>
                      <Typography variant="caption" style={{ color: colors.textMuted }}>
                        Saved
                      </Typography>
                      <Typography variant="h2" color={colors.white} style={{ fontWeight: '800' }}>
                        {formatCurrency(current)}
                      </Typography>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Typography variant="caption" style={{ color: colors.textMuted }}>
                        Target
                      </Typography>
                      <Typography variant="subtitle" style={{ color: colors.textMuted, fontWeight: '600' }}>
                        {formatCurrency(target)}
                      </Typography>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${percent}%`,
                          backgroundColor: isCompleted ? colors.success : vaultColor,
                        },
                      ]}
                    />
                  </View>

                  {/* Card Action Row */}
                  <View style={styles.cardActionRow}>
                    <TouchableOpacity
                      style={[styles.addFundsButton, { backgroundColor: vaultColor }]}
                      onPress={() => onAddFunds(vault.id)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="add" size={18} color={colors.white} style={{ marginRight: 4 }} />
                      <Typography variant="caption" color={colors.white} style={{ fontWeight: '700' }}>
                        Add Money
                      </Typography>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.detailsButton}
                      onPress={onViewAllVaults}
                      activeOpacity={0.8}
                    >
                      <Typography variant="caption" style={{ color: colors.textMuted, fontWeight: '600' }}>
                        Details
                      </Typography>
                      <Ionicons name="arrow-forward" size={14} color={colors.textMuted} style={{ marginLeft: 2 }} />
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              );
            })}
          </ScrollView>

          {/* Pagination Dots if multiple vaults */}
          {vaults.length > 1 && (
            <View style={styles.paginationRow}>
              {vaults.map((_, i) => (
                <View
                  key={`dot-${i}`}
                  style={[
                    styles.paginationDot,
                    i === activeIndex && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      )}
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
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countBadge: {
    backgroundColor: 'rgba(0, 212, 170, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  countBadgeText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 11,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  scrollContent: {
    paddingRight: 16,
    paddingBottom: 4,
  },
  vaultCard: {
    width: CARD_WIDTH,
    marginRight: CARD_GAP,
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
    borderRadius: 20,
  },
  vaultCardContent: {
    padding: 18,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vaultIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  amountDisplayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  addFundsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 3,
  },
  paginationDotActive: {
    width: 18,
    backgroundColor: colors.accent,
  },
  emptyCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 20,
  },
  emptyContent: {
    padding: 22,
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 212, 170, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
});
