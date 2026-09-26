import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Ionicons } from '@expo/vector-icons';

import { useStore } from '../../store/useStore';
import { Typography } from '../../components/common/Typography';
import { Input } from '../../components/forms/Input';
import { GradientButton } from '../../components/common/GradientButton';
import { colors } from '../../theme/colors';

const addFundsSchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  amount: z.string().min(1, 'Amount is required').refine(val => !isNaN(Number(val)) && Number(val) > 0, 'Must be a valid positive number'),
});

type AddFundsFormData = z.infer<typeof addFundsSchema>;

type ParamList = {
  AddFunds: { vaultId: string };
};

export const AddFundsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ParamList, 'AddFunds'>>();
  const vaultId = route.params.vaultId;
  
  const { addFundsToVault, accounts, vaults } = useStore();
  const vault = vaults.find(v => v.id === vaultId);
  
  const { control, handleSubmit, formState: { errors } } = useForm<AddFundsFormData>({
    resolver: zodResolver(addFundsSchema),
    defaultValues: {
      accountId: accounts[0]?.id || '',
      amount: '',
    },
  });

  const onSubmit = (data: AddFundsFormData) => {
    addFundsToVault(vaultId, data.accountId, parseFloat(data.amount));
    navigation.goBack();
  };

  if (!vault) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h2" style={styles.title}>Add Funds to {vault.name}</Typography>

      <Controller
        control={control}
        name="amount"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Amount (₹)"
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={value}
            onChangeText={onChange}
            error={errors.amount?.message}
          />
        )}
      />

      <View style={styles.section}>
        <Typography variant="caption" style={styles.label}>From Account</Typography>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <Controller
            control={control}
            name="accountId"
            render={({ field: { onChange, value } }) => (
              <>
                {accounts.map(account => (
                  <TouchableOpacity
                    key={account.id}
                    style={[styles.chip, value === account.id && styles.chipActive]}
                    onPress={() => onChange(account.id)}
                  >
                    <Ionicons name={account.icon as any || 'wallet'} size={16} color={value === account.id ? colors.white : colors.textMuted} style={styles.chipIcon} />
                    <Typography variant="caption" style={value === account.id ? styles.chipTextActive : styles.chipText}>
                      {account.name} (₹{account.balance})
                    </Typography>
                  </TouchableOpacity>
                ))}
              </>
            )}
          />
        </ScrollView>
        {errors.accountId && <Typography variant="caption" style={styles.errorText}>{errors.accountId.message}</Typography>}
      </View>

      <View style={styles.spacer} />

      <GradientButton
        title="Transfer Funds"
        onPress={handleSubmit(onSubmit)}
      />
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
    paddingTop: 40,
  },
  title: {
    marginBottom: 32,
    color: colors.white,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    marginBottom: 12,
    color: colors.textMuted,
  },
  chipScroll: {
    flexDirection: 'row',
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginRight: 12,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipIcon: {
    marginRight: 6,
  },
  chipText: {
    color: colors.textMuted,
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: 'bold',
  },
  errorText: {
    color: colors.danger,
    marginTop: 4,
  },
  spacer: {
    height: 32,
  },
});
