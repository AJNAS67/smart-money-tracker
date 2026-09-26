import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Account } from '../database/schema';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const NotificationService = {
  requestPermissionsAsync: async () => {
    if (Platform.OS === 'web') return false;
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  },

  scheduleCreditCardReminders: async (accounts: Account[]) => {
    if (Platform.OS === 'web') return;
    
    // First, clear all previously scheduled notifications to avoid duplicates when accounts change
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    const creditCards = accounts.filter(a => a.type === 'CREDIT_CARD' && a.dueDate);
    
    for (const card of creditCards) {
      if (!card.dueDate) continue;
      
      const dueDateObj = new Date(card.dueDate);
      const dueDay = dueDateObj.getDate();
      
      // Calculate target days for reminders based on the due day
      // 15 days before, 13 days before, 3 days before, 2 days before, 1 day before, and the due day
      const reminderOffsets = [15, 13, 3, 2, 1, 0];
      
      for (const offset of reminderOffsets) {
        let reminderDay = dueDay - offset;
        
        // Handle negative days (meaning the reminder should be in the previous month)
        // For simplicity in repeating notifications, if it goes negative, we might 
        // calculate the exact absolute date for the next 2 months.
        
        const now = new Date();
        
        // Schedule for the current month and the next month to ensure continuous reminders
        for (let monthOffset = 0; monthOffset < 2; monthOffset++) {
          const reminderDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, dueDay - offset, 10, 0, 0); // 10:00 AM
          
          // Only schedule if it's in the future
          if (reminderDate.getTime() > now.getTime()) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: 'Credit Card Due Soon! 💳',
                body: `Your ${card.name} bill is due in ${offset === 0 ? 'today' : offset + ' days'} (on the ${dueDay}th).`,
                sound: true,
              },
              trigger: {
                date: reminderDate,
              },
            });
          }
        }
      }
    }
  }
};
