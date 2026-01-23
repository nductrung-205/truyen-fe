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
  recentSearches?: string[];
  userPreferences?: {
    favoriteGenres?: string[];
    readingHistory?: string[];
  };
}

interface IntentResult {
  intent: string;
  params?: any;
  confidence?: number;
  entities?: any;
}

class ChatbotService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  private conversationHistory: ChatMessage[] = [];
  private storyContext: StoryContext = {
    recentSearches: [],
    userPreferences: {}
  };
  private maxHistoryLength = 10;

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || Constants.expoConfig?.extra?.geminiApiKey || '';
    if (!this.apiKey) console.error('⚠️ Gemini API Key missing!');
    this.loadUserPreferences();
  }

  // ==================== QUẢN LÝ NGÔN NGỮ ====================
  private detectLanguage(text: string): 'vi' | 'en' {
    const vietnamesePattern = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
    return vietnamesePattern.test(text) ? 'vi' : 'en';
  }

  // ==================== PHÂN TÍCH Ý ĐỊNH NÂNG CAO ====================
  private async analyzeIntent(message: string): Promise<IntentResult> {
    const msg = message.toLowerCase().trim();
    const lang = this.detectLanguage(message);
    
    // 1. TÌM KIẾM TRUYỆN
    if (this.matchPattern(msg, [
      'tìm', 'search', 'có truyện', 'kiếm', 'cho tôi', 'show me', 
      'tìm kiếm', 'tìm giúp', 'find', 'lookup'
    ])) {
      const keyword = this.extractKeyword(message, [
        'tìm', 'kiếm', 'search', 'có truyện', 'truyện', 'cho tôi', 'về'
      ]);
      return { intent: 'search', params: { keyword }, confidence: 0.9 };
    }

    // 2. GỢI Ý TRUYỆN HOT
    if (this.matchPattern(msg, [
      'hot', 'nổi bật', 'phổ biến', 'xem nhiều', 'trending', 
      'gợi ý', 'đề xuất', 'recommend', 'popular', 'best'
    ])) {
      return { intent: 'hot', confidence: 0.95 };
    }

    // 3. THỂ LOẠI
    if (this.matchPattern(msg, [
      'thể loại', 'category', 'loại nào', 'có những thể loại', 
      'genre', 'phân loại', 'categories', 'types'
    ])) {
      return { intent: 'category', confidence: 0.9 };
    }

    // 4. CHI TIẾT TRUYỆN
    if (this.matchPattern(msg, [
      'chi tiết', 'thông tin về', 'giới thiệu', 'nội dung', 
      'details', 'about', 'summary', 'synopsis', 'mô tả'
    ])) {
      const storyName = this.extractKeyword(message, ['về', 'của', 'truyện', 'chi tiết']);
      return { intent: 'story_detail', params: { storyName }, confidence: 0.85 };
    }

    // 5. LỌC THEO THỂ LOẠI
    if (this.matchPattern(msg, [
      'truyện', 'tiên hiệp', 'ngôn tình', 'kiếm hiệp', 'huyền huyễn',
      'romance', 'action', 'fantasy', 'mystery', 'horror'
    ])) {
      const genre = this.extractGenre(message);
      return { intent: 'filter_by_genre', params: { genre }, confidence: 0.8 };
    }

    // 6. THỐNG KÊ & SO SÁNH
    if (this.matchPattern(msg, [
      'so sánh', 'khác nhau', 'giống nhau', 'compare', 
      'difference', 'vs', 'versus'
    ])) {
      return { intent: 'compare', confidence: 0.7 };
    }

    // 7. TRỢ GIÚP
    if (this.matchPattern(msg, [
      'help', 'trợ giúp', 'hướng dẫn', 'làm sao', 'how to', 
      'guide', 'giúp tôi', 'cách'
    ])) {
      return { intent: 'help', confidence: 0.95 };
    }

    // 8. LỊCH SỬ ĐỌC
    if (this.matchPattern(msg, [
      'lịch sử', 'đã đọc', 'history', 'recent', 'gần đây'
    ])) {
      return { intent: 'history', confidence: 0.8 };
    }

    return { intent: 'general', confidence: 0.5 };
  }

  // Helper functions
  private matchPattern(text: string, patterns: string[]): boolean {
    return patterns.some(pattern => text.includes(pattern));
  }

  private extractKeyword(text: string, stopWords: string[]): string {
    let cleaned = text;
    stopWords.forEach(word => {
      cleaned = cleaned.replace(new RegExp(word, 'gi'), '');
    });
    return cleaned.trim();
  }

  private extractGenre(text: string): string {
    const genres = {
      'tiên hiệp': ['tiên hiệp', 'tu tiên', 'xian'],
      'ngôn tình': ['ngôn tình', 'romance', 'tình cảm'],
      'kiếm hiệp': ['kiếm hiệp', 'võ hiệp', 'martial'],
      'huyền huyễn': ['huyền huyễn', 'fantasy', 'phép thuật'],
      'trinh thám': ['trinh thám', 'mystery', 'detective'],
      'kinh dị': ['kinh dị', 'horror', 'ma']
    };

    for (const [key, patterns] of Object.entries(genres)) {
      if (patterns.some(p => text.includes(p))) return key;
    }
    return '';
  }

  // ==================== LẤY DỮ LIỆU THÔNG MINH ====================
  private async fetchRelevantData(intent: string, params?: any): Promise<string> {
    try {
      switch (intent) {
        case 'search':
          return await this.handleSearch(params?.keyword);
        
        case 'hot':
          return await this.handleHotStories();
        
        case 'category':
          return await this.handleCategories();
        
        case 'filter_by_genre':
          return await this.handleFilterByGenre(params?.genre);
        
        case 'story_detail':
          return await this.handleStoryDetail(params?.storyName);
        
        case 'help':
          return this.getHelpMessage();
        
        case 'history':
          return this.getReadingHistory();
        
        default:
          return await this.handleHotStories();
      }
    } catch (error) {
      console.error('Fetch data error:', error);
      return 'Không thể kết nối dữ liệu server.';
    }
  }

  private async handleSearch(keyword: string): Promise<string> {
    if (!keyword) return await this.handleHotStories();
    
    // Lưu lịch sử tìm kiếm
    this.addToRecentSearches(keyword);
    
    const searchRes = await storyService.searchStories(keyword);
    if (searchRes.data && searchRes.data.length > 0) {
      this.storyContext.searchResults = searchRes.data;
      return this.formatStoriesForAI(searchRes.data, `🔍 Kết quả tìm kiếm "${keyword}" (${searchRes.data.length} truyện)`);
    }
    
    // Nếu không tìm thấy, gợi ý từ khóa tương tự
    const hotRes = await storyService.getHotStories();
    return `❌ Không tìm thấy "${keyword}".\n\n💡 Bạn có muốn thử:\n- Tìm theo thể loại\n- Xem truyện hot\n- Tìm tác giả\n\n` + 
           this.formatStoriesForAI(hotRes.data.slice(0, 5), '📚 Truyện đề xuất');
  }

  private async handleHotStories(): Promise<string> {
    const hotRes = await storyService.getHotStories();
    this.storyContext.hotStories = hotRes.data;
    return this.formatStoriesForAI(hotRes.data, '🔥 TOP TRUYỆN HOT NHẤT');
  }

  private async handleCategories(): Promise<string> {
    const catRes = await categoryService.getAllCategories();
    this.storyContext.categories = catRes.data;
    return this.formatCategoriesForAI(catRes.data);
  }

  private async handleFilterByGenre(genre: string): Promise<string> {
    if (!genre) return 'Vui lòng cho tôi biết thể loại bạn muốn xem!';
    
    const searchRes = await storyService.searchStories(genre);
    if (searchRes.data && searchRes.data.length > 0) {
      return this.formatStoriesForAI(searchRes.data, `📖 Truyện thể loại "${genre}"`);
    }
    return `Không tìm thấy truyện thể loại "${genre}". Hãy thử thể loại khác!`;
  }

  private async handleStoryDetail(storyName: string): Promise<string> {
    if (!storyName) return 'Bạn muốn biết chi tiết truyện nào?';
    
    const searchRes = await storyService.searchStories(storyName);
    if (searchRes.data && searchRes.data.length > 0) {
      const story = searchRes.data[0];
      return `📚 **${story.title}**\n\n` +
             `👤 Tác giả: ${story.authorName || 'Chưa rõ'}\n` +
             `🏷️ Thể loại: ${story.categoryNames?.join(', ') || 'Chưa phân loại'}\n` +
             `📊 Lượt xem: ${story.views?.toLocaleString() || 0}\n` +
             `📚 Số chương: ${story.chaptersCount || 0}\n` +
             `⭐ Đánh giá: ${story.rating || 'Chưa có'}\n\n` +
             `📝 Mô tả: ${story.description || 'Đang cập nhật...'}`;
    }
    return `Không tìm thấy thông tin về "${storyName}"`;
  }

  private getHelpMessage(): string {
    return `🤖 **Trợ lý AI có thể giúp bạn:**\n\n` +
           `🔍 **Tìm kiếm**: "Tìm truyện về tu tiên"\n` +
           `🔥 **Truyện hot**: "Cho tôi truyện hot nhất"\n` +
           `📚 **Thể loại**: "Có những thể loại nào?"\n` +
           `📖 **Chi tiết**: "Thông tin về truyện ABC"\n` +
           `🎯 **Lọc**: "Truyện ngôn tình hay nhất"\n` +
           `📊 **So sánh**: "So sánh 2 truyện"\n` +
           `⏱️ **Lịch sử**: "Lịch sử đọc của tôi"\n\n` +
           `💬 Bạn có thể hỏi bằng tiếng Việt hoặc tiếng Anh!`;
  }

  private getReadingHistory(): string {
    if (!this.storyContext.recentSearches || this.storyContext.recentSearches.length === 0) {
      return '📭 Bạn chưa tìm kiếm gì gần đây.';
    }
    return `📜 **Lịch sử tìm kiếm gần đây:**\n\n` +
           this.storyContext.recentSearches.map((s, i) => `${i + 1}. ${s}`).join('\n');
  }

  // ==================== FORMAT DỮ LIỆU ====================
  private formatStoriesForAI(stories: any[], title: string): string {
    if (!stories || stories.length === 0) return "";
    
    const formatted = stories.slice(0, 10).map((s, i) => {
      const viewCount = s.views ? (s.views >= 1000 ? `${(s.views/1000).toFixed(1)}K` : s.views) : 0;
      return `${i + 1}. 📖 **${s.title}**\n` +
             `   👤 ${s.authorName || 'Ẩn danh'}\n` +
             `   🏷️ ${s.categoryNames?.join(', ') || 'Chưa phân loại'}\n` +
             `   👁️ ${viewCount} | 📚 ${s.chaptersCount || 0} chương` +
             (s.status ? ` | ${s.status === 'completed' ? '✅ Hoàn thành' : '📝 Đang ra'}` : '');
    }).join('\n\n');

    return `${title}:\n\n${formatted}`;
  }

  private formatCategoriesForAI(categories: any[]): string {
    if (!categories || categories.length === 0) return "";
    
    return `📚 **CÁC THỂ LOẠI HIỆN CÓ** (${categories.length} thể loại):\n\n` +
           categories.map((c, i) => `${i + 1}. ${c.name} ${c.count ? `(${c.count} truyện)` : ''}`).join('\n') +
           `\n\n💡 Hãy cho tôi biết thể loại bạn thích, tôi sẽ gợi ý truyện hay!`;
  }

  // ==================== QUẢN LÝ NGỮ CẢNH ====================
  private addToRecentSearches(keyword: string) {
    if (!this.storyContext.recentSearches) {
      this.storyContext.recentSearches = [];
    }
    
    // Loại bỏ trùng lặp
    this.storyContext.recentSearches = this.storyContext.recentSearches.filter(s => s !== keyword);
    
    // Thêm vào đầu
    this.storyContext.recentSearches.unshift(keyword);
    
    // Giới hạn 10 tìm kiếm gần nhất
    if (this.storyContext.recentSearches.length > 10) {
      this.storyContext.recentSearches = this.storyContext.recentSearches.slice(0, 10);
    }
    
    this.saveUserPreferences();
  }

  private loadUserPreferences() {
    // TODO: Load from AsyncStorage
  }

  private saveUserPreferences() {
    // TODO: Save to AsyncStorage
  }

  // ==================== CHAT CHÍNH ====================
  async chat(message: string): Promise<string> {
    try {
      // Phân tích ý định
      const { intent, params, confidence } = await this.analyzeIntent(message);
      
      // Lấy dữ liệu liên quan
      const dataContext = await this.fetchRelevantData(intent, params);

      // Thêm vào lịch sử hội thoại
      this.conversationHistory.push({ role: 'user', content: message });
      
      // Giới hạn lịch sử
      if (this.conversationHistory.length > this.maxHistoryLength * 2) {
        this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength * 2);
      }

      // Tạo system prompt thông minh
      const systemPrompt = this.buildSystemPrompt(dataContext, intent);
      
      // Tạo context từ lịch sử
      const conversationContext = this.conversationHistory
        .slice(-6) // Lấy 3 cặp hội thoại gần nhất
        .map(msg => `${msg.role === 'user' ? 'Người dùng' : 'AI'}: ${msg.content}`)
        .join('\n');

      const requestBody = {
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\n=== LỊCH SỬ HỘI THOẠI ===\n${conversationContext}\n\n=== CÂU HỎI MỚI ===\nNgười dùng: ${message}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          topP: 0.8,
          topK: 40
        }
      };

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.candidates[0].content.parts[0].text;
      
      // Lưu phản hồi vào lịch sử
      this.conversationHistory.push({ role: 'assistant', content: aiResponse });
      
      return aiResponse;
    } catch (error) {
      console.error('Chat error:', error);
      return "😔 Xin lỗi, tôi gặp sự cố kỹ thuật. Vui lòng thử lại sau!";
    }
  }

  private buildSystemPrompt(dataContext: string, intent: string): string {
    const basePrompt = `Bạn là **Trợ lý AI thông minh** của ứng dụng "Truyện Hay" - một chatbot thân thiện, nhiệt tình và chuyên nghiệp.

🎯 **VAI TRÒ CỦA BẠN:**
- Giúp người dùng tìm kiếm, khám phá và gợi ý truyện
- Cung cấp thông tin chính xác dựa trên dữ liệu thực tế
- Trò chuyện tự nhiên, thân thiện bằng tiếng Việt hoặc tiếng Anh
- Hiểu ngữ cảnh và ghi nhớ cuộc hội thoại

📊 **DỮ LIỆU THỰC TẾ TỪ HỆ THỐNG:**
${dataContext}

✅ **QUY TẮC BẮT BUỘC:**
1. **LUÔN** dùng dữ liệu thực tế ở trên để trả lời
2. **TUYỆT ĐỐI KHÔNG** bịa đặt tên truyện, tác giả không có trong dữ liệu
3. Nếu không tìm thấy, gợi ý từ danh sách có sẵn hoặc đề xuất cách tìm khác
4. Trả lời ngắn gọn, súc tích, dễ hiểu
5. Sử dụng emoji phù hợp để sinh động
6. Thể hiện cá tính thân thiện, hữu ích

💬 **PHONG CÁCH TRUYỀN ĐẠT:**
- Tự nhiên như trò chuyện với bạn bè
- Tích cực, nhiệt tình
- Cung cấp giá trị ngay lập tức
- Đưa ra gợi ý hành động tiếp theo khi phù hợp`;

    // Thêm hướng dẫn riêng theo intent
    const intentGuides: Record<string, string> = {
      search: '\n\n🔍 Người dùng đang tìm kiếm. Hãy liệt kê kết quả rõ ràng và gợi ý mở rộng.',
      hot: '\n\n🔥 Người dùng muốn xem truyện hot. Hãy giới thiệu top truyện hấp dẫn nhất.',
      category: '\n\n📚 Người dùng quan tâm thể loại. Hãy liệt kê và mô tả ngắn gọn.',
      help: '\n\n💡 Người dùng cần trợ giúp. Hãy hướng dẫn rõ ràng, dễ hiểu.',
      general: '\n\n💬 Cuộc trò chuyện tự nhiên. Hãy thân thiện và gợi ý những gì có thể giúp.'
    };

    return basePrompt + (intentGuides[intent] || intentGuides.general);
  }

  // ==================== TIỆN ÍCH ====================
  resetConversation() {
    this.conversationHistory = [];
  }

  async getQuickSuggestions(): Promise<string[]> {
    return [
      '🔥 Truyện hot nhất',
      '🔍 Tìm truyện tiên hiệp',
      '📚 Có những thể loại nào?',
      '💡 Gợi ý cho tôi',
      '❓ Trợ giúp'
    ];
  }

  getConversationHistory() {
    return this.conversationHistory;
  }

  setMaxHistoryLength(length: number) {
    this.maxHistoryLength = Math.max(5, Math.min(20, length));
  }
}

export const chatbotService = new ChatbotService();