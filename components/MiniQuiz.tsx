import { useState, useEffect, useCallback } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
} from 'react-native'
import { CheckCircle, XCircle, ArrowRight, MessageCircle } from 'lucide-react-native'

import { useTheme } from '@/lib/hooks/useTheme'
import { useLearningLanguage } from '@/lib/hooks/useLearningLanguage'
import { lightTheme, darkTheme, Colors } from '@/constants/Colors'
import { generateQuizQuestions, markPhraseLearned } from '@/lib/services/daily-lesson'
import { updateProgress } from '@/lib/storage/database'
import { getSkillForCategory } from '@/lib/services/daily-lesson'
import { updateUserSkill, getUserSkills } from '@/lib/storage/database'
import { reviewPhrase, mapToQuality } from '@/lib/services/srs'
import { awardXP } from '@/lib/services/xp'
import { XPBadge } from '@/components/XPBadge'
import type { Phrase } from '@/lib/data/phrases-data'

interface QuizQuestion {
  id: string
  english: string
  correctAnswer: string
  options: string[]
  phraseId: string
}

interface MiniQuizProps {
  phrases: Phrase[]
  onComplete: (score: number, total: number, justCompletedGoal: boolean) => void
  onPracticeWithShamwari?: (phrases: Phrase[]) => void
}

export function MiniQuiz({ phrases, onComplete, onPracticeWithShamwari }: MiniQuizProps) {
  const { isDark } = useTheme()
  const theme = isDark ? darkTheme : lightTheme
  const { learningLanguage } = useLearningLanguage()
  const { width } = useWindowDimensions()
  const isTablet = width >= 768

  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [justCompletedGoal, setJustCompletedGoal] = useState(false)
  const [xpPopup, setXpPopup] = useState({ visible: false, amount: 0 })
  const [totalXPEarned, setTotalXPEarned] = useState(0)

  useEffect(() => {
    const q = generateQuizQuestions(phrases, learningLanguage)
    setQuestions(q)
  }, [phrases, learningLanguage])

  const handleSelect = useCallback(async (answer: string) => {
    if (selectedAnswer !== null) return

    const question = questions[currentIndex]
    const correct = answer === question.correctAnswer
    setSelectedAnswer(answer)
    setIsCorrect(correct)

    // Update SRS card for this phrase
    try {
      const quality = mapToQuality(correct, correct ? 'medium' : 'hard')
      const srsResult = await reviewPhrase(question.phraseId, quality)

      if (correct) {
        setScore(prev => prev + 1)

        // Award XP for correct answer
        const { xpData } = await awardXP('quiz_correct')
        const xpGained = srsResult.xpEarned
        setTotalXPEarned(prev => prev + xpGained)
        setXpPopup({ visible: true, amount: xpGained })

        // Update phrase progress
        await updateProgress(question.phraseId, 'practiced')
        const result = await markPhraseLearned()
        if (result.justCompleted) {
          setJustCompletedGoal(true)
        }

        // Update skill score
        const phrase = phrases.find(p => p.id === question.phraseId)
        if (phrase) {
          const skill = getSkillForCategory(phrase.category)
          const skills = await getUserSkills()
          const currentScore = skills[skill]?.score || 0
          await updateUserSkill(skill, Math.min(currentScore + 2, 100))
        }
      }
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }, [selectedAnswer, questions, currentIndex, phrases])

  const handleNext = useCallback(async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setIsCorrect(null)
    } else {
      setFinished(true)
      // Award perfect score bonus if all correct
      const finalScore = score + (isCorrect ? 1 : 0)
      if (finalScore === questions.length) {
        try { await awardXP('quiz_perfect') } catch {}
      }
      onComplete(finalScore, questions.length, justCompletedGoal)
    }
  }, [currentIndex, questions.length, score, isCorrect, justCompletedGoal, onComplete])

  const styles = createStyles(theme, isDark, isTablet)

  if (questions.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Preparing quiz...</Text>
      </View>
    )
  }

  if (finished) {
    const percentage = Math.round((score / questions.length) * 100)
    return (
      <View style={styles.container}>
        <View style={styles.resultCard}>
          <Text style={styles.resultEmoji}>
            {percentage >= 80 ? '🎉' : percentage >= 60 ? '👍' : '💪'}
          </Text>
          <Text style={styles.resultTitle}>
            {percentage >= 80 ? 'Excellent!' : percentage >= 60 ? 'Good job!' : 'Keep practicing!'}
          </Text>
          <Text style={styles.resultScore}>
            {score} of {questions.length} correct
          </Text>
          {totalXPEarned > 0 && (
            <Text style={styles.resultXP}>+{totalXPEarned} XP earned</Text>
          )}
          <View style={styles.resultBar}>
            <View style={[
              styles.resultBarFill,
              {
                width: `${percentage}%`,
                backgroundColor: percentage >= 80 ? Colors.success[500] : percentage >= 60 ? Colors.accent[400] : theme.primary,
              },
            ]} />
          </View>

          {onPracticeWithShamwari && (
            <TouchableOpacity
              style={styles.shamwariButton}
              onPress={() => onPracticeWithShamwari(phrases)}
            >
              <MessageCircle size={18} color="#ffffff" />
              <Text style={styles.shamwariButtonText}>Practice with Shamwari</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    )
  }

  const question = questions[currentIndex]

  return (
    <View style={styles.container}>
      {/* XP Popup */}
      <XPBadge
        amount={xpPopup.amount}
        visible={xpPopup.visible}
        onHidden={() => setXpPopup({ visible: false, amount: 0 })}
      />

      {/* Progress indicator */}
      <View style={styles.progressRow}>
        {questions.map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              i === currentIndex && styles.progressDotActive,
              i < currentIndex && styles.progressDotDone,
            ]}
          />
        ))}
      </View>

      {/* Question */}
      <View style={styles.questionCard}>
        <Text style={styles.questionLabel}>Translate to {learningLanguage}</Text>
        <Text style={styles.questionText}>{question.english}</Text>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === option
          const isCorrectOption = option === question.correctAnswer
          let extraOptionStyle = null as typeof styles.optionCorrect | typeof styles.optionWrong | null
          let extraTextStyle = null as typeof styles.optionTextCorrect | typeof styles.optionTextWrong | null

          if (selectedAnswer !== null) {
            if (isCorrectOption) {
              extraOptionStyle = styles.optionCorrect
              extraTextStyle = styles.optionTextCorrect
            } else if (isSelected && !isCorrect) {
              extraOptionStyle = styles.optionWrong
              extraTextStyle = styles.optionTextWrong
            }
          }

          return (
            <TouchableOpacity
              key={index}
              style={[styles.option, extraOptionStyle, isSelected && selectedAnswer === null && styles.optionSelected]}
              onPress={() => handleSelect(option)}
              disabled={selectedAnswer !== null}
            >
              <Text style={[styles.optionText, extraTextStyle]}>{option}</Text>
              {selectedAnswer !== null && isCorrectOption && (
                <CheckCircle size={20} color={Colors.success[500]} />
              )}
              {selectedAnswer !== null && isSelected && !isCorrect && (
                <XCircle size={20} color={Colors.semanticError} />
              )}
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Next button */}
      {selectedAnswer !== null && (
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentIndex < questions.length - 1 ? 'Next' : 'See Results'}
          </Text>
          <ArrowRight size={18} color="#ffffff" />
        </TouchableOpacity>
      )}

      {/* Feedback */}
      {selectedAnswer !== null && (
        <Text style={[styles.feedback, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
          {isCorrect ? 'Correct!' : `The answer is: ${question.correctAnswer}`}
        </Text>
      )}
    </View>
  )
}

const createStyles = (theme: typeof lightTheme, isDark: boolean, isTablet: boolean) =>
  StyleSheet.create({
    container: {
      marginHorizontal: isTablet ? 48 : 16,
      marginBottom: 20,
    },
    loadingText: {
      fontSize: 14,
      color: theme.textMuted,
      textAlign: 'center',
      padding: 40,
    },
    progressRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 20,
    },
    progressDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: isDark ? Colors.neutral[700] : Colors.neutral[200],
    },
    progressDotActive: {
      width: 24,
      backgroundColor: theme.primary,
    },
    progressDotDone: {
      backgroundColor: Colors.success[500],
    },
    questionCard: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.border,
    },
    questionLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 8,
    },
    questionText: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.text,
      textAlign: 'center',
    },
    optionsContainer: {
      gap: 10,
      marginBottom: 16,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 2,
      borderColor: theme.border,
    },
    optionSelected: {
      borderColor: theme.primary,
    },
    optionCorrect: {
      borderColor: Colors.success[500],
      backgroundColor: isDark ? Colors.success[500] + '15' : Colors.success[50],
    },
    optionWrong: {
      borderColor: Colors.semanticError,
      backgroundColor: isDark ? Colors.semanticError + '15' : '#fef2f2',
    },
    optionText: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.text,
      flex: 1,
    },
    optionTextCorrect: {
      color: Colors.success[500],
      fontWeight: '600',
    },
    optionTextWrong: {
      color: Colors.semanticError,
    },
    nextButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primary,
      paddingVertical: 14,
      borderRadius: 12,
      gap: 8,
      marginBottom: 12,
    },
    nextButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
    feedback: {
      textAlign: 'center',
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
    },
    feedbackCorrect: {
      color: Colors.success[500],
    },
    feedbackWrong: {
      color: Colors.semanticError,
    },
    // Results
    resultCard: {
      backgroundColor: theme.card,
      borderRadius: 20,
      padding: 32,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    resultEmoji: {
      fontSize: 48,
      marginBottom: 12,
    },
    resultTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 8,
    },
    resultScore: {
      fontSize: 16,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    resultXP: {
      fontSize: 15,
      fontWeight: '700',
      color: Colors.accent[isDark ? 300 : 800],
      marginBottom: 16,
    },
    resultBar: {
      width: '100%',
      height: 8,
      borderRadius: 4,
      backgroundColor: isDark ? Colors.neutral[700] : Colors.neutral[200],
      overflow: 'hidden',
      marginBottom: 24,
    },
    resultBarFill: {
      height: '100%',
      borderRadius: 4,
    },
    shamwariButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primary,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 12,
      gap: 8,
      width: '100%',
    },
    shamwariButtonText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '600',
    },
  })
