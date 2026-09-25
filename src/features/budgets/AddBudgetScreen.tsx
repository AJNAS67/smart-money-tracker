import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Ionicons } from '@expo/vector-icons';

import { useStore } from '../../store/useStore';
import { Typography } from '../../components/common/Typography';
import { Input } from '../../components/forms/Input';
import { GradientButton } from '../../components/common/GradientButton';
import { colors } from '../../theme/colors';

const budgetSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  limitAmount: z.string().min(1, 'Limit amount is required').refine(val => !isNaN(Number(val)), 'Must be a valid number'),
  period: z.enum(['MONTHLY', 'WEEKLY']),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

export const AddBudgetScreen = () => {
  const navigation = useNavigation();
  const { addBudget, categories } = useStore();
  
  // Only allow budgeting for expense categories
  const expenseCategories = categories.filter(c => c.type === 'EXPENSE');

  const { control, handleSubmit, watch, formState: { errors } } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      categoryId: '',
      limitAmount: '',
      period: 'MONTHLY',
    },
  });

  const onSubmit = (data: BudgetFormData) => {
    addBudget({
      categoryId: data.categoryId,
      limitAmount: parseFloat(data.limitAmount),
      period: data.period,
    });
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h2" style={styles.title}>Create Budget</Typography>

      <Controller
        control={control}
        name="limitAmount"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Budget Limit (₹)"
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={value}
            onChangeText={onChange}
            error={errors.limitAmount?.message}
          />
        )}
      />

      <View style={styles.section}>
        <Typography variant="caption" style={styles.label}>Category</Typography>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <Controller
            control={control}
            name="categoryId"
            render={({ field: { onChange, value } }) => (
              <>
                {expenseCategories.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.chip, value === cat.id && { backgroundColor: cat.color, borderColor: cat.color }]}
                    onPress={() => onChange(cat.id)}
                  >
                    <Ionicons name={cat.icon as any || 'list'} size={16} color={value === cat.id ? colors.white : colors.textMuted} style={styles.chipIcon} />
                    <Typography variant="caption" style={value === cat.id ? styles.chipTextActive : styles.chipText}>{cat.name}</Typography>
                  </TouchableOpacity>
                ))}
              </>
            )}
          />
        </ScrollView>
        {errors.categoryId && <Typography variant="caption" style={styles.errorText}>{errors.categoryId.message}</Typography>}
      </View>

      <Controller
        control={control}
        name="period"
        render={({ field: { onChange, value } }) => (
          <View style={styles.section}>
            <Typography variant="caption" style={styles.label}>Period</Typography>
            <View style={styles.typeSelector}>
              <TouchableOpacity 
                style={[styles.typeButton, value === 'MONTHLY' && styles.typeButtonActive]}
                onPress={() => onChange('MONTHLY')}
              >
                <Typography variant="subtitle" style={value === 'MONTHLY' ? styles.typeTextActive : styles.typeText}>Monthly</Typography>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.typeButton, value === 'WEEKLY' && styles.typeButtonActive]}
                onPress={() => onChange('WEEKLY')}
              >
                <Typography variant="subtitle" style={value === 'WEEKLY' ? styles.typeTextActive : styles.typeText}>Weekly</Typography>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <View style={styles.spacer} />

      <GradientButton
        title="Save Budget"
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
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  typeButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  typeText: {
    color: colors.textMuted,
  },
  typeTextActive: {
    color: colors.white,
    fontWeight: 'bold',
  },
  spacer: {
    height: 32,
  },
});
