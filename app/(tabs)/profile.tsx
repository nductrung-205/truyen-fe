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
  Dimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { storageService } from '@/services/storageService';
import { authService } from '@/services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '@/types/auth';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { notificationService } from '@/services/notificationService';

const { width } = Dimensions.get('window');

// Cấu hình hệ thống cấp độ
const CHAPTERS_PER_LEVEL = 5;

// Hàm lấy danh hiệu dựa trên cấp độ
const getRankName = (level: number) => {
  if (level >= 100) return 'Độc Giả Thần Thánh';
  if (level >= 50) return 'Chí Tôn Truyện';
  if (level >= 20) return 'Đại Hiền Giả';
  if (level >= 10) return 'Bậc Thầy Đọc Truyện';
  if (level >= 2) return 'Mọt Sách Chính Hiệu';
  return 'Tân Thủ';
};

interface UserStats {
  totalRead: number;
  totalFavorites: number;
  totalChapters: number;
  level: number;
  expProgress: number; // 0 to 1
  remainingExp: number;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { activeTheme, toggleTheme, isDarkMode } = useTheme();
  const colors = Colors[activeTheme];

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [userStats, setUserStats] = useState<UserStats>({
    totalRead: 0,
    totalFavorites: 0,
    totalChapters: 0,
    level: 1,
    expProgress: 0,
    remainingExp: CHAPTERS_PER_LEVEL,
  });

  // Load lại dữ liệu mỗi khi quay lại màn hình này
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
        if (userData) {
          await Promise.all([loadUserStats(), loadSettings()]);
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      // 1. Lấy lịch sử và yêu thích để hiển thị số lượng truyện
      const history = await storageService.getReadingHistory();
      const favorites = await storageService.getFavorites();

      // 2. Lấy số chương tích lũy TRỌN ĐỜI để tính Level
      const lifetimeStats = await storageService.getLifetimeStats();
      const totalChapters = lifetimeStats.totalChaptersRead;

      // Tính toán Level và EXP dựa trên số trọn đời
      const level = Math.floor(totalChapters / CHAPTERS_PER_LEVEL) + 1;
      const currentLevelExp = totalChapters % CHAPTERS_PER_LEVEL;
      const expProgress = currentLevelExp / CHAPTERS_PER_LEVEL;
      const remainingExp = CHAPTERS_PER_LEVEL - currentLevelExp;

      // Đếm số truyện duy nhất trong lịch sử (để hiển thị "Truyện đã đọc")
      // Nếu bạn muốn số truyện này cũng không mất khi xóa history, 
      // bạn cũng nên lưu totalStoriesRead vào LifetimeStats.
      const uniqueStoriesCount = new Set(history.map(h => h.storyId)).size;

      setUserStats({
        totalRead: uniqueStoriesCount, // Số truyện hiện có trong lịch sử
        totalFavorites: favorites.length,
        totalChapters, // Con số này sẽ không bị mất khi xóa lịch sử
        level,
        expProgress,
        remainingExp,
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

  const handleDarkModeToggle = () => toggleTheme();

  const handleNotificationsToggle = async (value: boolean) => {
    setNotifications(value);
    await AsyncStorage.setItem('@notifications', value.toString());
  };

  const handleClearCache = () => {
    Alert.alert('Xóa bộ nhớ cache', 'Dữ liệu tạm thời sẽ được làm sạch.', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => Alert.alert('Thành công', 'Đã xóa bộ nhớ cache') },
    ]);
  };

  const handleClearAllData = () => {
    Alert.alert('⚠️ Xóa toàn bộ dữ liệu', 'Tất cả lịch sử và yêu thích sẽ mất. Bạn chắc chứ?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa tất cả',
        style: 'destructive',
        onPress: async () => {
          await storageService.clearReadingHistory();
          await AsyncStorage.clear();
          loadUserStats();
          Alert.alert('Thành công', 'Dữ liệu đã được xóa sạch');
        },
      },
    ]);
  };

  const handleLogout = async () => {
    const performLogout = async () => {
      try {
        if (isDarkMode) toggleTheme();

        // 1. Xóa thông tin auth (token, user info)
        await authService.logout();

        // 2. QUAN TRỌNG: Xóa dữ liệu đọc truyện local nếu bạn không muốn dùng chung
        // Bạn cần thêm hàm clearLifetimeStats vào storageService nếu chưa có
        await storageService.clearReadingHistory();
        await AsyncStorage.removeItem('@lifetime_stats'); // Xóa chỉ số cấp độ

        setUser(null);
        router.replace('/');
      } catch (error) {
        console.error("Logout error:", error);
      }
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

  // 1. MÀN HÌNH ĐANG TẢI
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Đang tải thông tin...</Text>
      </View>
    );
  }

  // 2. MÀN HÌNH CHƯA ĐĂNG NHẬP
  if (!user) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header với avatar placeholder */}
        <View style={[styles.guestHeader, { backgroundColor: colors.card }]}>
          <View style={styles.guestAvatarContainer}>
            <View style={[styles.guestAvatarPlaceholder, { backgroundColor: colors.border }]}>
              <Text style={styles.guestAvatarIcon}>👤</Text>
            </View>
          </View>
          <Text style={[styles.guestTitle, { color: colors.text }]}>Bấm để đăng nhập</Text>
          <TouchableOpacity
            style={[styles.attendanceButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.attendanceButtonText}>📋 Điểm danh</Text>
          </TouchableOpacity>
        </View>

        {/* Stats placeholder */}
        <View style={[styles.guestStatsContainer, { backgroundColor: colors.card }]}>
          <View style={styles.guestStatItem}>
            <Text style={[styles.guestStatNumber, { color: colors.textSecondary }]}>-</Text>
            <Text style={[styles.guestStatLabel, { color: colors.textSecondary }]}>Xu của tôi</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.guestStatItem}>
            <Text style={[styles.guestStatNumber, { color: colors.textSecondary }]}>-</Text>
            <Text style={[styles.guestStatLabel, { color: colors.textSecondary }]}>Điểm của tôi</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.guestStatItem}>
            <Text style={[styles.guestStatNumber, { color: colors.textSecondary }]}>-</Text>
            <Text style={[styles.guestStatLabel, { color: colors.textSecondary }]}>Phiếu</Text>
          </View>
        </View>

        {/* Feature Grid */}
        <View style={styles.featureGrid}>
          <TouchableOpacity 
            style={[styles.featureItem, { backgroundColor: colors.card }]}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.featureIcon}>📚</Text>
            <Text style={[styles.featureText, { color: colors.text }]}>Trở Thành Tác Giả</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.featureItem, { backgroundColor: colors.card }]}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.featureIcon}>➕</Text>
            <Text style={[styles.featureText, { color: colors.text }]}>Phúc Lợi</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.featureItem, { backgroundColor: colors.card }]}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.featureIcon}>📖</Text>
            <Text style={[styles.featureText, { color: colors.text }]}>Sáng Tác Tiểu Thuyết</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.featureItem, { backgroundColor: colors.card }]}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.featureIcon}>💬</Text>
            <Text style={[styles.featureText, { color: colors.text }]}>Sáng Tác Truyện Chat</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <TouchableOpacity 
            style={styles.guestMenuItem}
            onPress={() => router.push('/auth/forgot-password')}
          >
            <Text style={styles.menuIcon}>🛒</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>Quên mật khẩu</Text>            
            <Text style={[styles.menuArrow, { color: colors.textTertiary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.guestMenuItem}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.menuIcon}>🛒</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>Toon Mall</Text>            
            <Text style={[styles.menuArrow, { color: colors.textTertiary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.guestMenuItem, { borderTopWidth: 1, borderTopColor: colors.borderLight }]}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.menuIcon}>👑</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>VIP</Text>
            <Text style={[styles.menuArrow, { color: colors.textTertiary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.guestMenuItem, { borderTopWidth: 1, borderTopColor: colors.borderLight }]}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.menuIcon}>🔍</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>Tìm tiểu thuyết trên Internet</Text>
            <View style={styles.redDot} />
            <Text style={[styles.menuArrow, { color: colors.textTertiary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.guestMenuItem, { borderTopWidth: 1, borderTopColor: colors.borderLight }]}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.menuIcon}>💰</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>Nạp tiền</Text>
            <Text style={[styles.menuArrow, { color: colors.textTertiary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Reading Features Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <TouchableOpacity 
            style={styles.guestMenuItem}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.menuIcon}>📱</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>Phiếu đọc truyện của tôi</Text>
            <Text style={[styles.menuArrow, { color: colors.textTertiary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.guestMenuItem, { borderTopWidth: 1, borderTopColor: colors.borderLight }]}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.menuIcon}>🎭</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>Khung avatar của tôi</Text>
            <Text style={[styles.menuArrow, { color: colors.textTertiary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.guestMenuItem, { borderTopWidth: 1, borderTopColor: colors.borderLight }]}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.menuIcon}>🎨</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>Sticker của tôi</Text>
            <Text style={[styles.menuArrow, { color: colors.textTertiary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.guestMenuItem, { borderTopWidth: 1, borderTopColor: colors.borderLight }]}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.menuIcon}>⭐</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>Level của tôi</Text>
            <Text style={[styles.menuArrow, { color: colors.textTertiary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Settings Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.guestMenuItem}>
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
            style={[styles.guestMenuItem, { borderTopWidth: 1, borderTopColor: colors.borderLight }]}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.menuIcon}>💬</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>Bình luận của tôi</Text>
            <Text style={[styles.menuArrow, { color: colors.textTertiary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.guestMenuItem, { borderTopWidth: 1, borderTopColor: colors.borderLight }]}
          >
            <Text style={styles.menuIcon}>❓</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>Phản hồi ý kiến</Text>
            <Text style={[styles.menuArrow, { color: colors.textTertiary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.guestMenuItem, { borderTopWidth: 1, borderTopColor: colors.borderLight }]}
          >
            <Text style={styles.menuIcon}>ℹ️</Text>
            <Text style={[styles.menuText, { color: colors.text }]}>Giới thiệu chúng tôi</Text>
            <Text style={[styles.menuArrow, { color: colors.textTertiary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Login Prompt at Bottom */}
        <View style={[styles.loginPromptSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.loginPromptTitle, { color: colors.text }]}>
            Đăng nhập để trải nghiệm đầy đủ tính năng
          </Text>
          <Text style={[styles.loginPromptDesc, { color: colors.textSecondary }]}>
            Hệ thống cấp độ, lưu lịch sử đọc, đồng bộ dữ liệu và nhiều tính năng khác
          </Text>
          <TouchableOpacity
            style={[styles.loginPromptButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginPromptButtonText}>Đăng nhập ngay</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.registerPromptButton, { borderColor: colors.primary }]}
            onPress={() => router.push('/auth/register')}
          >
            <Text style={[styles.registerPromptButtonText, { color: colors.primary }]}>
              Đăng ký tài khoản mới
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    );
  }

  // 3. MÀN HÌNH ĐÃ ĐĂNG NHẬP (CÓ HỆ THỐNG CẤP ĐỘ)
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Profile + Level System */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: user.avatarUrl || 'https://i.pravatar.cc/150?img=68' }}
            style={styles.avatar}
          />
          <View style={[styles.levelBadge, { backgroundColor: '#FFD700', borderColor: colors.primary }]}>
            <Text style={styles.levelBadgeText}>{userStats.level}</Text>
          </View>
        </View>

        <Text style={styles.username}>{user.username}</Text>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{getRankName(userStats.level)}</Text>
        </View>

        {/* Experience Bar Area */}
        <View style={styles.expWrapper}>
          <View style={styles.expInfo}>
            <Text style={styles.expLabel}>Tiến trình cấp {userStats.level}</Text>
            <Text style={styles.expValue}>{Math.floor(userStats.expProgress * 100)}%</Text>
          </View>
          <View style={styles.expBarBg}>
            <View
              style={[
                styles.expBarFill,
                { width: `${userStats.expProgress * 100}%` }
              ]}
            />
          </View>
          <Text style={styles.expSubText}>Còn {userStats.remainingExp} chương để lên cấp tiếp theo</Text>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>{userStats.totalRead}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Truyện đọc</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>{userStats.totalFavorites}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Yêu thích</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>{userStats.totalChapters}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Tổng chương</Text>
        </View>
      </View>

      {/* Settings Sections */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>📖 Cài đặt đọc & Giao diện</Text>

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
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>⚙️ Hệ thống</Text>

        <TouchableOpacity style={styles.menuItem} onPress={handleClearCache}>
          <Text style={styles.menuIcon}>🗑️</Text>
          <Text style={[styles.menuText, { color: colors.text }]}>Xóa bộ nhớ cache</Text>
          <Text style={[styles.menuArrow, { color: colors.textTertiary }]}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, { borderTopColor: colors.borderLight }]}
          onPress={handleClearAllData}
        >
          <Text style={styles.menuIcon}>⚠️</Text>
          <Text style={[styles.menuText, { color: colors.danger }]}>Xóa toàn bộ dữ liệu</Text>
          <Text style={[styles.menuArrow, { color: colors.textTertiary }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  guestHeader: {
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  guestAvatarContainer: {
    marginBottom: 15,
  },
  guestAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestAvatarIcon: {
    fontSize: 40,
  },
  guestTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 15,
  },
  attendanceButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  attendanceButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  guestStatsContainer: {
    flexDirection: 'row',
    marginTop: 15,
    marginHorizontal: 16,
    borderRadius: 15,
    padding: 20,
  },
  guestStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  guestStatNumber: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  guestStatLabel: {
    fontSize: 12,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    marginTop: 10,
  },
  featureItem: {
    width: (width - 48) / 2,
    margin: 8,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  guestMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5252',
    marginRight: 10,
  },
  loginPromptSection: {
    margin: 16,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  loginPromptTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  loginPromptDesc: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },

  // Header styles
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  levelBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  levelBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  username: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 5,
  },
  rankBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 20,
  },
  rankText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  // EXP Bar styles
  expWrapper: {
    width: '100%',
    paddingHorizontal: 10,
  },
  expInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  expLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  expValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  expBarBg: {
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  expBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 5,
  },
  expSubText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Stats styles
  statsContainer: {
    flexDirection: 'row',
    marginTop: -20,
    marginHorizontal: 16,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 12 },
  statDivider: { width: 1, height: '70%', alignSelf: 'center', marginHorizontal: 5 },

  // Sections styles
  section: {
    marginTop: 20,
    borderRadius: 15,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    padding: 16,
    paddingBottom: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  menuIcon: { fontSize: 20, marginRight: 15, width: 25, textAlign: 'center' },
  menuText: { flex: 1, fontSize: 16 },
  menuArrow: { fontSize: 20, opacity: 0.5 },

  // Logout button
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 25,
    borderRadius: 15,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  logoutText: { fontSize: 16, fontWeight: '700' },
  bottomSpacing: { height: 50 },

  // Not Logged In styles
  notLoggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  notLoggedInIcon: { fontSize: 100, marginBottom: 20, opacity: 0.2 },
  notLoggedInTitle: { fontSize: 26, fontWeight: '800', marginBottom: 10 },
  notLoggedInText: { fontSize: 15, textAlign: 'center', marginBottom: 30, lineHeight: 24 },
  loginPromptButton: { width: '100%', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginBottom: 15 },
  loginPromptButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  registerPromptButton: { width: '100%', paddingVertical: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1.5 },
  registerPromptButtonText: { fontSize: 16, fontWeight: '700' },
});