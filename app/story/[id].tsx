import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { storyService } from '@/services/storyService';
import { chapterService } from '@/services/chapterService';
import { storageService, ReadingHistoryItem } from '@/services/storageService';
import { authService } from '@/services/authService';
import { StoryDetail, Chapter } from '@/types';
import { ChapterItem } from '@/components/ChapterItem';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function StoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [story, setStory] = useState<StoryDetail | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [lastReadChapter, setLastReadChapter] = useState<number | null>(null);
  const [showAllChapters, setShowAllChapters] = useState(false);

  useEffect(() => {
    if (id) loadStoryDetail();
  }, [id]);

  const loadStoryDetail = async () => {
    try {
      setLoading(true);
      const storyId = parseInt(id);
      const [storyRes, chaptersRes, storedUser] = await Promise.all([
        storyService.getStoryDetail(storyId),
        chapterService.getChapters(storyId),
        authService.getStoredUser(),
      ]);

      setStory(storyRes.data);
      setChapters(chaptersRes.data);
      setUser(storedUser);

      const favoriteStatus = await storageService.isFavorite(storyId);
      setIsFavorite(favoriteStatus);

      const progress = await storageService.getReadingProgress(storyId);
      setLastReadChapter(progress?.chapterNumber || null);
    } catch (error) {
      console.error('Error loading detail:', error);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    // YÊU CẦU ĐĂNG NHẬP ĐỂ THÍCH TRUYỆN
    if (!user) {
      if (Platform.OS === 'web') {
        if (window.confirm("Bạn cần đăng nhập để yêu thích truyện. Đi tới trang đăng nhập?")) {
            router.push('/auth/login');
        }
      } else {
        Alert.alert('Yêu cầu đăng nhập', 'Đăng nhập để sử dụng tính năng này.', [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Đăng nhập', onPress: () => router.push('/auth/login') }
        ]);
      }
      return;
    }

    if (!story) return;
    try {
      if (isFavorite) {
        await storageService.removeFromFavorites(story.id);
        setIsFavorite(false);
      } else {
        await storageService.addToFavorites(story.id);
        setIsFavorite(true);
      }
    } catch (error) { console.error(error); }
  };

  const handleReadChapter = async (num: number) => {
    if (!story) return;
    const item: ReadingHistoryItem = {
      storyId: story.id,
      storyTitle: story.title,
      thumbnailUrl: story.thumbnailUrl,
      authorName: story.authorName,
      lastReadChapter: num,
      lastReadAt: new Date().toISOString(),
    };
    await storageService.addToReadingHistory(item);
    router.push(`/chapter/${story.id}/${num}`);
  };

  if (loading) return <LoadingSpinner text="Đang tải..." />;
  if (!story) return null;

  const displayedChapters = showAllChapters ? chapters : chapters.slice(0, 10);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.coverContainer}>
          <Image source={{ uri: story.thumbnailUrl }} style={styles.coverImage} resizeMode="cover" />
          <View style={styles.coverOverlay} />
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.favoriteButton} onPress={handleToggleFavorite}>
            <Text style={styles.favoriteIcon}>{isFavorite ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.title}>{story.title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>✍️ {story.authorName}</Text>
            <Text style={styles.metaText}>👁 {story.views} lượt xem</Text>
          </View>

          <View style={styles.categoriesContainer}>
            {story.categoryNames?.map((cat, i) => (
              <View key={i} style={styles.categoryChip}><Text style={styles.categoryText}>{cat}</Text></View>
            ))}
          </View>

          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionTitle}>📝 Giới thiệu</Text>
            <Text style={styles.description}>{story.description}</Text>
          </View>
        </View>

        <View style={styles.chaptersContainer}>
          <Text style={[styles.sectionTitle, { paddingHorizontal: 16 }]}>📚 Danh sách chương</Text>
          {displayedChapters.map((ch) => (
            <ChapterItem key={ch.id} chapter={ch} onPress={() => handleReadChapter(ch.chapterNumber)} />
          ))}
          {chapters.length > 10 && !showAllChapters && (
            <TouchableOpacity style={styles.showMoreButton} onPress={() => setShowAllChapters(true)}>
              <Text style={styles.showMoreText}>Xem thêm chương →</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.readButton} onPress={() => handleReadChapter(chapters[0]?.chapterNumber || 1)}>
          <Text style={styles.readButtonText}>📖 Đọc từ đầu</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.readButton, { backgroundColor: '#4CAF50' }]} onPress={() => handleReadChapter(lastReadChapter || 1)}>
          <Text style={styles.readButtonText}>{lastReadChapter ? '▶️ Đọc tiếp' : '▶️ Bắt đầu'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollView: { flex: 1 },
  coverContainer: { height: 280, position: 'relative' },
  coverImage: { width: '100%', height: '100%' },
  coverOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  backButton: { position: 'absolute', top: 50, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  backButtonText: { fontSize: 32, color: '#fff' },
  favoriteButton: { position: 'absolute', top: 50, right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  favoriteIcon: { fontSize: 20 },
  infoContainer: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#333', marginBottom: 10 },
  metaRow: { flexDirection: 'row', gap: 15, marginBottom: 15 },
  metaText: { color: '#666', fontSize: 14 },
  categoriesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 },
  categoryChip: { backgroundColor: '#E3F2FD', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  categoryText: { color: '#1976D2', fontSize: 12, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  description: { color: '#666', lineHeight: 22 },
  descriptionContainer: { marginBottom: 20 },
  chaptersContainer: { backgroundColor: '#F8F9FA', paddingTop: 16 },
  showMoreButton: { padding: 16, alignItems: 'center' },
  showMoreText: { color: '#007AFF', fontWeight: '600' },
  bottomActions: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', gap: 10 },
  readButton: { flex: 1, backgroundColor: '#007AFF', padding: 14, borderRadius: 12, alignItems: 'center' },
  readButtonText: { color: '#fff', fontWeight: '700' }
});