import Constants from 'expo-constants';
import { Platform } from 'react-native';

interface ChatMessage {
  role: string;
  content: string;
}

class ChatbotService {
  private apiKey: string;
  // Sử dụng Gemini 2.5 Flash - nhanh, nhẹ, quota thấp hơn Pro
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

  constructor() {
    this.apiKey = 
      process.env.EXPO_PUBLIC_GEMINI_API_KEY || 
      Constants.expoConfig?.extra?.geminiApiKey || 
      '';
    
    // Debug: kiểm tra API key có được load không
    console.log('API Key loaded:', this.apiKey ? 'Yes (' + this.apiKey.substring(0, 10) + '...)' : 'No');
    
    if (!this.apiKey) {
      console.error('⚠️ API Key không được tìm thấy! Kiểm tra file .env');
    }
  }

  async chat(message: string, systemPrompt?: string): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new Error('API Key is missing');
      }

      // Gộp system prompt và tin nhắn người dùng
      const fullPrompt = systemPrompt 
        ? `${systemPrompt}\n\nNgười dùng: ${message}` 
        : message;

      const requestBody = {
        contents: [{
          parts: [{ text: fullPrompt }]
        }]
      };

      console.log('Sending request to:', `${this.baseUrl}?key=${this.apiKey.substring(0, 10)}...`);
      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));

      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        console.error('API Error details:', data);
        
        // Hiển thị lỗi chi tiết hơn
        if (data.error?.message) {
          throw new Error(data.error.message);
        }
        
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }

      const result = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!result) {
        console.error('No text in response:', data);
        throw new Error('Không nhận được phản hồi từ AI');
      }

      return result;
    } catch (error) {
      console.error('Chatbot service error:', error);
      
      // Nếu là lỗi CORS trên web
      if (Platform.OS === 'web' && error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Lỗi kết nối. Vui lòng thử lại hoặc sử dụng ứng dụng trên mobile.');
      }
      
      throw error;
    }
  }
}

export const chatbotService = new ChatbotService();