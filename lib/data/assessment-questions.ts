/**
 * Assessment Question Bank
 * Questions organized by skill and difficulty for language proficiency testing
 */

import type { SkillName, ProficiencyLevel } from '../types/skills'

export interface AssessmentQuestion {
  id: string
  skill: SkillName
  level: ProficiencyLevel
  type: 'multiple_choice' | 'translation' | 'fill_blank'
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
  language: 'shona' | 'ndebele' | 'swahili' | 'chinese' | 'all'
}

export const assessmentQuestions: AssessmentQuestion[] = [
  // ==========================================
  // VOCABULARY - Beginner
  // ==========================================
  {
    id: 'vocab-b-1',
    skill: 'vocabulary',
    level: 'beginner',
    type: 'multiple_choice',
    question: 'What does "Mhoro" mean in Shona?',
    options: ['Goodbye', 'Hello', 'Thank you', 'Please'],
    correctAnswer: 'Hello',
    explanation: '"Mhoro" is the Shona greeting for "Hello".',
    language: 'shona',
  },
  {
    id: 'vocab-b-2',
    skill: 'vocabulary',
    level: 'beginner',
    type: 'multiple_choice',
    question: 'What does "Sawubona" mean in Ndebele?',
    options: ['Thank you', 'Goodbye', 'Hello', 'How are you'],
    correctAnswer: 'Hello',
    explanation: '"Sawubona" is the Ndebele greeting meaning "Hello" or "I see you".',
    language: 'ndebele',
  },
  {
    id: 'vocab-b-3',
    skill: 'vocabulary',
    level: 'beginner',
    type: 'multiple_choice',
    question: 'What does "Asante" mean in Swahili?',
    options: ['Hello', 'Please', 'Thank you', 'Sorry'],
    correctAnswer: 'Thank you',
    explanation: '"Asante" means "Thank you" in Swahili.',
    language: 'swahili',
  },
  {
    id: 'vocab-b-4',
    skill: 'vocabulary',
    level: 'beginner',
    type: 'translation',
    question: 'How do you say "Thank you" in Shona?',
    options: ['Ndapota', 'Maita basa', 'Mhoro', 'Endai zvakanaka'],
    correctAnswer: 'Maita basa',
    explanation: '"Maita basa" (literally "you have done work") is how you express gratitude in Shona.',
    language: 'shona',
  },
  {
    id: 'vocab-b-5',
    skill: 'vocabulary',
    level: 'beginner',
    type: 'multiple_choice',
    question: 'What does "\u4F60\u597D" (N\u01D0 h\u01CEo) mean in Chinese?',
    options: ['Goodbye', 'Thank you', 'Hello', 'Sorry'],
    correctAnswer: 'Hello',
    explanation: '"\u4F60\u597D" (N\u01D0 h\u01CEo) is the standard Chinese greeting meaning "Hello".',
    language: 'chinese',
  },

  // ==========================================
  // VOCABULARY - Intermediate
  // ==========================================
  {
    id: 'vocab-i-1',
    skill: 'vocabulary',
    level: 'intermediate',
    type: 'translation',
    question: 'How do you say "I am well" in Shona?',
    options: ['Ndiripo', 'Ndapota', 'Ndinonzi', 'Ndinotenda'],
    correctAnswer: 'Ndiripo',
    explanation: '"Ndiripo" means "I am well/here" and is the standard response to "Makadii?".',
    language: 'shona',
  },
  {
    id: 'vocab-i-2',
    skill: 'vocabulary',
    level: 'intermediate',
    type: 'multiple_choice',
    question: 'What does "Tafadhali" mean in Swahili?',
    options: ['Thank you', 'Excuse me', 'Please', 'Welcome'],
    correctAnswer: 'Please',
    explanation: '"Tafadhali" is the polite Swahili word for "Please".',
    language: 'swahili',
  },
  {
    id: 'vocab-i-3',
    skill: 'vocabulary',
    level: 'intermediate',
    type: 'translation',
    question: 'How do you say "My name is..." in Ndebele?',
    options: ['Sawubona...', 'Ibizo lami ngu...', 'Ngiyabonga...', 'Ngicela...'],
    correctAnswer: 'Ibizo lami ngu...',
    explanation: '"Ibizo lami ngu..." is used to introduce yourself in Ndebele.',
    language: 'ndebele',
  },

  // ==========================================
  // GRAMMAR - Beginner
  // ==========================================
  {
    id: 'gram-b-1',
    skill: 'grammar',
    level: 'beginner',
    type: 'multiple_choice',
    question: 'In Shona, "Ndinonzi John" means "My name is John". What does "Ndinonzi" literally mean?',
    options: ['I am called', 'I like', 'I want', 'I see'],
    correctAnswer: 'I am called',
    explanation: '"Ndinonzi" comes from "ndi-" (I) + "-nonzi" (am called), a passive verb form.',
    language: 'shona',
  },
  {
    id: 'gram-b-2',
    skill: 'grammar',
    level: 'beginner',
    type: 'fill_blank',
    question: 'Complete the Swahili greeting: "Habari ___?" (How is your morning?)',
    options: ['ya asubuhi', 'ya jioni', 'yako', 'gani'],
    correctAnswer: 'ya asubuhi',
    explanation: '"Habari ya asubuhi?" means "How is your morning?" - "asubuhi" means morning.',
    language: 'swahili',
  },
  {
    id: 'gram-b-3',
    skill: 'grammar',
    level: 'beginner',
    type: 'multiple_choice',
    question: 'In Chinese, what is the correct word order for "I am a student"?',
    options: [
      '\u6211\u662F\u5B66\u751F (W\u01D2 sh\u00EC xu\u00E9sh\u0113ng)',
      '\u5B66\u751F\u662F\u6211',
      '\u662F\u6211\u5B66\u751F',
      '\u6211\u5B66\u751F\u662F',
    ],
    correctAnswer: '\u6211\u662F\u5B66\u751F (W\u01D2 sh\u00EC xu\u00E9sh\u0113ng)',
    explanation: 'Chinese follows Subject-Verb-Object order: \u6211 (I) + \u662F (am) + \u5B66\u751F (student).',
    language: 'chinese',
  },

  // ==========================================
  // GRAMMAR - Intermediate
  // ==========================================
  {
    id: 'gram-i-1',
    skill: 'grammar',
    level: 'intermediate',
    type: 'fill_blank',
    question: 'Complete: "Ndiri ___ kuenda kumusika" (I want to go to the market) in Shona.',
    options: ['kuda', 'ndoda', 'ndinoda', 'ndapota'],
    correctAnswer: 'kuda',
    explanation: '"Ndiri kuda" uses the progressive form "I am wanting/I want" in Shona.',
    language: 'shona',
  },

  // ==========================================
  // PRONUNCIATION - Beginner
  // ==========================================
  {
    id: 'pron-b-1',
    skill: 'pronunciation',
    level: 'beginner',
    type: 'multiple_choice',
    question: 'How many tones does Mandarin Chinese have?',
    options: ['Two', 'Three', 'Four', 'Five'],
    correctAnswer: 'Four',
    explanation: 'Mandarin has 4 main tones: flat, rising, dipping, and falling (plus a neutral tone).',
    language: 'chinese',
  },
  {
    id: 'pron-b-2',
    skill: 'pronunciation',
    level: 'beginner',
    type: 'multiple_choice',
    question: 'In Shona, the letter combination "sv" is pronounced like which English sound?',
    options: ['sv as in "svelte"', 'shv (with a whistle)', 'f as in "fast"', 'v as in "very"'],
    correctAnswer: 'shv (with a whistle)',
    explanation: 'Shona "sv" is a whistled fricative unique to the language, produced with pursed lips.',
    language: 'shona',
  },
  {
    id: 'pron-b-3',
    skill: 'pronunciation',
    level: 'beginner',
    type: 'multiple_choice',
    question: 'In Ndebele, the "c" in "ucela" (to ask) is pronounced as:',
    options: ['k sound', 's sound', 'a click sound', 'ch sound'],
    correctAnswer: 'a click sound',
    explanation: 'Ndebele uses click consonants. "c" is a dental click made by pulling the tongue off the front teeth.',
    language: 'ndebele',
  },

  // ==========================================
  // COMPREHENSION - Beginner
  // ==========================================
  {
    id: 'comp-b-1',
    skill: 'comprehension',
    level: 'beginner',
    type: 'multiple_choice',
    question: 'If someone says "Makadii?" in Shona, what are they asking?',
    options: ['What is your name?', 'Where are you going?', 'How are you?', 'What do you want?'],
    correctAnswer: 'How are you?',
    explanation: '"Makadii?" is the formal/plural way to ask "How are you?" in Shona.',
    language: 'shona',
  },
  {
    id: 'comp-b-2',
    skill: 'comprehension',
    level: 'beginner',
    type: 'multiple_choice',
    question: 'In Swahili, if someone greets you with "Habari yako?", how should you respond?',
    options: ['Habari yako', 'Nzuri, asante', 'Kwaheri', 'Tafadhali'],
    correctAnswer: 'Nzuri, asante',
    explanation: '"Nzuri, asante" means "Good, thank you" - the appropriate response to "How are you?".',
    language: 'swahili',
  },
  {
    id: 'comp-b-3',
    skill: 'comprehension',
    level: 'beginner',
    type: 'multiple_choice',
    question: 'If someone says "\u8C22\u8C22" (xi\u00E8xie) to you in Chinese, they are:',
    options: ['Apologizing', 'Saying hello', 'Thanking you', 'Saying goodbye'],
    correctAnswer: 'Thanking you',
    explanation: '"\u8C22\u8C22" (xi\u00E8xie) means "Thank you" in Chinese.',
    language: 'chinese',
  },

  // ==========================================
  // CONVERSATION - Beginner
  // ==========================================
  {
    id: 'conv-b-1',
    skill: 'conversation',
    level: 'beginner',
    type: 'multiple_choice',
    question: 'You meet someone for the first time in Zimbabwe. What is the most appropriate Shona greeting?',
    options: [
      'Sei? (What?)',
      'Mhoro, makadii? (Hello, how are you?)',
      'Ndapota (Please)',
      'Endai zvakanaka (Go well)',
    ],
    correctAnswer: 'Mhoro, makadii? (Hello, how are you?)',
    explanation: '"Mhoro, makadii?" is the standard polite greeting for meeting someone in Shona.',
    language: 'shona',
  },
  {
    id: 'conv-b-2',
    skill: 'conversation',
    level: 'beginner',
    type: 'multiple_choice',
    question: 'How do you say goodbye in Swahili?',
    options: ['Karibu', 'Kwaheri', 'Asante', 'Jambo'],
    correctAnswer: 'Kwaheri',
    explanation: '"Kwaheri" means "Goodbye" in Swahili. "Kwa heri" literally means "with blessings".',
    language: 'swahili',
  },
  {
    id: 'conv-b-3',
    skill: 'conversation',
    level: 'beginner',
    type: 'multiple_choice',
    question: 'In Ndebele, how do you politely ask someone for help?',
    options: ['Woza lapha', 'Ngicela usizo', 'Hamba', 'Yebo'],
    correctAnswer: 'Ngicela usizo',
    explanation: '"Ngicela usizo" means "I ask for help" - a polite way to request assistance in Ndebele.',
    language: 'ndebele',
  },
]

/**
 * Get questions for a specific skill assessment
 */
export function getQuestionsForSkill(
  skill: SkillName,
  level: ProficiencyLevel = 'beginner',
  language?: string,
  count: number = 5
): AssessmentQuestion[] {
  let filtered = assessmentQuestions.filter(q => q.skill === skill)

  // Filter by level - include current level and one below
  const levelOrder: ProficiencyLevel[] = ['beginner', 'elementary', 'intermediate', 'advanced', 'fluent']
  const levelIndex = levelOrder.indexOf(level)
  const allowedLevels = levelOrder.slice(0, levelIndex + 1)
  filtered = filtered.filter(q => allowedLevels.includes(q.level))

  // Filter by language if specified
  if (language) {
    filtered = filtered.filter(q => q.language === language || q.language === 'all')
  }

  // Shuffle and take the requested count
  const shuffled = filtered.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

/**
 * Get a diagnostic assessment (questions across all skills)
 */
export function getDiagnosticQuestions(language?: string, count: number = 10): AssessmentQuestion[] {
  let filtered = assessmentQuestions.filter(q => q.level === 'beginner')

  if (language) {
    filtered = filtered.filter(q => q.language === language || q.language === 'all')
  }

  const shuffled = filtered.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

/**
 * Calculate score from answers
 */
export function calculateAssessmentScore(
  questions: AssessmentQuestion[],
  answers: Record<string, string>
): {
  score: number
  total: number
  percentage: number
  results: Array<{ question: AssessmentQuestion; userAnswer: string; correct: boolean }>
} {
  const results = questions.map(q => ({
    question: q,
    userAnswer: answers[q.id] || '',
    correct: answers[q.id] === q.correctAnswer,
  }))

  const score = results.filter(r => r.correct).length
  const total = questions.length
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0

  return { score, total, percentage, results }
}
