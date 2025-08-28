import React, { useEffect, useRef } from 'react'
import { View, Image, Animated } from 'react-native'

export default function SplashScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start(() => {
      // Após o fade in, espera 1s e faz fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1000, // duração do fade out
        delay: 1000,    // espera 1s antes de iniciar o fade out
        useNativeDriver: true,
      }).start(() => {
        navigation.replace('Login') // navega depois do fade out
      })
    })
  }, [])

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
      <Animated.Image
        source={require('../img/icon-alertame-removebg-preview.png')}
        style={{ width: 150, height: 150, resizeMode: 'contain', opacity: fadeAnim }}
      />
    </View>
  )
}
