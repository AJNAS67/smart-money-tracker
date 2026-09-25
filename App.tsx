import './global.css';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation';
import { useEffect, useState } from 'react';
import { initDatabase, CategoryRepository } from './src/database';
import { View, Text } from 'react-native';
import { colors } from './src/theme/colors';

export default function App() {
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    const setup = async () => {
      try {
        await initDatabase();
        CategoryRepository.seedDefaults();
        setDbInitialized(true);
      } catch (e) {
        console.error(e);
      }
    };
    setup();
  }, []);

  if (!dbInitialized) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text }}>Loading Database...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <RootNavigator />
    </>
  );
}
