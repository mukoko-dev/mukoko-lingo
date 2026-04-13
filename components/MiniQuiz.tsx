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
import { reviewPhrase } from '@/lib/services/srs'
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
  const [qualityRated, setQualityRated] = useState(false)

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
    setQualityRated(false)

    // Incorrect answers get auto-rated as quality 1 (Again) — the user
    // didn't know it, no need to ask. Correct answers wait for the user
    // to self-rate difficulty via the quality buttons.
    if (!correct) {
      try {
        await reviewPhrase(question.phraseId, 1)
      } catch (error) {
        console.error('Error updating SRS on incorrect:', error)
      }
      setQualityRated(true)
    }
  }, [selectedAnswer, questions, currentIndex])

  /**
   * User self-rates how well they knew the answer (SRS quality rating).
   * Quality 3 = Hard, 4 = Good, 5 = Easy (only shown on correct answers).
   */
  const handleQualityRating = useCallback(async (quality: 3 | 4 | 5) => {
    if (qualityRated) return
    setQualityRated(true)
    const question = questions[currentIndex]

    try {
      const srsResult = await reviewPhrase(question.phraseId, quality)
      setScore(prev => prev + 1)

      // Award XP — base quiz_correct plus SRS quality bonus
      await awardXP('quiz_correct')
      setTotalXPEarned(prev => prev + srsResult.xpEarned)
      setXpPopup({ visible: true, amount: srsResult.xpEarned })

      // Update phrase progress — promote to 'mastered' when user rates Easy
      // on a phrase they already had practiced
      const newStatus = quality === 5 ? 'mastered' : 'practiced'
      await updateProgress(question.phraseId, newStatus)
      const result = await markPhraseLearned()
      if (result.justCompleted) {
        setJustCompletedGoal(true)
      }

      // Update skill score — Easy gives +3, Good +2, Hard +1
      const phrase = phrases.find(p => p.id === question.phraseId)
      if (phrase) {
        const skill = getSkillForCategory(phrase.category)
        const skills = await getUserSkills()
        const currentScore = skills[skill]?.score || 0
        const delta = quality === 5 ? 3 : quality === 4 ? 2 : 1
        await updateUserSkill(skill, Math.min(currentScore + delta, 100))
      }
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }, [qualityRated, questions, currentIndex, phrases])

  const handleNext = useCallback(async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setIsCorrect(null)
      setQualityRated(false)
    } else {
      setFinished(true)
      // Award perfect score bonus if all correct
      if (score === questions.length) {
        try { await awardXP('quiz_perfect') } catch {}
      }
      onComplete(score, questions.length, justCompletedGoal)
    }
  }, [currentIndex, questions.length, score, justCompletedGoal, onComplete])

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

      {/* Feedback */}
      {selectedAnswer !== null && (
        <Text style={[styles.feedback, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
          {isCorrect ? 'Correct!' : `The answer is: ${question.correctAnswer}`}
        </Text>
      )}

      {/* SRS Quality Rating — shown only on correct answer, before Next */}
      {selectedAnswer !== null && isCorrect && !qualityRated && (
        <View style={styles.qualityContainer}>
          <Text style={styles.qualityPrompt}>How well did you know it?</Text>
          <View style={styles.qualityButtons}>
            <TouchableOpacity
              style={[styles.qualityButton, styles.qualityHard]}
              onPress={() => handleQualityRating(3)}
            >
              <Text style={[styles.qualityButtonText, styles.qualityHardText]}>Hard</Text>
              <Text style={styles.qualitySubText}>Show sooner</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.qualityButton, styles.qualityGood]}
              onPress={() => handleQualityRating(4)}
            >
              <Text style={[styles.qualityButtonText, styles.qualityGoodText]}>Good</Text>
              <Text style={styles.qualitySubText}>Keep pace</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.qualityButton, styles.qualityEasy]}
              onPress={() => handleQualityRating(5)}
            >
              <Text style={[styles.qualityButtonText, styles.qualityEasyText]}>Easy</Text>
              <Text style={styles.qualitySubText}>Show later</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.qualityHint}>
            Your rating helps Shamwari show the right phrases at the right time.
          </Text>
        </View>
      )}

      {/* Next button — only shown after user has rated quality (correct)
          or immediately for incorrect answers */}
      {selectedAnswer !== null && qualityRated && (
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentIndex < questions.length - 1 ? 'Next' : 'See Results'}
          </Text>
          <ArrowRight size={18} color="#ffffff" />
        </TouchableOpacity>
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
    // SRS Quality Rating
    qualityContainer: {
      marginTop: 12,
      marginBottom: 8,
      alignItems: 'center',
    },
    qualityPrompt: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 10,
      textAlign: 'center',
    },
    qualityButtons: {
      flexDirection: 'row',
      gap: 10,
      width: '100%',
      marginBottom: 8,
    },
    qualityButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRadius: 12,
      borderWidth: 1.5,
    },
    qualityHard: {
      borderColor: Colors.semanticError,
      backgroundColor: isDark ? Colors.semanticError + '15' : '#fef2f2',
    },
    qualityGood: {
      borderColor: theme.primary,
      backgroundColor: isDark ? Colors.primary[400] + '15' : Colors.primary[600] + '08',
    },
    qualityEasy: {
      borderColor: Colors.success[500],
      backgroundColor: isDark ? Colors.success[500] + '15' : Colors.success[50],
    },
    qualityButtonText: {
      fontSize: 15,
      fontWeight: '700',
    },
    qualityHardText: {
      color: Colors.semanticError,
    },
    qualityGoodText: {
      color: theme.primary,
    },
    qualityEasyText: {
      color: Colors.success[500],
    },
    qualitySubText: {
      fontSize: 10,
      color: theme.textMuted,
      marginTop: 2,
      fontWeight: '500',
    },
    qualityHint: {
      fontSize: 11,
      color: theme.textMuted,
      fontStyle: 'italic',
      marginTop: 6,
      textAlign: 'center',
      maxWidth: 280,
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
