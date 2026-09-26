import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabs } from './BottomTabs';
import { AddAccountScreen } from '../features/accounts/AddAccountScreen';
import { AddTransactionScreen } from '../features/transactions/AddTransactionScreen';
import { AddBudgetScreen } from '../features/budgets/AddBudgetScreen';
import { AddVaultScreen } from '../features/vaults/AddVaultScreen';
import { AddFundsScreen } from '../features/vaults/AddFundsScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, presentation: 'modal' }}>
        <Stack.Screen name="MainTabs" component={BottomTabs} />
        <Stack.Screen name="AddAccount" component={AddAccountScreen} />
        <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
        <Stack.Screen name="AddBudget" component={AddBudgetScreen} />
        <Stack.Screen name="AddVault" component={AddVaultScreen} />
        <Stack.Screen name="AddFunds" component={AddFundsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
