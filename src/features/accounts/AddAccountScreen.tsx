import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { useStore } from '../../store/useStore';
import { AccountType } from '../../database/schema';
import { Typography } from '../../components/common/Typography';
import { Input } from '../../components/forms/Input';
import { GradientButton } from '../../components/common/GradientButton';
import { colors } from '../../theme/colors';

const ACCOUNT_TYPES = ['BANK', 'CREDIT_CARD', 'INVESTMENT', 'WALLET', 'OTHER'];

const accountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  type: z.string().min(1, 'Account type is required'),
  customType: z.string().optional(),
  balance: z.string().min(1, 'Initial balance is required').refine(val => !isNaN(Number(val)), 'Must be a valid number'),
});

type AccountFormData = z.infer<typeof accountSchema>;

export const AddAccountScreen = () => {
  const navigation = useNavigation();
  const addAccount = useStore(state => state.addAccount);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      type: 'BANK',
      customType: '',
      balance: '',
    },
  });

  const onSubmit = (data: AccountFormData) => {
    const finalType = data.type === 'OTHER' && data.customType ? data.customType : data.type;
    addAccount({
      name: data.name,
      type: finalType,
      balance: parseFloat(data.balance),
      icon: finalType === 'CASH' || finalType === 'WALLET' ? 'wallet' : finalType === 'CREDIT_CARD' ? 'card' : 'business',
      color: colors.primary,
    });
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h2" style={styles.title}>Add New Account</Typography>
      
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Account Name"
            placeholder="e.g. Main Chase Checking"
            value={value}
            onChangeText={onChange}
            error={errors.name?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="balance"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Initial Balance"
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={value}
            onChangeText={onChange}
            error={errors.balance?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="type"
        render={({ field: { onChange, value } }) => (
          <View style={styles.typeContainer}>
            <Typography variant="caption" style={styles.label}>Account Type</Typography>
            <View style={styles.pillsContainer}>
              {ACCOUNT_TYPES.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[styles.pill, value === type && styles.pillActive]}
                  onPress={() => onChange(type)}
                >
                  <Typography variant="caption" style={value === type ? styles.pillTextActive : styles.pillText}>
                    {type.replace('_', ' ')}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      />

      <Controller
        control={control}
        name="customType"
        render={({ field: { onChange, value } }) => {
          const selectedType = watch('type');
          if (selectedType !== 'OTHER') return null;
          
          return (
            <View>
              <Input
                label="Custom Type"
                placeholder="e.g. Crypto"
                value={value || ''}
                onChangeText={onChange}
                error={errors.customType?.message}
              />
            </View>
          );
        }}
      />

      <View style={styles.spacer} />

      <GradientButton
        title="Create Account"
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
  spacer: {
    height: 24,
  },
  typeContainer: {
    marginBottom: 24,
  },
  label: {
    marginBottom: 8,
    color: colors.textMuted,
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    color: colors.text,
  },
  pillTextActive: {
    color: colors.white,
    fontWeight: 'bold',
  },
});
