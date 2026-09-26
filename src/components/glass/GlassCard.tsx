import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
  intensity?: number;
  contentStyle?: any;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, intensity = 20, style, contentStyle, ...props }) => {
  return (
    <View style={[styles.container, style]} {...props}>
      <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFillObject} />
      <LinearGradient
        colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.02)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  content: {
    padding: 24,
    position: 'relative',
    zIndex: 1,
  }
});
