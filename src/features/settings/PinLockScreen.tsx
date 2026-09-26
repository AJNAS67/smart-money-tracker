import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useStore } from '../../store/useStore';
import { Typography } from '../../components/common/Typography';
import { colors } from '../../theme/colors';

export const PinLockScreen = () => {
  const { unlockSession } = useStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (pin.length === 4) {
      handleVerify();
    }
  }, [pin]);

  const handleVerify = async () => {
    const success = await unlockSession(pin);
    if (!success) {
      setError(true);
      setPin('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTimeout(() => setError(false), 1000);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(prev => prev.slice(0, -1));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const renderDialButton = (num: string) => (
    <TouchableOpacity
      key={num}
      style={styles.dialButton}
      onPress={() => handleKeyPress(num)}
    >
      <Typography variant="h2" style={styles.dialText}>{num}</Typography>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="lock-closed" size={48} color={error ? colors.danger : colors.primary} />
        <Typography variant="h2" style={[styles.title, error && { color: colors.danger }]}>
          {error ? 'Incorrect PIN' : 'Enter PIN'}
        </Typography>
      </View>

      <View style={styles.pinDotsContainer}>
        {[0, 1, 2, 3].map(i => (
          <View
            key={i}
            style={[
              styles.pinDot,
              pin.length > i && styles.pinDotFilled,
              error && styles.pinDotError
            ]}
          />
        ))}
      </View>

      <View style={styles.dialPad}>
        <View style={styles.dialRow}>
          {['1', '2', '3'].map(renderDialButton)}
        </View>
        <View style={styles.dialRow}>
          {['4', '5', '6'].map(renderDialButton)}
        </View>
        <View style={styles.dialRow}>
          {['7', '8', '9'].map(renderDialButton)}
        </View>
        <View style={styles.dialRow}>
          <View style={styles.dialButtonEmpty} />
          {renderDialButton('0')}
          <TouchableOpacity style={styles.dialButton} onPress={handleDelete}>
            <Ionicons name="backspace-outline" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    marginTop: 16,
    color: colors.white,
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 64,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.textMuted,
    marginHorizontal: 12,
  },
  pinDotFilled: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pinDotError: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  dialPad: {
    width: '100%',
    maxWidth: 320,
  },
  dialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  dialButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialButtonEmpty: {
    width: 72,
    height: 72,
  },
  dialText: {
    color: colors.white,
  },
});
