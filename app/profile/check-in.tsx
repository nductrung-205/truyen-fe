import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Switch,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { storyService } from '@/services/storyService';
import { authService } from '@/services/authService';
import { UserProfile } from '@/types/auth';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

const { width } = Dimensions.get('window');

export default function CheckInScreen() {
  const router = useRouter();
  const { activeTheme } = useTheme();
  const colors = Colors[activeTheme];

  // States
  const [user, setUser] = useState<UserProfile | null>(null);
  const [recommendedStories, setRecommendedStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCheckInLoading, setIsCheckInLoading] = useState(false);
  const [usePoints, setUsePoints] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000); // Tự biến mất sau 3s
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const userData = await authService.getStoredUser();
      setUser(userData);

      const storyRes = await storyService.getHotStories();
      const storyData = storyRes.data.content || storyRes.data.stories || storyRes.data;
      setRecommendedStories(storyData.slice(0, 6));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!user) {
      showToast('Vui lòng đăng nhập để điểm danh', 'error');
      return;
    }

    try {
      setIsCheckInLoading(true);
      const response = await authService.checkIn(user.id);
      const updatedUserFromServer = response.data;

      const oldCoins = user.coins || 0;
      const newCoins = updatedUserFromServer.coins || 0;
      const earned = newCoins - oldCoins;

      setUser(updatedUserFromServer);

      // UI: Hiển thị thông báo thành công
      showToast(`Thành công! +${earned} Xu vào ví 🎉`, 'success');

    } catch (error: any) {
      console.log("Error details:", error.response?.data);

      // Lấy message từ Backend: "Hôm nay bạn đã điểm danh rồi!"
      let errorMessage = 'Có lỗi xảy ra, vui lòng thử lại!';
      if (error.response && error.response.data) {
        errorMessage = error.response.data.message || error.response.data.error || errorMessage;
      }

      // UI: Hiển thị thông báo lỗi trực tiếp trên giao diện
      showToast(errorMessage, 'error');

    } finally {
      setIsCheckInLoading(false);
    }
  };

  const formatViews = (views: number) => {
    if (!views) return '0';
    return views >= 1000 ? (views / 1000).toFixed(1) + 'K' : views.toString();
  };

  // Logic hiển thị chu kỳ 7 ngày
  const renderCheckInDays = () => {
    const streak = user?.checkInStreak || 0;
    // Tính xem đang ở ngày thứ mấy trong chu kỳ 7 ngày (1-7)
    // Nếu streak = 7, 14... thì hiển thị là ngày 7 đã xong
    const currentDayInCycle = streak % 7 === 0 && streak > 0 ? 7 : streak % 7;

    return [1, 2, 3, 4, 5, 6, 7].map((day) => {
      const isPast = day <= currentDayInCycle;
      const isToday = day === (currentDayInCycle + 1) || (currentDayInCycle === 0 && day === 1);
      const isBigReward = day === 7;

      return (
        <View key={day} style={styles.dayBox}>
          <View style={[
            styles.coinCircle,
            { backgroundColor: colors.background, borderColor: isBigReward ? '#FFD700' : colors.border },
            isPast && { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' }
          ]}>
            {isPast ? (
              <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
            ) : (
              <View style={[styles.pBadge, { backgroundColor: isBigReward ? '#FFD700' : colors.primary }]}>
                <Text style={styles.pText}>{isBigReward ? '🎁' : 'X'}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.dayPoints, { color: isBigReward ? '#FFA000' : colors.text }]}>
            {isBigReward ? '+110' : '+10'}
          </Text>
          <Text style={[styles.dayLabel, { color: colors.textTertiary }, isToday && { color: colors.primary, fontWeight: 'bold' }]}>
            Ngày {day}
          </Text>
        </View>
      );
    });
  };

  if (loading && !user) {
    return (
      <View style={[styles.loadingCenter, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    
    <SafeAreaView style={[styles.container, { backgroundColor: colors.primary }]}>
      
      <StatusBar barStyle="light-content" />
      {message && (
        <View style={[
          styles.toastContainer,
          { backgroundColor: message.type === 'success' ? '#4CAF50' : '#FF5252' }
        ]}>
          <Ionicons
            name={message.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
            size={20}
            color="#fff"
          />
          <Text style={styles.toastText}>{message.text}</Text>
        </View>
      )}
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER SECTION */}
        <View style={styles.header}>
          <View style={styles.navBar}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={28} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Trung tâm Phúc lợi</Text>
            <TouchableOpacity>
              <Text style={styles.historyText}>Lịch sử</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.pointsContainer}>
            <View style={styles.pointItem}>
              <Text style={styles.pointLabel}>Ví Xu hiện tại</Text>
              <Text style={styles.pointValue}>{user?.coins || 0} Xu</Text>
            </View>
            <View style={styles.pointItem}>
              <Text style={styles.pointLabel}>Phiếu đọc</Text>
              <Text style={styles.pointValue}>0</Text>
            </View>
          </View>

          <Text style={styles.headerHint}>Dùng Xu để mở khóa chương mới hoặc đổi quà tặng</Text>

          <View style={styles.toggleCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Tự động dùng Xu mở chương</Text>
              <Text style={styles.toggleSub}>Hệ thống sẽ tự trừ 10 Xu khi bạn đọc chương VIP</Text>
            </View>
            <Switch
              value={usePoints}
              onValueChange={setUsePoints}
              trackColor={{ false: 'rgba(255,255,255,0.3)', true: '#fff' }}
              thumbColor={usePoints ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* CONTENT BODY */}
        <View style={[styles.contentBody, { backgroundColor: colors.background }]}>
          {/* TABS */}
          <View style={styles.tabContainer}>
            <View style={styles.tabActive}>
              <Text style={[styles.tabTextActive, { color: colors.text }]}>Phúc lợi</Text>
              <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />
            </View>
            <Text style={[styles.tabText, { color: colors.textTertiary }]}>Nhiệm vụ</Text>
            <Text style={[styles.tabText, { color: colors.textTertiary }]}>Cửa hàng</Text>
          </View>

          {/* CHECK-IN CARD */}
          <View style={[styles.checkInCard, { backgroundColor: colors.card }]}>
            <View style={styles.checkInHeaderRow}>
              <View>
                <Text style={[styles.checkInTitle, { color: colors.text }]}>
                  Chuỗi điểm danh: <Text style={{ color: colors.primary }}>{user?.checkInStreak || 0} ngày</Text>
                </Text>
                <Text style={[styles.checkInSub, { color: colors.textSecondary }]}>Điểm danh liên tiếp 7 ngày để nhận quà lớn!</Text>
              </View>
              <TouchableOpacity
                style={[styles.mainCheckInBtn, { backgroundColor: colors.primary }]}
                onPress={handleCheckIn}
                disabled={isCheckInLoading}
              >
                <Text style={styles.mainCheckInBtnText}>Điểm danh</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysList}>
              {renderCheckInDays()}
            </ScrollView>
          </View>

          {/* RECOMMENDED STORIES */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Truyện hay đề xuất</Text>
            <TouchableOpacity onPress={() => router.push('/')}>
              <Text style={{ color: colors.primary, fontSize: 13 }}>Xem tất cả ›</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 30 }} />
          ) : (
            recommendedStories.map((story) => (
              <TouchableOpacity
                key={story.id}
                style={[styles.storyItem, { backgroundColor: colors.card }]}
                onPress={() => router.push(`/story/${story.id}`)}
              >
                <View style={styles.imageWrapper}>
                  <Image
                    source={{ uri: story.thumbnailUrl || 'https://via.placeholder.com/150' }}
                    style={styles.storyCover}
                    resizeMode="cover"
                  />
                  <View style={[styles.upBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.upText}>HOT</Text>
                  </View>
                </View>

                <View style={styles.storyInfo}>
                  <Text style={[styles.storyName, { color: colors.text }]} numberOfLines={1}>
                    {story.title}
                  </Text>

                  <View style={[styles.chapterBadge, { backgroundColor: colors.primary + '15' }]}>
                    <Text style={[styles.storyChapter, { color: colors.primary }]}>
                      🚀 Chương {story.totalChapters || 0}
                    </Text>
                  </View>

                  <Text style={[styles.storyDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                    {story.description || 'Khám phá ngay bộ truyện hấp dẫn này tại ứng dụng...'}
                  </Text>

                  <View style={styles.viewRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="eye-outline" size={14} color={colors.textTertiary} />
                      <Text style={[styles.viewText, { color: colors.textTertiary }]}>
                        {formatViews(story.views)}
                      </Text>
                    </View>
                    <View style={[styles.metaItem, { marginLeft: 15 }]}>
                      <Ionicons name="star" size={14} color="#FFD700" />
                      <Text style={[styles.viewText, { color: colors.textTertiary }]}>
                        {story.rating?.toFixed(1) || "5.0"}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}

          <View style={{ height: 50 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingBottom: 35, paddingTop: 10 },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  headerTitle: { color: 'white', fontSize: 22, fontWeight: '800' },
  historyText: { color: 'white', fontSize: 14, opacity: 0.9 },
  pointsContainer: { flexDirection: 'row', marginBottom: 15 },
  pointItem: { marginRight: 45 },
  pointLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 4 },
  pointValue: { color: 'white', fontSize: 30, fontWeight: 'bold' },
  headerHint: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 20 },
  toggleCard: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    padding: 15,
    borderRadius: 14,
    alignItems: 'center'
  },
  toggleTitle: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  toggleSub: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 },
  contentBody: { borderTopLeftRadius: 30, borderTopRightRadius: 30, minHeight: width, paddingHorizontal: 20 },
  tabContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 25, marginBottom: 15 },
  tabText: { fontSize: 16, fontWeight: '600' },
  tabActive: { alignItems: 'center' },
  tabTextActive: { fontSize: 16, fontWeight: 'bold' },
  activeIndicator: { width: 24, height: 4, borderRadius: 2, marginTop: 6 },
  checkInCard: {
    borderRadius: 20, padding: 18, marginVertical: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4
  },
  toastContainer: {
    position: 'absolute',
    top: 50, // Điều chỉnh tùy vị trí bạn muốn (hiện trên cùng)
    left: 20,
    right: 20,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  toastText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 14,
  },
  checkInHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mainCheckInBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  mainCheckInBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  checkInTitle: { fontSize: 17, fontWeight: 'bold' },
  checkInSub: { fontSize: 11, marginTop: 3 },
  daysList: { marginTop: 20 },
  dayBox: { alignItems: 'center', marginRight: 15, width: 65 },
  coinCircle: { width: 54, height: 54, borderRadius: 27, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  pBadge: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  pText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  dayPoints: { fontSize: 12, fontWeight: 'bold' },
  dayLabel: { fontSize: 10, marginTop: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 30, marginBottom: 15 },
  sectionTitle: { fontSize: 19, fontWeight: 'bold' },
  storyItem: {
    flexDirection: 'row', marginBottom: 16, borderRadius: 16, padding: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  imageWrapper: { position: 'relative' },
  storyCover: { width: 95, height: 130, borderRadius: 12 },
  upBadge: { position: 'absolute', top: 0, left: 0, paddingHorizontal: 8, paddingVertical: 3, borderTopLeftRadius: 12, borderBottomRightRadius: 12 },
  upText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  storyInfo: { flex: 1, marginLeft: 16, justifyContent: 'space-between', paddingVertical: 2 },
  storyName: { fontSize: 17, fontWeight: 'bold' },
  chapterBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, marginVertical: 5 },
  storyChapter: { fontSize: 12, fontWeight: '700' },
  storyDescription: { fontSize: 13, lineHeight: 19 },
  viewRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  viewText: { fontSize: 12, marginLeft: 5, fontWeight: '600' }
});