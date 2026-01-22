import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { storyService } from './storyService';
import { categoryService } from './categoryService';

interface ChatMessage {
  role: string;
  content: string;
}

interface StoryContext {
  hotStories?: any[];
  categories?: any[];
  searchResults?: any[];
}

class ChatbotService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  private conversationHistory: ChatMessage[] = [];
  private storyContext: StoryContext = {};

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || Constants.expoConfig?.extra?.geminiApiKey || '';
    if (!this.apiKey) console.error('⚠️ Gemini API Key missing!');
  }

  private async analyzeIntent(message: string): Promise<{ intent: string; params?: any }> {
    const msg = message.toLowerCase();
    if (msg.includes('tìm') || msg.includes('có truyện') || msg.includes('search')) {
      const keyword = message.replace(/tìm|kiếm|search|có truyện|truyện/gi, '').trim();
      return { intent: 'search', params: { keyword } };
    }
    if (msg.includes('hot') || msg.includes('xem nhiều') || msg.includes('gợi ý') || msg.includes('đề xuất')) {
      return { intent: 'hot' };
    }
    if (msg.includes('thể loại') || msg.includes('loại nào')) return { intent: 'category' };
    return { intent: 'general' };
  }

  private async fetchRelevantData(intent: string, params?: any): Promise<string> {
    try {
      // Luôn lấy truyện HOT làm ngữ cảnh nền
      const hotRes = await storyService.getHotStories();
      const hotData = hotRes.data || [];
      this.storyContext.hotStories = hotData;

      switch (intent) {
        case 'search':
          if (params?.keyword) {
            const searchRes = await storyService.searchStories(params.keyword);
            if (searchRes.data && searchRes.data.length > 0) {
              return this.formatStoriesForAI(searchRes.data, `Kết quả tìm cho "${params.keyword}"`);
            }
            return `Không tìm thấy "${params.keyword}". Gợi ý truyện hot:\n` + this.formatStoriesForAI(hotData, 'Truyện nổi bật');
          }
          break;
        case 'category':
          const catRes = await categoryService.getAllCategories();
          return this.formatCategoriesForAI(catRes.data);
        default:
          return this.formatStoriesForAI(hotData, 'Danh sách truyện nổi bật');
      }
    } catch (error) {
      return 'Không thể kết nối dữ liệu server.';
    }
    return '';
  }

  private formatStoriesForAI(stories: any[], title: string): string {
    if (!stories || stories.length === 0) return "";
    return `${title}:\n\n` + stories.slice(0, 10).map((s, i) => (
      `${i + 1}. 📖 **${s.title}**\n   👤 Tác giả: ${s.authorName || 'Không rõ'}\n   🏷️ Thể loại: ${s.categoryNames?.join(', ') || 'Chưa phân loại'}\n   👁️ ${s.views || 0} lượt xem | 📚 ${s.chaptersCount || 0} chương`
    )).join('\n\n');
  }

  private formatCategoriesForAI(categories: any[]): string {
    if (!categories) return "";
    return "Các thể loại hiện có: " + categories.map(c => c.name).join(', ');
  }

  async chat(message: string): Promise<string> {
    try {
      const { intent, params } = await this.analyzeIntent(message);
      const dataContext = await this.fetchRelevantData(intent, params);

      const systemPrompt = `Bạn là Trợ lý AI của ứng dụng "Truyện Hay".
      DỮ LIỆU THỰC TẾ TỪ HỆ THỐNG:
      ${dataContext}

      QUY TẮC:
      1. Nếu người dùng hỏi về truyện/gợi ý: Bạn PHẢI dùng dữ liệu trên để liệt kê. 
      2. Nếu không có dữ liệu khớp, hãy dùng danh sách "Truyện nổi bật" ở trên để gợi ý.
      3. Tuyệt đối không bịa đặt tên truyện không có trong danh sách.
      4. Trả lời thân thiện, ngắn gọn bằng Tiếng Việt.`;

      const requestBody = {
        contents: [{ parts: [{ text: `${systemPrompt}\n\nNgười dùng: ${message}` }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
      };

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      return "Xin lỗi, tôi gặp trục trặc khi kết nối. Hãy thử lại sau!";
    }
  }

  resetConversation() { this.conversationHistory = []; }
  async getQuickSuggestions() { return ['🔥 Truyện hot nhất', '📚 Gợi ý truyện hay', '🏷️ Xem thể loại']; }
}

export const chatbotService = new ChatbotService();