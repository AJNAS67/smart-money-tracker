import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabs } from './BottomTabs';
import { AddAccountScreen } from '../features/accounts/AddAccountScreen';
import { AddTransactionScreen } from '../features/transactions/AddTransactionScreen';
import { AddBudgetScreen } from '../features/budgets/AddBudgetScreen';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, presentation: 'modal' }}>
        <Stack.Screen name="MainTabs" component={BottomTabs} />
        <Stack.Screen name="AddAccount" component={AddAccountScreen} />
        <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
        <Stack.Screen name="AddBudget" component={AddBudgetScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
