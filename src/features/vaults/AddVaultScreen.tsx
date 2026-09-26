import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { useStore } from '../../store/useStore';
import { Typography } from '../../components/common/Typography';
import { Input } from '../../components/forms/Input';
import { GradientButton } from '../../components/common/GradientButton';
import { colors } from '../../theme/colors';

const vaultSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  targetAmount: z.string().min(1, 'Target amount is required').refine(val => !isNaN(Number(val)), 'Must be a valid number'),
  color: z.string().optional(),
});

type VaultFormData = z.infer<typeof vaultSchema>;

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#ec4899', // pink
  '#ef4444', // red
];

export const AddVaultScreen = () => {
  const navigation = useNavigation();
  const { addVault } = useStore();
  
  const { control, handleSubmit, watch, formState: { errors } } = useForm<VaultFormData>({
    resolver: zodResolver(vaultSchema),
    defaultValues: {
      name: '',
      targetAmount: '',
      color: PRESET_COLORS[0],
    },
  });

  const onSubmit = (data: VaultFormData) => {
    addVault({
      name: data.name,
      targetAmount: parseFloat(data.targetAmount),
      color: data.color,
    });
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h2" style={styles.title}>Create Savings Vault</Typography>

      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Goal Name"
            placeholder="e.g. Vacation to Bali"
            value={value}
            onChangeText={onChange}
            error={errors.name?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="targetAmount"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Target Amount (₹)"
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={value}
            onChangeText={onChange}
            error={errors.targetAmount?.message}
          />
        )}
      />

      <View style={styles.section}>
        <Typography variant="caption" style={styles.label}>Vault Color</Typography>
        <Controller
          control={control}
          name="color"
          render={({ field: { onChange, value } }) => (
            <View style={styles.colorContainer}>
              {PRESET_COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: color },
                    value === color && styles.colorCircleActive
                  ]}
                  onPress={() => onChange(color)}
                />
              ))}
            </View>
          )}
        />
      </View>

      <View style={styles.spacer} />

      <GradientButton
        title="Create Vault"
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
  colorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCircleActive: {
    borderColor: colors.white,
  },
  spacer: {
    height: 32,
  },
});
