/**
 * XPBadge - Animated "+XP" popup that floats up and fades out.
 * Use after any XP-earning action to give instant feedback.
 */

import { useEffect, useRef } from 'react'
import { StyleSheet, Text, Animated } from 'react-native'
import { Colors } from '@/constants/Colors'

interface XPBadgeProps {
  amount: number
  visible: boolean
  onHidden?: () => void
}

export function XPBadge({ amount, visible, onHidden }: XPBadgeProps) {
  const translateY = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0.5)).current

  useEffect(() => {
    if (visible && amount > 0) {
      // Reset
      translateY.setValue(0)
      opacity.setValue(0)
      scale.setValue(0.5)

      // Animate: pop in, float up, fade out
      Animated.parallel([
        Animated.sequence([
          Animated.spring(scale, {
            toValue: 1.2,
            friction: 5,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.delay(800),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(translateY, {
          toValue: -40,
          duration: 1400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onHidden?.()
      })
    }
  }, [visible, amount])

  if (!visible || amount <= 0) return null

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
      pointerEvents="none"
    >
      <Text style={styles.text}>+{amount} XP</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: Colors.accent[400],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
})
