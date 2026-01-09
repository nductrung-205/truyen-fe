import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Chapter } from '@/types';

interface ChapterItemProps {
  chapter: Chapter;
  onPress: () => void;
}

export function ChapterItem({ chapter, onPress }: ChapterItemProps) {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* Chapter Number + Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.chapterNumber}>
            Chương {chapter.chapterNumber}
          </Text>
          <Text style={styles.title} numberOfLines={1}>
            {chapter.title}
          </Text>
        </View>
        
        {/* Stats */}
        <View style={styles.stats}>
          <Text style={styles.views}>👁 {formatViews(chapter.views)}</Text>
          <Text style={styles.date}>{formatDate(chapter.updatedAt)}</Text>
        </View>
      </View>
      
      {/* Arrow */}
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

function formatViews(views: number): string {
  if (views >= 1000) {
    return (views / 1000).toFixed(1) + 'K';
  }
  return views.toString();
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) {
    return `${diffMins} phút trước`;
  } else if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  } else if (diffDays < 7) {
    return `${diffDays} ngày trước`;
  } else {
    return date.toLocaleDateString('vi-VN');
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  content: {
    flex: 1,
  },
  titleContainer: {
    marginBottom: 6,
  },
  chapterNumber: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 2,
  },
  title: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
  },
  views: {
    fontSize: 12,
    color: '#999',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  arrow: {
    fontSize: 24,
    color: '#ccc',
    marginLeft: 8,
  },
});