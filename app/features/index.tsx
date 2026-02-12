import { useEffect } from 'react'
import { useRouter } from 'expo-router'

export default function FeaturesScreen() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/welcome')
  }, [router])

  return null
}
