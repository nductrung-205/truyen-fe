import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { storyService } from '@/services/storyService';
import { chapterService } from '@/services/chapterService';
import { storageService, ReadingHistoryItem } from '@/services/storageService';
import { StoryDetail, Chapter } from '@/types';
import { ChapterItem } from '@/components/ChapterItem';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function StoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [story, setStory] = useState<StoryDetail | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [lastReadChapter, setLastReadChapter] = useState<number | null>(null);
  const [showAllChapters, setShowAllChapters] = useState(false);

  useEffect(() => {
    if (id) {
      loadStoryDetail();
    }
  }, [id]);

  const loadStoryDetail = async () => {
    try {
      setLoading(true);
      const storyId = parseInt(id);

      // Load story detail và chapters song song
      const [storyRes, chaptersRes] = await Promise.all([
        storyService.getStoryDetail(storyId),
        chapterService.getChapters(storyId),
      ]);

      setStory(storyRes.data);
      setChapters(chaptersRes.data);

      // Check favorite status
      const favoriteStatus = await storageService.isFavorite(storyId);
      setIsFavorite(favoriteStatus);

      // Get last read chapter
      const progress = await storageService.getReadingProgress(storyId);
      setLastReadChapter(progress?.chapterNumber || null);
    } catch (error) {
      console.error('Error loading story detail:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin truyện');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!story) return;

    try {
      if (isFavorite) {
        await storageService.removeFromFavorites(story.id);
        setIsFavorite(false);
        Alert.alert('Thành công', 'Đã xóa khỏi yêu thích');
      } else {
        await storageService.addToFavorites(story.id);
        setIsFavorite(true);
        Alert.alert('Thành công', 'Đã thêm vào yêu thích');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Lỗi', 'Không thể thực hiện');
    }
  };

  const handleReadChapter = async (chapterNumber: number) => {
    if (!story) return;

    // Save to reading history
    const historyItem: ReadingHistoryItem = {
      storyId: story.id,
      storyTitle: story.title,
      thumbnailUrl: story.thumbnailUrl,
      authorName: story.authorName,
      lastReadChapter: chapterNumber,
      lastReadAt: new Date().toISOString(),
    };
    await storageService.addToReadingHistory(historyItem);

    // Navigate to chapter
    router.push(`/chapter/${story.id}/${chapterNumber}`);
  };

  const handleReadFromStart = () => {
    if (chapters.length > 0) {
      handleReadChapter(chapters[0].chapterNumber);
    }
  };

  const handleContinueReading = () => {
    if (lastReadChapter) {
      handleReadChapter(lastReadChapter);
    } else {
      handleReadFromStart();
    }
  };

  if (loading) {
    return <LoadingSpinner text="Đang tải..." />;
  }

  if (!story) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không tìm thấy truyện</Text>
      </View>
    );
  }

  const displayedChapters = showAllChapters ? chapters : chapters.slice(0, 10);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Cover Image */}
        <View style={styles.coverContainer}>
          <Image
            source={{ uri: story.thumbnailUrl }}
            style={styles.coverImage}
            resizeMode="cover"
          />
          <View style={styles.coverOverlay} />
          
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>

          {/* Favorite Button */}
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleToggleFavorite}
          >
            <Text style={styles.favoriteIcon}>
              {isFavorite ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Story Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{story.title}</Text>
          
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>✍️</Text>
              <Text style={styles.metaText}>{story.authorName}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>👁</Text>
              <Text style={styles.metaText}>
                {formatNumber(story.views)} lượt xem
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>⭐</Text>
              <Text style={styles.metaText}>{story.rating?.toFixed(1) || 0}/5.0</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>📖</Text>
              <Text style={styles.metaText}>{story.chaptersCount} chương</Text>
            </View>
            <View style={[styles.statusBadge, story.status === 'Hoàn thành' && styles.statusBadgeComplete]}>
              <Text style={styles.statusText}>{story.status}</Text>
            </View>
          </View>

          {/* Categories */}
          {story.categoryNames && story.categoryNames.length > 0 && (
            <View style={styles.categoriesContainer}>
              {Array.from(story.categoryNames).map((category, index) => (
                <View key={index} style={styles.categoryChip}>
                  <Text style={styles.categoryText}>{category}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionTitle}>📝 Giới thiệu</Text>
            <Text style={styles.description}>{story.description}</Text>
          </View>
        </View>

        {/* Chapters List */}
        <View style={styles.chaptersContainer}>
          <View style={styles.chaptersHeader}>
            <Text style={styles.sectionTitle}>
              📚 Danh sách chương ({chapters.length})
            </Text>
            {lastReadChapter && (
              <Text style={styles.lastReadText}>
                Đọc đến chương {lastReadChapter}
              </Text>
            )}
          </View>

          {displayedChapters.map((chapter) => (
            <ChapterItem
              key={chapter.id}
              chapter={chapter}
              onPress={() => handleReadChapter(chapter.chapterNumber)}
            />
          ))}

          {chapters.length > 10 && !showAllChapters && (
            <TouchableOpacity
              style={styles.showMoreButton}
              onPress={() => setShowAllChapters(true)}
            >
              <Text style={styles.showMoreText}>
                Xem thêm {chapters.length - 10} chương →
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.readButton}
          onPress={handleReadFromStart}
        >
          <Text style={styles.readButtonText}>📖 Đọc từ đầu</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.readButton, styles.continueButton]}
          onPress={handleContinueReading}
        >
          <Text style={styles.readButtonText}>
            {lastReadChapter ? '▶️ Đọc tiếp' : '▶️ Bắt đầu đọc'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  coverContainer: {
    height: 300,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
  },
  favoriteButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIcon: {
    fontSize: 20,
  },
  infoContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  metaIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeComplete: {
    backgroundColor: '#E8F5E9',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9800',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    marginBottom: 16,
  },
  categoryChip: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 13,
    color: '#1976D2',
    fontWeight: '500',
  },
  descriptionContainer: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: '#666',
  },
  chaptersContainer: {
    backgroundColor: '#F8F9FA',
    paddingTop: 16,
  },
  chaptersHeader: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  lastReadText: {
    fontSize: 13,
    color: '#007AFF',
    marginTop: 4,
  },
  showMoreButton: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
    marginTop: 8,
  },
  showMoreText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 80,
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  readButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButton: {
    backgroundColor: '#4CAF50',
  },
  readButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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