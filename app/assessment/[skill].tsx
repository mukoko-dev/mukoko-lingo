import { useState, useCallback, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { CheckCircle, XCircle, ArrowRight, RotateCcw, Trophy } from 'lucide-react-native'

import { useColorScheme } from '@/components/useColorScheme'
import { lightTheme, darkTheme, Colors } from '@/constants/Colors'
import { updateUserSkill } from '@/lib/storage/database'
import { useLearningLanguage } from '@/lib/hooks/useLearningLanguage'
import {
  getQuestionsForSkill,
  getDiagnosticQuestions,
  calculateAssessmentScore,
  AssessmentQuestion,
} from '@/lib/data/assessment-questions'
import type { SkillName, ProficiencyLevel } from '@/lib/types/skills'

type Phase = 'quiz' | 'results'

export default function AssessmentScreen() {
  const { skill } = useLocalSearchParams<{ skill: string }>()
  const router = useRouter()
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme
  const { learningLanguage } = useLearningLanguage()

  const [phase, setPhase] = useState<Phase>('quiz')
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [results, setResults] = useState<ReturnType<typeof calculateAssessmentScore> | null>(null)

  useEffect(() => {
    loadQuestions()
  }, [skill, learningLanguage])

  const loadQuestions = useCallback(() => {
    let qs: AssessmentQuestion[]
    if (skill === 'diagnostic') {
      qs = getDiagnosticQuestions(learningLanguage, 8)
    } else {
      qs = getQuestionsForSkill(skill as SkillName, 'beginner', learningLanguage, 5)
    }

    // If we don't have enough language-specific questions, get any language
    if (qs.length < 3) {
      if (skill === 'diagnostic') {
        qs = getDiagnosticQuestions(undefined, 8)
      } else {
        qs = getQuestionsForSkill(skill as SkillName, 'beginner', undefined, 5)
      }
    }

    setQuestions(qs)
    setCurrentIndex(0)
    setAnswers({})
    setSelectedAnswer(null)
    setShowFeedback(false)
    setPhase('quiz')
    setResults(null)
  }, [skill, learningLanguage])

  const currentQuestion = questions[currentIndex]

  const handleSelectAnswer = (answer: string) => {
    if (showFeedback) return
    setSelectedAnswer(answer)
  }

  const handleConfirmAnswer = () => {
    if (!selectedAnswer || !currentQuestion) return

    setShowFeedback(true)
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: selectedAnswer,
    }))
  }

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setShowFeedback(false)
    } else {
      // Assessment complete
      const finalAnswers = { ...answers, [currentQuestion.id]: selectedAnswer! }
      const scoreResult = calculateAssessmentScore(questions, finalAnswers)
      setResults(scoreResult)
      setPhase('results')

      // Update skill scores
      if (skill === 'diagnostic') {
        // For diagnostic, update all skills based on questions answered
        const skillScores: Record<string, { correct: number; total: number }> = {}
        scoreResult.results.forEach(r => {
          const s = r.question.skill
          if (!skillScores[s]) skillScores[s] = { correct: 0, total: 0 }
          skillScores[s].total++
          if (r.correct) skillScores[s].correct++
        })

        for (const [skillName, data] of Object.entries(skillScores)) {
          const pct = Math.round((data.correct / data.total) * 100)
          await updateUserSkill(skillName, pct)
        }
      } else {
        await updateUserSkill(skill, scoreResult.percentage)
      }
    }
  }

  const styles = createStyles(theme)

  if (questions.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.emptyText}>No assessment questions available for this skill yet.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (phase === 'results' && results) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.resultsContent}>
        <View style={styles.resultsHeader}>
          <View style={[styles.scoreRing, results.percentage >= 65 ? styles.scoreRingPass : styles.scoreRingFail]}>
            <Text style={styles.scorePercent}>{results.percentage}%</Text>
          </View>
          <Text style={styles.resultsTitle}>
            {results.percentage >= 65 ? 'Great Job!' : 'Keep Practicing!'}
          </Text>
          <Text style={styles.resultsSubtitle}>
            {results.score} of {results.total} correct
          </Text>
          {results.percentage >= 65 && (
            <View style={styles.passedBadge}>
              <Trophy size={16} color="#ffffff" />
              <Text style={styles.passedBadgeText}>Assessment Passed</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Question Review</Text>
        {results.results.map((r, index) => (
          <View key={r.question.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              {r.correct ? (
                <CheckCircle size={20} color={theme.secondary} />
              ) : (
                <XCircle size={20} color="#ef4444" />
              )}
              <Text style={styles.reviewNumber}>Q{index + 1}</Text>
            </View>
            <Text style={styles.reviewQuestion}>{r.question.question}</Text>
            {!r.correct && (
              <View style={styles.reviewCorrection}>
                <Text style={styles.reviewYourAnswer}>Your answer: {r.userAnswer}</Text>
                <Text style={styles.reviewCorrectAnswer}>Correct: {r.question.correctAnswer}</Text>
              </View>
            )}
            <Text style={styles.reviewExplanation}>{r.question.explanation}</Text>
          </View>
        ))}

        <View style={styles.resultsActions}>
          <TouchableOpacity style={styles.retryButton} onPress={loadQuestions}>
            <RotateCcw size={18} color={theme.primary} />
            <Text style={styles.retryButtonText}>Retake Assessment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Back to Skills</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    )
  }

  const isCorrect = selectedAnswer === currentQuestion?.correctAnswer

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${((currentIndex + 1) / questions.length) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {currentIndex + 1} of {questions.length}
        </Text>
      </View>

      {/* Question */}
      <ScrollView style={styles.questionSection} contentContainerStyle={styles.questionContent}>
        <View style={styles.questionTypeBadge}>
          <Text style={styles.questionTypeText}>
            {currentQuestion.type === 'multiple_choice'
              ? 'Multiple Choice'
              : currentQuestion.type === 'translation'
              ? 'Translation'
              : 'Fill in the Blank'}
          </Text>
        </View>
        <Text style={styles.questionText}>{currentQuestion.question}</Text>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === option
            const isCorrectOption = showFeedback && option === currentQuestion.correctAnswer
            const isWrongSelection = showFeedback && isSelected && !isCorrect

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  isSelected && !showFeedback && styles.optionSelected,
                  isCorrectOption && styles.optionCorrect,
                  isWrongSelection && styles.optionWrong,
                ]}
                onPress={() => handleSelectAnswer(option)}
                disabled={showFeedback}
              >
                <View style={styles.optionLabel}>
                  <View
                    style={[
                      styles.optionDot,
                      isSelected && !showFeedback && styles.optionDotSelected,
                      isCorrectOption && styles.optionDotCorrect,
                      isWrongSelection && styles.optionDotWrong,
                    ]}
                  >
                    {isCorrectOption && <CheckCircle size={16} color="#ffffff" />}
                    {isWrongSelection && <XCircle size={16} color="#ffffff" />}
                  </View>
                  <Text
                    style={[
                      styles.optionText,
                      isCorrectOption && styles.optionTextCorrect,
                      isWrongSelection && styles.optionTextWrong,
                    ]}
                  >
                    {option}
                  </Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Feedback */}
        {showFeedback && (
          <View style={[styles.feedbackCard, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
            <View style={styles.feedbackHeader}>
              {isCorrect ? (
                <CheckCircle size={20} color={theme.secondary} />
              ) : (
                <XCircle size={20} color="#ef4444" />
              )}
              <Text style={[styles.feedbackTitle, isCorrect ? styles.feedbackTitleCorrect : styles.feedbackTitleWrong]}>
                {isCorrect ? 'Correct!' : 'Not quite right'}
              </Text>
            </View>
            <Text style={styles.feedbackExplanation}>{currentQuestion.explanation}</Text>
          </View>
        )}
      </ScrollView>

      {/* Action Button */}
      <View style={styles.actionSection}>
        {!showFeedback ? (
          <TouchableOpacity
            style={[styles.primaryButton, !selectedAnswer && styles.primaryButtonDisabled]}
            onPress={handleConfirmAnswer}
            disabled={!selectedAnswer}
          >
            <Text style={styles.primaryButtonText}>Check Answer</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
            <Text style={styles.primaryButtonText}>
              {currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
            </Text>
            <ArrowRight size={18} color="#ffffff" />
          </TouchableOpacity>
        )}
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
    centered: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    emptyText: {
      fontSize: 16,
      color: theme.textMuted,
      textAlign: 'center',
      marginBottom: 24,
    },
    progressSection: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    progressBarBg: {
      height: 6,
      backgroundColor: theme.border,
      borderRadius: 3,
      marginBottom: 8,
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: theme.primary,
      borderRadius: 3,
    },
    progressText: {
      fontSize: 13,
      color: theme.textMuted,
      textAlign: 'center',
    },
    questionSection: {
      flex: 1,
    },
    questionContent: {
      padding: 20,
    },
    questionTypeBadge: {
      backgroundColor: theme.primary + '15',
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      marginBottom: 16,
    },
    questionTypeText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.primary,
    },
    questionText: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.text,
      lineHeight: 28,
      marginBottom: 24,
    },
    optionsContainer: {
      gap: 12,
    },
    optionButton: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 2,
      borderColor: theme.border,
    },
    optionSelected: {
      borderColor: theme.primary,
      backgroundColor: theme.primary + '08',
    },
    optionCorrect: {
      borderColor: theme.secondary,
      backgroundColor: theme.secondary + '10',
    },
    optionWrong: {
      borderColor: '#ef4444',
      backgroundColor: '#ef444410',
    },
    optionLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    optionDot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionDotSelected: {
      borderColor: theme.primary,
      backgroundColor: theme.primary,
    },
    optionDotCorrect: {
      borderColor: theme.secondary,
      backgroundColor: theme.secondary,
    },
    optionDotWrong: {
      borderColor: '#ef4444',
      backgroundColor: '#ef4444',
    },
    optionText: {
      fontSize: 16,
      color: theme.text,
      flex: 1,
    },
    optionTextCorrect: {
      color: Colors.secondary[600],
      fontWeight: '600',
    },
    optionTextWrong: {
      color: '#ef4444',
    },
    feedbackCard: {
      marginTop: 20,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
    },
    feedbackCorrect: {
      backgroundColor: theme.secondary + '10',
      borderColor: theme.secondary + '30',
    },
    feedbackWrong: {
      backgroundColor: '#ef444410',
      borderColor: '#ef444430',
    },
    feedbackHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    feedbackTitle: {
      fontSize: 16,
      fontWeight: '700',
    },
    feedbackTitleCorrect: {
      color: Colors.secondary[600],
    },
    feedbackTitleWrong: {
      color: '#ef4444',
    },
    feedbackExplanation: {
      fontSize: 14,
      color: theme.textSecondary,
      lineHeight: 20,
    },
    actionSection: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      backgroundColor: theme.card,
    },
    primaryButton: {
      backgroundColor: theme.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    primaryButtonDisabled: {
      backgroundColor: theme.border,
    },
    primaryButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
    // Results styles
    resultsContent: {
      padding: 20,
    },
    resultsHeader: {
      alignItems: 'center',
      marginBottom: 32,
    },
    scoreRing: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    scoreRingPass: {
      borderColor: theme.secondary,
    },
    scoreRingFail: {
      borderColor: theme.accent,
    },
    scorePercent: {
      fontSize: 32,
      fontWeight: '700',
      color: theme.text,
    },
    resultsTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 4,
    },
    resultsSubtitle: {
      fontSize: 16,
      color: theme.textSecondary,
      marginBottom: 12,
    },
    passedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.secondary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      gap: 6,
    },
    passedBadgeText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '600',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 12,
    },
    reviewCard: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    reviewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    reviewNumber: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textMuted,
    },
    reviewQuestion: {
      fontSize: 15,
      color: theme.text,
      marginBottom: 8,
      lineHeight: 21,
    },
    reviewCorrection: {
      marginBottom: 8,
    },
    reviewYourAnswer: {
      fontSize: 13,
      color: '#ef4444',
      marginBottom: 2,
    },
    reviewCorrectAnswer: {
      fontSize: 13,
      color: Colors.secondary[600],
      fontWeight: '600',
    },
    reviewExplanation: {
      fontSize: 13,
      color: theme.textSecondary,
      lineHeight: 18,
      fontStyle: 'italic',
    },
    resultsActions: {
      marginTop: 12,
      gap: 12,
      marginBottom: 40,
    },
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.card,
      borderRadius: 12,
      paddingVertical: 16,
      borderWidth: 1,
      borderColor: theme.primary,
      gap: 8,
    },
    retryButtonText: {
      color: theme.primary,
      fontSize: 16,
      fontWeight: '600',
    },
  })
