import React, { useEffect } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../../store/useStore';
import { Typography } from '../../components/common/Typography';
import { GlassCard } from '../../components/glass/GlassCard';
import { colors } from '../../theme/colors';
import { Vault } from '../../database/schema';

const { width } = Dimensions.get('window');

export const VaultsScreen = () => {
  const { vaults, refreshVaults } = useStore();
  const navigation = useNavigation<any>();

  useEffect(() => {
    refreshVaults();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderVault = ({ item }: { item: Vault }) => {
    const progress = Math.min(item.currentAmount / item.targetAmount, 1);
    const progressPercent = Math.round(progress * 100);
    const remaining = item.targetAmount - item.currentAmount;
    const vaultColor = item.color || colors.primary;

    return (
      <Animated.View entering={FadeInDown.delay(item.id ? 100 : 0).duration(400)}>
        <GlassCard style={styles.vaultCard} contentStyle={styles.cardContent}>
          
          <View style={styles.vaultHeader}>
            <View style={styles.vaultTitleRow}>
              <View style={[styles.iconContainer, { backgroundColor: vaultColor + '20' }]}>
                <Ionicons name="wallet" size={24} color={vaultColor} />
              </View>
              <View style={styles.titleInfo}>
                <Typography variant="subtitle" style={{ color: colors.white, fontWeight: 'bold' }}>{item.name}</Typography>
                <Typography variant="caption" style={{ color: colors.textMuted }}>{progressPercent}% Complete</Typography>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.addFundsBtn, { backgroundColor: vaultColor }]}
              onPress={() => navigation.navigate('AddFunds', { vaultId: item.id })}
            >
              <Ionicons name="add" size={16} color={colors.white} style={{ marginRight: 4 }} />
              <Typography variant="caption" style={{ color: colors.white, fontWeight: 'bold' }}>Add</Typography>
            </TouchableOpacity>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: vaultColor }]} />
            </View>
          </View>

          <View style={styles.vaultDetails}>
            <Typography variant="caption" style={{ color: colors.textMuted }}>
              Saved: <Typography variant="caption" style={{ color: vaultColor, fontWeight: 'bold' }}>{formatCurrency(item.currentAmount)}</Typography>
            </Typography>
            <Typography variant="caption" style={{ color: colors.textMuted }}>
              Target: <Typography variant="caption" style={{ color: colors.white, fontWeight: 'bold' }}>{formatCurrency(item.targetAmount)}</Typography>
            </Typography>
          </View>

        </GlassCard>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h2" color={colors.white}>Savings Vaults</Typography>
      </View>

      <FlatList
        data={vaults}
        keyExtractor={(item) => item.id}
        renderItem={renderVault}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="lock-closed-outline" size={48} color={colors.textMuted} />
            <Typography variant="subtitle" style={{ marginTop: 16 }}>No vaults yet</Typography>
            <Typography variant="caption" align="center" style={{ marginTop: 8 }}>
              Create a vault to start saving for your goals.
            </Typography>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddVault')}
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
  vaultCard: {
    marginBottom: 16,
    borderRadius: 20,
  },
  cardContent: {
    padding: 20,
  },
  vaultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  vaultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  titleInfo: {
    flex: 1,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  vaultDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addFundsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
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
