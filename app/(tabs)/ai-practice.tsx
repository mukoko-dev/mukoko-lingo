import { useState, useRef, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { Send, Bot, Sparkles } from 'lucide-react-native'

import { useColorScheme } from '@/components/useColorScheme'
import { lightTheme, darkTheme, Colors } from '@/constants/Colors'
import { sendMessage as sendAIMessage, getConversationStarters } from '@/lib/ai/chat-service'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function AIPracticeScreen() {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme
  const flatListRef = useRef<FlatList>(null)

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Mhoro! 🐝 I'm Shamwari, your friendly AI language tutor. I'm here to help you learn Shona, Ndebele, Swahili, and Chinese. What would you like to practice today?",
      timestamp: new Date(),
    },
  ])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('Shona')

  const styles = createStyles(theme)
  const starters = getConversationStarters(selectedLanguage)

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)

    try {
      // Convert messages to format expected by chat service
      const chatMessages = [...messages, userMessage].map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
        timestamp: m.timestamp,
      }))

      const response = await sendAIMessage(chatMessages, selectedLanguage, 'practice')

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again!",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleStarterPress = (starter: string) => {
    setInputText(starter)
  }

  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true })
    }
  }, [messages])

  const languages = ['Shona', 'Ndebele', 'Swahili', 'Chinese']

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Language Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.languageBar}
        contentContainerStyle={styles.languageContent}
      >
        {languages.map(lang => (
          <TouchableOpacity
            key={lang}
            style={[
              styles.languagePill,
              selectedLanguage === lang && styles.languagePillActive,
            ]}
            onPress={() => setSelectedLanguage(lang)}
          >
            <Text
              style={[
                styles.languageText,
                selectedLanguage === lang && styles.languageTextActive,
              ]}
            >
              {lang}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Chat Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesContent}
        renderItem={({ item }) => (
          <MessageBubble message={item} theme={theme} />
        )}
        ListHeaderComponent={
          <View style={styles.welcomeCard}>
            <View style={styles.mascotContainer}>
              <Bot size={32} color={Colors.primary[600]} />
            </View>
            <Text style={styles.welcomeTitle}>Meet Shamwari</Text>
            <Text style={styles.welcomeText}>
              Your AI language learning companion. Practice conversations, get pronunciation help, or ask about grammar!
            </Text>
            <View style={styles.startersContainer}>
              <Text style={styles.startersLabel}>Try asking:</Text>
              {starters.slice(0, 2).map((starter, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.starterButton}
                  onPress={() => handleStarterPress(starter)}
                >
                  <Sparkles size={14} color={Colors.primary[600]} />
                  <Text style={styles.starterText}>{starter}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
      />

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.primary[600]} />
          <Text style={styles.loadingText}>Shamwari is thinking...</Text>
        </View>
      )}

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder={`Ask about ${selectedLanguage}...`}
            placeholderTextColor={theme.textMuted}
            multiline
            maxLength={500}
            onSubmitEditing={handleSendMessage}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Send size={20} color={inputText.trim() ? '#ffffff' : theme.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

interface MessageBubbleProps {
  message: Message
  theme: typeof lightTheme
}

function MessageBubble({ message, theme }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const styles = createStyles(theme)

  return (
    <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
      {!isUser && (
        <View style={styles.avatarContainer}>
          <Bot size={16} color={Colors.primary[600]} />
        </View>
      )}
      <View style={[styles.bubbleContent, isUser ? styles.userContent : styles.assistantContent]}>
        <Text style={[styles.messageText, isUser && styles.userText]}>
          {message.content}
        </Text>
      </View>
    </View>
  )
}

const createStyles = (theme: typeof lightTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    languageBar: {
      maxHeight: 48,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    languageContent: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      gap: 8,
      flexDirection: 'row',
    },
    languagePill: {
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    languagePillActive: {
      backgroundColor: Colors.primary[600],
      borderColor: Colors.primary[600],
    },
    languageText: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.text,
    },
    languageTextActive: {
      color: '#ffffff',
    },
    messagesContent: {
      padding: 16,
      paddingBottom: 8,
    },
    welcomeCard: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    mascotContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: Colors.primary[600] + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    welcomeTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 8,
    },
    welcomeText: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 16,
    },
    startersContainer: {
      width: '100%',
    },
    startersLabel: {
      fontSize: 12,
      color: theme.textMuted,
      marginBottom: 8,
    },
    starterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 8,
      marginBottom: 8,
      gap: 8,
    },
    starterText: {
      fontSize: 13,
      color: theme.text,
      flex: 1,
    },
    messageBubble: {
      flexDirection: 'row',
      marginBottom: 12,
      alignItems: 'flex-end',
    },
    userBubble: {
      justifyContent: 'flex-end',
    },
    assistantBubble: {
      justifyContent: 'flex-start',
    },
    avatarContainer: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: Colors.primary[600] + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    },
    bubbleContent: {
      maxWidth: '75%',
      borderRadius: 16,
      padding: 12,
    },
    userContent: {
      backgroundColor: Colors.primary[600],
      borderBottomRightRadius: 4,
    },
    assistantContent: {
      backgroundColor: theme.card,
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: theme.border,
    },
    messageText: {
      fontSize: 15,
      color: theme.text,
      lineHeight: 21,
    },
    userText: {
      color: '#ffffff',
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      gap: 8,
    },
    loadingText: {
      fontSize: 13,
      color: theme.textMuted,
    },
    inputContainer: {
      borderTopWidth: 1,
      borderTopColor: theme.border,
      backgroundColor: theme.card,
      padding: 12,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      backgroundColor: theme.background,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: theme.text,
      maxHeight: 100,
      paddingVertical: 8,
    },
    sendButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: Colors.primary[600],
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },
    sendButtonDisabled: {
      backgroundColor: theme.border,
    },
  })
