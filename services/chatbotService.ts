import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { storyService } from './storyService';
import { categoryService } from './categoryService';
import { authorService } from './authorService';

interface ChatMessage {
  role: string;
  content: string;
}

interface StoryContext {
  hotStories?: any[];
  categories?: any[];
  searchResults?: any[];
  authorStories?: any[];
}

class ChatbotService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  private conversationHistory: ChatMessage[] = [];
  private storyContext: StoryContext = {};

  constructor() {
    this.apiKey = 
      process.env.EXPO_PUBLIC_GEMINI_API_KEY || 
      Constants.expoConfig?.extra?.geminiApiKey || 
      '';
    
    if (!this.apiKey) {
      console.error('⚠️ API Key không được tìm thấy! Kiểm tra file .env');
    }
  }

  /**
   * Phân tích ý định của người dùng
   */
  private async analyzeIntent(message: string): Promise<{
    intent: 'search' | 'hot' | 'category' | 'author' | 'general' | 'recommendation';
    params?: any;
  }> {
    const lowerMessage = message.toLowerCase();
    
    // Tìm kiếm truyện
    if (lowerMessage.includes('tìm') || lowerMessage.includes('tim') || 
        lowerMessage.includes('search') || lowerMessage.includes('có truyện')) {
      const keyword = message.replace(/tìm|tim|kiếm|kiem|search|có truyện|truyen|về|cho tôi|cho toi/gi, '').trim();
      return { intent: 'search', params: { keyword } };
    }
    
    // Truyện hot
    if (lowerMessage.includes('hot') || lowerMessage.includes('phổ biến') || 
        lowerMessage.includes('pho bien') || lowerMessage.includes('nổi bật') ||
        lowerMessage.includes('xem nhiều') || lowerMessage.includes('đọc nhiều') ||
        lowerMessage.includes('thể bạn') || lowerMessage.includes('the ban')) {
      return { intent: 'hot' };
    }
    
    // Thể loại
    const categoryKeywords = ['thể loại', 'the loai', 'category', 'kiểu', 'kieu'];
    if (categoryKeywords.some(kw => lowerMessage.includes(kw))) {
      return { intent: 'category', params: { query: message } };
    }
    
    // Tác giả
    if (lowerMessage.includes('tác giả') || lowerMessage.includes('tac gia') || 
        lowerMessage.includes('author') || lowerMessage.includes('của ai')) {
      return { intent: 'author', params: { query: message } };
    }
    
    // Gợi ý
    if (lowerMessage.includes('gợi ý') || lowerMessage.includes('goi y') || 
        lowerMessage.includes('recommend') || lowerMessage.includes('đề xuất') ||
        lowerMessage.includes('nên đọc')) {
      return { intent: 'recommendation' };
    }
    
    return { intent: 'general' };
  }

  /**
   * Lấy dữ liệu từ database - CẢI TIẾN + DEBUG
   */
  private async fetchRelevantData(intent: string, params?: any): Promise<string> {
    try {
      switch (intent) {
        case 'search':
          if (params?.keyword) {
            const response = await storyService.searchStories(params.keyword);
            this.storyContext.searchResults = response.data;
            
            console.log('🔍 Search results:', response.data); // DEBUG
            
            if (!response.data || response.data.length === 0) {
              return `Kết quả tìm kiếm cho "${params.keyword}": KHÔNG TÌM THẤY TRUYỆN NÀO.`;
            }
            
            return this.formatStoriesForAI(response.data, `Kết quả tìm "${params.keyword}"`);
          }
          break;
          
        case 'hot':
          const hotResponse = await storyService.getHotStories();
          this.storyContext.hotStories = hotResponse.data;
          
          console.log('🔥 Hot stories:', hotResponse.data); // DEBUG
          
          return this.formatStoriesForAI(hotResponse.data, 'Truyện HOT');
          
        case 'category':
          const categoriesResponse = await categoryService.getAllCategories();
          this.storyContext.categories = categoriesResponse.data;
          
          console.log('🏷️ Categories:', categoriesResponse.data); // DEBUG
          
          return this.formatCategoriesForAI(categoriesResponse.data);
          
        case 'recommendation':
          const [hot, cats] = await Promise.all([
            storyService.getHotStories(),
            categoryService.getAllCategories()
          ]);
          this.storyContext.hotStories = hot.data;
          this.storyContext.categories = cats.data;
          
          console.log('💡 Recommendation data:', { hot: hot.data, cats: cats.data }); // DEBUG
          
          return this.formatStoriesForAI(hot.data, 'Gợi ý hôm nay');
          
        default:
          return '';
      }
    } catch (error) {
      console.error('❌ Error fetching data:', error); // DEBUG
      return 'LỖI: Không thể lấy dữ liệu từ server.';
    }
    
    return '';
  }

  /**
   * Format truyện - CẢI TIẾN: Ngắn gọn, tập trung vào thông tin quan trọng
   */
  private formatStoriesForAI(stories: any[], title: string): string {
    if (!stories || stories.length === 0) {
      return `${title}: KHÔNG CÓ TRUYỆN.`;
    }
    
    const formattedStories = stories.slice(0, 5).map((story, index) => {
      const categories = story.categories?.map((c: any) => c.name).join(', ') || 'Chưa phân loại';
      const author = story.author?.name || 'Không rõ';
      const status = story.status === 'COMPLETED' ? '✅ Hoàn thành' : '🔄 Đang ra';
      const views = (story.viewCount || 0).toLocaleString('vi-VN');
      const chapters = story.chapterCount || 0;
      
      return `${index + 1}. 📖 **${story.title}**
   👤 Tác giả: ${author}
   🏷️ Thể loại: ${categories}
   ${status} | 👁️ ${views} lượt xem | 📚 ${chapters} chương`;
    }).join('\n\n');
    
    return `${title} (Top ${Math.min(stories.length, 5)}):\n\n${formattedStories}`;
  }

  /**
   * Format thể loại - CẢI TIẾN
   */
  private formatCategoriesForAI(categories: any[]): string {
    if (!categories || categories.length === 0) {
      return 'KHÔNG CÓ THỂ LOẠI NÀO.';
    }
    
    const formatted = categories.slice(0, 8).map((cat, index) => 
      `${index + 1}. 🏷️ **${cat.name}** (${cat.slug})`
    ).join('\n');
    
    return `Thể loại truyện có sẵn:\n${formatted}`;
  }

  /**
   * System prompt - CẢI TIẾN: Bắt buộc hiển thị danh sách
   */
  private buildSystemPrompt(dataContext: string): string {
    return `Bạn là AI trợ lý ứng dụng đọc truyện.

DỮ LIỆU HIỆN CÓ:
${dataContext}

QUY TẮC BẮT BUỘC:
1. LUÔN LUÔN hiển thị danh sách truyện từ dữ liệu trên
2. Format: "📖 **Tên truyện** - Tác giả: X, Thể loại: Y"
3. Thêm 1-2 câu mô tả ngắn tại sao nên đọc
4. CHỈ gợi ý truyện CÓ TRONG DỮ LIỆU
5. KHÔNG được tóm tắt chung chung
6. KHÔNG bịa tên truyện

Ví dụ đúng:
"Đây là những truyện nhiều lượt xem:

📖 **Mắt Biếc** - Tác giả: Nguyễn Nhật Ánh, Thể loại: Học Đường, Ngôn Tình
Câu chuyện tình yêu tuổi học trò đầy cảm xúc.

📖 **Tôi Thấy Hoa Vàng** - Tác giả: Nguyễn Nhật Ánh, Thể loại: Học Đường
Kỷ niệm tuổi thơ đầy hoài niệm."

Ví dụ SAI (KHÔNG làm thế này):
"Có những truyện có lượt xem cao mà mình tìm được..."`;
  }

  /**
   * Chat function - CẢI TIẾN
   */
  async chat(message: string, customSystemPrompt?: string): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new Error('API Key is missing');
      }

      // Phân tích ý định
      const { intent, params } = await this.analyzeIntent(message);
      
      // Lấy dữ liệu
      const dataContext = await this.fetchRelevantData(intent, params);
      
      console.log('📊 Data context for AI:', dataContext); // DEBUG - xem AI nhận được gì
      
      // Tạo system prompt
      const systemPrompt = customSystemPrompt || this.buildSystemPrompt(dataContext);
      
      // Thêm tin nhắn
      this.conversationHistory.push({
        role: 'user',
        content: message
      });

      // Giữ lịch sử ngắn
      if (this.conversationHistory.length > 8) {
        this.conversationHistory = this.conversationHistory.slice(-8);
      }

      // Tạo prompt với lịch sử ngắn hơn
      const recentHistory = this.conversationHistory.slice(-3).map(msg => 
        `${msg.role === 'user' ? '👤' : '🤖'}: ${msg.content}`
      ).join('\n');

      const fullPrompt = `${systemPrompt}

LỊCH SỬ GẦN NHẤT:
${recentHistory}

QUAN TRỌNG: 
- Bạn PHẢI liệt kê CỤ THỂ từng truyện với tên, tác giả, thể loại
- KHÔNG được nói chung chung kiểu "có những truyện..."
- Hãy copy CHÍNH XÁC thông tin từ DỮ LIỆU HIỆN CÓ ở trên`;

      const requestBody = {
        contents: [{
          parts: [{ text: fullPrompt }]
        }],
        generationConfig: {
          temperature: 0.7, // Giảm xuống để chính xác hơn
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1000, // Tăng lên để đủ chỗ liệt kê
        }
      };

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error?.message || 'API request failed');
      }

      const data = await response.json();
      const result = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!result) {
        throw new Error('Không nhận được phản hồi từ AI');
      }

      // Lưu phản hồi
      this.conversationHistory.push({
        role: 'assistant',
        content: result
      });

      return result;
    } catch (error) {
      console.error('Chatbot service error:', error);
      
      if (Platform.OS === 'web' && error instanceof TypeError) {
        throw new Error('Lỗi kết nối. Vui lòng thử lại.');
      }
      
      throw error;
    }
  }

  resetConversation() {
    this.conversationHistory = [];
    this.storyContext = {};
  }

  async getQuickSuggestions(): Promise<string[]> {
    return [
      '📚 Gợi ý truyện hay',
      '🔥 Top truyện hot',
      '🔍 Tìm truyện tiên hiệp',
      '❤️ Truyện ngôn tình',
      '🏷️ Có thể loại nào?'
    ];
  }
}

export const chatbotService = new ChatbotService();