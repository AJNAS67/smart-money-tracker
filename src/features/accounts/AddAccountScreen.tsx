import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
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
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

const ACCOUNT_TYPES = ['BANK', 'CREDIT_CARD', 'INVESTMENT', 'WALLET', 'OTHER'];

const accountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  type: z.string().min(1, 'Account type is required'),
  customType: z.string().optional(),
  balance: z.string().optional(),
  creditLimit: z.string().optional(),
  billPaymentDate: z.date().optional(),
  dueDate: z.date().optional(),
  bankName: z.string().optional(),
  last4Digits: z.string().optional().refine(val => !val || /^\d{0,4}$/.test(val), 'Must be up to 4 digits'),
  expiryDate: z.string().optional(),
  remarks: z.string().optional(),
});

type AccountFormData = z.infer<typeof accountSchema>;

export const AddAccountScreen = () => {
  const navigation = useNavigation();
  const addAccount = useStore(state => state.addAccount);
  const [showBillDatePicker, setShowBillDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);

  const { control, handleSubmit, watch, formState: { errors }, setError } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      type: 'BANK',
      customType: '',
      balance: '',
      creditLimit: '',
      billPaymentDate: new Date(),
      dueDate: new Date(),
      bankName: '',
      last4Digits: '',
      expiryDate: '',
      remarks: '',
    },
  });

  const selectedType = watch('type');

  const onSubmit = (data: AccountFormData) => {
    if (selectedType === 'CREDIT_CARD' && (!data.creditLimit || isNaN(Number(data.creditLimit)))) {
      setError('creditLimit', { message: 'Credit limit is required and must be a valid number' });
      return;
    }
    if (selectedType !== 'CREDIT_CARD' && (!data.balance || isNaN(Number(data.balance)))) {
      setError('balance', { message: 'Initial balance is required and must be a valid number' });
      return;
    }

    const finalType = data.type === 'OTHER' && data.customType ? data.customType : data.type;
    addAccount({
      name: data.name,
      type: finalType,
      balance: selectedType === 'CREDIT_CARD' ? 0 : parseFloat(data.balance || '0'),
      creditLimit: selectedType === 'CREDIT_CARD' ? parseFloat(data.creditLimit || '0') : undefined,
      billPaymentDate: selectedType === 'CREDIT_CARD' ? data.billPaymentDate?.getTime() : undefined,
      dueDate: selectedType === 'CREDIT_CARD' ? data.dueDate?.getTime() : undefined,
      bankName: data.bankName,
      last4Digits: data.last4Digits,
      expiryDate: data.expiryDate,
      remarks: data.remarks,
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
        name="name"
        render={({ field: { onChange, value } }) => (
          <Input
            label={selectedType === 'CREDIT_CARD' ? "Card Name" : "Account Name"}
            placeholder={selectedType === 'CREDIT_CARD' ? "e.g. Chase Sapphire Reserve" : "e.g. Main Chase Checking"}
            value={value}
            onChangeText={onChange}
            error={errors.name?.message}
          />
        )}
      />

      {selectedType === 'CREDIT_CARD' && (
        <Controller
          control={control}
          name="bankName"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Bank Name"
              placeholder="e.g. Chase Bank"
              value={value || ''}
              onChangeText={onChange}
              error={errors.bankName?.message}
            />
          )}
        />
      )}

      {selectedType !== 'CREDIT_CARD' ? (
        <>
          <Controller
            control={control}
            name="balance"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Initial Balance (₹)"
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={value || ''}
                onChangeText={onChange}
                error={errors.balance?.message}
              />
            )}
          />
        </>
      ) : (
        <>
          <Controller
            control={control}
            name="creditLimit"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Total Credit Limit (₹)"
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={value || ''}
                onChangeText={onChange}
                error={errors.creditLimit?.message}
              />
            )}
          />

          <View style={{ flexDirection: 'row', gap: 16 }}>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="billPaymentDate"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.section}>
                    <Typography variant="caption" style={styles.label}>Bill Date</Typography>
                    <TouchableOpacity 
                      style={styles.dateButton}
                      onPress={() => setShowBillDatePicker(true)}
                    >
                      <Ionicons name="calendar-outline" size={20} color={colors.textMuted} style={styles.chipIcon} />
                      <Typography variant="body" style={{ color: colors.white }}>
                        {value ? value.toLocaleDateString() : 'Select date'}
                      </Typography>
                    </TouchableOpacity>

                    {showBillDatePicker && (
                      <DateTimePicker
                        value={value || new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, selectedDate) => {
                          setShowBillDatePicker(Platform.OS === 'ios');
                          if (selectedDate) {
                            onChange(selectedDate);
                          }
                        }}
                      />
                    )}
                  </View>
                )}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="dueDate"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.section}>
                    <Typography variant="caption" style={styles.label}>Due Date</Typography>
                    <TouchableOpacity 
                      style={styles.dateButton}
                      onPress={() => setShowDueDatePicker(true)}
                    >
                      <Ionicons name="calendar-outline" size={20} color={colors.textMuted} style={styles.chipIcon} />
                      <Typography variant="body" style={{ color: colors.white }}>
                        {value ? value.toLocaleDateString() : 'Select date'}
                      </Typography>
                    </TouchableOpacity>

                    {showDueDatePicker && (
                      <DateTimePicker
                        value={value || new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, selectedDate) => {
                          setShowDueDatePicker(Platform.OS === 'ios');
                          if (selectedDate) {
                            onChange(selectedDate);
                          }
                        }}
                      />
                    )}
                  </View>
                )}
              />
            </View>
          </View>
        </>
      )}

      {(selectedType === 'BANK' || selectedType === 'CREDIT_CARD') && (
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <View style={{ flex: 1 }}>
            <Controller
              control={control}
              name="last4Digits"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Last 4 Digits (Optional)"
                  placeholder="1234"
                  keyboardType="number-pad"
                  maxLength={4}
                  value={value || ''}
                  onChangeText={onChange}
                  error={errors.last4Digits?.message}
                />
              )}
            />
          </View>
          {selectedType === 'CREDIT_CARD' && (
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="expiryDate"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Expiry Date"
                    placeholder="MM/YY"
                    maxLength={5}
                    value={value || ''}
                    onChangeText={text => {
                      let formatted = text.replace(/[^0-9]/g, '');
                      if (formatted.length > 2) {
                        formatted = formatted.substring(0, 2) + '/' + formatted.substring(2, 4);
                      }
                      onChange(formatted);
                    }}
                    error={errors.expiryDate?.message}
                  />
                )}
              />
            </View>
          )}
        </View>
      )}

      <Controller
        control={control}
        name="remarks"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Remarks (Optional)"
            placeholder="Additional notes"
            value={value || ''}
            onChangeText={onChange}
            error={errors.remarks?.message}
          />
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
  section: {
    marginBottom: 24,
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
  chipIcon: {
    marginRight: 8,
  },
});
