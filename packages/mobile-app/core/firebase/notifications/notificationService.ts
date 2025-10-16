import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from '@/core/api';
import i18n from '@/core/i18n';

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
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;

  // Global singleton: Cold start notification'ı işlenmiş mi?
  private coldStartNotificationProcessed: boolean = false;
  private processedNotificationIds: Set<string> = new Set();

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
      // İzin kontrolü hatası
      return false;
    }
  }

  async registerForPushNotifications(guestId?: string): Promise<string | null> {
    try {
      // Simülatörde de token alabiliriz ama gerçek push alamayız
      if (!Device.isDevice) {
        // Removed console statement
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        // Removed console statement
        return null;
      }

      // ProjectId'yi config'den al
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ||
        Constants.easConfig?.projectId;

      if (!projectId) {
        // EAS Project ID not found in config
        return null;
      }

      // Removed console statement

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

      await this.sendTokenToBackend(token, guestId);

      return token;
    } catch (error) {
      // Push notification kayıt hatası
      return null;
    }
  }

  private async sendTokenToBackend(token: string, guestId?: string): Promise<void> {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );

      const currentLanguage = i18n.language || 'en';

      const endpoint = guestId ? '/guest/device-token' : '/users/device-token';
      const payload = guestId
        ? {
            guestId,
            token,
            platform: Platform.OS,
            deviceName: Device.deviceName || 'Unknown Device',
            language: currentLanguage,
          }
        : {
            token,
            platform: Platform.OS,
            deviceName: Device.deviceName || 'Unknown Device',
            language: currentLanguage,
          };

      await Promise.race([
        api.post(endpoint, payload),
        timeoutPromise,
      ]);
      // Removed console statement
    } catch (error) {
      // Token backend gönderim hatası veya timeout
    }
  }

  /**
   * Cold start notification'ı kontrol et ve işle
   * Bu metod sadece bir kez çalıştırılmalı (uygulama başlangıcında)
   */
  async processColdStartNotification(): Promise<{
    hasNotification: boolean;
    notificationId?: string;
    data?: Record<string, unknown>;
  }> {
    // Daha önce işlendiyse tekrar işleme
    if (this.coldStartNotificationProcessed) {
      return { hasNotification: false };
    }

    try {
      const lastNotificationResponse = await Notifications.getLastNotificationResponseAsync();

      if (!lastNotificationResponse) {
        this.coldStartNotificationProcessed = true;
        return { hasNotification: false };
      }

      const notificationId = lastNotificationResponse.notification.request.identifier;
      const data = lastNotificationResponse.notification.request.content.data;

      // Notification'ı işlenmiş olarak işaretle
      this.coldStartNotificationProcessed = true;
      this.processedNotificationIds.add(notificationId);

      // KRITIK: Notification'ı dismiss et ki listener'a tekrar gönderilmesin
      await Notifications.dismissNotificationAsync(lastNotificationResponse.notification.request.identifier);

      return {
        hasNotification: true,
        notificationId,
        data: data as Record<string, unknown>,
      };
    } catch (error) {
      this.coldStartNotificationProcessed = true;
      return { hasNotification: false };
    }
  }

  setupNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationResponse?: (response: Notifications.NotificationResponse) => void
  ): void {
    // Listener'lar zaten kuruluysa tekrar kurma
    if (this.notificationListener || this.responseListener) {
      return;
    }

    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      onNotificationReceived?.(notification);
    });

    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const notificationId = response.notification.request.identifier;

      // Bu notification daha önce işlendiyse (cold start'ta) ignore et
      if (this.processedNotificationIds.has(notificationId)) {
        return;
      }

      // Notification'ı işlenmiş olarak işaretle
      this.processedNotificationIds.add(notificationId);

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

  /**
   * Notification'ın işlenip işlenmediğini kontrol et
   */
  isNotificationProcessed(notificationId: string): boolean {
    return this.processedNotificationIds.has(notificationId);
  }

  /**
   * Tüm processed notification'ları temizle (genelde sadece test için kullanılır)
   */
  clearProcessedNotifications(): void {
    this.processedNotificationIds.clear();
    this.coldStartNotificationProcessed = false;
  }

  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: Record<string, unknown>,
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