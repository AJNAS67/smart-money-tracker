import React, { useEffect } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../../store/useStore';
import { Typography } from '../../components/common/Typography';
import { GlassCard } from '../../components/glass/GlassCard';
import { colors } from '../../theme/colors';
import { Vault } from '../../database/schema';
import { PolarChart, Pie } from 'victory-native';

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

    const pieData = [
      { value: progress, color: vaultColor },
      { value: 1 - progress, color: 'rgba(255,255,255,0.1)' }
    ];

    return (
      <GlassCard style={styles.vaultCard}>
        <View style={styles.vaultHeader}>
          <Typography variant="subtitle" style={{ color: colors.white }}>{item.name}</Typography>
        </View>

        <View style={styles.chartContainer}>
          <View style={styles.chartWrapper}>
            <PolarChart
              data={pieData}
              colorKey={"color"}
              valueKey={"value"}
              labelKey={""}
            >
              <Pie.Chart innerRadius={35} />
            </PolarChart>
            <View style={styles.chartCenterText}>
              <Typography variant="caption" style={{ color: colors.white, fontWeight: 'bold' }}>{progressPercent}%</Typography>
            </View>
          </View>
        </View>

        <View style={styles.vaultDetails}>
          <Typography variant="caption" style={{ color: colors.text }}>
            Saved: <Typography variant="caption" style={{ color: vaultColor, fontWeight: 'bold' }}>{formatCurrency(item.currentAmount)}</Typography>
          </Typography>
          <Typography variant="caption" style={{ color: colors.textMuted }}>
            Target: {formatCurrency(item.targetAmount)}
          </Typography>
        </View>

        <TouchableOpacity 
          style={[styles.addFundsBtn, { backgroundColor: vaultColor }]}
          onPress={() => navigation.navigate('AddFunds', { vaultId: item.id })}
        >
          <Typography variant="caption" style={{ color: colors.white, fontWeight: 'bold' }}>Add Funds</Typography>
        </TouchableOpacity>
      </GlassCard>
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
        numColumns={2}
        columnWrapperStyle={styles.row}
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
  row: {
    justifyContent: 'space-between',
  },
  vaultCard: {
    width: (width - 48) / 2, // 2 columns with padding
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  vaultHeader: {
    marginBottom: 12,
    alignItems: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  chartWrapper: {
    width: 100,
    height: 100,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartCenterText: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vaultDetails: {
    alignItems: 'center',
    marginBottom: 16,
  },
  addFundsBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
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
