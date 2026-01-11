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
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { storageService } from '@/services/storageService';
import { authService } from '@/services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '@/types/auth';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

interface UserStats {
  totalRead: number;
  totalFavorites: number;
  totalChapters: number;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats>({
    totalRead: 0,
    totalFavorites: 0,
    totalChapters: 0,
  });
  const [notifications, setNotifications] = useState(true);
  const { activeTheme, toggleTheme, isDarkMode } = useTheme();
  const colors = Colors[activeTheme];

  useFocusEffect(
    React.useCallback(() => {
      checkAuth();
    }, [])
  );

  const checkAuth = async () => {
    const isAuth = await authService.isAuthenticated();
    if (!isAuth) {
      router.replace('/auth/login');
    } else {
      loadUserData();
    }
  };

  const loadUserData = async () => {
    try {
      setLoading(true);
      const userData = await authService.getStoredUser();
      setUser(userData);
      if (userData) {
        loadUserStats();
        loadSettings();
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const history = await storageService.getReadingHistory();
      const favorites = await storageService.getFavorites();

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
      const notificationsSetting = await AsyncStorage.getItem('@notifications');

      if (notificationsSetting !== null) {
        setNotifications(notificationsSetting === 'true');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleDarkModeToggle = () => {
    toggleTheme();
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

  const handleLogout = () => {
    const performLogout = async () => {
      await authService.logout();
      router.replace('/');
    };

    if (Platform.OS === 'web') {
      const confirmLogout = window.confirm("Bạn có chắc chắn muốn đăng xuất không?");
      if (confirmLogout) {
        performLogout();
      }
    } else {
      Alert.alert(
        'Đăng xuất',
        'Bạn có chắc chắn muốn đăng xuất?',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Đăng xuất', style: 'destructive', onPress: performLogout },
        ]
      );
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Đang tải...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.notLoggedInContainer}>
          <Text style={styles.notLoggedInIcon}>👤</Text>
          <Text style={[styles.notLoggedInTitle, { color: colors.text }]}>Chưa đăng nhập</Text>
          <Text style={[styles.notLoggedInText, { color: colors.textSecondary }]}>
            Đăng nhập để lưu lịch sử đọc và đồng bộ dữ liệu
          </Text>
          <TouchableOpacity
            style={[styles.loginPromptButton, { backgroundColor: colors.blue }]}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginPromptButtonText}>Đăng nhập ngay</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.registerPromptButton, { borderColor: colors.blue }]}
            onPress={() => router.push('/auth/register')}
          >
            <Text style={[styles.registerPromptButtonText, { color: colors.blue }]}>
              Đăng ký tài khoản
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: user.avatarUrl || 'https://i.pravatar.cc/150?img=68' }}
            style={styles.avatar}
          />
          <View style={[styles.editBadge, { borderColor: colors.primary }]}>
            <Text style={styles.editIcon}>✏️</Text>
          </View>
        </View>
        <Text style={styles.username}>{user.username}</Text>
        <Text style={[styles.email, { color: colors.primaryLight }]}>{user.email}</Text>
      </View>

      {/* Stats */}
      <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>{userStats.totalRead}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Đã đọc</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>{userStats.totalFavorites}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Yêu thích</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>{userStats.totalChapters}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Chương</Text>
        </View>
      </View>

      {/* Reading Settings */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>📖 Cài đặt đọc truyện</Text>

        <TouchableOpacity
          style={[styles.menuItem, { borderTopColor: colors.borderLight }]}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>🔤</Text>
          <Text style={[styles.menuText, { color: colors.text }]}>Cỡ chữ</Text>
          <View style={[styles.menuBadge, { backgroundColor: colors.borderLight }]}>
            <Text style={[styles.menuBadgeText, { color: colors.textSecondary }]}>Trung bình</Text>
          </View>
          <Text style={[styles.menuArrow, { color: colors.textTertiary }]}>›</Text>
        </TouchableOpacity>

        <View style={[styles.menuItem, { borderTopColor: colors.borderLight }]}>
          <Text style={styles.menuIcon}>🌙</Text>
          <Text style={[styles.menuText, { color: colors.text }]}>Chế độ tối</Text>
          <Switch
            value={isDarkMode}
            onValueChange={handleDarkModeToggle}
            trackColor={{ false: '#E0E0E0', true: '#81C784' }}
            thumbColor={isDarkMode ? '#4CAF50' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity
          style={[styles.menuItem, { borderTopColor: colors.borderLight }]}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>📱</Text>
          <Text style={[styles.menuText, { color: colors.text }]}>Hướng đọc</Text>
          <View style={[styles.menuBadge, { backgroundColor: colors.borderLight }]}>
            <Text style={[styles.menuBadgeText, { color: colors.textSecondary }]}>Dọc</Text>
          </View>
          <Text style={[styles.menuArrow, { color: colors.textTertiary }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* App Settings */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>⚙️ Cài đặt ứng dụng</Text>

        <View style={[styles.menuItem, { borderTopColor: colors.borderLight }]}>
          <Text style={styles.menuIcon}>🔔</Text>
          <Text style={[styles.menuText, { color: colors.text }]}>Thông báo</Text>
          <Switch
            value={notifications}
            onValueChange={handleNotificationsToggle}
            trackColor={{ false: '#E0E0E0', true: '#81C784' }}
            thumbColor={notifications ? '#4CAF50' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity
          style={[styles.menuItem, { borderTopColor: colors.borderLight }]}
          onPress={handleClearCache}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>🗑️</Text>
          <Text style={[styles.menuText, { color: colors.text }]}>Xóa bộ nhớ cache</Text>
          <Text style={[styles.menuArrow, { color: colors.textTertiary }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, { borderTopColor: colors.borderLight }]}
          onPress={handleClearAllData}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>⚠️</Text>
          <Text style={[styles.menuText, { color: colors.danger }]}>
            Xóa toàn bộ dữ liệu
          </Text>
          <Text style={[styles.menuArrow, { color: colors.textTertiary }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Other */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>📋 Khác</Text>

        <TouchableOpacity
          style={[styles.menuItem, { borderTopColor: colors.borderLight }]}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>⭐</Text>
          <Text style={[styles.menuText, { color: colors.text }]}>Đánh giá ứng dụng</Text>
          <Text style={[styles.menuArrow, { color: colors.textTertiary }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, { borderTopColor: colors.borderLight }]}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>💬</Text>
          <Text style={[styles.menuText, { color: colors.text }]}>Phản hồi</Text>
          <Text style={[styles.menuArrow, { color: colors.textTertiary }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, { borderTopColor: colors.borderLight }]}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>📄</Text>
          <Text style={[styles.menuText, { color: colors.text }]}>Điều khoản sử dụng</Text>
          <Text style={[styles.menuArrow, { color: colors.textTertiary }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, { borderTopColor: colors.borderLight }]}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>🔒</Text>
          <Text style={[styles.menuText, { color: colors.text }]}>Chính sách bảo mật</Text>
          <Text style={[styles.menuArrow, { color: colors.textTertiary }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, { borderTopColor: colors.borderLight }]}
          onPress={handleAbout}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>ℹ️</Text>
          <Text style={[styles.menuText, { color: colors.text }]}>Về ứng dụng</Text>
          <View style={[styles.menuBadge, { backgroundColor: colors.borderLight }]}>
            <Text style={[styles.menuBadgeText, { color: colors.textSecondary }]}>v1.0.0</Text>
          </View>
          <Text style={[styles.menuArrow, { color: colors.textTertiary }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={[styles.logoutButton, {
          backgroundColor: colors.card,
          borderColor: colors.dangerLight
        }]}
        activeOpacity={0.7}
        onPress={handleLogout}
      >
        <Text style={[styles.logoutText, { color: colors.danger }]}>🚪 Đăng xuất</Text>
      </TouchableOpacity>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
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
  },
  statsContainer: {
    flexDirection: 'row',
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
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
  },
  statDivider: {
    width: 1,
    marginHorizontal: 12,
  },
  section: {
    marginTop: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    padding: 16,
    paddingBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
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
  },
  menuBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  menuBadgeText: {
    fontSize: 13,
  },
  menuArrow: {
    fontSize: 20,
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  notLoggedInIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  notLoggedInTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  notLoggedInText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  loginPromptButton: {
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  loginPromptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  registerPromptButton: {
    borderWidth: 1,
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  registerPromptButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});