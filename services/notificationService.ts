import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Cấu hình cách thông báo hiển thị khi app đang mở
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    // Thay thế shouldShowAlert bằng 2 dòng dưới đây
    shouldShowBanner: true, // Hiển thị biểu ngữ đẩy xuống từ đỉnh màn hình
    shouldShowList: true,   // Hiển thị trong danh sách trung tâm thông báo
    
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationService = {
  // 1. Xin quyền và lấy Token (Dùng cho thông báo chương mới từ Server)
  registerForPushNotifications: async () => {
    if (!Device.isDevice) return null;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    // Lấy token để gửi lên server (nếu bạn có backend)
    const token = (await Notifications.getExpoPushTokenAsync()).data;

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  },

  // 2. Thông báo chúc mừng thăng cấp (Local Notification)
  notifyLevelUp: async (newLevel: number, rankName: string) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🎉 CHÚC MỪNG THĂNG CẤP!",
        body: `Bạn đã đạt Cấp ${newLevel} - Danh hiệu: ${rankName}. Tiếp tục đọc nhé!`,
        data: { screen: 'Profile' },
        sound: true,
      },
      trigger: null, // Gửi ngay lập tức
    });
  },

  // 3. Nhắc nhở đọc truyện hàng ngày
  scheduleDailyReminder: async () => {
    // Hủy các nhắc nhở cũ để tránh trùng lặp
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Lên lịch thông báo vào 20:00 mỗi ngày
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "📚 Giờ đọc truyện đến rồi!",
        body: "Đừng quên vào khám phá các chương truyện mới hấp dẫn đang chờ bạn nhé.",
        data: { screen: 'Home' },
      },
      trigger: {
        hour: 20,
        minute: 0,
        repeats: true,
      } as Notifications.NotificationTriggerInput,
    });
  },

  // 4. Hủy tất cả thông báo
  cancelAll: async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
};