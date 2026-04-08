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
