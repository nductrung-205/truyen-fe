import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Category } from '@/types';

interface CategoryChipProps {
  category: Category;
  onPress: () => void;
  isSelected?: boolean;
}

export function CategoryChip({ category, onPress, isSelected = false }: CategoryChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, isSelected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {category.icon && <Text style={styles.icon}>{category.icon}</Text>}
      <Text style={[styles.text, isSelected && styles.textSelected]}>
        {category.name}
      </Text>
      {category.storyCount > 0 && (
        <Text style={[styles.count, isSelected && styles.countSelected]}>
          {category.storyCount}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#1976D2',
  },
  icon: {
    fontSize: 16,
    marginRight: 6,
  },
  text: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  textSelected: {
    color: '#1976D2',
    fontWeight: '600',
  },
  count: {
    fontSize: 11,
    color: '#999',
    marginLeft: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countSelected: {
    backgroundColor: '#1976D2',
    color: '#fff',
  },
});