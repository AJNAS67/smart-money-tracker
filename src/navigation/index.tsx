import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { BottomTabs } from './BottomTabs';

export const RootNavigator = () => {
  return (
    <NavigationContainer>
      <BottomTabs />
    </NavigationContainer>
  );
};
