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
  };

  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatbotService.chat(
        userMessage.content,
        'Bạn là trợ lý AI cho ứng dụng đọc truyện. Hãy gợi ý truyện hay, trả lời câu hỏi về truyện, và hỗ trợ người dùng một cách thân thiện.'
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
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
              lineHeight: 20,
            }}
          >
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Ionicons name="chatbubbles-outline" size={64} color={colors.textSecondary} />
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600', marginTop: 16 }}>
        Xin chào! 👋
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 8, textAlign: 'center' }}>
        Tôi là trợ lý AI. Hỏi tôi về truyện, gợi ý đọc truyện, hoặc bất cứ điều gì bạn cần!
      </Text>
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
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="chatbubbles" size={24} color="#ffffff" />
              <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '600', marginLeft: 12 }}>
                Trợ lý AI
              </Text>
            </View>
            <TouchableOpacity onPress={() => setIsOpen(false)}>
              <Ionicons name="close" size={28} color="#ffffff" />
            </TouchableOpacity>
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
                  <Text style={{ color: colors.textSecondary, marginLeft: 8 }}>Đang trả lời...</Text>
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
              borderTopColor: isDarkMode ? '#3a3a3a' : '#e0e0e0',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Nhập tin nhắn..."
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
                  borderColor: isDarkMode ? '#3a3a3a' : '#e0e0e0',
                }}
                multiline
                maxLength={500}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={handleSend}
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
                <Ionicons name="send" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};