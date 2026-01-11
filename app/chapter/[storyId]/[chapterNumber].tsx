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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { chapterService } from '@/services/chapterService';
import { storageService, ReadingProgress } from '@/services/storageService';
import { ChapterDetail } from '@/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import Slider from '@react-native-community/slider';

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
  },
  dark: {
    background: '#1E1E1E',
    text: '#E0E0E0',
    name: 'Tối',
  },
  sepia: {
    background: '#F4ECD8',
    text: '#5F4B32',
    name: 'Nâu',
  },
};

export default function ChapterReaderScreen() {
  const { storyId, chapterNumber } = useLocalSearchParams<{
    storyId: string;
    chapterNumber: string;
  }>();
  const router = useRouter();
  const systemTheme = useColorScheme();
  const scrollViewRef = useRef<ScrollView>(null);

  const [loading, setLoading] = useState(true);
  const [chapter, setChapter] = useState<ChapterDetail | null>(null);
  const [showControls, setShowControls] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [theme, setTheme] = useState<Theme>('light');
  const [brightness, setBrightness] = useState(1.0);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    loadChapter();
    loadSettings();
  }, [storyId, chapterNumber]);

  useEffect(() => {
    // Save reading progress periodically
    const interval = setInterval(() => {
      if (chapter) {
        saveProgress();
      }
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
    } catch (error) {
      console.error('Error loading chapter:', error);
      Alert.alert('Lỗi', 'Không thể tải nội dung chapter');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const savedFontSize = await storageService.getReadingProgress(parseInt(storyId));
      // Load font size, theme from storage if needed
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveProgress = async () => {
    if (!chapter) return;

    const progress: ReadingProgress = {
      storyId: parseInt(storyId),
      chapterNumber: chapter.chapterNumber,
      scrollPosition: scrollProgress,
    };

    await storageService.saveReadingProgress(progress);
  };

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const progress = contentOffset.y / (contentSize.height - layoutMeasurement.height);
    setScrollProgress(Math.max(0, Math.min(1, progress)));
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!chapter) return;

    const targetChapter = direction === 'prev' 
      ? chapter.previousChapter 
      : chapter.nextChapter;

    if (targetChapter) {
      router.replace(`/chapter/${storyId}/${targetChapter}`);
    } else {
      Alert.alert(
        'Thông báo',
        direction === 'prev' 
          ? 'Đây là chương đầu tiên' 
          : 'Đây là chương cuối cùng'
      );
    }
  };

  const handleFontSizeChange = (size: FontSize) => {
    setFontSize(size);
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  if (loading) {
    return <LoadingSpinner text="Đang tải chapter..." />;
  }

  if (!chapter) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không tìm thấy chapter</Text>
      </View>
    );
  }

  const currentTheme = THEMES[theme];
  const currentFontSize = FONT_SIZES[fontSize];

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {/* Header */}
      {showControls && (
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <Text style={[styles.headerButtonText, { color: currentTheme.text }]}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={[styles.headerTitleText, { color: currentTheme.text }]} numberOfLines={1}>
              Chương {chapter.chapterNumber}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowSettings(true)}
          >
            <Text style={[styles.headerButtonText, { color: currentTheme.text }]}>⚙️</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${scrollProgress * 100}%` }]} />
      </View>

      {/* Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onTouchStart={() => setShowControls(!showControls)}
      >
        <Text style={[styles.chapterTitle, { color: currentTheme.text }]}>
          Chương {chapter.chapterNumber}: {chapter.title}
        </Text>

        <View style={styles.chapterMeta}>
          <Text style={[styles.chapterMetaText, { color: currentTheme.text }]}>
            👁 {chapter.views} lượt xem
          </Text>
          <Text style={[styles.chapterMetaText, { color: currentTheme.text }]}>
            🕐 {formatDate(chapter.updatedAt)}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Chapter Content */}
        <Text
          style={[
            styles.content,
            {
              fontSize: currentFontSize,
              color: currentTheme.text,
              opacity: brightness,
            },
          ]}
        >
          {stripHtml(chapter.content)}
        </Text>

        <View style={styles.divider} />

        <Text style={[styles.endChapterText, { color: currentTheme.text }]}>
          --- Hết chương {chapter.chapterNumber} ---
        </Text>
      </ScrollView>

      {/* Bottom Navigation */}
      {showControls && (
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={[
              styles.navButton,
              !chapter.previousChapter && styles.navButtonDisabled,
            ]}
            onPress={() => handleNavigate('prev')}
            disabled={!chapter.previousChapter}
          >
            <Text style={styles.navButtonText}>← Trước</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => router.back()}
          >
            <Text style={styles.navButtonText}>📚 Danh sách</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navButton,
              !chapter.nextChapter && styles.navButtonDisabled,
            ]}
            onPress={() => handleNavigate('next')}
            disabled={!chapter.nextChapter}
          >
            <Text style={styles.navButtonText}>Sau →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⚙️ Cài đặt đọc truyện</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Font Size */}
            <View style={styles.settingSection}>
              <Text style={styles.settingLabel}>🔤 Cỡ chữ</Text>
              <View style={styles.fontSizeButtons}>
                {(['small', 'medium', 'large', 'xlarge'] as FontSize[]).map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.fontSizeButton,
                      fontSize === size && styles.fontSizeButtonActive,
                    ]}
                    onPress={() => handleFontSizeChange(size)}
                  >
                    <Text
                      style={[
                        styles.fontSizeButtonText,
                        fontSize === size && styles.fontSizeButtonTextActive,
                      ]}
                    >
                      {size === 'small' ? 'Nhỏ' : size === 'medium' ? 'TB' : size === 'large' ? 'Lớn' : 'Rất lớn'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Theme */}
            <View style={styles.settingSection}>
              <Text style={styles.settingLabel}>🎨 Chủ đề</Text>
              <View style={styles.themeButtons}>
                {(['light', 'dark', 'sepia'] as Theme[]).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.themeButton,
                      { backgroundColor: THEMES[t].background },
                      theme === t && styles.themeButtonActive,
                    ]}
                    onPress={() => handleThemeChange(t)}
                  >
                    <Text style={[styles.themeButtonText, { color: THEMES[t].text }]}>
                      {THEMES[t].name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Brightness */}
            <View style={styles.settingSection}>
              <Text style={styles.settingLabel}>☀️ Độ sáng</Text>
              <Slider
                style={styles.slider}
                minimumValue={0.3}
                maximumValue={1.0}
                value={brightness}
                onValueChange={setBrightness}
                minimumTrackTintColor="#007AFF"
                maximumTrackTintColor="#E0E0E0"
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 24,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  chapterTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  chapterMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  chapterMetaText: {
    fontSize: 13,
    opacity: 0.7,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 20,
  },
  content: {
    lineHeight: 32,
    textAlign: 'justify',
  },
  endChapterText: {
    textAlign: 'center',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 20,
    opacity: 0.6,
  },
  bottomNav: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 8,
  },
  navButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: '#E0E0E0',
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalCloseText: {
    fontSize: 24,
    color: '#999',
  },
  settingSection: {
    marginBottom: 24,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  fontSizeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  fontSizeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  fontSizeButtonActive: {
    backgroundColor: '#007AFF',
  },
  fontSizeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  fontSizeButtonTextActive: {
    color: '#fff',
  },
  themeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  themeButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeButtonActive: {
    borderColor: '#007AFF',
  },
  themeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
});