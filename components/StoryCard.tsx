import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Story } from '@/types';

interface StoryCardProps {
  story: Story;
  onPress: () => void;
}

export function StoryCard({ story, onPress }: StoryCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Thumbnail */}
      <Image 
        source={{ uri: story.thumbnailUrl || 'https://via.placeholder.com/150' }} 
        style={styles.thumbnail}
        resizeMode="cover"
      />
      
      {/* Info */}
      <View style={styles.info}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {story.title}
        </Text>
        
        {/* Author */}
        <Text style={styles.author} numberOfLines={1}>
          {story.authorName}
        </Text>
        
        {/* Categories */}
        {story.categoryNames && story.categoryNames.length > 0 && (
          <View style={styles.categories}>
            {story.categoryNames.slice(0, 2).map((cat, index) => (
              <View key={index} style={styles.categoryChip}>
                <Text style={styles.categoryText}>{cat}</Text>
              </View>
            ))}
          </View>
        )}
        
        {/* Stats */}
        <View style={styles.stats}>
          <Text style={styles.statText}>👁 {formatViews(story.views)}</Text>
          <Text style={styles.statText}>📖 {story.chaptersCount} chương</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Format số lượt xem
function formatViews(views: number): string {
  if (views >= 1000000) {
    return (views / 1000000).toFixed(1) + 'M';
  }
  if (views >= 1000) {
    return (views / 1000).toFixed(1) + 'K';
  }
  return views.toString();
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnail: {
    width: 100,
    height: 140,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  author: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  categoryChip: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    color: '#1976D2',
    fontWeight: '500',
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
  },
  statText: {
    fontSize: 12,
    color: '#999',
  },
});