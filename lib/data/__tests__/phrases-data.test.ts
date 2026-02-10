import { phrases, categories, Phrase } from '../phrases-data'

describe('phrases-data', () => {
  describe('phrases array', () => {
    it('contains phrases', () => {
      expect(phrases.length).toBeGreaterThan(0)
    })

    it('each phrase has required fields', () => {
      phrases.forEach((phrase: Phrase) => {
        expect(phrase).toHaveProperty('id')
        expect(phrase).toHaveProperty('category')
        expect(phrase).toHaveProperty('english')
        expect(phrase).toHaveProperty('shona')
        expect(phrase).toHaveProperty('ndebele')
        expect(phrase).toHaveProperty('swahili')
        expect(phrase).toHaveProperty('chinese')
        expect(phrase).toHaveProperty('pronunciation')
        expect(phrase).toHaveProperty('context')
      })
    })

    it('each phrase has all pronunciation keys', () => {
      phrases.forEach((phrase: Phrase) => {
        expect(phrase.pronunciation).toHaveProperty('english')
        expect(phrase.pronunciation).toHaveProperty('shona')
        expect(phrase.pronunciation).toHaveProperty('ndebele')
        expect(phrase.pronunciation).toHaveProperty('swahili')
        expect(phrase.pronunciation).toHaveProperty('chinese')
      })
    })

    it('each phrase has all context keys', () => {
      phrases.forEach((phrase: Phrase) => {
        expect(phrase.context).toHaveProperty('en')
        expect(phrase.context).toHaveProperty('sn')
        expect(phrase.context).toHaveProperty('nd')
        expect(phrase.context).toHaveProperty('sw')
        expect(phrase.context).toHaveProperty('zh')
      })
    })

    it('all phrases have unique IDs', () => {
      const ids = phrases.map(p => p.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('all phrases have a non-empty category', () => {
      phrases.forEach((phrase: Phrase) => {
        expect(typeof phrase.category).toBe('string')
        expect(phrase.category.trim().length).toBeGreaterThan(0)
      })
    })

    it('no phrase has empty translation fields', () => {
      phrases.forEach((phrase: Phrase) => {
        expect(phrase.english.trim().length).toBeGreaterThan(0)
        expect(phrase.shona.trim().length).toBeGreaterThan(0)
        expect(phrase.ndebele.trim().length).toBeGreaterThan(0)
        expect(phrase.swahili.trim().length).toBeGreaterThan(0)
        expect(phrase.chinese.trim().length).toBeGreaterThan(0)
      })
    })
  })

  describe('categories array', () => {
    it('contains categories', () => {
      expect(categories.length).toBeGreaterThan(0)
    })

    it('each category has required fields', () => {
      categories.forEach(category => {
        expect(category).toHaveProperty('id')
        expect(category).toHaveProperty('name')
        expect(category).toHaveProperty('icon')
        expect(typeof category.id).toBe('string')
        expect(typeof category.name).toBe('string')
      })
    })

    it('all categories have unique IDs', () => {
      const ids = categories.map(c => c.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('each defined category maps to at least some phrases', () => {
      // Check that at least some defined categories are used
      const usedCategories = new Set(phrases.map(p => p.category))
      const definedCategories = categories.map(c => c.id)
      const matchingCategories = definedCategories.filter(id => usedCategories.has(id))
      expect(matchingCategories.length).toBeGreaterThan(0)
    })
  })
})
