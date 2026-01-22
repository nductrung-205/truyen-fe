import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Image, TouchableOpacity,
  Alert, Platform, TextInput, Modal, FlatList
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { storyService } from '@/services/storyService';
import { chapterService } from '@/services/chapterService';
import { storageService, ReadingHistoryItem } from '@/services/storageService';
import { authService } from '@/services/authService';
import { StoryDetail, Chapter } from '@/types';
import { ChapterItem } from '@/components/ChapterItem';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { reviewService } from '@/services/reviewService';

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
  const [reviews, setReviews] = useState<any[]>([]);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [sortType, setSortType] = useState<'hot' | 'new'>('new');

  useEffect(() => {
    if (id) {
      loadStoryDetail();
      loadReviews();
    }
  }, [id]);

  const loadReviews = async () => {
    try {
      const res = await reviewService.getReviews(parseInt(id));
      setReviews(res.data);
    } catch (error) {
      console.error('Lỗi tải đánh giá:', error);
    }
  };

  const handlePostReview = async () => {
    if (!user) return Alert.alert("Thông báo", "Vui lòng đăng nhập");
    if (!reviewContent.trim()) return Alert.alert("Lỗi", "Vui lòng nhập nội dung");

    try {
      await reviewService.postReview(parseInt(id), { rating, content: reviewContent });
      setIsReviewModalVisible(false);
      setReviewContent('');
      loadReviews(); // Tải lại danh sách
    } catch (error: any) {
      Alert.alert("Lỗi", error.response?.data || "Không thể gửi đánh giá");
    }
  };

  // Hàm tính Level dựa trên Exp (Ví dụ: mỗi 100 exp lên 1 cấp)
  const calculateLevel = (exp: number) => Math.floor(exp / 100) + 1;

  const renderStars = (count: number, size = 16) => (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Text key={s} style={{ color: s <= count ? '#FFD700' : '#DDD', fontSize: size }}>★</Text>
      ))}
    </View>
  );

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

  const renderRating = (rating: number) => {
    return (
      <View style={styles.ratingContainer}>
        <Text style={styles.ratingText}>{rating.toFixed(1)} </Text>
        {[1, 2, 3, 4, 5].map((star) => (
          <Text key={star} style={{ color: star <= rating ? '#FFD700' : '#CCC', fontSize: 16 }}>
            ★
          </Text>
        ))}
      </View>
    );
  };

  if (loading) return <LoadingSpinner text="Đang tải..." />;
  if (!story) return null;

  const displayedChapters = showAllChapters ? chapters : chapters.slice(0, 10);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          {/* 1. COVER IMAGE & BACK BUTTON */}
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

          {/* 2. STORY INFO */}
          <View style={styles.infoContainer}>
            <Text style={styles.title}>{story.title}</Text>
            {renderRating(story.rating || 0)}
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>✍️ {story.authorName}</Text>
              <Text style={styles.metaText}>👁 {story.views} lượt xem</Text>
            </View>

            <View style={styles.categoriesContainer}>
              {story.categoryNames?.map((cat, i) => (
                <View key={i} style={styles.categoryChip}>
                  <Text style={styles.categoryText}>#{cat}</Text>
                </View>
              ))}
            </View>

            <View style={styles.descriptionContainer}>
              <Text style={styles.sectionTitle}>📝 Giới thiệu</Text>
              <Text style={styles.description}>{story.description}</Text>
            </View>
          </View>

          {/* 3. CHAPTER LIST */}
          <View style={styles.chaptersContainer}>
            <Text style={[styles.sectionTitle, { paddingHorizontal: 16 }]}>
              📚 Danh sách chương ({chapters.length})
            </Text>


            {displayedChapters.map((ch) => (
              <TouchableOpacity
                key={ch.id}
                style={styles.chapterItemRow}
                onPress={() => handleReadChapter(ch.chapterNumber)}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.chapterItemTitle}>Chương {ch.chapterNumber}: {ch.title}</Text>
                    {ch.isVip && (
                      <View style={styles.vipBadge}>
                        <Text style={styles.vipText}>VIP</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.chapterItemSub}>📅 {new Date(ch.updatedAt).toLocaleDateString('vi-VN')}</Text>
                </View>

                <View style={styles.chapterRightInfo}>
                  <Text style={styles.chapterViewText}>👁 {ch.views}</Text>
                  {ch.isVip && (
                    <Text style={styles.priceText}>💰 {ch.price}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}

            {chapters.length > 10 && !showAllChapters && (
              <TouchableOpacity style={styles.showMoreButton} onPress={() => setShowAllChapters(true)}>
                <Text style={styles.showMoreText}>Xem tất cả tập ({chapters.length}) ∨</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 4. REVIEW SECTION (PHẦN MỚI THEO HÌNH) */}
          <View style={styles.reviewSection}>
            {/* Header tím hiển thị điểm trung bình */}
            <View style={styles.reviewHeader}>
              <View>
                <Text style={styles.avgRatingText}>{story.rating?.toFixed(1) || "0.0"}</Text>
                {renderStars(Math.round(story.rating || 0), 20)}
                <Text style={{ color: '#E1BEE7', fontSize: 12, marginTop: 4 }}>
                  {reviews.length} người đánh giá
                </Text>
              </View>
              <TouchableOpacity
                style={styles.postReviewBtn}
                onPress={() => setIsReviewModalVisible(true)}
              >
                <Text style={styles.postReviewBtnText}>Đánh giá 📝</Text>
              </TouchableOpacity>
            </View>

            {/* Thanh lọc Hot/Mới */}
            <View style={styles.filterBar}>
              <Text style={styles.reviewCountTitle}>Danh sách đánh giá ({reviews.length})</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity onPress={() => setSortType('hot')}>
                  <Text style={[styles.filterText, sortType === 'hot' && styles.filterActive]}>Hot</Text>
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity onPress={() => setSortType('new')}>
                  <Text style={[styles.filterText, sortType === 'new' && styles.filterActive]}>Mới</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* List Đánh giá */}
            {reviews.length > 0 ? (
              reviews.map((item) => (
                <View key={item.id} style={styles.reviewItem}>
                  <Image
                    source={{ uri: item.avatarUrl || 'https://i.pravatar.cc/150' }}
                    style={styles.userAvatar}
                  />
                  <View style={{ flex: 1 }}>
                    <View style={styles.userInfoRow}>
                      <Text style={styles.username}>{item.username}</Text>
                      <View style={styles.levelBadge}>
                        <Text style={styles.levelText}>Lv{calculateLevel(item.userExp)}</Text>
                      </View>
                      <Text>🛡️</Text>
                    </View>

                    <View style={styles.ratingRow}>
                      {renderStars(item.rating)}
                      <Text style={styles.ratingLabel}>{item.rating >= 4 ? 'Rất tốt' : 'Tạm ổn'}</Text>
                    </View>

                    <Text style={styles.reviewText}>{item.content}</Text>

                    <View style={styles.reviewFooter}>
                      <Text style={styles.reviewDate}>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</Text>
                      <View style={styles.reviewActions}>
                        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ color: '#666', fontSize: 13 }}>💬 1</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ color: '#666', fontSize: 13 }}>👍 4</Text>
                        </TouchableOpacity>
                        <TouchableOpacity><Text style={{ color: '#999' }}>⋮</Text></TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <Text style={{ textAlign: 'center', color: '#999', marginVertical: 20 }}>Chưa có đánh giá nào.</Text>
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* 5. MODAL ĐÁNH GIÁ */}
        <Modal visible={isReviewModalVisible} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Đánh giá truyện</Text>
              <View style={styles.starPicker}>
                {[1, 2, 3, 4, 5].map(s => (
                  <TouchableOpacity key={s} onPress={() => setRating(s)}>
                    <Text style={{ fontSize: 40, color: s <= rating ? '#FFD700' : '#DDD', marginHorizontal: 5 }}>★</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Cảm nhận của bạn về truyện này..."
                multiline
                numberOfLines={4}
                value={reviewContent}
                onChangeText={setReviewContent}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => setIsReviewModalVisible(false)} style={styles.cancelBtn}>
                  <Text style={{ color: '#666' }}>Hủy bỏ</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handlePostReview} style={styles.submitBtn}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Gửi đánh giá</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* 6. BOTTOM ACTION BAR */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.favoriteButtonBottom}
            onPress={handleToggleFavorite}
          >
            <Text style={{ fontSize: 20 }}>{isFavorite ? '❤️' : '🤍'}</Text>
            <Text style={{ fontSize: 11, color: '#666' }}>Lưu</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.readButton}
            onPress={() => handleReadChapter(lastReadChapter || chapters[0]?.chapterNumber || 1)}
          >
            <Text style={styles.readButtonText}>
              {lastReadChapter ? 'Tiếp tục đọc Chương ' + lastReadChapter : 'Bắt đầu xem'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
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
  readButtonText: { color: '#fff', fontWeight: '700' },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFA500',
  },
  chapterItemRow: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  chapterItemTitle: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500'
  },
  chapterItemSub: {
    fontSize: 12,
    color: '#999',
    marginTop: 4
  },
  chapterViewBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  chapterViewText: {
    fontSize: 11,
    color: '#666'
  },
  reviewSection: {
    padding: 16,
    borderTopWidth: 8,
    borderTopColor: '#F5F5F5',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#6A1B9A', // Màu tím giống trong hình
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  avgRatingText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  favoriteButtonBottom: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postReviewBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fff',
  },
  postReviewBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  reviewCountTitle: {
    fontWeight: '700',
    fontSize: 16,
  },
  filterOptions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterText: {
    color: '#999',
    fontSize: 14,
  },
  filterActive: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: '#DDD',
    marginHorizontal: 8,
  },
  reviewItem: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: 15,
  },
  userAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 12,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 15,
    marginRight: 8,
  },
  levelBadge: {
    backgroundColor: '#00B0FF',
    paddingHorizontal: 6,
    borderRadius: 4,
    marginRight: 5,
  },
  levelText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingLabel: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  reviewText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    alignItems: 'center',
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 15,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  starPicker: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  vipBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6
  },
  vipText: { fontSize: 10, fontWeight: '900', color: '#000' },
  chapterRightInfo: { alignItems: 'flex-end' },
  priceText: { fontSize: 12, color: '#FFA000', fontWeight: 'bold', marginTop: 2 },
  textInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 10,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    padding: 10,
  },
  submitBtn: {
    backgroundColor: '#6A1B9A',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
});