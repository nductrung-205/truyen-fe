export interface Review {
  id: number;
  username: string;
  avatarUrl: string | null;
  rating: number;
  content: string;
  createdAt: string;
  userExp: number; // Dùng để tính Level
}