import './global.css';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation';
import { useEffect, useState } from 'react';
import { initDatabase, CategoryRepository } from './src/database';
import { View, Text } from 'react-native';
import { colors } from './src/theme/colors';
import { useStore } from './src/store/useStore';
import { PinLockScreen } from './src/features/settings/PinLockScreen';
import { NotificationService } from './src/services/NotificationService';

export default function App() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [securityChecked, setSecurityChecked] = useState(false);
  const { isAppLocked, isUnlockedSession, initializeSecurity } = useStore();

  useEffect(() => {
    const setup = async () => {
      try {
        await initDatabase();
        CategoryRepository.seedDefaults();
        setDbInitialized(true);
        
        await initializeSecurity();
        await NotificationService.requestPermissionsAsync();
        setSecurityChecked(true);
      } catch (e) {
        console.error(e);
      }
    };
    setup();
  }, []);

  if (!dbInitialized || !securityChecked) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text }}>Loading...</Text>
      </View>
    );
  }

  if (isAppLocked && !isUnlockedSession) {
    return (
      <>
        <StatusBar style="light" />
        <PinLockScreen />
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <RootNavigator />
    </>
  );
}
