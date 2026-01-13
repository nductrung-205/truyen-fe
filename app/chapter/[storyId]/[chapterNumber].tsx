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
  useColorScheme,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { chapterService } from '@/services/chapterService';
import { storageService, ReadingProgress } from '@/services/storageService';
import { ChapterDetail } from '@/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons'; // Đảm bảo bạn đã cài expo/vector-icons

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type FontSize = 'small' | 'medium' | 'large' | 'xlarge';
type Theme = 'light' | 'dark' | 'sepia';

const FONT_SIZES = {
  small: 14,
  medium: 16,
  large: 18,
  xlarge: 20,
};

const THEMES = {
  light: {
    background: '#FFFFFF',
    text: '#333333',
    name: 'Sáng',
    controlBg: '#F8F9FA',
  },
  dark: {
    background: '#121212',
    text: '#E0E0E0',
    name: 'Tối',
    controlBg: '#1E1E1E',
  },
  sepia: {
    background: '#F4ECD8',
    text: '#5F4B32',
    name: 'Nâu',
    controlBg: '#E8DDC3',
  },
};

export default function ChapterReaderScreen() {
  const { storyId, chapterNumber } = useLocalSearchParams<{
    storyId: string;
    chapterNumber: string;
  }>();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  const [loading, setLoading] = useState(true);
  const [chapter, setChapter] = useState<ChapterDetail | null>(null);
  const [showControls, setShowControls] = useState(true); // Mặc định hiện để người dùng dễ thấy
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [theme, setTheme] = useState<Theme>('light');
  const [brightness, setBrightness] = useState(1.0);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    loadChapter();
  }, [storyId, chapterNumber]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (chapter) saveProgress();
    }, 5000);
    return () => clearInterval(interval);
  }, [chapter, scrollProgress]);

  const loadChapter = async () => {
    try {
      setLoading(true);
      const response = await chapterService.getChapterContent(
        parseInt(storyId),
        parseInt(chapterNumber)
      );
      setChapter(response.data);
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    } catch (error) {
      console.error('Error loading chapter:', error);
      Alert.alert('Lỗi', 'Không thể tải nội dung chương');
      goToStoryDetail();
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async () => {
    if (!chapter) return;
    await storageService.saveReadingProgress({
      storyId: parseInt(storyId),
      chapterNumber: chapter.chapterNumber,
      scrollPosition: scrollProgress,
    });
  };

  const goToStoryDetail = () => {
    // Kiểm tra nếu có thể quay lại (nghĩa là người dùng đi từ StoryDetail sang)
    if (router.canGoBack()) {
      router.back();
    } else {
      // Nếu người dùng vào thẳng link chapter (ví dụ từ thông báo, bookmark) 
      // thì mới dùng replace để về trang story mà không tạo thêm stack mới
      router.replace(`/story/${storyId}`);
    }
  };

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const progress = contentOffset.y / (contentSize.height - layoutMeasurement.height);
    setScrollProgress(Math.max(0, Math.min(1, progress || 0)));
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!chapter) return;
    const targetChapter = direction === 'prev' ? chapter.previousChapter : chapter.nextChapter;

    if (targetChapter) {
      router.replace(`/chapter/${storyId}/${targetChapter}`);
    } else {
      Alert.alert('Thông báo', direction === 'prev' ? 'Đây là chương đầu tiên' : 'Đây là chương mới nhất');
    }
  };

  const toggleControls = () => setShowControls(!showControls);

  if (loading) return <LoadingSpinner text="Đang tải chương..." />;

  const currentTheme = THEMES[theme];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header Bar */}
      {showControls && (
        <View style={[styles.header, { backgroundColor: currentTheme.controlBg, borderBottomColor: 'rgba(0,0,0,0.1)' }]}>
          <TouchableOpacity style={styles.headerButton} onPress={goToStoryDetail}>
            <Ionicons name="chevron-back" size={28} color={currentTheme.text} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={[styles.headerTitleText, { color: currentTheme.text }]} numberOfLines={1}>
              Chương {chapter?.chapterNumber}
            </Text>
          </View>
          <TouchableOpacity style={styles.headerButton} onPress={() => setShowSettings(true)}>
            <Ionicons name="settings-outline" size={24} color={currentTheme.text} />
          </TouchableOpacity>
        </View>
      )}

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${scrollProgress * 100}%` }]} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onTouchEnd={(e) => {
          // Chỉ toggle khi click nhẹ, không phải vuốt
          toggleControls();
        }}
      >
        {chapter && (
          <>
            <Text style={[styles.chapterTitle, { color: currentTheme.text }]}>
              Chương {chapter.chapterNumber}: {chapter.title}
            </Text>

            <View style={styles.chapterMeta}>
              <Text style={[styles.chapterMetaText, { color: currentTheme.text }]}>👁 {chapter.views} lượt xem</Text>
              <Text style={[styles.chapterMetaText, { color: currentTheme.text }]}>📅 {formatDate(chapter.updatedAt)}</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: currentTheme.text, opacity: 0.1 }]} />

            <Text
              style={[
                styles.content,
                {
                  fontSize: FONT_SIZES[fontSize],
                  color: currentTheme.text,
                  opacity: brightness,
                },
              ]}
            >
              {stripHtml(chapter.content)}
            </Text>

            <View style={[styles.divider, { backgroundColor: currentTheme.text, opacity: 0.1 }]} />
            <Text style={[styles.endChapterText, { color: currentTheme.text }]}>--- Hết chương ---</Text>

            {/* Nút điều hướng nhanh cuối trang */}
            {/* <View style={styles.bottomQuickNav}>
              <TouchableOpacity
                style={[styles.quickNavBtn, !chapter.previousChapter && styles.disabledBtn]}
                onPress={() => handleNavigate('prev')}
                disabled={!chapter.previousChapter}
              >
                <Text style={styles.quickNavBtnText}>Chương trước</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickNavBtn, !chapter.nextChapter && styles.disabledBtn]}
                onPress={() => handleNavigate('next')}
                disabled={!chapter.nextChapter}
              >
                <Text style={styles.quickNavBtnText}>Chương sau</Text>
              </TouchableOpacity>
            </View> */}
          </>
        )}
      </ScrollView>

      {/* Bottom Control Bar */}
      {showControls && (
        <View style={[styles.bottomNav, { backgroundColor: currentTheme.controlBg }]}>
          <TouchableOpacity
            style={[styles.navButton, !chapter?.previousChapter && styles.navButtonDisabled]}
            onPress={() => handleNavigate('prev')}
            disabled={!chapter?.previousChapter}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.navButtonText}>Trước</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.navButton, { backgroundColor: '#6c757d' }]} onPress={goToStoryDetail}>
            <Ionicons name="list" size={20} color="#fff" />
            <Text style={styles.navButtonText}>Mục lục</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, !chapter?.nextChapter && styles.navButtonDisabled]}
            onPress={() => handleNavigate('next')}
            disabled={!chapter?.nextChapter}
          >
            <Text style={styles.navButtonText}>Sau</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Settings Modal (Giữ nguyên logic cũ của bạn) */}
      <Modal visible={showSettings} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cài đặt đọc</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Ionicons name="close" size={28} color="#999" />
              </TouchableOpacity>
            </View>

            {/* ... Các phần setting giữ nguyên như code cũ của bạn ... */}
            <View style={styles.settingSection}>
              <Text style={styles.settingLabel}>Cỡ chữ</Text>
              <View style={styles.fontSizeButtons}>
                {(['small', 'medium', 'large', 'xlarge'] as FontSize[]).map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[styles.fontSizeButton, fontSize === size && styles.fontSizeButtonActive]}
                    onPress={() => setFontSize(size)}
                  >
                    <Text style={[styles.fontSizeButtonText, fontSize === size && styles.fontSizeButtonTextActive]}>
                      {size.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.settingSection}>
              <Text style={styles.settingLabel}>Chủ đề</Text>
              <View style={styles.themeButtons}>
                {(['light', 'dark', 'sepia'] as Theme[]).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.themeButton, { backgroundColor: THEMES[t].background }, theme === t && styles.themeButtonActive]}
                    onPress={() => setTheme(t)}
                  >
                    <Text style={[styles.themeButtonText, { color: THEMES[t].text }]}>{THEMES[t].name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Helpers
function stripHtml(html: string | null | undefined): string {
  if (!html) return ""; // Trả về chuỗi rỗng nếu không có dữ liệu

  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('vi-VN');
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    height: 60,
    zIndex: 10,
  },
  headerButton: { padding: 8 },
  headerTitle: { flex: 1, alignItems: 'center' },
  headerTitleText: { fontSize: 18, fontWeight: 'bold' },
  progressBarContainer: { height: 2, backgroundColor: 'rgba(0,0,0,0.05)' },
  progressBar: { height: '100%', backgroundColor: '#007AFF' },
  scrollView: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 100 },
  chapterTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 15, lineHeight: 32 },
  chapterMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  chapterMetaText: { fontSize: 13, opacity: 0.6 },
  divider: { height: 1, marginVertical: 25 },
  content: { lineHeight: 34, textAlign: 'left' },
  endChapterText: { textAlign: 'center', fontSize: 14, fontStyle: 'italic', marginVertical: 30, opacity: 0.5 },

  // Nút điều hướng dưới cùng (Thanh điều khiển)
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 15,
    paddingBottom: 30, // Thêm padding cho iPhone có tai thỏ
    gap: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  navButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  navButtonDisabled: { backgroundColor: '#ccc' },
  navButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  // Nút điều hướng nhanh cuối trang nội dung
  bottomQuickNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 15,
  },
  quickNavBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickNavBtnText: { color: '#007AFF', fontWeight: '600' },
  disabledBtn: { borderColor: '#ccc', opacity: 0.5 },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 22, fontWeight: 'bold' },
  settingSection: { marginBottom: 25 },
  settingLabel: { fontSize: 16, fontWeight: '600', marginBottom: 15 },
  fontSizeButtons: { flexDirection: 'row', gap: 10 },
  fontSizeButton: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#f0f0f0', alignItems: 'center' },
  fontSizeButtonActive: { backgroundColor: '#007AFF' },
  fontSizeButtonText: { fontWeight: 'bold', color: '#666' },
  fontSizeButtonTextActive: { color: '#fff' },
  themeButtons: { flexDirection: 'row', gap: 15 },
  themeButton: { flex: 1, paddingVertical: 15, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: '#eee' },
  themeButtonActive: { borderColor: '#007AFF' },
  themeButtonText: { fontWeight: 'bold' },
});