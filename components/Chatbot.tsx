import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { chatbotService } from '@/services/chatbotService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const Chatbot = () => {
  const { isDarkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const colors = {
    background: isDarkMode ? '#1a1a1a' : '#ffffff',
    surface: isDarkMode ? '#2d2d2d' : '#f5f5f5',
    primary: '#3b82f6',
    text: isDarkMode ? '#ffffff' : '#000000',
    textSecondary: isDarkMode ? '#a0a0a0' : '#666666',
    userBubble: '#3b82f6',
    assistantBubble: isDarkMode ? '#2d2d2d' : '#e5e5e5',
    suggestionBg: isDarkMode ? '#2d2d2d' : '#f0f0f0',
    border: isDarkMode ? '#3a3a3a' : '#e0e0e0',
  };

  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  useEffect(() => {
    // Load quick suggestions khi mở chatbot
    if (isOpen && messages.length === 0) {
      loadSuggestions();
    }
  }, [isOpen]);

  const loadSuggestions = async () => {
    try {
      const quickSuggestions = await chatbotService.getQuickSuggestions();
      setSuggestions(quickSuggestions);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowSuggestions(false);

    try {
      const response = await chatbotService.chat(textToSend);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error?.message || 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    // Remove emoji và gửi
    const cleanText = suggestion.replace(/[📚🔥🔍❤️📖✨💫]/g, '').trim();
    handleSend(cleanText);
  };

  const handleReset = () => {
    setMessages([]);
    setShowSuggestions(true);
    chatbotService.resetConversation();
    loadSuggestions();
  };

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View
        style={{
          flexDirection: 'row',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          marginVertical: 4,
          paddingHorizontal: 12,
        }}
      >
        <View
          style={{
            maxWidth: '80%',
            padding: 12,
            borderRadius: 16,
            backgroundColor: isUser ? colors.userBubble : colors.assistantBubble,
          }}
        >
          <Text
            style={{
              color: isUser ? '#ffffff' : colors.text,
              fontSize: 15,
              lineHeight: 22,
            }}
          >
            {item.content}
          </Text>
          <Text
            style={{
              color: isUser ? 'rgba(255,255,255,0.7)' : colors.textSecondary,
              fontSize: 11,
              marginTop: 4,
            }}
          >
            {item.timestamp.toLocaleTimeString('vi-VN', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Ionicons name="chatbubbles-outline" size={64} color={colors.textSecondary} />
      <Text style={{ color: colors.text, fontSize: 20, fontWeight: '600', marginTop: 16 }}>
        Xin chào! 👋
      </Text>
      <Text style={{ 
        color: colors.textSecondary, 
        fontSize: 14, 
        marginTop: 8, 
        textAlign: 'center',
        lineHeight: 20,
      }}>
        Tôi là trợ lý AI của bạn.{'\n'}
        Hãy hỏi tôi về truyện, gợi ý đọc truyện hoặc bất cứ điều gì!
      </Text>
      
      {/* Quick suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={{ marginTop: 24, width: '100%' }}>
          <Text style={{ 
            color: colors.text, 
            fontSize: 13, 
            fontWeight: '600', 
            marginBottom: 12 
          }}>
            💡 Gợi ý nhanh:
          </Text>
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleSuggestionPress(suggestion)}
              style={{
                backgroundColor: colors.suggestionBg,
                padding: 12,
                borderRadius: 12,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 14 }}>
                {suggestion}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <>
      {/* Floating Button */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          transform: [{ scale: scaleAnim }],
          zIndex: 1000,
        }}
      >
        <TouchableOpacity
          onPress={() => {
            animateButton();
            setIsOpen(true);
          }}
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          }}
        >
          <Ionicons name="chatbubble-ellipses" size={28} color="#ffffff" />
          {/* Badge for new messages indicator */}
          <View
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: '#ef4444',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: 'bold' }}>
              AI
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Chat Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, backgroundColor: colors.background }}
        >
          {/* Header */}
          <View
            style={{
              backgroundColor: colors.primary,
              paddingTop: Platform.OS === 'ios' ? 50 : 20,
              paddingBottom: 16,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              elevation: 4,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Ionicons name="sparkles" size={24} color="#ffffff" />
              <View style={{ marginLeft: 12 }}>
                <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '600' }}>
                  Trợ lý AI
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                  Hỗ trợ tìm truyện & gợi ý
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {messages.length > 0 && (
                <TouchableOpacity onPress={handleReset}>
                  <Ionicons name="refresh" size={24} color="#ffffff" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Ionicons name="close" size={28} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Messages */}
          <View style={{ flex: 1 }}>
            {messages.length === 0 ? (
              renderEmptyState()
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingVertical: 12 }}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              />
            )}
            {isLoading && (
              <View style={{ flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8 }}>
                <View
                  style={{
                    padding: 12,
                    borderRadius: 16,
                    backgroundColor: colors.assistantBubble,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={{ color: colors.textSecondary, marginLeft: 8 }}>
                    Đang suy nghĩ...
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Input */}
          <View
            style={{
              padding: 12,
              backgroundColor: colors.surface,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Hỏi về truyện, gợi ý, tác giả..."
                placeholderTextColor={colors.textSecondary}
                style={{
                  flex: 1,
                  backgroundColor: colors.background,
                  borderRadius: 24,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 15,
                  color: colors.text,
                  marginRight: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                  maxHeight: 100,
                }}
                multiline
                maxLength={500}
                editable={!isLoading}
                onSubmitEditing={() => handleSend()}
              />
              <TouchableOpacity
                onPress={() => handleSend()}
                disabled={!input.trim() || isLoading}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: input.trim() && !isLoading ? colors.primary : colors.textSecondary,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons 
                  name={isLoading ? "hourglass-outline" : "send"} 
                  size={20} 
                  color="#ffffff" 
                />
              </TouchableOpacity>
            </View>
            <Text style={{ 
              color: colors.textSecondary, 
              fontSize: 11, 
              marginTop: 6,
              textAlign: 'center' 
            }}>
              AI có thể mắc lỗi. Hãy kiểm tra thông tin quan trọng.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};