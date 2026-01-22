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

export default function ProfileScreen() {
  const router = useRouter();
  const { activeTheme, toggleTheme, isDarkMode } = useTheme();
  const colors = Colors[activeTheme];

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      checkAuth();
    }, [])
  );

  const checkAuth = async () => {
    try {
      setLoading(true);
      const isAuth = await authService.isAuthenticated();
      if (!isAuth) {
        setUser(null);
      } else {
        const userData = await authService.getStoredUser();
        setUser(userData);
        loadSettings();
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
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

  const handleNotificationsToggle = async (value: boolean) => {
    setNotifications(value);
    await AsyncStorage.setItem('@notifications', value.toString());
  };

  const handleLogout = async () => {
    const performLogout = async () => {
      await authService.logout();
      if (isDarkMode) toggleTheme();
      setUser(null);
      router.replace('/');
    };

    if (Platform.OS === 'web') {
      if (window.confirm("Bạn có chắc muốn đăng xuất?")) performLogout();
    } else {
      Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng xuất', style: 'destructive', onPress: performLogout },
      ]);
    }
  };

  if (loading) return null;

  // Giao diện khi chưa đăng nhập (giữ nguyên logic cũ của bạn nhưng làm gọn)
  if (!user) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.guestHeader, { backgroundColor: colors.primary }]}>
          <View style={styles.guestAvatarPlaceholder}>
            <Text style={{ fontSize: 40 }}>👤</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={styles.guestTitle}>Bấm để đăng nhập</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, marginTop: 20 }]}>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/auth/login')}>
            <Text style={styles.menuIcon}>🔑</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>Đăng nhập / Đăng ký</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Profile - ĐÃ SỬA LỖI LẶP TÊN */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: user.avatarUrl || 'https://i.pravatar.cc/150?img=68' }}
            style={styles.avatar}
          />
          <TouchableOpacity
            style={styles.checkInCircleBtn}
            onPress={() => router.push('/profile/check-in')}
          >
            <Text style={{ fontSize: 12 }}>📅</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.username}>{user.username}</Text>

        <TouchableOpacity
          style={styles.attendanceSmallBtn}
          onPress={() => router.push('/profile/check-in')}
        >
          <Text style={styles.attendanceSmallText}>🎁 Nhận quà hàng ngày</Text>
        </TouchableOpacity>
      </View>

      {/* Settings Sections */}
      <View style={[styles.section, { backgroundColor: colors.card, marginTop: -20 }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>👤 Cá nhân & Thành tích</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/profile/level')}
        >
          <Text style={styles.menuIcon}>⭐</Text>
          <Text style={[styles.menuText, { color: colors.text }]}>Level của tôi & Thống kê</Text>
          <Text style={[styles.menuArrow, { color: colors.textTertiary }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/profile/deposit')}
        >
          <Text style={styles.menuIcon}>💰</Text>
          <Text style={[styles.menuText, { color: colors.text }]}>Ví của tôi (Nạp tiền)</Text>
          <Text style={[styles.menuArrow, { color: colors.textTertiary }]}>›</Text>
        </TouchableOpacity>

         <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/profile/my-reviews')}
        >
          <Text style={styles.menuIcon}>📝</Text>
          <Text style={[styles.menuText, { color: colors.text }]}>Bình luận & Đánh giá của tôi</Text>
          <Text style={[styles.menuArrow, { color: colors.textTertiary }]}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>📖 Giao diện & Thông báo</Text>

        <View style={styles.menuItem}>
          <Text style={styles.menuIcon}>🌙</Text>
          <Text style={[styles.menuText, { color: colors.text }]}>Chế độ tối</Text>
          <Switch
            value={isDarkMode}
            onValueChange={() => toggleTheme()}
            trackColor={{ false: '#E0E0E0', true: '#81C784' }}
            thumbColor={isDarkMode ? '#4CAF50' : '#f4f3f4'}
          />
        </View>

        <View style={[styles.menuItem, { borderTopWidth: 1, borderTopColor: colors.borderLight }]}>
          <Text style={styles.menuIcon}>🔔</Text>
          <Text style={[styles.menuText, { color: colors.text }]}>Thông báo đẩy</Text>
          <Switch
            value={notifications}
            onValueChange={handleNotificationsToggle}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: colors.card, borderColor: colors.dangerLight }]}
        onPress={handleLogout}
      >
        <Text style={[styles.logoutText, { color: colors.danger }]}>🚪 Đăng xuất tài khoản</Text>
      </TouchableOpacity>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 50, alignItems: 'center', paddingHorizontal: 25 },
  guestHeader: { paddingTop: 80, paddingBottom: 40, alignItems: 'center' },
  guestAvatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  guestTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: 'rgba(255,255,255,0.4)' },
  checkInCircleBtn: { position: 'absolute', top: 0, right: -5, backgroundColor: '#FFF', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  username: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 10 },
  attendanceSmallBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20 },
  attendanceSmallText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  section: { marginHorizontal: 16, borderRadius: 15, overflow: 'hidden', marginBottom: 15 },
  sectionTitle: { fontSize: 14, fontWeight: '700', padding: 15, paddingBottom: 5, opacity: 0.6 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 16 },
  menuIcon: { fontSize: 20, marginRight: 15, width: 25, textAlign: 'center' },
  menuText: { flex: 1, fontSize: 16 },
  menuArrow: { fontSize: 18, opacity: 0.3 },
  logoutButton: { marginHorizontal: 16, marginTop: 10, borderRadius: 15, paddingVertical: 15, alignItems: 'center', borderWidth: 1 },
  logoutText: { fontSize: 16, fontWeight: '700' },
  bottomSpacing: { height: 40 },
});