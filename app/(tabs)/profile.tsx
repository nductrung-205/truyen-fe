import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Switch,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { storageService } from '@/services/storageService';
import { authService } from '@/services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '@/types/auth';

interface UserStats {
  totalRead: number;
  totalFavorites: number;
  totalChapters: number;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [userStats, setUserStats] = useState<UserStats>({
    totalRead: 0,
    totalFavorites: 0,
    totalChapters: 0,
  });
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    loadUserStats();
    loadSettings();
  }, []);

  const loadUserStats = async () => {
    try {
      const history = await storageService.getReadingHistory();
      const favorites = await storageService.getFavorites();
      
      // Tính tổng số chapter đã đọc
      const totalChapters = history.reduce((sum, item) => sum + item.lastReadChapter, 0);

      setUserStats({
        totalRead: history.length,
        totalFavorites: favorites.length,
        totalChapters,
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const darkModeSetting = await AsyncStorage.getItem('@dark_mode');
      const notificationsSetting = await AsyncStorage.getItem('@notifications');
      
      if (darkModeSetting !== null) {
        setDarkMode(darkModeSetting === 'true');
      }
      if (notificationsSetting !== null) {
        setNotifications(notificationsSetting === 'true');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleDarkModeToggle = async (value: boolean) => {
    setDarkMode(value);
    await AsyncStorage.setItem('@dark_mode', value.toString());
    // TODO: Apply dark mode theme
    Alert.alert('Thông báo', 'Chế độ tối sẽ được áp dụng trong phiên bản tiếp theo');
  };

  const handleNotificationsToggle = async (value: boolean) => {
    setNotifications(value);
    await AsyncStorage.setItem('@notifications', value.toString());
  };

  const handleClearCache = () => {
    Alert.alert(
      'Xóa bộ nhớ cache',
      'Bạn có chắc muốn xóa toàn bộ dữ liệu cache?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            // TODO: Clear image cache, etc.
            Alert.alert('Thành công', 'Đã xóa bộ nhớ cache');
          },
        },
      ]
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      '⚠️ Xóa toàn bộ dữ liệu',
      'Điều này sẽ xóa lịch sử đọc, yêu thích và tất cả cài đặt. Bạn có chắc chắn?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa tất cả',
          style: 'destructive',
          onPress: async () => {
            await storageService.clearReadingHistory();
            await AsyncStorage.clear();
            loadUserStats();
            Alert.alert('Thành công', 'Đã xóa toàn bộ dữ liệu');
          },
        },
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'Về ứng dụng',
      'Truyện Hay v1.0.0\n\nỨng dụng đọc truyện miễn phí\n\n© 2025 Truyện Hay',
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: 'https://i.pravatar.cc/150?img=68' }}
            style={styles.avatar}
          />
          <View style={styles.editBadge}>
            <Text style={styles.editIcon}>✏️</Text>
          </View>
        </View>
        <Text style={styles.username}>Người dùng</Text>
        <Text style={styles.email}>user@example.com</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userStats.totalRead}</Text>
          <Text style={styles.statLabel}>Đã đọc</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userStats.totalFavorites}</Text>
          <Text style={styles.statLabel}>Yêu thích</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userStats.totalChapters}</Text>
          <Text style={styles.statLabel}>Chương</Text>
        </View>
      </View>

      {/* Reading Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📖 Cài đặt đọc truyện</Text>
        
        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <Text style={styles.menuIcon}>🔤</Text>
          <Text style={styles.menuText}>Cỡ chữ</Text>
          <View style={styles.menuBadge}>
            <Text style={styles.menuBadgeText}>Trung bình</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.menuItem}>
          <Text style={styles.menuIcon}>🌙</Text>
          <Text style={styles.menuText}>Chế độ tối</Text>
          <Switch
            value={darkMode}
            onValueChange={handleDarkModeToggle}
            trackColor={{ false: '#E0E0E0', true: '#81C784' }}
            thumbColor={darkMode ? '#4CAF50' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <Text style={styles.menuIcon}>📱</Text>
          <Text style={styles.menuText}>Hướng đọc</Text>
          <View style={styles.menuBadge}>
            <Text style={styles.menuBadgeText}>Dọc</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* App Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ Cài đặt ứng dụng</Text>
        
        <View style={styles.menuItem}>
          <Text style={styles.menuIcon}>🔔</Text>
          <Text style={styles.menuText}>Thông báo</Text>
          <Switch
            value={notifications}
            onValueChange={handleNotificationsToggle}
            trackColor={{ false: '#E0E0E0', true: '#81C784' }}
            thumbColor={notifications ? '#4CAF50' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleClearCache}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>🗑️</Text>
          <Text style={styles.menuText}>Xóa bộ nhớ cache</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleClearAllData}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>⚠️</Text>
          <Text style={[styles.menuText, { color: '#D32F2F' }]}>
            Xóa toàn bộ dữ liệu
          </Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Other */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Khác</Text>
        
        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <Text style={styles.menuIcon}>⭐</Text>
          <Text style={styles.menuText}>Đánh giá ứng dụng</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <Text style={styles.menuIcon}>💬</Text>
          <Text style={styles.menuText}>Phản hồi</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <Text style={styles.menuIcon}>📄</Text>
          <Text style={styles.menuText}>Điều khoản sử dụng</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
          <Text style={styles.menuIcon}>🔒</Text>
          <Text style={styles.menuText}>Chính sách bảo mật</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleAbout}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>ℹ️</Text>
          <Text style={styles.menuText}>Về ứng dụng</Text>
          <View style={styles.menuBadge}>
            <Text style={styles.menuBadgeText}>v1.0.0</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} activeOpacity={0.7}>
        <Text style={styles.logoutText}>🚪 Đăng xuất</Text>
      </TouchableOpacity>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingTop: 60,
    paddingBottom: 32,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  editIcon: {
    fontSize: 14,
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#E8F5E9',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginTop: -16,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 12,
  },
  section: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    padding: 16,
    paddingBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  menuBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  menuBadgeText: {
    fontSize: 13,
    color: '#666',
  },
  menuArrow: {
    fontSize: 20,
    color: '#ccc',
  },
  logoutButton: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFEBEE',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D32F2F',
  },
  bottomSpacing: {
    height: 32,
  },
});