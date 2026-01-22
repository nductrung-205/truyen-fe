import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Modal,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { chapterService } from '@/services/chapterService';
import { storageService } from '@/services/storageService';
import { authService } from '@/services/authService';
import { ChapterDetail } from '@/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type FontSize = 'small' | 'medium' | 'large' | 'xlarge';
type Theme = 'light' | 'dark' | 'sepia';

const FONT_SIZES = { small: 14, medium: 16, large: 18, xlarge: 20 };
const THEMES = {
  light: { background: '#FFFFFF', text: '#333333', controlBg: '#F8F9FA', name: 'Sáng' },
  dark: { background: '#121212', text: '#E0E0E0', controlBg: '#1E1E1E', name: 'Tối' },
  sepia: { background: '#F4ECD8', text: '#5F4B32', controlBg: '#E8DDC3', name: 'Nâu' },
};

export default function ChapterReaderScreen() {
  const { storyId, chapterNumber } = useLocalSearchParams<{ storyId: string; chapterNumber: string }>();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  const [loading, setLoading] = useState(true);
  const [chapter, setChapter] = useState<ChapterDetail | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [theme, setTheme] = useState<Theme>('light');
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    loadChapter();
  }, [storyId, chapterNumber]);

  const loadChapter = async () => {
    try {
      setLoading(true);
      const storedUser = await authService.getStoredUser();
      setUser(storedUser);

      const response = await chapterService.getChapterContent(
        parseInt(storyId),
        parseInt(chapterNumber),
        storedUser?.id
      );
      setChapter(response.data);
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể tải nội dung chương');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    console.log("Nút mở khóa đã được nhấn!"); // Kiểm tra xem nút có ăn không

    if (!user) {
      alert("Vui lòng đăng nhập để mua chương!"); // Dùng alert() của trình duyệt cho web
      return;
    }

    console.log("Thông tin mở khóa:", { storyId, chapterId: chapter?.id, userId: user.id });

    // Xử lý xác nhận cho Web và Mobile
    const confirmMessage = `Dùng 10 xu để mở khóa chương này? (Số dư: ${user.coins} xu)`;

    const proceedUnlock = async () => {
      try {
        setLoading(true);

        // 1. Gọi API mở khóa chương (Trừ xu trong DB)
        await chapterService.unlockChapter(parseInt(storyId), chapter!.id, user.id);
        console.log("Mở khóa thành công từ API!");

        // 2. Lấy thông tin User mới nhất từ server (Lấy số dư xu mới)
        const userResponse = await authService.getCurrentUser(user.id);
        const updatedUser = userResponse.data;

        // 3. Cập nhật vào bộ nhớ máy (AsyncStorage) để các màn hình khác (như Profile) cũng thấy thay đổi
        await authService.saveUser(updatedUser);

        // 4. Cập nhật vào State của màn hình hiện tại để câu confirm tiếp theo hiện đúng số xu
        setUser(updatedUser);

        // 5. Load lại nội dung chương (Server bây giờ sẽ trả về content vì đã mua)
        await loadChapter();

        alert("Mở khóa thành công!");
      } catch (e: any) {
        console.error("Lỗi khi mở khóa:", e.response?.data || e.message);
        alert(e.response?.data || "Số dư không đủ hoặc có lỗi xảy ra!");
      } finally {
        setLoading(false);
      }
    };

    // Nếu là Web dùng confirm(), nếu là App dùng Alert.alert()
    if (Platform.OS === 'web') {
      if (window.confirm(confirmMessage)) {
        proceedUnlock();
      }
    } else {
      Alert.alert("Mở khóa chương", confirmMessage, [
        { text: "Hủy", style: "cancel" },
        { text: "Mua ngay", onPress: proceedUnlock }
      ]);
    }
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!chapter) return;
    const target = direction === 'prev' ? chapter.previousChapter : chapter.nextChapter;
    if (target) router.replace(`/chapter/${storyId}/${target}`);
    else Alert.alert('Thông báo', 'Đây là chương đầu/cuối của truyện');
  };

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const progress = contentOffset.y / (contentSize.height - layoutMeasurement.height);
    setScrollProgress(Math.max(0, Math.min(1, progress || 0)));
  };

  if (loading) return <LoadingSpinner text="Đang tải..." />;
  const currentTheme = THEMES[theme];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* --- HEADER --- */}
      {showControls && (
        <View style={[styles.header, { backgroundColor: currentTheme.controlBg }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="chevron-back" size={28} color={currentTheme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: currentTheme.text }]} numberOfLines={1}>
            Chương {chapter?.chapterNumber}
          </Text>
          <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.headerBtn}>
            <Ionicons name="settings-outline" size={24} color={currentTheme.text} />
          </TouchableOpacity>
        </View>
      )}

      {/* --- PROGRESS BAR --- */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarActive, { width: `${scrollProgress * 100}%` }]} />
      </View>

      {/* --- MAIN CONTENT --- */}
      {chapter?.locked ? (
        // GIAO DIỆN KHI CHƯƠNG BỊ KHÓA (VIP)
        <View style={styles.lockedContainer}>
          <Ionicons name="lock-closed" size={100} color="#999" />
          <Text style={[styles.lockedTitle, { color: currentTheme.text }]}>Chương này là nội dung VIP</Text>
          <Text style={styles.lockedSub}>Bạn cần mở khóa để tiếp tục đọc câu chuyện này</Text>

          <TouchableOpacity style={styles.unlockButton} onPress={handleUnlock}>
            <Text style={styles.unlockButtonText}>Mở khóa ngay (10 xu) 🔓</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
            <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // GIAO DIỆN ĐỌC CHƯƠNG BÌNH THƯỜNG
        <ScrollView
          ref={scrollViewRef}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onTouchEnd={() => setShowControls(!showControls)}
          contentContainerStyle={styles.scrollContent}
        >
          {chapter && (
            <>
              <Text style={[styles.contentTitle, { color: currentTheme.text }]}>
                Chương {chapter.chapterNumber}: {chapter.title}
              </Text>
              <View style={styles.metaRow}>
                <Text style={{ color: currentTheme.text, opacity: 0.6 }}>👁 {chapter.views} lượt xem</Text>
                <Text style={{ color: currentTheme.text, opacity: 0.6 }}>📅 {new Date(chapter.updatedAt).toLocaleDateString('vi-VN')}</Text>
              </View>

              <View style={[styles.divider, { backgroundColor: currentTheme.text, opacity: 0.1 }]} />

              <Text style={[styles.contentText, {
                fontSize: FONT_SIZES[fontSize],
                color: currentTheme.text,
                lineHeight: FONT_SIZES[fontSize] * 1.8
              }]}>
                {stripHtml(chapter.content)}
              </Text>

              <View style={[styles.divider, { backgroundColor: currentTheme.text, opacity: 0.1 }]} />
              <Text style={[styles.endText, { color: currentTheme.text }]}>--- Hết chương ---</Text>
            </>
          )}
        </ScrollView>
      )}

      {/* --- BOTTOM NAVIGATION --- */}
      {showControls && !chapter?.locked && (
        <View style={[styles.bottomNav, { backgroundColor: currentTheme.controlBg }]}>
          <TouchableOpacity
            style={[styles.navBtn, !chapter?.previousChapter && styles.disabledBtn]}
            onPress={() => handleNavigate('prev')}
            disabled={!chapter?.previousChapter}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.navBtnText}>Trước</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.navBtn, { backgroundColor: '#6c757d' }]} onPress={() => router.replace(`/story/${storyId}`)}>
            <Ionicons name="list" size={20} color="#fff" />
            <Text style={styles.navBtnText}>Mục lục</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navBtn, !chapter?.nextChapter && styles.disabledBtn]}
            onPress={() => handleNavigate('next')}
            disabled={!chapter?.nextChapter}
          >
            <Text style={styles.navBtnText}>Sau</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* --- SETTINGS MODAL --- */}
      <Modal visible={showSettings} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tùy chỉnh đọc</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Ionicons name="close" size={28} color="#999" />
              </TouchableOpacity>
            </View>

            <Text style={styles.settingLabel}>Cỡ chữ</Text>
            <View style={styles.row}>
              {(['small', 'medium', 'large', 'xlarge'] as FontSize[]).map((s) => (
                <TouchableOpacity key={s}
                  style={[styles.optionBtn, fontSize === s && styles.optionActive]}
                  onPress={() => setFontSize(s)}
                >
                  <Text style={[styles.optionText, fontSize === s && styles.optionTextActive]}>{s.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.settingLabel}>Màu nền</Text>
            <View style={styles.row}>
              {(['light', 'dark', 'sepia'] as Theme[]).map((t) => (
                <TouchableOpacity key={t}
                  style={[styles.themeBtn, { backgroundColor: THEMES[t].background }, theme === t && styles.themeBtnActive]}
                  onPress={() => setTheme(t)}
                >
                  <Text style={{ color: THEMES[t].text, fontWeight: 'bold' }}>{THEMES[t].name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Helpers
function stripHtml(html: string | null | undefined) {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', height: 60, paddingHorizontal: 15, elevation: 5 },
  headerBtn: { padding: 5 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold' },
  progressBarBg: { height: 2, backgroundColor: 'rgba(0,0,0,0.05)' },
  progressBarActive: { height: '100%', backgroundColor: '#007AFF' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  contentTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 15 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  divider: { height: 1, marginVertical: 25 },
  contentText: { textAlign: 'left' },
  endText: { textAlign: 'center', fontStyle: 'italic', marginVertical: 30, opacity: 0.5 },

  // Locked UI
  lockedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  lockedTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 20, textAlign: 'center' },
  lockedSub: { fontSize: 15, color: '#666', textAlign: 'center', marginVertical: 15 },
  unlockButton: { backgroundColor: '#FF9800', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30, elevation: 3 },
  unlockButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  // Navigation
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 15, paddingBottom: 30, gap: 10 },
  navBtn: { flex: 1, backgroundColor: '#007AFF', flexDirection: 'row', paddingVertical: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center', gap: 5 },
  navBtnText: { color: '#fff', fontWeight: 'bold' },
  disabledBtn: { backgroundColor: '#ccc' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  settingLabel: { fontSize: 16, fontWeight: '600', marginTop: 20, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 10 },
  optionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#f0f0f0', alignItems: 'center' },
  optionActive: { backgroundColor: '#007AFF' },
  optionText: { color: '#666', fontWeight: 'bold' },
  optionTextActive: { color: '#fff' },
  themeBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
  themeBtnActive: { borderColor: '#007AFF', borderWidth: 2 },
});