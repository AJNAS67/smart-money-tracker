import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useStore } from '../../store/useStore';
import { TransactionType } from '../../database/schema';
import { Typography } from '../../components/common/Typography';
import { Input } from '../../components/forms/Input';
import { GradientButton } from '../../components/common/GradientButton';
import { colors } from '../../theme/colors';

const transactionSchema = z.object({
  amount: z.string().min(1, 'Amount is required').refine(val => !isNaN(Number(val)), 'Must be a valid number'),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  categoryId: z.string().min(1, 'Category is required'),
  accountId: z.string().min(1, 'Account is required'),
  note: z.string().optional(),
  date: z.date(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

export const AddTransactionScreen = () => {
  const navigation = useNavigation();
  const { addTransaction, categories, accounts, budgets, transactions, refreshBudgets, refreshTransactions } = useStore();
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    refreshBudgets();
    refreshTransactions();
  }, []);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: '',
      type: 'EXPENSE',
      categoryId: '',
      accountId: accounts[0]?.id || '',
      note: '',
      date: new Date(),
    },
  });

  const selectedType = watch('type');
  const filteredCategories = categories.filter(c => c.type === selectedType);

  const onSubmit = (data: TransactionFormData) => {
    if (data.type === 'EXPENSE' && data.categoryId) {
      const budget = budgets.find(b => b.categoryId === data.categoryId);
      if (budget) {
        const currentMonth = data.date.getMonth();
        const currentYear = data.date.getFullYear();
        
        const spentAmount = transactions
          .filter(t => {
            const d = new Date(t.date);
            return t.categoryId === data.categoryId 
              && t.type === 'EXPENSE'
              && d.getMonth() === currentMonth 
              && d.getFullYear() === currentYear;
          })
          .reduce((sum, t) => sum + t.amount, 0);

        const newAmount = parseFloat(data.amount);
        const newTotal = spentAmount + newAmount;

        if (newTotal > budget.limitAmount) {
          const cat = categories.find(c => c.id === data.categoryId);
          
          Alert.alert(
            "Budget Limit Exceeded",
            `You have a budget of ₹${budget.limitAmount} for ${cat?.name || 'this category'}.\n\nYou have already spent ₹${spentAmount}. Adding this transaction will exceed your budget by ₹${newTotal - budget.limitAmount}.\n\nAre you sure you want to add this transaction?`,
            [
              { text: "Cancel", style: "cancel" },
              { 
                text: "Add Anyway", 
                style: "destructive",
                onPress: () => saveTransaction(data)
              }
            ]
          );
          return;
        }
      }
    }
    
    saveTransaction(data);
  };

  const saveTransaction = (data: TransactionFormData) => {
    addTransaction({
      amount: parseFloat(data.amount),
      type: data.type as TransactionType,
      categoryId: data.categoryId,
      accountId: data.accountId,
      note: data.note,
      date: data.date.getTime(),
    });
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h2" style={styles.title}>Add Transaction</Typography>

      <Controller
        control={control}
        name="type"
        render={({ field: { onChange, value } }) => (
          <View style={styles.typeSelector}>
            <TouchableOpacity 
              style={[styles.typeButton, value === 'EXPENSE' && styles.typeButtonActive]}
              onPress={() => {
                onChange('EXPENSE');
                setValue('categoryId', ''); // Reset category
              }}
            >
              <Typography variant="subtitle" style={value === 'EXPENSE' ? styles.typeTextActive : styles.typeText}>Expense</Typography>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.typeButton, value === 'INCOME' && styles.typeButtonActive]}
              onPress={() => {
                onChange('INCOME');
                setValue('categoryId', ''); // Reset category
              }}
            >
              <Typography variant="subtitle" style={value === 'INCOME' ? styles.typeTextActive : styles.typeText}>Income</Typography>
            </TouchableOpacity>
          </View>
        )}
      />

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
        <Typography variant="caption" style={styles.label}>Account</Typography>
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
                    <Typography variant="caption" style={value === account.id ? styles.chipTextActive : styles.chipText}>{account.name}</Typography>
                  </TouchableOpacity>
                ))}
              </>
            )}
          />
        </ScrollView>
        {errors.accountId && <Typography variant="caption" style={styles.errorText}>{errors.accountId.message}</Typography>}
      </View>

      <View style={styles.section}>
        <Typography variant="caption" style={styles.label}>Category</Typography>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <Controller
            control={control}
            name="categoryId"
            render={({ field: { onChange, value } }) => (
              <>
                {filteredCategories.map(cat => (
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
        name="note"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Note (Optional)"
            placeholder="e.g. Grocery shopping"
            value={value}
            onChangeText={onChange}
            error={errors.note?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="date"
        render={({ field: { onChange, value } }) => (
          <View style={styles.section}>
            <Typography variant="caption" style={styles.label}>Date</Typography>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.textMuted} style={styles.chipIcon} />
              <Typography variant="body" style={{ color: colors.white }}>
                {value.toLocaleDateString()}
              </Typography>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={value}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()} // Cannot select future date
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    onChange(selectedDate);
                  }
                }}
              />
            )}
          </View>
        )}
      />

      <View style={styles.spacer} />

      <GradientButton
        title="Save Transaction"
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
    marginBottom: 24,
    color: colors.white,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
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
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  spacer: {
    height: 32,
  },
});
