import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { AccountsScreen } from '../features/accounts/AccountsScreen';
import { TransactionsScreen } from '../features/transactions/TransactionsScreen';
import { DashboardScreen } from '../features/dashboard/DashboardScreen';

// Placeholder screens for Phase 2
const PlaceholderScreen = ({ name }: { name: string }) => (
  <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ color: colors.text, fontSize: 24, fontFamily: 'Inter-SemiBold' }}>{name}</Text>
  </View>
);

const Budgets = () => <PlaceholderScreen name="Budgets" />;
const Vaults = () => <PlaceholderScreen name="Vaults" />;

const Tab = createBottomTabNavigator();

export const BottomTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: 'rgba(255,255,255,0.1)',
          borderTopWidth: 1,
          elevation: 0,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'home';
          switch (route.name) {
            case 'Dashboard': iconName = focused ? 'home' : 'home-outline'; break;
            case 'Accounts': iconName = focused ? 'card' : 'card-outline'; break;
            case 'Transactions': iconName = focused ? 'swap-vertical' : 'swap-vertical-outline'; break;
            case 'Budgets': iconName = focused ? 'pie-chart' : 'pie-chart-outline'; break;
            case 'Vaults': iconName = focused ? 'lock-closed' : 'lock-closed-outline'; break;
          }
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Accounts" component={AccountsScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen name="Budgets" component={Budgets} />
      <Tab.Screen name="Vaults" component={Vaults} />
    </Tab.Navigator>
  );
};
