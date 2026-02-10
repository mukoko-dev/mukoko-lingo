import { useState, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native'
import { useRouter } from 'expo-router'
import {
  Volume2,
  BookText,
  Languages,
  Ear,
  MessageSquare,
  ChevronRight,
  Trophy,
  Flame,
} from 'lucide-react-native'

import { useColorScheme } from '@/components/useColorScheme'
import { lightTheme, darkTheme, Colors } from '@/constants/Colors'
import { getUserSkills, getStudyStreak, getProgress } from '@/lib/storage/database'

const SKILLS = [
  {
    id: 'pronunciation',
    name: 'Pronunciation',
    description: 'Sound production, tone, rhythm',
    icon: Volume2,
    color: Colors.primary[600],
  },
  {
    id: 'vocabulary',
    name: 'Vocabulary',
    description: 'Word knowledge, context usage',
    icon: BookText,
    color: Colors.secondary[500],
  },
  {
    id: 'grammar',
    name: 'Grammar',
    description: 'Sentence structure, verb forms',
    icon: Languages,
    color: Colors.accent[500],
  },
  {
    id: 'comprehension',
    name: 'Comprehension',
    description: 'Listening and reading',
    icon: Ear,
    color: '#3b82f6',
  },
  {
    id: 'conversation',
    name: 'Conversation',
    description: 'Real-time dialogue',
    icon: MessageSquare,
    color: '#8b5cf6',
  },
]

export default function SkillsScreen() {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme
  const router = useRouter()

  const [skills, setSkills] = useState<Record<string, { score: number; lastAssessed: string }>>({})
  const [streak, setStreak] = useState(0)
  const [masteredCount, setMasteredCount] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [userSkills, studyStreak, progress] = await Promise.all([
      getUserSkills(),
      getStudyStreak(),
      getProgress(),
    ])
    setSkills(userSkills)
    setStreak(studyStreak)
    setMasteredCount(Object.values(progress).filter(p => p.status === 'mastered').length)
  }

  const getOverallProgress = () => {
    const scores = Object.values(skills).map(s => s.score)
    if (scores.length === 0) return 0
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  }

  const getProficiencyLevel = (score: number) => {
    if (score >= 90) return 'Fluent'
    if (score >= 80) return 'Advanced'
    if (score >= 65) return 'Intermediate'
    if (score >= 50) return 'Elementary'
    return 'Beginner'
  }

  const styles = createStyles(theme)
  const overallProgress = getOverallProgress()

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: Colors.accent[500] + '20' }]}>
            <Flame size={24} color={Colors.accent[500]} />
          </View>
          <Text style={styles.statValue}>{streak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: Colors.secondary[500] + '20' }]}>
            <Trophy size={24} color={Colors.secondary[500]} />
          </View>
          <Text style={styles.statValue}>{overallProgress}%</Text>
          <Text style={styles.statLabel}>Overall</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: Colors.primary[600] + '20' }]}>
            <Trophy size={24} color={Colors.primary[600]} />
          </View>
          <Text style={styles.statValue}>{masteredCount}</Text>
          <Text style={styles.statLabel}>Mastered</Text>
        </View>
      </View>

      {/* Progress Ring */}
      <View style={styles.progressCard}>
        <View style={styles.progressRing}>
          <Text style={styles.progressPercent}>{overallProgress}%</Text>
          <Text style={styles.progressLevel}>{getProficiencyLevel(overallProgress)}</Text>
        </View>
        <View style={styles.progressInfo}>
          <Text style={styles.progressTitle}>Your Progress</Text>
          <Text style={styles.progressDescription}>
            Keep practicing to improve your overall language proficiency!
          </Text>
          <TouchableOpacity
            style={styles.assessButton}
            onPress={() => router.push('/assessment/diagnostic')}
          >
            <Text style={styles.assessButtonText}>Take Assessment</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Skills List */}
      <Text style={styles.sectionTitle}>Skills Breakdown</Text>
      {SKILLS.map(skill => {
        const userSkill = skills[skill.id]
        const score = userSkill?.score || 0
        const Icon = skill.icon

        return (
          <TouchableOpacity
            key={skill.id}
            style={styles.skillCard}
            onPress={() => router.push(`/assessment/${skill.id}`)}
            activeOpacity={0.7}
          >
            <View style={[styles.skillIcon, { backgroundColor: skill.color + '20' }]}>
              <Icon size={24} color={skill.color} />
            </View>
            <View style={styles.skillInfo}>
              <Text style={styles.skillName}>{skill.name}</Text>
              <Text style={styles.skillDescription}>{skill.description}</Text>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${score}%`, backgroundColor: skill.color },
                  ]}
                />
              </View>
            </View>
            <View style={styles.skillScore}>
              <Text style={[styles.scoreText, { color: skill.color }]}>{score}%</Text>
              <ChevronRight size={16} color={theme.textMuted} />
            </View>
          </TouchableOpacity>
        )
      })}

      {/* Ubuntu Philosophy */}
      <View style={styles.ubuntuCard}>
        <Text style={styles.ubuntuTitle}>Ubuntu Philosophy</Text>
        <Text style={styles.ubuntuQuote}>
          "I am because we are"
        </Text>
        <Text style={styles.ubuntuText}>
          Learning together, growing together. Your progress helps build a community of multilingual speakers.
        </Text>
      </View>
    </ScrollView>
  )
}

const createStyles = (theme: typeof lightTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      padding: 16,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
    },
    statIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.text,
    },
    statLabel: {
      fontSize: 13,
      color: theme.textMuted,
      marginTop: 2,
    },
    progressCard: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
    },
    progressRing: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 8,
      borderColor: Colors.primary[600],
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    progressPercent: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.text,
    },
    progressLevel: {
      fontSize: 12,
      color: Colors.primary[600],
      fontWeight: '600',
    },
    progressInfo: {
      flex: 1,
    },
    progressTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 4,
    },
    progressDescription: {
      fontSize: 13,
      color: theme.textSecondary,
      lineHeight: 18,
      marginBottom: 12,
    },
    assessButton: {
      backgroundColor: Colors.primary[600],
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      alignSelf: 'flex-start',
    },
    assessButtonText: {
      color: '#ffffff',
      fontSize: 13,
      fontWeight: '600',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 12,
    },
    skillCard: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    skillIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    skillInfo: {
      flex: 1,
    },
    skillName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 2,
    },
    skillDescription: {
      fontSize: 12,
      color: theme.textMuted,
      marginBottom: 8,
    },
    progressBarContainer: {
      height: 4,
      backgroundColor: theme.border,
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      borderRadius: 2,
    },
    skillScore: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 12,
    },
    scoreText: {
      fontSize: 16,
      fontWeight: '700',
      marginRight: 4,
    },
    ubuntuCard: {
      backgroundColor: Colors.primary[700],
      borderRadius: 16,
      padding: 20,
      marginTop: 12,
      marginBottom: 24,
    },
    ubuntuTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: Colors.primary[200],
      marginBottom: 8,
    },
    ubuntuQuote: {
      fontSize: 20,
      fontWeight: '700',
      color: '#ffffff',
      fontStyle: 'italic',
      marginBottom: 8,
    },
    ubuntuText: {
      fontSize: 14,
      color: Colors.primary[200],
      lineHeight: 20,
    },
  })
