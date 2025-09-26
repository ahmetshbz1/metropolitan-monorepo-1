import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from '@/core/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  private static instance: NotificationService;
  private expoPushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async hasNotificationPermission(): Promise<boolean> {
    try {
      const settings = await Notifications.getPermissionsAsync();
      return settings.status === 'granted';
    } catch (error) {
      console.error('İzin kontrolü hatası:', error);
      return false;
    }
  }

  async registerForPushNotifications(): Promise<string | null> {
    try {
      // Simülatörde de token alabiliriz ama gerçek push alamayız
      if (!Device.isDevice) {
        console.log('Push notifications simülatörde test modunda çalışıyor');
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification izni alınamadı');
        return null;
      }

      // ProjectId'yi config'den al
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ||
        Constants.easConfig?.projectId;

      if (!projectId) {
        console.error('EAS Project ID not found in config');
        return null;
      }

      console.log('Using EAS Project ID:', projectId);

      const token = (await Notifications.getExpoPushTokenAsync({
        projectId,
      })).data;

      this.expoPushToken = token;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });
      }

      await this.sendTokenToBackend(token);

      return token;
    } catch (error) {
      console.error('Push notification kayıt hatası:', error);
      return null;
    }
  }

  private async sendTokenToBackend(token: string): Promise<void> {
    try {
      await api.post('/users/device-token', {
        token,
        platform: Platform.OS,
        deviceName: Device.deviceName || 'Unknown Device',
      });
      console.log('Push token backend\'e başarıyla gönderildi');
    } catch (error) {
      console.error('Token backend gönderim hatası:', error);
    }
  }

  setupNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationResponse?: (response: Notifications.NotificationResponse) => void
  ): void {
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Bildirim alındı:', notification);
      onNotificationReceived?.(notification);
    });

    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Bildirim tıklandı:', response);
      onNotificationResponse?.(response);
    });
  }

  removeNotificationListeners(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = null;
    }
    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = null;
    }
  }

  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        badge: 1,
      },
      trigger: trigger || null,
    });
    return id;
  }

  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async setBadgeCount(count: number): Promise<boolean> {
    return await Notifications.setBadgeCountAsync(count);
  }

  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  async ensurePushToken(): Promise<string | null> {
    // Mevcut token varsa döndür
    if (this.expoPushToken) {
      return this.expoPushToken;
    }

    // Token yoksa register et
    return await this.registerForPushNotifications();
  }
}

export default NotificationService.getInstance();