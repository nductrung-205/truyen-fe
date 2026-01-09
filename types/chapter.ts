// DTO cho danh sách chapter
export interface Chapter {
  id: number;
  chapterNumber: number;
  title: string;
  views: number;
  createdAt: string;
  updatedAt: string;
}

// DTO cho chi tiết chapter (có nội dung)
export interface ChapterDetail {
  id: number;
  chapterNumber: number;
  title: string;
  views: number;
  content: string; // Nội dung HTML hoặc text
  createdAt: string;
  updatedAt: string;
  
  // Navigation
  previousChapter: number | null;
  nextChapter: number | null;
}