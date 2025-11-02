import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Platform, 
  TextInput, 
  TouchableOpacity, 
  FlatList,
  KeyboardAvoidingView,
  ActivityIndicator
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import Constants from 'expo-constants';
import { loadHealthDaily, loadScreentime } from '../data/dbLoaders';
import { SafeAreaView } from 'react-native-safe-area-context';

type Message = { 
  id: string; 
  text: string; 
  isUser: boolean; 
  timestamp: number;
  isTyping?: boolean;
  fullText?: string;
};

export default function AskAltuScreen() {
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: 'Hi! Ask me about your steps, sleep, workouts, or app time.',
      isUser: false,
      timestamp: Date.now(),
    },
  ]);
  const [healthData, setHealthData] = useState<any[]>([]);
  const [screentimeData, setScreentimeData] = useState<any[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [health, screentime] = await Promise.all([
          loadHealthDaily(),
          loadScreentime()
        ]);
        setHealthData(health);
        setScreentimeData(screentime);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setDataLoading(false);
      }
    }
    loadData();
  }, []);

  const addMessage = useCallback((msg: Message) => {
    setMessages((prev) => [msg, ...prev]);
  }, []);

  const addTypingMessage = useCallback((fullText: string, messageId: string) => {
    // Clear any existing typing interval
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    // Add initial empty message
    const newMessage: Message = {
      id: messageId,
      text: '',
      isUser: false,
      timestamp: Date.now(),
      isTyping: true,
      fullText: fullText,
    };
    setMessages((prev) => [newMessage, ...prev]);

    // Animate typing
    let currentIndex = 0;
    const typingSpeed = 20; // milliseconds per character

    typingIntervalRef.current = setInterval(() => {
      currentIndex++;
      if (currentIndex <= fullText.length) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, text: fullText.substring(0, currentIndex) }
              : m
          )
        );
      } else {
        // Typing complete
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
        }
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, isTyping: false, fullText: undefined }
              : m
          )
        );
      }
    }, typingSpeed);
  }, []);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  async function handleSend() {
    const text = inputText.trim();
    if (!text) return;

    const userMsg: Message = {
      id: String(Date.now()),
      text: text,
      isUser: true,
      timestamp: Date.now(),
    };
    addMessage(userMsg);
    setInputText('');

    setLoading(true);
    try {
      const apiKey = (Constants.expoConfig?.extra as any)?.OPENAI_API_KEY as string;
      if (!apiKey) {
        addMessage({
          id: String(Date.now() + 1),
          text: 'Missing OPENAI_API_KEY. Add it to .env and restart.',
          isUser: false,
          timestamp: Date.now(),
        });
        setLoading(false);
        return;
      }

      const payload = {
        healthData: healthData,
        screentimeData: screentimeData,
      };

      const sys =
        'You are Altu, a helpful health assistant. You have access to complete health and screentime data. The healthData array contains daily records with: date, steps, sleepMinutes, activeEnergyKcal, workoutMinutes. The screentimeData array contains records with: date, app, minutes, category. IMPORTANT: Only use the actual data provided. Do not make up numbers. If data is missing for a date, say so. Answer questions about specific dates, trends, comparisons, etc. Be concise and numeric. Today is ' + new Date().toISOString().split('T')[0] + '.';
      
      // Build conversation history (last 10 messages for context, excluding welcome message)
      const conversationHistory = messages
        .filter(m => m.id !== 'welcome' && !m.isTyping)
        .slice(0, 10)
        .reverse()
        .map(m => ({
          role: m.isUser ? 'user' : 'assistant',
          content: m.text
        }));

      // Add current user message
      conversationHistory.push({
        role: 'user',
        content: text
      });

      // Add data context to first user message only to save tokens
      if (conversationHistory.length === 1) {
        conversationHistory[0].content = `Question: ${text}\n\nData JSON:\n${JSON.stringify(payload)}`;
      } else {
        // For follow-up questions, prepend a note about data availability
        conversationHistory[conversationHistory.length - 1].content = `[You have access to the same health and screentime data from the conversation]\n\nQuestion: ${text}`;
      }

      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: sys },
            ...conversationHistory,
          ],
          temperature: 0.1,
          max_tokens: 500,
        }),
      });

      const json = await resp.json();
      const content = json?.choices?.[0]?.message?.content ?? 'No response';
      addTypingMessage(String(content), String(Date.now() + 2));
    } catch (e: any) {
      addMessage({
        id: String(Date.now() + 3),
        text: `Error: ${e?.message ?? 'unknown'}`,
        isUser: false,
        timestamp: Date.now(),
      });
    } finally {
      setLoading(false);
    }
  }

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageContainer, item.isUser ? styles.userMessage : styles.botMessage]}>
      <View style={[styles.bubble, item.isUser ? styles.userBubble : styles.botBubble]}>
        {item.isUser ? (
          <Text style={[styles.messageText, styles.userText]}>
            {item.text}
          </Text>
        ) : (
          <View>
            <Markdown
              style={{
                body: { color: '#111', fontSize: 15, lineHeight: 20 },
                strong: { fontWeight: '700', color: '#111' },
                em: { fontStyle: 'italic', color: '#111' },
                paragraph: { marginTop: 0, marginBottom: 4 },
                bullet_list: { marginTop: 2, marginBottom: 2 },
                ordered_list: { marginTop: 2, marginBottom: 2 },
                list_item: { marginTop: 2, marginBottom: 2 },
                code_inline: { 
                  backgroundColor: '#f0f0f0', 
                  color: '#111',
                  paddingHorizontal: 4,
                  paddingVertical: 2,
                  borderRadius: 3,
                  fontSize: 14,
                  fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                },
                code_block: {
                  backgroundColor: '#f0f0f0',
                  padding: 8,
                  borderRadius: 6,
                  fontSize: 14,
                  fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                },
              }}
            >
              {item.text || ' '}
            </Markdown>
            {item.isTyping && <Text style={styles.cursor}>▋</Text>}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ask anything</Text>
      </View>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          inverted
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Message"
            placeholderTextColor="#999"
            multiline
            maxLength={500}
            editable={!loading}
          />
          <TouchableOpacity 
            onPress={handleSend} 
            style={[
              styles.sendButton,
              (!inputText.trim() || loading) && styles.sendButtonDisabled
            ]}
            disabled={loading || !inputText.trim()}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>
                ↑
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageContainer: {
    marginVertical: 4,
    flexDirection: 'row',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  botMessage: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#007aff',
  },
  botBubble: {
    backgroundColor: '#f1f3f5',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userText: {
    color: '#fff',
  },
  botText: {
    color: '#111',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    backgroundColor: '#f6f7f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000',
    maxHeight: 100,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 18,
    marginTop: -1,
  },
  sendButtonDisabled: {
    opacity: 0.4,
    backgroundColor: '#e0e0e0',
  },
  cursor: {
    opacity: 0.7,
  },
});
