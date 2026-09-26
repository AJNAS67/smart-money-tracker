import React from 'react';
import { View, StyleSheet, Modal, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from './Typography';
import { colors } from '../../theme/colors';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  description: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBgColor?: string;
  primaryActionLabel: string;
  primaryActionColor?: string;
  onPrimaryAction: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction: () => void;
  children?: React.ReactNode;
}

export const ConfirmModal = ({
  visible,
  title,
  description,
  iconName = 'warning',
  iconColor = '#EF4444',
  iconBgColor = 'rgba(239, 68, 68, 0.15)',
  primaryActionLabel,
  primaryActionColor = '#EF4444',
  onPrimaryAction,
  secondaryActionLabel = 'Cancel',
  onSecondaryAction,
  children
}: ConfirmModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onSecondaryAction}
    >
      <TouchableWithoutFeedback onPress={onSecondaryAction}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.bottomSheetContent}>
              <View style={styles.bottomSheetCard}>
                
                {/* Warning Indicator */}
                <View style={[styles.modalIconContainer, { backgroundColor: iconBgColor }]}>
                  <Ionicons name={iconName} size={28} color={iconColor} />
                </View>
                
                {/* Micro-copy */}
                <Typography variant="h3" color={colors.white} style={styles.modalTitle}>{title}</Typography>
                <Typography variant="body" align="center" style={styles.modalText}>
                  {description}
                </Typography>

                {/* Custom Content (e.g. Preview Cards) */}
                {children}
                
                {/* Action Buttons */}
                <View style={styles.modalActionsVertical}>
                  <TouchableOpacity 
                    style={[styles.modalButtonPrimary, { backgroundColor: primaryActionColor, shadowColor: primaryActionColor }]}
                    onPress={onPrimaryAction}
                  >
                    <Typography variant="body" style={{ color: colors.white, fontWeight: 'bold' }}>{primaryActionLabel}</Typography>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.modalButtonSecondary}
                    onPress={onSecondaryAction}
                  >
                    <Typography variant="body" style={{ color: colors.white }}>{secondaryActionLabel}</Typography>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  bottomSheetContent: {
    width: '100%',
    padding: 16,
    paddingBottom: 32,
  },
  bottomSheetCard: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D3748',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  modalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  modalText: {
    color: colors.textMuted,
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  modalActionsVertical: {
    width: '100%',
    gap: 12,
  },
  modalButtonPrimary: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalButtonSecondary: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
});
