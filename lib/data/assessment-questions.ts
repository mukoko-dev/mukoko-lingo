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

  // ==========================================
  // VOCABULARY - Elementary
  // ==========================================
  {
    id: 'vocab-e-1',
    skill: 'vocabulary',
    level: 'elementary',
    type: 'multiple_choice',
    question: 'What does "Mvura" mean in Shona?',
    options: ['Fire', 'Wind', 'Water/Rain', 'Earth'],
    correctAnswer: 'Water/Rain',
    explanation: '"Mvura" means water or rain in Shona — a vital word in everyday conversation.',
    language: 'shona',
  },
  {
    id: 'vocab-e-2',
    skill: 'vocabulary',
    level: 'elementary',
    type: 'translation',
    question: 'How do you say "food" in Ndebele?',
    options: ['Amanzi', 'Ukudla', 'Indlu', 'Umsebenzi'],
    correctAnswer: 'Ukudla',
    explanation: '"Ukudla" means food in Ndebele.',
    language: 'ndebele',
  },
  {
    id: 'vocab-e-3',
    skill: 'vocabulary',
    level: 'elementary',
    type: 'multiple_choice',
    question: 'What does "Rafiki" mean in Swahili?',
    options: ['Teacher', 'Friend', 'Brother', 'Child'],
    correctAnswer: 'Friend',
    explanation: '"Rafiki" means friend in Swahili — also the name of the wise baboon in The Lion King.',
    language: 'swahili',
  },
  {
    id: 'vocab-e-4',
    skill: 'vocabulary',
    level: 'elementary',
    type: 'translation',
    question: 'How do you say "family" in Shona?',
    options: ['Mhuri', 'Imba', 'Shamwari', 'Musha'],
    correctAnswer: 'Mhuri',
    explanation: '"Mhuri" means family in Shona — central to Zimbabwean culture.',
    language: 'shona',
  },
  {
    id: 'vocab-e-5',
    skill: 'vocabulary',
    level: 'elementary',
    type: 'multiple_choice',
    question: 'What does "钱" (qián) mean in Chinese?',
    options: ['Time', 'Money', 'Book', 'Food'],
    correctAnswer: 'Money',
    explanation: '"钱" (qián) means money in Chinese.',
    language: 'chinese',
  },

  // ==========================================
  // VOCABULARY - Advanced
  // ==========================================
  {
    id: 'vocab-a-1',
    skill: 'vocabulary',
    level: 'advanced',
    type: 'translation',
    question: 'What is the Shona word for "perseverance" or "endurance"?',
    options: ['Kushanda', 'Kutsungirira', 'Kufara', 'Kubuda'],
    correctAnswer: 'Kutsungirira',
    explanation: '"Kutsungirira" means to persevere or endure — a deeply valued concept in Shona culture.',
    language: 'shona',
  },
  {
    id: 'vocab-a-2',
    skill: 'vocabulary',
    level: 'advanced',
    type: 'multiple_choice',
    question: 'What does "Ubumnandi" express in Ndebele?',
    options: ['Sadness', 'Sweetness/Enjoyment', 'Anger', 'Tiredness'],
    correctAnswer: 'Sweetness/Enjoyment',
    explanation: '"Ubumnandi" conveys sweetness, deliciousness, or enjoyment in Ndebele.',
    language: 'ndebele',
  },
  {
    id: 'vocab-a-3',
    skill: 'vocabulary',
    level: 'advanced',
    type: 'translation',
    question: 'How do you say "community gathering" in Swahili?',
    options: ['Mkutano', 'Baraza', 'Shule', 'Soko'],
    correctAnswer: 'Baraza',
    explanation: '"Baraza" refers to a community council or public meeting place in Swahili culture.',
    language: 'swahili',
  },

  // ==========================================
  // GRAMMAR - Elementary
  // ==========================================
  {
    id: 'gram-e-1',
    skill: 'grammar',
    level: 'elementary',
    type: 'fill_blank',
    question: 'Complete: "___ unani?" (Who are you with?) in Shona.',
    options: ['Uri', 'Ndiri', 'Vari', 'Tiri'],
    correctAnswer: 'Uri',
    explanation: '"Uri" is the second person singular subject prefix "you are" in Shona.',
    language: 'shona',
  },
  {
    id: 'gram-e-2',
    skill: 'grammar',
    level: 'elementary',
    type: 'multiple_choice',
    question: 'In Ndebele, which prefix makes a verb negative? "Angifuni" (I don\'t want)',
    options: ['A-', 'Angi-', 'Si-', 'Ka-'],
    correctAnswer: 'Angi-',
    explanation: '"Angi-" is the first person singular negative prefix in Ndebele.',
    language: 'ndebele',
  },
  {
    id: 'gram-e-3',
    skill: 'grammar',
    level: 'elementary',
    type: 'fill_blank',
    question: 'Complete the Swahili sentence: "Mimi ___ mwalimu" (I am a teacher).',
    options: ['ni', 'si', 'ana', 'una'],
    correctAnswer: 'ni',
    explanation: '"Ni" is the copula "am/is" in Swahili for first person.',
    language: 'swahili',
  },

  // ==========================================
  // GRAMMAR - Intermediate
  // ==========================================
  {
    id: 'gram-i-2',
    skill: 'grammar',
    level: 'intermediate',
    type: 'multiple_choice',
    question: 'In Shona, how do you form the past tense of "kuenda" (to go)?',
    options: ['Ndaenda', 'Ndinoenda', 'Ndichaenda', 'Ndirienda'],
    correctAnswer: 'Ndaenda',
    explanation: '"Nda-" is the past tense prefix. "Ndaenda" = "I went".',
    language: 'shona',
  },
  {
    id: 'gram-i-3',
    skill: 'grammar',
    level: 'intermediate',
    type: 'fill_blank',
    question: 'Complete: "Abantwana ___ dlala" (The children are playing) in Ndebele.',
    options: ['ba', 'ba-ya', 'u', 'si'],
    correctAnswer: 'ba-ya',
    explanation: '"Ba-ya-" is the present continuous for third person plural in Ndebele.',
    language: 'ndebele',
  },
  {
    id: 'gram-i-4',
    skill: 'grammar',
    level: 'intermediate',
    type: 'multiple_choice',
    question: 'In Chinese, which particle marks a completed action?',
    options: ['的 (de)', '了 (le)', '吗 (ma)', '在 (zài)'],
    correctAnswer: '了 (le)',
    explanation: '"了" (le) is the aspect particle that indicates a completed action in Chinese.',
    language: 'chinese',
  },

  // ==========================================
  // GRAMMAR - Advanced
  // ==========================================
  {
    id: 'gram-a-1',
    skill: 'grammar',
    level: 'advanced',
    type: 'multiple_choice',
    question: 'In Shona, what is the difference between "Ndiri kudya" and "Ndinodya"?',
    options: [
      'No difference',
      'Progressive (eating now) vs. Habitual (I eat)',
      'Past vs. Future',
      'Formal vs. Informal',
    ],
    correctAnswer: 'Progressive (eating now) vs. Habitual (I eat)',
    explanation: '"Ndiri kudya" = I am eating (right now). "Ndinodya" = I eat (regularly/habitually).',
    language: 'shona',
  },
  {
    id: 'gram-a-2',
    skill: 'grammar',
    level: 'advanced',
    type: 'fill_blank',
    question: 'Complete the Swahili relative clause: "Mtu ___ anasoma" (The person who is reading).',
    options: ['ambaye', 'kwa', 'na', 'ya'],
    correctAnswer: 'ambaye',
    explanation: '"Ambaye" is the relative pronoun for animate singular nouns in Swahili.',
    language: 'swahili',
  },

  // ==========================================
  // PRONUNCIATION - Elementary
  // ==========================================
  {
    id: 'pron-e-1',
    skill: 'pronunciation',
    level: 'elementary',
    type: 'multiple_choice',
    question: 'In Ndebele, how is the "q" in "iqanda" (egg) pronounced?',
    options: ['Like English "k"', 'A palatal click', 'Like English "q"', 'Silent'],
    correctAnswer: 'A palatal click',
    explanation: '"q" in Ndebele is a palatal click, made by pulling the tongue off the hard palate.',
    language: 'ndebele',
  },
  {
    id: 'pron-e-2',
    skill: 'pronunciation',
    level: 'elementary',
    type: 'multiple_choice',
    question: 'In Shona, the "mh" in "mhoro" is pronounced as:',
    options: ['Silent "m", just "horo"', 'A breathy nasal "m"', 'Like English "m"', 'Like "f"'],
    correctAnswer: 'A breathy nasal "m"',
    explanation: '"mh" in Shona is a breathy (aspirated) nasal, produced with a puff of air after the "m".',
    language: 'shona',
  },

  // ==========================================
  // PRONUNCIATION - Intermediate
  // ==========================================
  {
    id: 'pron-i-1',
    skill: 'pronunciation',
    level: 'intermediate',
    type: 'multiple_choice',
    question: 'In Chinese, the tone of "mā" (妈, mother) vs "mǎ" (马, horse) differs by:',
    options: ['Volume', 'Pitch contour (flat vs. dipping)', 'Speed', 'Nasality'],
    correctAnswer: 'Pitch contour (flat vs. dipping)',
    explanation: '"mā" (1st tone) is high and flat. "mǎ" (3rd tone) dips down then rises.',
    language: 'chinese',
  },
  {
    id: 'pron-i-2',
    skill: 'pronunciation',
    level: 'intermediate',
    type: 'multiple_choice',
    question: 'Ndebele has three types of clicks: dental (c), palatal (q), and:',
    options: ['Velar (k)', 'Lateral (x)', 'Glottal (h)', 'Bilabial (p)'],
    correctAnswer: 'Lateral (x)',
    explanation: 'The three Ndebele clicks are: dental "c", palatal "q", and lateral "x" (tongue pulled from the side).',
    language: 'ndebele',
  },

  // ==========================================
  // PRONUNCIATION - Advanced
  // ==========================================
  {
    id: 'pron-a-1',
    skill: 'pronunciation',
    level: 'advanced',
    type: 'multiple_choice',
    question: 'In Shona, what distinguishes "svika" (arrive) from "zvika" in pronunciation?',
    options: [
      'They sound the same',
      '"sv" is a whistled fricative, "zv" is its voiced counterpart',
      '"sv" is louder',
      'Only the tone differs',
    ],
    correctAnswer: '"sv" is a whistled fricative, "zv" is its voiced counterpart',
    explanation: 'Shona\'s whistled fricatives are unique: "sv" is voiceless and "zv" is voiced, both produced with lip rounding.',
    language: 'shona',
  },

  // ==========================================
  // COMPREHENSION - Elementary
  // ==========================================
  {
    id: 'comp-e-1',
    skill: 'comprehension',
    level: 'elementary',
    type: 'multiple_choice',
    question: 'If a Shona speaker says "Ndinoda mvura", what do they want?',
    options: ['Food', 'Help', 'Water', 'Money'],
    correctAnswer: 'Water',
    explanation: '"Ndinoda mvura" = "I want water". "Ndinoda" = I want, "mvura" = water.',
    language: 'shona',
  },
  {
    id: 'comp-e-2',
    skill: 'comprehension',
    level: 'elementary',
    type: 'multiple_choice',
    question: 'In Ndebele, "Ngiyahamba" means:',
    options: ['I am eating', 'I am going/leaving', 'I am sleeping', 'I am coming'],
    correctAnswer: 'I am going/leaving',
    explanation: '"Ngiyahamba" = "I am going". "Ngi-" = I, "-ya-" = progressive, "-hamba" = go.',
    language: 'ndebele',
  },

  // ==========================================
  // COMPREHENSION - Intermediate
  // ==========================================
  {
    id: 'comp-i-1',
    skill: 'comprehension',
    level: 'intermediate',
    type: 'multiple_choice',
    question: 'A sign reads "Musatsvaga mvura pano". What does it mean?',
    options: ['Water available here', 'Do not look for water here', 'Clean water only', 'Water for sale'],
    correctAnswer: 'Do not look for water here',
    explanation: '"Musatsvaga" = do not search/look for. "Mvura" = water. "Pano" = here.',
    language: 'shona',
  },
  {
    id: 'comp-i-2',
    skill: 'comprehension',
    level: 'intermediate',
    type: 'multiple_choice',
    question: 'In Swahili, "Duka limefungwa" means:',
    options: ['The shop is open', 'The shop is closed', 'The shop is big', 'The shop is new'],
    correctAnswer: 'The shop is closed',
    explanation: '"Duka" = shop, "limefungwa" = has been closed (passive perfect tense).',
    language: 'swahili',
  },
  {
    id: 'comp-i-3',
    skill: 'comprehension',
    level: 'intermediate',
    type: 'multiple_choice',
    question: 'Someone says "请问，洗手间在哪里？" (Qǐng wèn, xǐshǒujiān zài nǎlǐ?). They are asking:',
    options: ['What time is it?', 'Where is the bathroom?', 'How much does it cost?', 'Where is the station?'],
    correctAnswer: 'Where is the bathroom?',
    explanation: '"请问" = excuse me, "洗手间" = bathroom, "在哪里" = where is it.',
    language: 'chinese',
  },

  // ==========================================
  // COMPREHENSION - Advanced
  // ==========================================
  {
    id: 'comp-a-1',
    skill: 'comprehension',
    level: 'advanced',
    type: 'multiple_choice',
    question: 'A proverb says "Chara chimwe hachitswanyi inda". What lesson does it teach?',
    options: [
      'Be patient with children',
      'One finger cannot crush a louse (teamwork is needed)',
      'A bird in hand is worth two in the bush',
      'Early to bed, early to rise',
    ],
    correctAnswer: 'One finger cannot crush a louse (teamwork is needed)',
    explanation: 'This Shona proverb emphasizes Ubuntu — working together achieves what one person cannot.',
    language: 'shona',
  },

  // ==========================================
  // CONVERSATION - Elementary
  // ==========================================
  {
    id: 'conv-e-1',
    skill: 'conversation',
    level: 'elementary',
    type: 'multiple_choice',
    question: 'At a Shona market, how do you ask "How much is this?"',
    options: ['Chii ichi?', 'Imarii?', 'Ndeipi?', 'Ndinoda chii?'],
    correctAnswer: 'Imarii?',
    explanation: '"Imarii?" means "How much is it?" — essential for market interactions.',
    language: 'shona',
  },
  {
    id: 'conv-e-2',
    skill: 'conversation',
    level: 'elementary',
    type: 'translation',
    question: 'How do you say "I don\'t understand" in Ndebele?',
    options: ['Angizwa', 'Angazi', 'Angivumi', 'Angifuni'],
    correctAnswer: 'Angizwa',
    explanation: '"Angizwa" = "I don\'t hear/understand". Used when you need something repeated.',
    language: 'ndebele',
  },

  // ==========================================
  // CONVERSATION - Intermediate
  // ==========================================
  {
    id: 'conv-i-1',
    skill: 'conversation',
    level: 'intermediate',
    type: 'multiple_choice',
    question: 'In Shona, how do you politely refuse an offer?',
    options: [
      'Aiwa! (No!)',
      'Maita basa, asi handidi (Thank you, but I don\'t want)',
      'Siyana neni (Leave me alone)',
      'Handina mari (I have no money)',
    ],
    correctAnswer: 'Maita basa, asi handidi (Thank you, but I don\'t want)',
    explanation: 'Expressing gratitude before declining is the polite way to refuse in Shona culture.',
    language: 'shona',
  },
  {
    id: 'conv-i-2',
    skill: 'conversation',
    level: 'intermediate',
    type: 'multiple_choice',
    question: 'When greeting an elder in Ndebele, what should you do?',
    options: [
      'Wave casually',
      'Use "Sawubona" and clap hands as a sign of respect',
      'Just nod',
      'Say "Hey"',
    ],
    correctAnswer: 'Use "Sawubona" and clap hands as a sign of respect',
    explanation: 'Greeting elders with respect (clapping, kneeling) is fundamental in Ndebele culture.',
    language: 'ndebele',
  },
  {
    id: 'conv-i-3',
    skill: 'conversation',
    level: 'intermediate',
    type: 'multiple_choice',
    question: 'In Swahili, "Pole sana" is used to express:',
    options: ['Congratulations', 'Sympathy/Sorry for your trouble', 'Excitement', 'Agreement'],
    correctAnswer: 'Sympathy/Sorry for your trouble',
    explanation: '"Pole sana" = "Very sorry" — used to express empathy, not personal apology.',
    language: 'swahili',
  },

  // ==========================================
  // CONVERSATION - Advanced
  // ==========================================
  {
    id: 'conv-a-1',
    skill: 'conversation',
    level: 'advanced',
    type: 'multiple_choice',
    question: 'In Shona, "Zvinhu zvinonetsa" is best translated as:',
    options: [
      'Things are difficult/complicated',
      'Things are expensive',
      'Things are beautiful',
      'Things are changing',
    ],
    correctAnswer: 'Things are difficult/complicated',
    explanation: '"Zvinonetsa" means "they are difficult/troublesome" — commonly used to discuss life challenges.',
    language: 'shona',
  },
  {
    id: 'conv-a-2',
    skill: 'conversation',
    level: 'advanced',
    type: 'multiple_choice',
    question: 'When someone says "生意兴隆" (shēngyì xīnglóng) to a shopkeeper, they are wishing:',
    options: ['Good health', 'Safe travels', 'Prosperous business', 'Happy birthday'],
    correctAnswer: 'Prosperous business',
    explanation: '"生意兴隆" is a well-wish meaning "May your business prosper" — common in Chinese culture.',
    language: 'chinese',
  },

  // ==========================================
  // VOCABULARY - Expanded (seasons, body, numbers, food)
  // ==========================================
  {
    id: 'vocab-e-6',
    skill: 'vocabulary',
    level: 'elementary',
    type: 'multiple_choice',
    question: 'What does "Chirimo" mean in Shona?',
    options: ['Summer/dry season', 'Winter', 'Rainy season', 'Harvest'],
    correctAnswer: 'Summer/dry season',
    explanation: '"Chirimo" refers to the dry, hot season in Shona — one of the traditional Zimbabwean seasons.',
    language: 'shona',
  },
  {
    id: 'vocab-e-7',
    skill: 'vocabulary',
    level: 'elementary',
    type: 'multiple_choice',
    question: 'What does "isandla" mean in Ndebele?',
    options: ['Foot', 'Hand', 'Head', 'Eye'],
    correctAnswer: 'Hand',
    explanation: '"Isandla" means hand in Ndebele. The plural "izandla" means hands.',
    language: 'ndebele',
  },
  {
    id: 'vocab-i-4',
    skill: 'vocabulary',
    level: 'intermediate',
    type: 'translation',
    question: 'How do you say "fifteen" in Swahili?',
    options: ['Kumi na tano', 'Kumi na tatu', 'Ishirini', 'Kumi na nne'],
    correctAnswer: 'Kumi na tano',
    explanation: '"Kumi na tano" literally means "ten and five" — Swahili builds teens by combining "kumi" (ten) with units.',
    language: 'swahili',
  },
  {
    id: 'vocab-f-1',
    skill: 'vocabulary',
    level: 'fluent',
    type: 'multiple_choice',
    question: 'In Chinese, what does "点心" (diǎnxīn) refer to?',
    options: [
      'A main course meal',
      'Small bite-sized dishes, often served with tea (dim sum)',
      'Sweet desserts only',
      'Breakfast cereal',
    ],
    correctAnswer: 'Small bite-sized dishes, often served with tea (dim sum)',
    explanation: '"点心" (diǎnxīn) literally means "touch the heart" and refers to the tradition of small savory and sweet dishes served with tea, known in English as dim sum.',
    language: 'chinese',
  },

  // ==========================================
  // GRAMMAR - Expanded (negation, possessives, noun classes, measure words)
  // ==========================================
  {
    id: 'gram-i-5',
    skill: 'grammar',
    level: 'intermediate',
    type: 'multiple_choice',
    question: 'In Shona, how do you say "I do not want" (negation of "ndinoda")?',
    options: ['Handidi', 'Ndinoda kwete', 'Ndisada', 'Ndichada'],
    correctAnswer: 'Handidi',
    explanation: 'Shona negation uses the prefix "ha-" plus a modified verb stem. "Ndinoda" (I want) becomes "Handidi" (I do not want).',
    language: 'shona',
  },
  {
    id: 'gram-e-4',
    skill: 'grammar',
    level: 'elementary',
    type: 'fill_blank',
    question: 'Complete: "incwadi ___" (my book) in Ndebele.',
    options: ['yami', 'wami', 'lami', 'bami'],
    correctAnswer: 'yami',
    explanation: 'In Ndebele, possessives agree with the noun class. "Incwadi" (book) is class 9, which takes the possessive concord "ya-", giving "yami" (my).',
    language: 'ndebele',
  },
  {
    id: 'gram-a-3',
    skill: 'grammar',
    level: 'advanced',
    type: 'multiple_choice',
    question: 'In Swahili, which noun class pair do "mtu/watu" (person/people) belong to?',
    options: ['M-/Mi- (classes 3/4)', 'M-/Wa- (classes 1/2)', 'Ki-/Vi- (classes 7/8)', 'Ji-/Ma- (classes 5/6)'],
    correctAnswer: 'M-/Wa- (classes 1/2)',
    explanation: 'The M-/Wa- classes (1/2) are used for people. "Mtu" (person, class 1) and "watu" (people, class 2) are the canonical example.',
    language: 'swahili',
  },
  {
    id: 'gram-f-1',
    skill: 'grammar',
    level: 'fluent',
    type: 'fill_blank',
    question: 'Complete: "我有三 ___ 书" (I have three books) in Chinese.',
    options: ['本 (běn)', '个 (gè)', '只 (zhī)', '张 (zhāng)'],
    correctAnswer: '本 (běn)',
    explanation: 'Chinese requires a measure word between a number and a noun. "本" (běn) is the specific measure word for bound items like books.',
    language: 'chinese',
  },

  // ==========================================
  // PRONUNCIATION - Expanded (aspirated, tones, vowel length, neutral tone)
  // ==========================================
  {
    id: 'pron-i-3',
    skill: 'pronunciation',
    level: 'intermediate',
    type: 'multiple_choice',
    question: 'In Shona, what distinguishes "bh" (as in "bhuku") from plain "b"?',
    options: [
      'They are identical',
      '"bh" is aspirated (with a puff of air), "b" is implosive',
      '"bh" is silent',
      '"bh" is pronounced like "v"',
    ],
    correctAnswer: '"bh" is aspirated (with a puff of air), "b" is implosive',
    explanation: 'In Shona orthography, "bh" marks an aspirated/explosive b, while plain "b" is an implosive sound produced by drawing air inward.',
    language: 'shona',
  },
  {
    id: 'pron-e-3',
    skill: 'pronunciation',
    level: 'elementary',
    type: 'multiple_choice',
    question: 'Unlike Shona, Ndebele is described as which type of tonal language?',
    options: [
      'Non-tonal',
      'Register tone (high vs. low pitch distinguishes meaning)',
      'Contour tone like Mandarin',
      'Stress-based only',
    ],
    correctAnswer: 'Register tone (high vs. low pitch distinguishes meaning)',
    explanation: 'Ndebele uses register tones — high and low pitches can change the meaning of otherwise identical words, though tone is not usually written.',
    language: 'ndebele',
  },
  {
    id: 'pron-i-4',
    skill: 'pronunciation',
    level: 'intermediate',
    type: 'multiple_choice',
    question: 'In Swahili, how are vowels pronounced in terms of length?',
    options: [
      'Vowels vary in length and change meaning',
      'All vowels are consistently short and clear, with each written vowel pronounced',
      'Vowels are silent at word ends',
      'Only "a" is long, others are short',
    ],
    correctAnswer: 'All vowels are consistently short and clear, with each written vowel pronounced',
    explanation: 'Swahili has five pure vowels (a, e, i, o, u), each pronounced consistently and clearly. When two vowels are written together, both are pronounced separately.',
    language: 'swahili',
  },
  {
    id: 'pron-f-1',
    skill: 'pronunciation',
    level: 'fluent',
    type: 'multiple_choice',
    question: 'In Mandarin Chinese, the neutral tone (轻声 qīngshēng) is best described as:',
    options: [
      'A fifth distinct pitch contour',
      'A light, short syllable with no tone mark, whose pitch depends on the preceding tone',
      'Always a high flat tone',
      'The same as the third tone',
    ],
    correctAnswer: 'A light, short syllable with no tone mark, whose pitch depends on the preceding tone',
    explanation: 'The neutral tone is unstressed, short, and has no inherent pitch contour. Its realized pitch is determined by the preceding syllable\'s tone, e.g., in "māma" the second "ma" is neutral.',
    language: 'chinese',
  },

  // ==========================================
  // COMPREHENSION - Expanded (signs, announcements, recipes, proverbs)
  // ==========================================
  {
    id: 'comp-e-3',
    skill: 'comprehension',
    level: 'elementary',
    type: 'multiple_choice',
    question: 'A Swahili road sign reads "Hatari". What does it mean?',
    options: ['Welcome', 'Slow down', 'Danger', 'Parking'],
    correctAnswer: 'Danger',
    explanation: '"Hatari" means "danger" in Swahili and is commonly seen on warning signs, e.g., at construction sites or hazardous areas.',
    language: 'swahili',
  },
  {
    id: 'comp-i-4',
    skill: 'comprehension',
    level: 'intermediate',
    type: 'multiple_choice',
    question: 'An announcement in Ndebele says "Isitimela sizafika ngehora lesithathu". What is happening?',
    options: [
      'The train has been cancelled',
      'The train will arrive at three o\'clock',
      'The train is full',
      'The train is delayed by three hours',
    ],
    correctAnswer: 'The train will arrive at three o\'clock',
    explanation: '"Isitimela" = train, "sizafika" = will arrive, "ngehora lesithathu" = at the third hour (3 o\'clock).',
    language: 'ndebele',
  },
  {
    id: 'comp-i-5',
    skill: 'comprehension',
    level: 'intermediate',
    type: 'multiple_choice',
    question: 'A Chinese recipe instructs "加一点盐" (jiā yìdiǎn yán). What should you do?',
    options: ['Add a lot of salt', 'Add a little salt', 'Remove the salt', 'Replace salt with sugar'],
    correctAnswer: 'Add a little salt',
    explanation: '"加" = add, "一点" = a little/a bit, "盐" = salt. Together: "add a little salt".',
    language: 'chinese',
  },
  {
    id: 'comp-f-1',
    skill: 'comprehension',
    level: 'fluent',
    type: 'multiple_choice',
    question: 'The Shona proverb "Kandiro kanoenda kunobva kamwe" is best understood as:',
    options: [
      'Do not waste food at mealtime',
      'A small dish goes back to where another came from (reciprocity — kindness returns)',
      'A small bird builds a big nest',
      'One should always eat together',
    ],
    correctAnswer: 'A small dish goes back to where another came from (reciprocity — kindness returns)',
    explanation: 'This proverb teaches reciprocity: when you receive from someone, you should give back. It reflects the Ubuntu value of mutual exchange in Shona culture.',
    language: 'shona',
  },

  // ==========================================
  // CONVERSATION - Expanded (interviews, medical, market, formal greetings)
  // ==========================================
  {
    id: 'conv-a-3',
    skill: 'conversation',
    level: 'advanced',
    type: 'multiple_choice',
    question: 'In a Swahili job interview, how would you politely say "I have five years of experience"?',
    options: [
      'Nina miaka mitano ya uzoefu',
      'Nataka kazi sasa',
      'Sina uzoefu',
      'Nimechoka sana',
    ],
    correctAnswer: 'Nina miaka mitano ya uzoefu',
    explanation: '"Nina" = I have, "miaka mitano" = five years, "ya uzoefu" = of experience. This is a professional way to describe your background.',
    language: 'swahili',
  },
  {
    id: 'conv-i-4',
    skill: 'conversation',
    level: 'intermediate',
    type: 'multiple_choice',
    question: 'At a Shona clinic, how do you tell the nurse "My head hurts"?',
    options: [
      'Ndinorwadziwa nemusoro',
      'Ndiri kunzwa nzara',
      'Ndapera simba',
      'Ndinoda kurara',
    ],
    correctAnswer: 'Ndinorwadziwa nemusoro',
    explanation: '"Ndinorwadziwa" = I am in pain, "nemusoro" = with/in the head. Together: "My head hurts".',
    language: 'shona',
  },
  {
    id: 'conv-i-5',
    skill: 'conversation',
    level: 'intermediate',
    type: 'multiple_choice',
    question: 'At a Ndebele market, how do you negotiate by asking "Can you reduce the price?"',
    options: [
      'Ungangehlisa intengo?',
      'Ngifuna ukudla',
      'Ngiyahamba manje',
      'Kuyabanda lapha',
    ],
    correctAnswer: 'Ungangehlisa intengo?',
    explanation: '"Ungangehlisa" = can you lower, "intengo" = the price. This is the standard polite negotiation phrase in Ndebele markets.',
    language: 'ndebele',
  },
  {
    id: 'conv-f-1',
    skill: 'conversation',
    level: 'fluent',
    type: 'multiple_choice',
    question: 'In a formal Chinese business meeting, how do you most appropriately greet a senior executive for the first time?',
    options: [
      '嗨！(Hāi! — "Hi!")',
      '您好，很高兴认识您 (Nín hǎo, hěn gāoxìng rènshi nín — "Hello [formal], very pleased to meet you")',
      '你好吗？(Nǐ hǎo ma? — "How are you?")',
      '再见 (Zàijiàn — "Goodbye")',
    ],
    correctAnswer: '您好，很高兴认识您 (Nín hǎo, hěn gāoxìng rènshi nín — "Hello [formal], very pleased to meet you")',
    explanation: 'Using "您" (nín), the formal "you", and the full phrase "很高兴认识您" shows respect and is the standard formal introduction expected in Chinese business settings.',
    language: 'chinese',
  },

  // ==========================================
  // VOCABULARY - Additional (colors, family, days, weather)
  // ==========================================
  {
    id: 'vocab-e-8',
    skill: 'vocabulary',
    level: 'elementary',
    type: 'multiple_choice',
    question: 'What does "mutsvuku" mean in Shona?',
    options: ['Black', 'White', 'Red', 'Green'],
    correctAnswer: 'Red',
    explanation: '"Mutsvuku" means red in Shona. Color terms often take noun-class prefixes like "mu-" when describing things.',
    language: 'shona',
  },
  {
    id: 'vocab-e-9',
    skill: 'vocabulary',
    level: 'elementary',
    type: 'multiple_choice',
    question: 'What does "umama" mean in Ndebele?',
    options: ['Father', 'Mother', 'Sister', 'Aunt'],
    correctAnswer: 'Mother',
    explanation: '"Umama" means mother in Ndebele. "Ubaba" is father, and these are among the first family words learners acquire.',
    language: 'ndebele',
  },
  {
    id: 'vocab-i-5',
    skill: 'vocabulary',
    level: 'intermediate',
    type: 'translation',
    question: 'How do you say "Monday" in Swahili?',
    options: ['Jumatatu', 'Jumanne', 'Jumatano', 'Ijumaa'],
    correctAnswer: 'Jumatatu',
    explanation: '"Jumatatu" means Monday in Swahili. Swahili days after Saturday ("Jumamosi") follow a counting pattern based on the Islamic week.',
    language: 'swahili',
  },
  {
    id: 'vocab-a-4',
    skill: 'vocabulary',
    level: 'advanced',
    type: 'multiple_choice',
    question: 'In Chinese, what does "下雨" (xià yǔ) mean?',
    options: ['It is windy', 'It is raining', 'It is snowing', 'It is sunny'],
    correctAnswer: 'It is raining',
    explanation: '"下雨" (xià yǔ) literally means "descending rain" and is the standard way to say "it is raining" in Chinese weather expressions.',
    language: 'chinese',
  },

  // ==========================================
  // GRAMMAR - Additional (subject concord, past tense, tense markers, ba-construction)
  // ==========================================
  {
    id: 'gram-b-4',
    skill: 'grammar',
    level: 'beginner',
    type: 'fill_blank',
    question: 'Complete: "___ yabonga" (He/She thanks) in Ndebele.',
    options: ['U', 'Ngi', 'Ba', 'Si'],
    correctAnswer: 'U',
    explanation: 'In Ndebele, "u-" is the third person singular subject concord for class 1 nouns (people). "Uyabonga" means "he/she thanks".',
    language: 'ndebele',
  },
  {
    id: 'gram-e-5',
    skill: 'grammar',
    level: 'elementary',
    type: 'multiple_choice',
    question: 'In Swahili, which tense marker indicates the past tense? "Nilikula" (I ate)',
    options: ['-na-', '-li-', '-ta-', '-me-'],
    correctAnswer: '-li-',
    explanation: '"-li-" is the simple past tense marker in Swahili. "Ni-li-kula" = I (ni) + past (li) + eat (kula) = "I ate".',
    language: 'swahili',
  },
  {
    id: 'gram-a-4',
    skill: 'grammar',
    level: 'advanced',
    type: 'multiple_choice',
    question: 'In Shona, what does the tense marker "-cha-" indicate, as in "Ndichaenda"?',
    options: ['Past tense', 'Present habitual', 'Future tense', 'Perfect tense'],
    correctAnswer: 'Future tense',
    explanation: '"-cha-" is the future tense marker in Shona. "Ndichaenda" = "I will go" (ndi- I + -cha- future + -enda go).',
    language: 'shona',
  },
  {
    id: 'gram-f-2',
    skill: 'grammar',
    level: 'fluent',
    type: 'multiple_choice',
    question: 'In Chinese, what is the function of the 把 (bǎ) construction, as in "我把书放在桌子上" (Wǒ bǎ shū fàng zài zhuōzi shàng)?',
    options: [
      'It marks a question',
      'It fronts the object to emphasize what happens to it (disposal construction)',
      'It indicates possession',
      'It marks the past tense',
    ],
    correctAnswer: 'It fronts the object to emphasize what happens to it (disposal construction)',
    explanation: 'The 把 construction moves the object before the verb to highlight what is done to it. "我把书放在桌子上" literally: "I BA book put on table" = "I put the book on the table". It requires a specific, disposable object and a result or direction.',
    language: 'chinese',
  },

  // ==========================================
  // PRONUNCIATION - Additional (stress, vowels, breathy voice, erhua)
  // ==========================================
  {
    id: 'pron-b-4',
    skill: 'pronunciation',
    level: 'beginner',
    type: 'multiple_choice',
    question: 'In Swahili, word stress almost always falls on which syllable?',
    options: ['The first syllable', 'The last syllable', 'The second-to-last (penultimate) syllable', 'Stress is random'],
    correctAnswer: 'The second-to-last (penultimate) syllable',
    explanation: 'Swahili has regular penultimate stress — e.g., ha-BA-ri, ra-FI-ki, ki-SWA-hi-li. This makes pronunciation predictable for learners.',
    language: 'swahili',
  },
  {
    id: 'pron-e-4',
    skill: 'pronunciation',
    level: 'elementary',
    type: 'multiple_choice',
    question: 'Shona vowels (a, e, i, o, u) are described as:',
    options: [
      'Reduced and unclear like English schwa',
      'Pure and consistent, always fully pronounced',
      'Silent at word ends',
      'Nasalized by default',
    ],
    correctAnswer: 'Pure and consistent, always fully pronounced',
    explanation: 'Shona vowels are pure and always clearly pronounced — they do not reduce to schwa. Every written vowel is sounded, even at word endings.',
    language: 'shona',
  },
  {
    id: 'pron-a-2',
    skill: 'pronunciation',
    level: 'advanced',
    type: 'multiple_choice',
    question: 'In Ndebele, breathy-voiced consonants (e.g., "bh", "dh") differ from plain consonants by:',
    options: [
      'Being silent',
      'Carrying a murmured, aspirated quality and lowering the following vowel pitch',
      'Being pronounced louder',
      'Only being used in borrowed words',
    ],
    correctAnswer: 'Carrying a murmured, aspirated quality and lowering the following vowel pitch',
    explanation: 'Breathy (depressor) consonants in Ndebele are produced with a murmured/aspirated voice and trigger a lower tone on the following vowel, an important feature of Nguni phonology.',
    language: 'ndebele',
  },
  {
    id: 'pron-f-2',
    skill: 'pronunciation',
    level: 'fluent',
    type: 'multiple_choice',
    question: 'In Mandarin Chinese, the "erhua" (儿化) phenomenon refers to:',
    options: [
      'A separate fifth tone',
      'Adding a retroflex "-r" suffix that fuses with the preceding syllable, common in Beijing speech',
      'Lengthening of vowels in formal speech',
      'Doubling of consonants for emphasis',
    ],
    correctAnswer: 'Adding a retroflex "-r" suffix that fuses with the preceding syllable, common in Beijing speech',
    explanation: 'Erhua (儿化) adds a retroflex "-r" ending to certain syllables, modifying the final sound. For example, 哪 (nǎ) becomes 哪儿 (nǎr, "where"). It is characteristic of northern, especially Beijing, Mandarin.',
    language: 'chinese',
  },

  // ==========================================
  // COMPREHENSION - Additional (questions, menus, forecasts, proverbs)
  // ==========================================
  {
    id: 'comp-b-4',
    skill: 'comprehension',
    level: 'beginner',
    type: 'multiple_choice',
    question: 'If someone in Ndebele asks "Ungubani igama lakho?", what are they asking?',
    options: ['Where do you live?', 'What is your name?', 'How old are you?', 'Where are you going?'],
    correctAnswer: 'What is your name?',
    explanation: '"Ungubani igama lakho?" literally means "Who is your name?" — the standard Ndebele way to ask someone\'s name.',
    language: 'ndebele',
  },
  {
    id: 'comp-e-4',
    skill: 'comprehension',
    level: 'elementary',
    type: 'multiple_choice',
    question: 'A Swahili menu lists "Wali na kuku". What is being served?',
    options: ['Rice and beans', 'Rice and chicken', 'Ugali and fish', 'Bread and tea'],
    correctAnswer: 'Rice and chicken',
    explanation: '"Wali" = cooked rice, "na" = and/with, "kuku" = chicken. Together: "rice and chicken" — a popular East African dish.',
    language: 'swahili',
  },
  {
    id: 'comp-a-2',
    skill: 'comprehension',
    level: 'advanced',
    type: 'multiple_choice',
    question: 'A Chinese weather forecast says "明天多云转晴，最高气温25度" (Míngtiān duōyún zhuǎn qíng, zuìgāo qìwēn 25 dù). What will tomorrow be like?',
    options: [
      'Rainy all day with a high of 25°C',
      'Cloudy turning to clear, with a high of 25°C',
      'Snowy with a low of 25°C',
      'Sunny turning to cloudy, with a high of 25°C',
    ],
    correctAnswer: 'Cloudy turning to clear, with a high of 25°C',
    explanation: '"多云" = cloudy, "转" = turning to, "晴" = clear/sunny, "最高气温" = highest temperature, "25度" = 25 degrees. So: cloudy turning clear, high of 25°C.',
    language: 'chinese',
  },
  {
    id: 'comp-f-2',
    skill: 'comprehension',
    level: 'fluent',
    type: 'multiple_choice',
    question: 'The Swahili proverb "Haraka haraka haina baraka" teaches that:',
    options: [
      'Hurry brings success',
      'Hurrying too much brings no blessing — patience is a virtue',
      'Blessings come from hard work',
      'Travel far to find fortune',
    ],
    correctAnswer: 'Hurrying too much brings no blessing — patience is a virtue',
    explanation: '"Haraka haraka haina baraka" literally: "Hurry hurry has no blessing". It is a widely used Swahili proverb warning against rushing and emphasizing that careful, patient work is rewarded.',
    language: 'swahili',
  },

  // ==========================================
  // CONVERSATION - Additional (apology, ordering, condolences, negotiation)
  // ==========================================
  {
    id: 'conv-b-4',
    skill: 'conversation',
    level: 'beginner',
    type: 'multiple_choice',
    question: 'In Shona, how do you politely say "I am sorry" (apology)?',
    options: ['Maita basa', 'Ndine urombo', 'Mhoro', 'Endai zvakanaka'],
    correctAnswer: 'Ndine urombo',
    explanation: '"Ndine urombo" literally means "I have sorrow" and is the standard way to apologize or express condolences in Shona.',
    language: 'shona',
  },
  {
    id: 'conv-e-3',
    skill: 'conversation',
    level: 'elementary',
    type: 'multiple_choice',
    question: 'At a Swahili restaurant, how do you order politely saying "I would like tea, please"?',
    options: [
      'Nataka chai, tafadhali',
      'Sina chai',
      'Chai ni nzuri',
      'Kwaheri chai',
    ],
    correctAnswer: 'Nataka chai, tafadhali',
    explanation: '"Nataka" = I want, "chai" = tea, "tafadhali" = please. This is the standard polite way to order in Swahili.',
    language: 'swahili',
  },
  {
    id: 'conv-a-4',
    skill: 'conversation',
    level: 'advanced',
    type: 'multiple_choice',
    question: 'In Ndebele, how would you formally offer condolences at a funeral?',
    options: [
      'Sawubona',
      'Sililela kanye lawe (We mourn together with you)',
      'Hamba kahle',
      'Ngiyabonga kakhulu',
    ],
    correctAnswer: 'Sililela kanye lawe (We mourn together with you)',
    explanation: '"Sililela kanye lawe" expresses shared grief — an appropriate, respectful condolence phrase in Ndebele mourning culture, where community support is central.',
    language: 'ndebele',
  },
  {
    id: 'conv-f-2',
    skill: 'conversation',
    level: 'fluent',
    type: 'multiple_choice',
    question: 'In a formal Chinese business negotiation, how would you most diplomatically say "This price is a bit high for us; could we discuss it?"',
    options: [
      '太贵了，不买 (Tài guì le, bù mǎi — "Too expensive, not buying")',
      '这个价格对我们来说有点高，我们能商量一下吗？(Zhège jiàgé duì wǒmen lái shuō yǒudiǎn gāo, wǒmen néng shāngliang yīxià ma?)',
      '便宜点！(Piányi diǎn! — "Cheaper!")',
      '多少钱？(Duōshǎo qián? — "How much?")',
    ],
    correctAnswer: '这个价格对我们来说有点高，我们能商量一下吗？(Zhège jiàgé duì wǒmen lái shuō yǒudiǎn gāo, wǒmen néng shāngliang yīxià ma?)',
    explanation: 'Softening phrases like "对我们来说" (for us), "有点" (a bit), and ending with a polite request "能商量一下吗" (could we discuss it) reflect the indirect, face-preserving style expected in Chinese business negotiations.',
    language: 'chinese',
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
