import { useEffect } from 'react'
import { useRouter } from 'expo-router'

export default function WhyScreen() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/welcome')
  }, [router])

  return null
}
