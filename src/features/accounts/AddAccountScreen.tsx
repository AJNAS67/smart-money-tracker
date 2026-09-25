import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
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

const accountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  type: z.enum(['CASH', 'BANK', 'CREDIT_CARD', 'INVESTMENT']),
  balance: z.string().min(1, 'Initial balance is required').refine(val => !isNaN(Number(val)), 'Must be a valid number'),
});

type AccountFormData = z.infer<typeof accountSchema>;

export const AddAccountScreen = () => {
  const navigation = useNavigation();
  const addAccount = useStore(state => state.addAccount);

  const { control, handleSubmit, formState: { errors } } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      type: 'BANK',
      balance: '',
    },
  });

  const onSubmit = (data: AccountFormData) => {
    addAccount({
      name: data.name,
      type: data.type as AccountType,
      balance: parseFloat(data.balance),
      icon: data.type === 'CASH' ? 'cash' : data.type === 'CREDIT_CARD' ? 'card' : 'business',
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

      {/* For MVP we are using a simple string for type, later we can add a proper dropdown component */}
      <Controller
        control={control}
        name="type"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Account Type (CASH, BANK, CREDIT_CARD, INVESTMENT)"
            placeholder="BANK"
            value={value}
            onChangeText={onChange}
            error={errors.type?.message}
          />
        )}
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
});
