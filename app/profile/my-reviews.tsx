import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, Image, TouchableOpacity, ActivityIndicator
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { reviewService } from '@/services/reviewService';
import { authService } from '@/services/authService';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

export default function MyReviewsScreen() {
  const router = useRouter();
  const { activeTheme } = useTheme();
  const colors = Colors[activeTheme];

  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await authService.getStoredUser();
      if (user) {
        const res = await reviewService.getMyReviews(user.username);
        setReviews(res.data);
      }
    } catch (error) {
      console.error('Lỗi tải đánh giá cá nhân:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (count: number) => (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Text key={s} style={{ color: s <= count ? '#FFD700' : '#DDD', fontSize: 14 }}>★</Text>
      ))}
    </View>
  );

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={() => router.push(`/story/${item.storyId}`)}
    >
      <Image source={{ uri: item.storyThumbnail }} style={styles.storyThumb} />
      <View style={styles.content}>
        <Text style={[styles.storyTitle, { color: colors.text }]} numberOfLines={1}>
          {item.storyTitle}
        </Text>
        <View style={styles.row}>
          {renderStars(item.rating)}
          <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</Text>
        </View>
        <Text style={[styles.reviewText, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.content}
        </Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ 
        title: 'Đánh giá của tôi',
        headerShown: true,
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff'
      }} />

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Bạn chưa có đánh giá nào.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContainer: { padding: 16 },
  card: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  storyThumb: { width: 60, height: 80, borderRadius: 8 },
  content: { flex: 1, marginLeft: 12 },
  storyTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  date: { fontSize: 12, color: '#999' },
  reviewText: { fontSize: 14, fontStyle: 'italic' },
  arrow: { fontSize: 24, color: '#CCC', marginLeft: 8 },
  emptyText: { textAlign: 'center', marginTop: 100, color: '#999', fontSize: 16 }
});