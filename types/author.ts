import { Story } from './story';

// DTO cho danh sách tác giả
export interface Author {
  id: number;
  name: string;
  bio: string;
  avatarUrl: string;
  createdAt: string;
  storyCount: number; // Số lượng truyện của tác giả
}

// DTO cho chi tiết tác giả (có danh sách truyện)
export interface AuthorDetail {
  id: number;
  name: string;
  bio: string;
  avatarUrl: string;
  createdAt: string;
  stories: Story[]; // Danh sách truyện của tác giả
}