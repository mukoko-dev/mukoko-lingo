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
  Image,
} from 'react-native'
import { Send, Sparkles } from 'lucide-react-native'
import { useLocalSearchParams } from 'expo-router'

import { useColorScheme } from '@/components/useColorScheme'
import { lightTheme, darkTheme } from '@/constants/Colors'
import { sendMessage as sendAIMessage, getConversationStarters } from '@/lib/ai/chat-service'
import { useLearningLanguage, LEARNING_LANGUAGES } from '@/lib/hooks/useLearningLanguage'

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
  const { phraseContext } = useLocalSearchParams<{ phraseContext?: string }>()

  const getWelcomeMessage = () => {
    if (phraseContext) {
      return `Mhoro! I'm Shamwari, your friendly AI language tutor. I see you'd like to practice: "${phraseContext}". Let's work on this together! Try using it in a sentence, or ask me anything about it.`
    }
    return "Mhoro! I'm Shamwari, your friendly AI language tutor. Welcome to the hive — I'm here to help you learn Shona, Ndebele, Swahili, and Chinese. What would you like to practice today?"
  }

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: getWelcomeMessage(),
      timestamp: new Date(),
    },
  ])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { learningLanguage, setLearningLanguage, learningLanguageOption } = useLearningLanguage()

  // Map internal key to display name for AI service compatibility
  const selectedLanguage = learningLanguageOption.name

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
        {LEARNING_LANGUAGES.map(lang => (
          <TouchableOpacity
            key={lang.key}
            style={[
              styles.languagePill,
              learningLanguage === lang.key && styles.languagePillActive,
            ]}
            onPress={() => setLearningLanguage(lang.key)}
          >
            <Text style={styles.languageFlag}>{lang.flag}</Text>
            <Text
              style={[
                styles.languageText,
                learningLanguage === lang.key && styles.languageTextActive,
              ]}
            >
              {lang.name}
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
              <Image
                source={require('@/assets/images/mascot-icon.png')}
                style={styles.mascotImage}
                resizeMode="contain"
              />
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
                  <Sparkles size={14} color={theme.primary} />
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
          <ActivityIndicator size="small" color={theme.primary} />
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
          <Image
            source={require('@/assets/images/mascot-icon.png')}
            style={styles.avatarImage}
            resizeMode="contain"
          />
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
      minHeight: 56,
      maxHeight: 64,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    languageContent: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    languagePill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 18,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      minHeight: 36,
      gap: 6,
    },
    languageFlag: {
      fontSize: 16,
    },
    languagePillActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    languageText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.text,
      lineHeight: 18,
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
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: theme.accent + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
      overflow: 'hidden',
    },
    mascotImage: {
      width: 80,
      height: 80,
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
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.accent + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
      overflow: 'hidden',
    },
    avatarImage: {
      width: 32,
      height: 32,
    },
    bubbleContent: {
      maxWidth: '75%',
      borderRadius: 16,
      padding: 12,
    },
    userContent: {
      backgroundColor: theme.primary,
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
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },
    sendButtonDisabled: {
      backgroundColor: theme.border,
    },
  })
