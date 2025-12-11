/**
 * Diagnostic Assessment Data
 * Initial assessment to determine baseline proficiency across all 5 skills
 *
 * Structure: 10 questions per skill = 50 total questions
 * Each skill tests concepts from beginner to advanced
 * Questions progress in difficulty within each skill section
 */

import type { SkillName, ProficiencyLevel } from "@/lib/types/skills"

export interface DiagnosticQuestion {
  id: string
  skillName: SkillName
  type: "multiple_choice" | "fill_blank" | "translation" | "listening"
  difficulty: 1 | 2 | 3 | 4 | 5 // 1=beginner, 5=fluent
  question: {
    en: string
    shona?: string
    ndebele?: string
    chinese?: string
  }
  options?: string[]
  correctAnswer: string
  explanation: {
    en: string
    shona?: string
    ndebele?: string
    chinese?: string
  }
  points: number
}

export interface DiagnosticAssessment {
  id: string
  title: Record<string, string>
  description: Record<string, string>
  estimatedTime: number // minutes
  questions: DiagnosticQuestion[]
}

// Calculate proficiency level from score
export function calculateProficiencyLevel(score: number): ProficiencyLevel {
  if (score >= 90) return "fluent"
  if (score >= 80) return "advanced"
  if (score >= 65) return "intermediate"
  if (score >= 50) return "elementary"
  return "beginner"
}

// Calculate score for a skill based on answers
export function calculateSkillScore(
  questions: DiagnosticQuestion[],
  answers: Record<string, string>
): number {
  let totalPoints = 0
  let earnedPoints = 0

  for (const question of questions) {
    totalPoints += question.points
    if (answers[question.id]?.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()) {
      earnedPoints += question.points
    }
  }

  return totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0
}

/**
 * Diagnostic Assessment - Shona Language Focus
 * Tests all 5 skills with 10 questions each
 */
export const diagnosticAssessment: DiagnosticAssessment = {
  id: "diagnostic-shona-001",
  title: {
    en: "Shona Language Diagnostic Assessment",
    shona: "Bvunzo Yekutanga yeChiShona",
  },
  description: {
    en: "This assessment will determine your current proficiency level in Shona across 5 key skills. Take your time and answer honestly - there's no penalty for wrong answers!",
    shona: "Bvunzo iyi ichaona kuti unogona zvakadini muChiShona. Tora nguva yako - hapana chirango kana ukapindura zvisizvo!",
  },
  estimatedTime: 15,
  questions: [
    // ========================================
    // PRONUNCIATION QUESTIONS (10)
    // ========================================
    {
      id: "pron-1",
      skillName: "pronunciation",
      type: "multiple_choice",
      difficulty: 1,
      question: {
        en: "How do you pronounce the Shona greeting 'Mhoro'?",
      },
      options: ["m-HO-ro", "MHO-ro", "mho-RO", "m-ho-RO"],
      correctAnswer: "m-HO-ro",
      explanation: {
        en: "In Shona, 'Mhoro' is pronounced with emphasis on the second syllable: m-HO-ro.",
      },
      points: 10,
    },
    {
      id: "pron-2",
      skillName: "pronunciation",
      type: "multiple_choice",
      difficulty: 1,
      question: {
        en: "Which sound does the Shona letter combination 'sv' make?",
      },
      options: ["Like 'sv' in 'svelte'", "A whistling 'sv' sound", "Like 'f'", "Like 'sh'"],
      correctAnswer: "A whistling 'sv' sound",
      explanation: {
        en: "The Shona 'sv' is a unique whistling fricative sound not found in English.",
      },
      points: 10,
    },
    {
      id: "pron-3",
      skillName: "pronunciation",
      type: "multiple_choice",
      difficulty: 2,
      question: {
        en: "In Shona, how is the word 'Ndatenda' (thank you) stressed?",
      },
      options: ["NDA-ten-da", "nda-TEN-da", "nda-ten-DA", "Evenly stressed"],
      correctAnswer: "nda-TEN-da",
      explanation: {
        en: "'Ndatenda' has the primary stress on the second syllable: nda-TEN-da.",
      },
      points: 10,
    },
    {
      id: "pron-4",
      skillName: "pronunciation",
      type: "multiple_choice",
      difficulty: 2,
      question: {
        en: "What type of sound is the Shona 'bv' combination?",
      },
      options: ["A click sound", "An implosive sound", "A nasal sound", "A silent sound"],
      correctAnswer: "An implosive sound",
      explanation: {
        en: "The Shona 'bv' is an implosive bilabial sound, made by drawing air inward.",
      },
      points: 10,
    },
    {
      id: "pron-5",
      skillName: "pronunciation",
      type: "multiple_choice",
      difficulty: 3,
      question: {
        en: "How does tone affect meaning in Shona?",
      },
      options: [
        "Tone doesn't affect meaning",
        "High/low tones can change word meaning",
        "Only for questions",
        "Only for emphasis",
      ],
      correctAnswer: "High/low tones can change word meaning",
      explanation: {
        en: "Shona is a tonal language where high and low tones can completely change a word's meaning.",
      },
      points: 10,
    },
    {
      id: "pron-6",
      skillName: "pronunciation",
      type: "multiple_choice",
      difficulty: 3,
      question: {
        en: "The Shona 'dzv' sound is pronounced by:",
      },
      options: [
        "Touching tongue to teeth",
        "Combining 'd' with a whistling 'zv'",
        "Like English 'j'",
        "Like a click",
      ],
      correctAnswer: "Combining 'd' with a whistling 'zv'",
      explanation: {
        en: "The 'dzv' combines the 'd' stop with the distinctive Shona whistling 'zv' fricative.",
      },
      points: 10,
    },
    {
      id: "pron-7",
      skillName: "pronunciation",
      type: "multiple_choice",
      difficulty: 4,
      question: {
        en: "In the word 'nzira' (path/way), the 'nz' combination is:",
      },
      options: [
        "Two separate sounds",
        "A prenasalized 'z'",
        "Silent 'n'",
        "Like English 'ns'",
      ],
      correctAnswer: "A prenasalized 'z'",
      explanation: {
        en: "The 'nz' is a prenasalized consonant where the nasal 'n' flows directly into 'z'.",
      },
      points: 10,
    },
    {
      id: "pron-8",
      skillName: "pronunciation",
      type: "multiple_choice",
      difficulty: 4,
      question: {
        en: "Which vowel sound does NOT exist in standard Shona?",
      },
      options: ["a", "e", "i", "ü (as in German)"],
      correctAnswer: "ü (as in German)",
      explanation: {
        en: "Shona has 5 vowels (a, e, i, o, u) similar to Spanish. The German 'ü' sound doesn't exist.",
      },
      points: 10,
    },
    {
      id: "pron-9",
      skillName: "pronunciation",
      type: "multiple_choice",
      difficulty: 5,
      question: {
        en: "The phonetic difference between 'nhema' (lies) and 'nema' depends on:",
      },
      options: [
        "Vowel length",
        "Aspiration of the 'n'",
        "The breathy 'nh' vs regular 'n'",
        "Tone only",
      ],
      correctAnswer: "The breathy 'nh' vs regular 'n'",
      explanation: {
        en: "The 'nh' is a breathy nasal, distinct from the regular 'n'. This changes word meaning.",
      },
      points: 10,
    },
    {
      id: "pron-10",
      skillName: "pronunciation",
      type: "multiple_choice",
      difficulty: 5,
      question: {
        en: "Advanced speakers recognize that Shona syllables are typically:",
      },
      options: [
        "Closed (ending in consonant)",
        "Open (ending in vowel)",
        "Variable",
        "Consonant clusters",
      ],
      correctAnswer: "Open (ending in vowel)",
      explanation: {
        en: "Shona syllables are predominantly open, ending in vowels. This gives the language its rhythmic quality.",
      },
      points: 10,
    },

    // ========================================
    // VOCABULARY QUESTIONS (10)
    // ========================================
    {
      id: "vocab-1",
      skillName: "vocabulary",
      type: "multiple_choice",
      difficulty: 1,
      question: {
        en: "What does 'Mangwanani' mean?",
      },
      options: ["Good evening", "Good morning", "Good night", "Goodbye"],
      correctAnswer: "Good morning",
      explanation: {
        en: "'Mangwanani' is the Shona greeting for 'Good morning'.",
      },
      points: 10,
    },
    {
      id: "vocab-2",
      skillName: "vocabulary",
      type: "multiple_choice",
      difficulty: 1,
      question: {
        en: "What is 'mvura' in English?",
      },
      options: ["Fire", "Water", "Earth", "Air"],
      correctAnswer: "Water",
      explanation: {
        en: "'Mvura' means 'water' in Shona.",
      },
      points: 10,
    },
    {
      id: "vocab-3",
      skillName: "vocabulary",
      type: "multiple_choice",
      difficulty: 2,
      question: {
        en: "How do you say 'I am fine' in Shona?",
      },
      options: ["Ndiri bho", "Ndiri zvakanaka", "Ndakagara zvakanaka", "Tiripo"],
      correctAnswer: "Ndiri zvakanaka",
      explanation: {
        en: "'Ndiri zvakanaka' literally means 'I am well/fine'.",
      },
      points: 10,
    },
    {
      id: "vocab-4",
      skillName: "vocabulary",
      type: "multiple_choice",
      difficulty: 2,
      question: {
        en: "What does 'Murisei?' mean?",
      },
      options: ["Where are you?", "How are you (plural)?", "Who are you?", "What are you doing?"],
      correctAnswer: "How are you (plural)?",
      explanation: {
        en: "'Murisei?' is the plural/respectful form of 'How are you?'",
      },
      points: 10,
    },
    {
      id: "vocab-5",
      skillName: "vocabulary",
      type: "multiple_choice",
      difficulty: 3,
      question: {
        en: "The word 'mhuri' refers to:",
      },
      options: ["House", "Village", "Family", "Friend"],
      correctAnswer: "Family",
      explanation: {
        en: "'Mhuri' means 'family' in Shona - a very important concept in Shona culture.",
      },
      points: 10,
    },
    {
      id: "vocab-6",
      skillName: "vocabulary",
      type: "multiple_choice",
      difficulty: 3,
      question: {
        en: "What is 'basa' in English?",
      },
      options: ["School", "Work/Job", "Market", "Church"],
      correctAnswer: "Work/Job",
      explanation: {
        en: "'Basa' means 'work' or 'job' in Shona.",
      },
      points: 10,
    },
    {
      id: "vocab-7",
      skillName: "vocabulary",
      type: "multiple_choice",
      difficulty: 4,
      question: {
        en: "The expression 'Zvakanaka chaizvo' means:",
      },
      options: ["Not bad", "Very good/excellent", "Good enough", "So-so"],
      correctAnswer: "Very good/excellent",
      explanation: {
        en: "'Zvakanaka chaizvo' adds emphasis to 'zvakanaka' (good), meaning 'very good' or 'excellent'.",
      },
      points: 10,
    },
    {
      id: "vocab-8",
      skillName: "vocabulary",
      type: "multiple_choice",
      difficulty: 4,
      question: {
        en: "What does 'kudzidza' mean?",
      },
      options: ["To eat", "To sleep", "To learn/study", "To travel"],
      correctAnswer: "To learn/study",
      explanation: {
        en: "'Kudzidza' is the infinitive verb meaning 'to learn' or 'to study'.",
      },
      points: 10,
    },
    {
      id: "vocab-9",
      skillName: "vocabulary",
      type: "multiple_choice",
      difficulty: 5,
      question: {
        en: "The idiomatic expression 'Ane maoko maviri' literally means 'has two hands' but implies:",
      },
      options: ["Is capable", "Is greedy", "Is generous", "Is dishonest"],
      correctAnswer: "Is generous",
      explanation: {
        en: "This idiom suggests someone is generous - they give with both hands.",
      },
      points: 10,
    },
    {
      id: "vocab-10",
      skillName: "vocabulary",
      type: "multiple_choice",
      difficulty: 5,
      question: {
        en: "'Musha mukadzi' is a proverb meaning:",
      },
      options: [
        "A home needs children",
        "A home is the woman (wife makes the home)",
        "Women belong at home",
        "The husband leads the home",
      ],
      correctAnswer: "A home is the woman (wife makes the home)",
      explanation: {
        en: "This proverb emphasizes the woman's central role in creating and maintaining a home.",
      },
      points: 10,
    },

    // ========================================
    // GRAMMAR QUESTIONS (10)
    // ========================================
    {
      id: "gram-1",
      skillName: "grammar",
      type: "multiple_choice",
      difficulty: 1,
      question: {
        en: "In Shona, 'Ndiri' means:",
      },
      options: ["You are", "I am", "We are", "They are"],
      correctAnswer: "I am",
      explanation: {
        en: "'Ndiri' is the first person singular 'I am'. 'Ndi-' is the subject prefix for 'I'.",
      },
      points: 10,
    },
    {
      id: "gram-2",
      skillName: "grammar",
      type: "multiple_choice",
      difficulty: 1,
      question: {
        en: "Which prefix makes a verb negative in Shona?",
      },
      options: ["ha-", "ku-", "mu-", "chi-"],
      correctAnswer: "ha-",
      explanation: {
        en: "The prefix 'ha-' is used to negate verbs in Shona. E.g., 'Handidi' = I don't want.",
      },
      points: 10,
    },
    {
      id: "gram-3",
      skillName: "grammar",
      type: "multiple_choice",
      difficulty: 2,
      question: {
        en: "To say 'I want' in Shona, you say:",
      },
      options: ["Ndoda", "Ndiri", "Ndine", "Ndaenda"],
      correctAnswer: "Ndoda",
      explanation: {
        en: "'Ndoda' combines the subject prefix 'Ndi-' with the verb root '-da' (want).",
      },
      points: 10,
    },
    {
      id: "gram-4",
      skillName: "grammar",
      type: "multiple_choice",
      difficulty: 2,
      question: {
        en: "The past tense marker in Shona is typically:",
      },
      options: ["-a-", "-cha-", "-ka-", "-no-"],
      correctAnswer: "-ka-",
      explanation: {
        en: "The '-ka-' infix indicates simple past tense. E.g., 'Ndakadya' = I ate.",
      },
      points: 10,
    },
    {
      id: "gram-5",
      skillName: "grammar",
      type: "multiple_choice",
      difficulty: 3,
      question: {
        en: "'Anofamba' means 'he/she walks'. What does 'Vanofamba' mean?",
      },
      options: ["I walk", "You walk", "They walk", "We walk"],
      correctAnswer: "They walk",
      explanation: {
        en: "'Va-' is the subject prefix for 'they' (or respectful 'you'). 'Vanofamba' = They walk.",
      },
      points: 10,
    },
    {
      id: "gram-6",
      skillName: "grammar",
      type: "multiple_choice",
      difficulty: 3,
      question: {
        en: "To form a question in Shona, you typically:",
      },
      options: [
        "Add 'ka' at the end",
        "Change word order",
        "Use rising intonation or question words",
        "Add 'here' prefix",
      ],
      correctAnswer: "Use rising intonation or question words",
      explanation: {
        en: "Questions in Shona use rising intonation or question words like 'Sei?' (why), 'Ani?' (who).",
      },
      points: 10,
    },
    {
      id: "gram-7",
      skillName: "grammar",
      type: "multiple_choice",
      difficulty: 4,
      question: {
        en: "The future tense in 'Ndichaenda' (I will go) is marked by:",
      },
      options: ["-di-", "-cha-", "-enda", "-a"],
      correctAnswer: "-cha-",
      explanation: {
        en: "The '-cha-' infix marks future tense. 'Ndi-cha-enda' = I will go.",
      },
      points: 10,
    },
    {
      id: "gram-8",
      skillName: "grammar",
      type: "multiple_choice",
      difficulty: 4,
      question: {
        en: "In 'Bhuku rangu' (my book), 'rangu' is:",
      },
      options: ["A verb", "A possessive pronoun", "An adjective", "An adverb"],
      correctAnswer: "A possessive pronoun",
      explanation: {
        en: "'Rangu' is the possessive 'my' that agrees with noun class 5 (ri-). 'Ra-ngu' = of-me.",
      },
      points: 10,
    },
    {
      id: "gram-9",
      skillName: "grammar",
      type: "multiple_choice",
      difficulty: 5,
      question: {
        en: "Shona has how many noun classes?",
      },
      options: ["5", "10", "15-21", "3"],
      correctAnswer: "15-21",
      explanation: {
        en: "Shona, like other Bantu languages, has 15-21 noun classes that affect agreement patterns.",
      },
      points: 10,
    },
    {
      id: "gram-10",
      skillName: "grammar",
      type: "multiple_choice",
      difficulty: 5,
      question: {
        en: "In the sentence 'Mukadzi uyu arikubika' (This woman is cooking), '-ri-ku-' indicates:",
      },
      options: [
        "Past continuous",
        "Present continuous",
        "Future",
        "Habitual action",
      ],
      correctAnswer: "Present continuous",
      explanation: {
        en: "The '-ri-ku-' combination marks present continuous: 'is cooking' (right now).",
      },
      points: 10,
    },

    // ========================================
    // COMPREHENSION QUESTIONS (10)
    // ========================================
    {
      id: "comp-1",
      skillName: "comprehension",
      type: "multiple_choice",
      difficulty: 1,
      question: {
        en: "If someone says 'Mhoro, makadii?', they are:",
      },
      options: ["Saying goodbye", "Greeting and asking how you are", "Asking for directions", "Ordering food"],
      correctAnswer: "Greeting and asking how you are",
      explanation: {
        en: "'Mhoro' is a greeting, and 'Makadii?' asks 'How are you?' (respectful/plural).",
      },
      points: 10,
    },
    {
      id: "comp-2",
      skillName: "comprehension",
      type: "multiple_choice",
      difficulty: 1,
      question: {
        en: "When someone responds 'Ndiripo, makadiiko?', they mean:",
      },
      options: [
        "I'm not here",
        "I'm fine, how about you?",
        "I don't understand",
        "Please repeat",
      ],
      correctAnswer: "I'm fine, how about you?",
      explanation: {
        en: "'Ndiripo' = I'm here/fine. 'Makadiiko?' returns the question: And how are you?",
      },
      points: 10,
    },
    {
      id: "comp-3",
      skillName: "comprehension",
      type: "multiple_choice",
      difficulty: 2,
      question: {
        en: "If someone says 'Zita rangu ndinonzi Tatenda', they are telling you:",
      },
      options: ["Their age", "Their name", "Where they live", "Their job"],
      correctAnswer: "Their name",
      explanation: {
        en: "'Zita rangu' = My name. 'Ndinonzi' = I am called. They're introducing themselves as Tatenda.",
      },
      points: 10,
    },
    {
      id: "comp-4",
      skillName: "comprehension",
      type: "multiple_choice",
      difficulty: 2,
      question: {
        en: "'Ndinogara kuHarare' tells you about someone's:",
      },
      options: ["Work", "Family", "Residence", "Hobby"],
      correctAnswer: "Residence",
      explanation: {
        en: "'Ndinogara' = I live/stay. 'kuHarare' = in Harare. They're telling you where they live.",
      },
      points: 10,
    },
    {
      id: "comp-5",
      skillName: "comprehension",
      type: "multiple_choice",
      difficulty: 3,
      question: {
        en: "Read: 'Ndakaenda kumusika ndikatenga michero.' What happened?",
      },
      options: [
        "I went to school and learned",
        "I went to the market and bought fruits",
        "I went home and slept",
        "I went to church and prayed",
      ],
      correctAnswer: "I went to the market and bought fruits",
      explanation: {
        en: "'Kumusika' = to the market. 'Ndikatenga' = and bought. 'Michero' = fruits.",
      },
      points: 10,
    },
    {
      id: "comp-6",
      skillName: "comprehension",
      type: "multiple_choice",
      difficulty: 3,
      question: {
        en: "'Mwana uyu anodzidza kuChikoro chePuraimari' means the child:",
      },
      options: [
        "Works at a primary school",
        "Studies at a primary school",
        "Lives near a primary school",
        "Built a primary school",
      ],
      correctAnswer: "Studies at a primary school",
      explanation: {
        en: "'Anodzidza' = studies/learns. 'Chikoro chePuraimari' = Primary School.",
      },
      points: 10,
    },
    {
      id: "comp-7",
      skillName: "comprehension",
      type: "multiple_choice",
      difficulty: 4,
      question: {
        en: "'Kana uchida kubatsirwa, ndipei shoko.' The speaker is saying:",
      },
      options: [
        "Don't ask for help",
        "If you need help, let me know",
        "I don't want to help",
        "Help yourself",
      ],
      correctAnswer: "If you need help, let me know",
      explanation: {
        en: "'Kana' = if. 'Uchida kubatsirwa' = you want to be helped. 'Ndipei shoko' = give me word/let me know.",
      },
      points: 10,
    },
    {
      id: "comp-8",
      skillName: "comprehension",
      type: "multiple_choice",
      difficulty: 4,
      question: {
        en: "'Handina nguva nhasi, asi mangwana ndinogona.' What is the person saying?",
      },
      options: [
        "I'm always busy",
        "I don't have time today, but tomorrow I can",
        "I never have time",
        "Today and tomorrow are busy",
      ],
      correctAnswer: "I don't have time today, but tomorrow I can",
      explanation: {
        en: "'Handina nguva' = I don't have time. 'Nhasi' = today. 'Asi' = but. 'Mangwana' = tomorrow.",
      },
      points: 10,
    },
    {
      id: "comp-9",
      skillName: "comprehension",
      type: "multiple_choice",
      difficulty: 5,
      question: {
        en: "'Kunyangwe zvazvo vachiita zvakadaro, tinofanira kuramba tichishanda pamwe chete.' The message is:",
      },
      options: [
        "We should stop working together",
        "Even though they do that, we must continue working together",
        "They work better alone",
        "Working together is impossible",
      ],
      correctAnswer: "Even though they do that, we must continue working together",
      explanation: {
        en: "'Kunyangwe zvazvo' = even though. 'Kuramba tichishanda pamwe chete' = continue working together.",
      },
      points: 10,
    },
    {
      id: "comp-10",
      skillName: "comprehension",
      type: "multiple_choice",
      difficulty: 5,
      question: {
        en: "In a business context, 'Tinokukumbirai kuti mutumire mari musati mapiwa zvigadzirwa' means:",
      },
      options: [
        "Products are free",
        "Pay after receiving products",
        "We request payment before products are given",
        "No payment is needed",
      ],
      correctAnswer: "We request payment before products are given",
      explanation: {
        en: "'Tinokukumbirai' = we request you. 'Tumire mari' = send money. 'Musati mapiwa' = before you are given.",
      },
      points: 10,
    },

    // ========================================
    // CONVERSATION QUESTIONS (10)
    // ========================================
    {
      id: "conv-1",
      skillName: "conversation",
      type: "multiple_choice",
      difficulty: 1,
      question: {
        en: "Someone greets you with 'Mhoro!' What's the best response?",
      },
      options: ["Tatenda", "Mhoro!", "Fambai zvakanaka", "Ndapota"],
      correctAnswer: "Mhoro!",
      explanation: {
        en: "The appropriate response to 'Mhoro!' is to return the greeting: 'Mhoro!'",
      },
      points: 10,
    },
    {
      id: "conv-2",
      skillName: "conversation",
      type: "multiple_choice",
      difficulty: 1,
      question: {
        en: "How do you politely say 'please' when asking for something?",
      },
      options: ["Ndatenda", "Ndapota", "Zvakanaka", "Mangwanani"],
      correctAnswer: "Ndapota",
      explanation: {
        en: "'Ndapota' is the polite word for 'please' in Shona.",
      },
      points: 10,
    },
    {
      id: "conv-3",
      skillName: "conversation",
      type: "multiple_choice",
      difficulty: 2,
      question: {
        en: "At a market, you want to ask 'How much is this?' You say:",
      },
      options: ["Zvinoita sei?", "Izvi zvakawanda sei?", "Imarii?", "Ndechipi?"],
      correctAnswer: "Imarii?",
      explanation: {
        en: "'Imarii?' is the common way to ask 'How much?' when shopping.",
      },
      points: 10,
    },
    {
      id: "conv-4",
      skillName: "conversation",
      type: "multiple_choice",
      difficulty: 2,
      question: {
        en: "To introduce yourself by name, you would say:",
      },
      options: [
        "Ndiri munhu",
        "Zita rangu ndinonzi...",
        "Ndakabva ku...",
        "Ndinoshanda ku...",
      ],
      correctAnswer: "Zita rangu ndinonzi...",
      explanation: {
        en: "'Zita rangu ndinonzi...' = My name is called... This is the standard self-introduction.",
      },
      points: 10,
    },
    {
      id: "conv-5",
      skillName: "conversation",
      type: "multiple_choice",
      difficulty: 3,
      question: {
        en: "When saying goodbye to an elder, you should say:",
      },
      options: ["Chisarai!", "Endai zvakanaka", "Sara zvakanaka", "Bye!"],
      correctAnswer: "Endai zvakanaka",
      explanation: {
        en: "'Endai zvakanaka' (Go well) is respectful when the elder is leaving. Use plural/respectful form.",
      },
      points: 10,
    },
    {
      id: "conv-6",
      skillName: "conversation",
      type: "multiple_choice",
      difficulty: 3,
      question: {
        en: "If you don't understand something, you politely say:",
      },
      options: [
        "Handizive",
        "Handina kunzwisisa, mungadzokorora here?",
        "Chirungu chete",
        "Ndinogona",
      ],
      correctAnswer: "Handina kunzwisisa, mungadzokorora here?",
      explanation: {
        en: "'Handina kunzwisisa' = I didn't understand. 'Mungadzokorora here?' = Could you repeat? Very polite.",
      },
      points: 10,
    },
    {
      id: "conv-7",
      skillName: "conversation",
      type: "multiple_choice",
      difficulty: 4,
      question: {
        en: "To politely decline an offer in Shona culture, you might say:",
      },
      options: [
        "Kwete, handidi!",
        "Ndatenda, asi handikwanise pari zvino",
        "Musandipe",
        "Ibva!",
      ],
      correctAnswer: "Ndatenda, asi handikwanise pari zvino",
      explanation: {
        en: "'Ndatenda' (thank you) first shows appreciation. 'Handikwanise pari zvino' = I can't right now. Polite refusal.",
      },
      points: 10,
    },
    {
      id: "conv-8",
      skillName: "conversation",
      type: "multiple_choice",
      difficulty: 4,
      question: {
        en: "When meeting someone's parents for the first time, appropriate greetings include:",
      },
      options: [
        "Mhoro wani!",
        "Makadii Baba/Amai, ndinokutendai kundigamuchira",
        "Hey!",
        "Uri sei?",
      ],
      correctAnswer: "Makadii Baba/Amai, ndinokutendai kundigamuchira",
      explanation: {
        en: "Using respectful titles (Baba/Amai) and expressing gratitude shows proper respect.",
      },
      points: 10,
    },
    {
      id: "conv-9",
      skillName: "conversation",
      type: "multiple_choice",
      difficulty: 5,
      question: {
        en: "In a formal business meeting, to open discussion you might say:",
      },
      options: [
        "Ngatitaurei",
        "Tinokutendai nekuuya kwenyu, ngatienderere mberi nemusangano wedu",
        "Sei matadza kuuya?",
        "Pindai henyu",
      ],
      correctAnswer: "Tinokutendai nekuuya kwenyu, ngatienderere mberi nemusangano wedu",
      explanation: {
        en: "'Tinokutendai nekuuya kwenyu' = We thank you for coming. 'Ngatienderere mberi' = Let us proceed. Very formal.",
      },
      points: 10,
    },
    {
      id: "conv-10",
      skillName: "conversation",
      type: "multiple_choice",
      difficulty: 5,
      question: {
        en: "To navigate a cultural misunderstanding diplomatically, you could say:",
      },
      options: [
        "Makakanganisa!",
        "Ndinokumbira ruregerero kana paine chandakakanganisa, ndinoda kunzwisisa tsika dzenyu",
        "Handina basa nazvo",
        "Ndimi makaipa",
      ],
      correctAnswer: "Ndinokumbira ruregerero kana paine chandakakanganisa, ndinoda kunzwisisa tsika dzenyu",
      explanation: {
        en: "Apologizing ('Ndinokumbira ruregerero'), expressing desire to learn customs ('tsika dzenyu') shows cultural sensitivity.",
      },
      points: 10,
    },
  ],
}

// Helper to get questions by skill
export function getQuestionsBySkill(skillName: SkillName): DiagnosticQuestion[] {
  return diagnosticAssessment.questions.filter((q) => q.skillName === skillName)
}

// Helper to get all skill names from assessment
export function getAssessmentSkills(): SkillName[] {
  return ["pronunciation", "vocabulary", "grammar", "comprehension", "conversation"]
}

// Shuffle questions for randomization
export function shuffleQuestions(questions: DiagnosticQuestion[]): DiagnosticQuestion[] {
  const shuffled = [...questions]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
