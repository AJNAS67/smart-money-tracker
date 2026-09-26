import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Switch, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';

import { useStore } from '../../store/useStore';
import { Typography } from '../../components/common/Typography';
import { GlassCard } from '../../components/glass/GlassCard';
import { Input } from '../../components/forms/Input';
import { GradientButton } from '../../components/common/GradientButton';
import { colors } from '../../theme/colors';
import { SettingsService } from '../../services/SettingsService';

export const SettingsScreen = () => {
  const { isAppLocked, hasPinSetup, setAppLock } = useStore();
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const togglePinLock = async (value: boolean) => {
    if (value) {
      setIsSettingPin(true);
    } else {
      // Remove PIN Lock
      Alert.alert(
        'Remove PIN Lock',
        'Are you sure you want to remove the PIN lock?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Remove', 
            style: 'destructive',
            onPress: async () => {
              await setAppLock(null);
            }
          }
        ]
      );
    }
  };

  const handleSavePin = async () => {
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    await setAppLock(pin);
    setIsSettingPin(false);
    setPin('');
    setConfirmPin('');
    setError('');
    Alert.alert('Success', 'PIN lock has been enabled.');
  };

  const handleExportDatabase = async () => {
    try {
      const fileUri = await SettingsService.exportDatabase();
      const canShare = await Sharing.isAvailableAsync();
      
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export MoneyFlow Database'
        });
      } else {
        Alert.alert('Export Successful', `Database saved to: ${fileUri}`);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to export database.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Typography variant="h2" style={styles.title}>Settings</Typography>

      <GlassCard style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="lock-closed" size={24} color={colors.primary} />
          <Typography variant="subtitle" style={styles.sectionTitle}>Security</Typography>
        </View>
        
        <View style={styles.row}>
          <View>
            <Typography style={{ color: colors.text }}>App PIN Lock</Typography>
            <Typography variant="caption" style={{ color: colors.textMuted }}>Require a PIN to open the app</Typography>
          </View>
          <Switch
            value={isAppLocked}
            onValueChange={togglePinLock}
            trackColor={{ false: 'rgba(255,255,255,0.1)', true: colors.primary }}
          />
        </View>

        {isSettingPin && (
          <View style={styles.pinSetupContainer}>
            <Input
              label="Enter PIN (min 4 digits)"
              placeholder="****"
              keyboardType="numeric"
              secureTextEntry
              value={pin}
              onChangeText={setPin}
              maxLength={8}
            />
            <Input
              label="Confirm PIN"
              placeholder="****"
              keyboardType="numeric"
              secureTextEntry
              value={confirmPin}
              onChangeText={setConfirmPin}
              maxLength={8}
            />
            {error ? <Typography variant="caption" style={styles.errorText}>{error}</Typography> : null}
            
            <View style={styles.pinActions}>
              <TouchableOpacity onPress={() => setIsSettingPin(false)} style={styles.cancelBtn}>
                <Typography style={{ color: colors.textMuted }}>Cancel</Typography>
              </TouchableOpacity>
              <GradientButton title="Save PIN" onPress={handleSavePin} style={styles.saveBtn} />
            </View>
          </View>
        )}
      </GlassCard>

      <GlassCard style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="server" size={24} color={colors.secondary} />
          <Typography variant="subtitle" style={styles.sectionTitle}>Data Management</Typography>
        </View>

        <TouchableOpacity style={styles.actionBtn} onPress={handleExportDatabase}>
          <View style={styles.actionBtnContent}>
            <Ionicons name="download-outline" size={20} color={colors.text} />
            <Typography style={styles.actionBtnText}>Export Database Backup</Typography>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
        
        <Typography variant="caption" style={styles.helpText}>
          Export your data as a JSON file to keep it safe or transfer it to another device.
        </Typography>
      </GlassCard>
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
    paddingTop: 60,
  },
  title: {
    marginBottom: 32,
    color: colors.white,
  },
  section: {
    padding: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 12,
  },
  sectionTitle: {
    marginLeft: 12,
    color: colors.white,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pinSetupContainer: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 16,
  },
  errorText: {
    color: colors.danger,
    marginBottom: 16,
  },
  pinActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
  },
  cancelBtn: {
    marginRight: 16,
    padding: 8,
  },
  saveBtn: {
    width: 120,
  },
  actionBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtnText: {
    marginLeft: 12,
    color: colors.text,
  },
  helpText: {
    color: colors.textMuted,
    marginTop: 12,
  },
});
