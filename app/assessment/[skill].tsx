import { useState, useCallback, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { CheckCircle, XCircle, ArrowRight, RotateCcw, Trophy } from 'lucide-react-native'

import { useColorScheme } from '@/components/useColorScheme'
import { lightTheme, darkTheme, Colors } from '@/constants/Colors'
import { updateUserSkill } from '@/lib/storage/database'
import { assessmentsApi } from '@/lib/services/api-client'
import { useLearningLanguage } from '@/lib/hooks/useLearningLanguage'
import type {
  AssessmentSubmitResponse,
  PublicAssessmentQuestion,
} from '@/lib/types/assessment'

/**
 * The questions arrive from `/api/assessments/start` without their answers,
 * and the server grades the set it issued. That is what makes the score
 * trustworthy — and it is why there is no per-question "Correct!" during the
 * quiz any more: this screen genuinely does not know. The full review, with
 * every correct answer and explanation, arrives in the submit response.
 */
type Phase = 'loading' | 'quiz' | 'submitting' | 'results' | 'error'

export default function AssessmentScreen() {
  const { skill } = useLocalSearchParams<{ skill: string }>()
  const router = useRouter()
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme
  const { learningLanguage } = useLearningLanguage()

  const [phase, setPhase] = useState<Phase>('loading')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<PublicAssessmentQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [results, setResults] = useState<AssessmentSubmitResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [startedAt, setStartedAt] = useState(() => Date.now())

  const startAssessment = useCallback(async () => {
    setPhase('loading')
    setErrorMessage(null)
    try {
      const { data } = await assessmentsApi.startAssessment({
        skill_id: skill,
        language: learningLanguage,
      })
      if (!data || !data.questions?.length) throw new Error('No questions were issued')

      setSessionId(data.session_id)
      setQuestions(data.questions)
      setCurrentIndex(0)
      setAnswers({})
      setSelectedAnswer(null)
      setResults(null)
      setStartedAt(Date.now())
      setPhase('quiz')
    } catch (error) {
      // The bank lives on the server now, so there is no offline fallback to
      // drop back to: say so rather than showing an empty quiz.
      console.warn(`[mukoko][assessment] Could not start assessment: ${String(error)}`)
      setErrorMessage('Could not load this assessment. Check your connection and try again.')
      setPhase('error')
    }
  }, [skill, learningLanguage])

  useEffect(() => {
    startAssessment()
  }, [startAssessment])

  const currentQuestion = questions[currentIndex]

  const handleSelectAnswer = (answer: string) => {
    setSelectedAnswer(answer)
  }

  const handleNext = async () => {
    if (!currentQuestion || !selectedAnswer) return

    const recorded = { ...answers, [currentQuestion.id]: selectedAnswer }
    setAnswers(recorded)

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
      return
    }

    if (!sessionId) {
      setErrorMessage('This assessment expired before it could be submitted. Please start again.')
      setPhase('error')
      return
    }

    setPhase('submitting')
    try {
      const { data } = await assessmentsApi.submitAssessment({
        session_id: sessionId,
        answers: recorded,
        time_taken: Math.round((Date.now() - startedAt) / 1000),
      })
      if (!data) throw new Error('No result returned')

      setResults(data)
      setPhase('results')

      // Mirror the server's numbers into device storage, which the tutor falls
      // back to while `lingo.user_skills` is sparse. The server's figures, not
      // a second local grading pass — there is only one score now.
      const perSkill = Object.entries(data.per_skill || {})
      if (perSkill.length > 0) {
        for (const [skillName, pct] of perSkill) await updateUserSkill(skillName, pct)
      } else if (skill !== 'diagnostic') {
        await updateUserSkill(skill, data.score)
      }
    } catch (error) {
      console.warn(`[mukoko][assessment] Could not submit assessment: ${String(error)}`)
      setErrorMessage('Your answers could not be submitted. Check your connection and try again.')
      setPhase('error')
    }
  }

  const styles = createStyles(theme)

  if (phase === 'loading' || phase === 'submitting') {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.emptyText}>
          {phase === 'submitting' ? 'Grading your answers…' : 'Preparing your assessment…'}
        </Text>
      </View>
    )
  }

  if (phase === 'error') {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.emptyText}>{errorMessage ?? 'Something went wrong.'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={startAssessment}>
          <RotateCcw size={18} color={theme.primary} />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

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
          <View style={[styles.scoreRing, results.passed ? styles.scoreRingPass : styles.scoreRingFail]}>
            <Text style={styles.scorePercent}>{results.score}%</Text>
          </View>
          <Text style={styles.resultsTitle}>
            {results.passed ? 'Great Job!' : 'Keep Practicing!'}
          </Text>
          <Text style={styles.resultsSubtitle}>
            {results.correct} of {results.total} correct
          </Text>
          {results.passed && (
            <View style={styles.passedBadge}>
              <Trophy size={16} color="#ffffff" />
              <Text style={styles.passedBadgeText}>Assessment Passed</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Question Review</Text>
        {results.results.map((r, index) => {
          // The question text is the copy this screen was issued; the verdict,
          // the correct answer and the explanation all come from the server.
          const asked = questions.find(q => q.id === r.questionId)
          return (
            <View key={r.questionId} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                {r.correct ? (
                  <CheckCircle size={20} color={theme.secondary} />
                ) : (
                  <XCircle size={20} color="#ef4444" />
                )}
                <Text style={styles.reviewNumber}>Q{index + 1}</Text>
              </View>
              <Text style={styles.reviewQuestion}>{asked?.question ?? r.questionId}</Text>
              {!r.correct && (
                <View style={styles.reviewCorrection}>
                  <Text style={styles.reviewYourAnswer}>
                    Your answer: {r.userAnswer || 'Not answered'}
                  </Text>
                  <Text style={styles.reviewCorrectAnswer}>Correct: {r.correctAnswer}</Text>
                </View>
              )}
              {r.explanation ? <Text style={styles.reviewExplanation}>{r.explanation}</Text> : null}
            </View>
          )
        })}

        <View style={styles.resultsActions}>
          <TouchableOpacity style={styles.retryButton} onPress={startAssessment}>
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

            return (
              <TouchableOpacity
                key={index}
                style={[styles.optionButton, isSelected && styles.optionSelected]}
                onPress={() => handleSelectAnswer(option)}
              >
                <View style={styles.optionLabel}>
                  <View style={[styles.optionDot, isSelected && styles.optionDotSelected]} />
                  <Text style={styles.optionText}>{option}</Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>

        <Text style={styles.answerNote}>
          Your answers are graded when you finish — you will see every correct
          answer and why it is right on the results screen.
        </Text>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={[styles.primaryButton, !selectedAnswer && styles.primaryButtonDisabled]}
          onPress={handleNext}
          disabled={!selectedAnswer}
        >
          <Text style={styles.primaryButtonText}>
            {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish & See Results'}
          </Text>
          <ArrowRight size={18} color="#ffffff" />
        </TouchableOpacity>
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
    answerNote: {
      fontSize: 13,
      lineHeight: 18,
      color: theme.textMuted,
      textAlign: 'center',
      marginTop: 20,
      paddingHorizontal: 8,
    },
    retryButtonText: {
      color: theme.primary,
      fontSize: 16,
      fontWeight: '600',
    },
  })
