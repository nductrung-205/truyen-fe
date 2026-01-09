// DTO cho thể loại
export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  storyCount: number; // Số lượng truyện trong thể loại
}