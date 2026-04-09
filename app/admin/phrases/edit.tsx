import { useState, useEffect, useCallback } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useRouter, useLocalSearchParams, Stack } from 'expo-router'
import { ChevronDown, Save, X } from 'lucide-react-native'

import { useTheme } from '@/lib/hooks/useTheme'
import { lightTheme, darkTheme, Colors } from '@/constants/Colors'
import { phrasesApi, adminPhrasesApi } from '@/lib/services/api-client'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES = [
  'greetings', 'family', 'shopping', 'food', 'directions',
  'work', 'home', 'social', 'health', 'transport', 'emotions',
  'school', 'money', 'weather',
]

const DIFFICULTIES = ['beginner', 'elementary', 'intermediate', 'advanced', 'fluent']

const LANGUAGES = [
  { key: 'english', label: 'English', flag: '🇬🇧' },
  { key: 'shona', label: 'Shona', flag: '🇿🇼' },
  { key: 'ndebele', label: 'Ndebele', flag: '🇿🇼' },
  { key: 'chinese', label: 'Chinese', flag: '🇨🇳' },
] as const

type LanguageKey = typeof LANGUAGES[number]['key']

// ---------------------------------------------------------------------------
// Form state shape
// ---------------------------------------------------------------------------

interface PhraseForm {
  category: string
  difficulty: string
  english: string
  shona: string
  ndebele: string
  chinese: string
  english_pronunciation: string
  shona_pronunciation: string
  ndebele_pronunciation: string
  chinese_pronunciation: string
  english_context: string
  shona_context: string
  ndebele_context: string
  chinese_context: string
}

const EMPTY_FORM: PhraseForm = {
  category: 'greetings',
  difficulty: 'beginner',
  english: '',
  shona: '',
  ndebele: '',
  chinese: '',
  english_pronunciation: '',
  shona_pronunciation: '',
  ndebele_pronunciation: '',
  chinese_pronunciation: '',
  english_context: '',
  shona_context: '',
  ndebele_context: '',
  chinese_context: '',
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function AdminPhraseEditScreen() {
  const { isDark } = useTheme()
  const theme = isDark ? darkTheme : lightTheme
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id?: string }>()

  const isEditing = !!id

  const [form, setForm] = useState<PhraseForm>(EMPTY_FORM)
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof PhraseForm, string>>>({})
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const [showDifficultyPicker, setShowDifficultyPicker] = useState(false)

  // -----------------------------------------------------------------------
  // Load existing phrase for editing
  // -----------------------------------------------------------------------

  const loadPhrase = useCallback(async () => {
    if (!id) return
    try {
      const { data, error } = await phrasesApi.getPhrase(id)
      if (error || !data) {
        Alert.alert('Error', error || 'Phrase not found')
        router.back()
        return
      }
      setForm({
        category: data.category || 'greetings',
        difficulty: data.difficulty || 'beginner',
        english: data.english || '',
        shona: data.shona || '',
        ndebele: data.ndebele || '',
        chinese: data.chinese || '',
        english_pronunciation: data.englishPronunciation || '',
        shona_pronunciation: data.shonaPronunciation || '',
        ndebele_pronunciation: data.ndebelePronunciation || '',
        chinese_pronunciation: data.chinesePronunciation || '',
        english_context: data.englishContext || '',
        shona_context: data.shonaContext || '',
        ndebele_context: data.ndebeleContext || '',
        chinese_context: data.chineseContext || '',
      })
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load phrase')
      router.back()
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    if (isEditing) loadPhrase()
  }, [isEditing, loadPhrase])

  // -----------------------------------------------------------------------
  // Form helpers
  // -----------------------------------------------------------------------

  const updateField = (field: keyof PhraseForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    // Clear error on change
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  // -----------------------------------------------------------------------
  // Validation
  // -----------------------------------------------------------------------

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof PhraseForm, string>> = {}

    if (!form.english.trim()) {
      newErrors.english = 'English text is required'
    }

    // At least one translation besides English is required
    const hasTranslation =
      form.shona.trim().length > 0 ||
      form.ndebele.trim().length > 0 ||
      form.chinese.trim().length > 0

    if (!hasTranslation) {
      newErrors.shona = 'At least one translation is required'
    }

    if (!form.category) {
      newErrors.category = 'Category is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // -----------------------------------------------------------------------
  // Submit
  // -----------------------------------------------------------------------

  const handleSave = async () => {
    if (!validate()) {
      // Scroll up would be nice but Alert works for now
      Alert.alert('Validation Error', 'Please fix the highlighted fields.')
      return
    }

    setSaving(true)
    try {
      const payload: Record<string, any> = { ...form }
      // Strip empty strings to null for optional fields
      for (const lang of LANGUAGES) {
        const pronKey = `${lang.key}_pronunciation` as keyof PhraseForm
        const ctxKey = `${lang.key}_context` as keyof PhraseForm
        if (!payload[pronKey]) payload[pronKey] = null
        if (!payload[ctxKey]) payload[ctxKey] = null
      }

      let result
      if (isEditing) {
        result = await adminPhrasesApi.updatePhrase(id!, payload)
      } else {
        result = await adminPhrasesApi.createPhrase(payload)
      }

      if (result.error) {
        Alert.alert('Error', result.error)
        return
      }

      Alert.alert(
        'Success',
        isEditing ? 'Phrase updated successfully.' : 'Phrase created successfully.',
        [{ text: 'OK', onPress: () => router.back() }]
      )
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save phrase')
    } finally {
      setSaving(false)
    }
  }

  // -----------------------------------------------------------------------
  // Render helpers
  // -----------------------------------------------------------------------

  const styles = createStyles(theme, isDark)

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerTitle: 'Loading...' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading phrase...</Text>
        </View>
      </>
    )
  }

  return (
    <>
      <Stack.Screen
        options={{ headerTitle: isEditing ? 'Edit Phrase' : 'New Phrase' }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ---- Metadata Section ---- */}
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.sectionCard}>
            {/* Category Picker */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Category *</Text>
              <TouchableOpacity
                style={[styles.pickerButton, errors.category ? styles.inputError : null]}
                onPress={() => {
                  setShowCategoryPicker(!showCategoryPicker)
                  setShowDifficultyPicker(false)
                }}
              >
                <Text style={styles.pickerButtonText}>
                  {form.category.charAt(0).toUpperCase() + form.category.slice(1)}
                </Text>
                <ChevronDown size={18} color={theme.textMuted} />
              </TouchableOpacity>
              {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
              {showCategoryPicker && (
                <View style={styles.pickerDropdown}>
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.pickerOption,
                        form.category === cat && styles.pickerOptionActive,
                      ]}
                      onPress={() => {
                        updateField('category', cat)
                        setShowCategoryPicker(false)
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          form.category === cat && styles.pickerOptionTextActive,
                        ]}
                      >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Difficulty Picker */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Difficulty</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => {
                  setShowDifficultyPicker(!showDifficultyPicker)
                  setShowCategoryPicker(false)
                }}
              >
                <Text style={styles.pickerButtonText}>
                  {form.difficulty.charAt(0).toUpperCase() + form.difficulty.slice(1)}
                </Text>
                <ChevronDown size={18} color={theme.textMuted} />
              </TouchableOpacity>
              {showDifficultyPicker && (
                <View style={styles.pickerDropdown}>
                  {DIFFICULTIES.map(diff => (
                    <TouchableOpacity
                      key={diff}
                      style={[
                        styles.pickerOption,
                        form.difficulty === diff && styles.pickerOptionActive,
                      ]}
                      onPress={() => {
                        updateField('difficulty', diff)
                        setShowDifficultyPicker(false)
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          form.difficulty === diff && styles.pickerOptionTextActive,
                        ]}
                      >
                        {diff.charAt(0).toUpperCase() + diff.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* ---- Language Sections ---- */}
          {LANGUAGES.map(lang => {
            const textKey = lang.key as keyof PhraseForm
            const pronKey = `${lang.key}_pronunciation` as keyof PhraseForm
            const ctxKey = `${lang.key}_context` as keyof PhraseForm
            const isRequired = lang.key === 'english'

            return (
              <View key={lang.key}>
                <Text style={styles.sectionTitle}>
                  {lang.flag}  {lang.label}{isRequired ? ' *' : ''}
                </Text>
                <View style={styles.sectionCard}>
                  {/* Text */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>
                      Phrase text{isRequired ? ' *' : ''}
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        errors[textKey] ? styles.inputError : null,
                      ]}
                      value={form[textKey]}
                      onChangeText={v => updateField(textKey, v)}
                      placeholder={`Enter ${lang.label} phrase...`}
                      placeholderTextColor={theme.textMuted}
                      multiline
                    />
                    {errors[textKey] && (
                      <Text style={styles.errorText}>{errors[textKey]}</Text>
                    )}
                  </View>

                  {/* Pronunciation */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Pronunciation</Text>
                    <TextInput
                      style={styles.textInput}
                      value={form[pronKey]}
                      onChangeText={v => updateField(pronKey, v)}
                      placeholder={`Pronunciation guide...`}
                      placeholderTextColor={theme.textMuted}
                    />
                  </View>

                  {/* Context */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Context / Usage</Text>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      value={form[ctxKey]}
                      onChangeText={v => updateField(ctxKey, v)}
                      placeholder={`When/how to use this phrase...`}
                      placeholderTextColor={theme.textMuted}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>
                </View>
              </View>
            )
          })}

          {/* ---- Action Buttons ---- */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
              disabled={saving}
            >
              <X size={18} color={theme.text} />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Save size={18} color="#ffffff" />
              )}
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : isEditing ? 'Update Phrase' : 'Create Phrase'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bottom spacer */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const createStyles = (theme: typeof lightTheme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.background,
      gap: 12,
    },
    loadingText: {
      fontSize: 15,
      color: theme.textMuted,
    },

    // Section
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 8,
      marginTop: 20,
    },
    sectionCard: {
      backgroundColor: theme.card,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },

    // Field
    fieldContainer: {
      marginBottom: 16,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    textInput: {
      backgroundColor: theme.background,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: theme.text,
      borderWidth: 1,
      borderColor: theme.border,
      minHeight: 44,
    },
    textArea: {
      minHeight: 72,
      paddingTop: 12,
    },
    inputError: {
      borderColor: Colors.semanticError,
      borderWidth: 1.5,
    },
    errorText: {
      fontSize: 12,
      color: Colors.semanticError,
      marginTop: 4,
    },

    // Picker
    pickerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.background,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: theme.border,
      minHeight: 44,
    },
    pickerButtonText: {
      fontSize: 15,
      color: theme.text,
    },
    pickerDropdown: {
      backgroundColor: theme.card,
      borderRadius: 10,
      marginTop: 4,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
      maxHeight: 240,
    },
    pickerOption: {
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    pickerOptionActive: {
      backgroundColor: theme.primary + '15',
    },
    pickerOptionText: {
      fontSize: 14,
      color: theme.text,
    },
    pickerOptionTextActive: {
      color: theme.primary,
      fontWeight: '600',
    },

    // Buttons
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 28,
    },
    cancelButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 8,
    },
    cancelButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.text,
    },
    saveButton: {
      flex: 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: theme.primary,
      gap: 8,
    },
    saveButtonDisabled: {
      opacity: 0.7,
    },
    saveButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#ffffff',
    },
  })
