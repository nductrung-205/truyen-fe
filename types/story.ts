// DTO cho danh sách truyện (response từ API)
export interface Story {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
  authorName: string;
  categoryNames: string[];
  views: number;
  rating?: number; // Optional vì không phải lúc nào cũng có
  chaptersCount: number;
}

// DTO cho chi tiết truyện đầy đủ
export interface StoryDetail {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
  description: string;
  status: string; // "Đang ra", "Hoàn thành"
  views: number;
  rating: number;
  chaptersCount: number;
  
  // Thông tin tác giả
  authorId: number;
  authorName: string;
  authorAvatarUrl: string;
  
  // Danh sách thể loại
  categoryNames: string[];
  
  // Danh sách chapter (tóm tắt)
  chapters: ChapterSummary[];
  
  createdAt: string;
  updatedAt: string;
}

// Tóm tắt chapter trong chi tiết truyện
export interface ChapterSummary {
  id: number;
  chapterNumber: number;
  title: string;
  views: number;
  updatedAt: string;
}

// Response phân trang từ API
export interface PaginatedStories {
  stories: Story[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
}

export interface StoryResponse {
  stories: Story[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export interface ApiResponse {
  data: StoryResponse | Story[]; // Vì có chỗ bạn dùng response.data.stories, có chỗ dùng response.data trực tiếp
}