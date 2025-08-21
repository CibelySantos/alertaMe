import React from 'react'
import { View, Text, Button } from 'react-native'
import { supabase } from '../../supabaseClient'

export default function HomeScreen({ navigation }) {
  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigation.replace('Login')
  }

  return (
    <View>
      <Text>Bem-vindo à Home!</Text>
      <Button title="Sair" onPress={handleLogout} />
    </View>
  )
}