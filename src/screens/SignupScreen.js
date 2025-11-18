// src/screens/SignupScreen.js
import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  Alert,
} from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { supabase, ensureProfileExists, getCurrentUser } from '../../supabaseClient'

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // animação
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.9)

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600 })
    scale.value = withTiming(1, { duration: 600 })
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }))

  const handleSignup = async () => {
    try {
      if (!email || !password || !confirmPassword) {
        setError('Preencha todos os campos')
        return
      }
      if (!email.includes('@')) {
        setError('Email inválido')
        return
      }
      if (password !== confirmPassword) {
        setError('Senhas não coincidem')
        return
      }
      if (password.length < 6) {
        setError('Senha muito curta')
        return
      }

      setLoading(true)
      setError(null)

      const { data, error: signupError } = await supabase.auth.signUp({ email, password })

      if (signupError) {
        setError(signupError.message)
        setLoading(false)
        return
      }

      // tentativa de obter o usuário (pode vir depois do signUp)
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) {
        // não fatal: apenas notifica
        console.warn('Não foi possível obter usuário imediatamente:', userError.message)
      }

      const user = userData?.user
      if (user?.id) {
        // garante que exista o registro em profiles
        try {
          await ensureProfileExists(user.id)
        } catch (e) {
          console.warn('Erro criando profile automático:', e.message || e)
        }
      }

      Alert.alert('Conta criada!', 'Verifique seu email para confirmação (se aplicável).')
      navigation.replace('Login')
    } catch (err) {
      setError(err.message || 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.mainContainer}>
      <Image source={require('../img/alertameBackground.png')} style={styles.fixedBackground} resizeMode="cover" />
      <View style={styles.overlay} />

      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <StatusBar barStyle="light-content" />
        <ScrollView contentContainerStyle={styles.scrollContainer} horizontal={false} showsHorizontalScrollIndicator={false} bounces={false} alwaysBounceVertical={false}>
          <Animated.View style={[styles.card, animatedStyle]}>
            <Text style={styles.title}>Crie sua conta</Text>

            <Text style={styles.label}>Email:</Text>
            <TextInput style={styles.input} placeholder="Digite seu email" placeholderTextColor="#9CA3AF" onChangeText={setEmail} value={email} keyboardType="email-address" autoCapitalize="none" />
            <Text style={styles.label}>Senha:</Text>
            <TextInput style={styles.input} placeholder="Insira sua senha" placeholderTextColor="#9CA3AF" secureTextEntry onChangeText={setPassword} value={password} />
            <Text style={styles.label}>Confirmar senha:</Text>
            <TextInput style={styles.input} placeholder="Confirme sua senha" placeholderTextColor="#9CA3AF" secureTextEntry onChangeText={setConfirmPassword} value={confirmPassword} />

            {error && <Text style={styles.error}>⚠️ {error}</Text>}

            <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSignup} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'Criando conta...' : 'Criar Conta'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.link}>Já tem conta? Fazer login</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, overflow: 'hidden' },
  fixedBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', zIndex: -2 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: -1 },
  keyboardView: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40, width: '100%' },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 32 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 24, textAlign: 'center', color: '#111827' },
  input: { height: 56, backgroundColor: '#F9FAFB', borderRadius: 16, paddingHorizontal: 20, marginBottom: 16, fontSize: 16, color: '#111827', borderWidth: 2, borderColor: '#E5E7EB' },
  error: { color: '#DC2626', textAlign: 'center', marginBottom: 12 },
  button: { height: 56, backgroundColor: '#DC2626', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  buttonDisabled: { backgroundColor: '#9CA3AF' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  link: { marginTop: 24, textAlign: 'center', color: '#EF4444', fontWeight: '600', textDecorationLine: 'underline', fontSize: 15 },
  label: { fontSize: 14, color: '#111827', marginBottom: 6 }
})
