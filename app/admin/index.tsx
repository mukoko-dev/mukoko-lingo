import { useEffect } from 'react'
import { useRouter } from 'expo-router'

export default function AdminIndex() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin/overview')
  }, [router])

  return null
}
