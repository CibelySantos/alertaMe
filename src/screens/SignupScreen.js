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
  // 💡 Removemos ImageBackground, mantemos Image
  Image, 
  ScrollView,
} from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { supabase } from '../../supabaseClient'

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // Animação de entrada
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

    const { error: signupError } = await supabase.auth.signUp({ email, password })

    if (signupError) {
      setError(signupError.message)
    } else {
      alert('Conta criada! Verifique seu email.')
      navigation.replace('Login')
    }
    setLoading(false)
  }

  return (
    // 💡 1. Contêiner principal View com overflow: 'hidden'
    <View style={styles.mainContainer}> 
        
      {/* 💡 2. IMAGEM DE FUNDO FIXA (Posicionamento Absoluto) */}
      <Image
        source={require('../img/alertameBackground.png')}
        style={styles.fixedBackground}
        resizeMode="cover"
      />
      {/* 💡 3. Overlay Escuro Fixo */}
      <View style={styles.overlay} />


      {/* 💡 4. CONTEÚDO PRINCIPAL (Flutuando sobre a imagem e o overlay) */}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StatusBar barStyle="light-content" />
        <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            // Propriedades para garantir que a rolagem horizontal esteja desabilitada
            horizontal={false} 
            showsHorizontalScrollIndicator={false}
            bounces={false} 
            alwaysBounceVertical={false}
        >
          <Animated.View style={[styles.card, animatedStyle]}>
            <Text style={styles.title}>Crie sua conta</Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              onChangeText={setEmail}
              value={email}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              onChangeText={setPassword}
              value={password}
            />

            <TextInput
              style={styles.input}
              placeholder="Confirmar senha"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              onChangeText={setConfirmPassword}
              value={confirmPassword}
            />

            {error && <Text style={styles.error}>⚠️ {error}</Text>}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Criando conta...' : 'Criar Conta'}
              </Text>
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
  // 💡 1. Contêiner principal com overflow: 'hidden'
  mainContainer: {
    flex: 1,
    overflow: 'hidden', 
  },
  
  // 💡 2. Imagem de fundo FIXA (Substitui o ImageBackground)
  fixedBackground: {
    ...StyleSheet.absoluteFillObject, // position: 'absolute', top: 0, bottom: 0, left: 0, right: 0
    width: '100%',
    height: '100%',
    zIndex: -2, // No fundo
  },
  
  // 💡 3. Overlay Fixo
  overlay: { 
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: -1, // Entre a imagem e o conteúdo
  },
  
  // 💡 Removido background e overlay antigos (pois são substituídos por mainContainer e overlay fixo)
  // background: { flex: 1 }, 
  // overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }, // Estilo original do overlay

  keyboardView: { flex: 1 },
  
  // Ajuste de padding: o paddingHorizontal deve ser movido para o ScrollView para dar espaço,
  // mas como o `card` já tem padding, vamos manter aqui o paddingHorizontal
  // e o paddingVertical para garantir que o card não toque as bordas.
  scrollContainer: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    paddingHorizontal: 24, 
    paddingVertical: 40,
    width: '100%', // 💡 Garante que o conteúdo não estoure horizontalmente
  },
  
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 32 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 24, textAlign: 'center', color: '#111827' },
  input: {
    height: 56,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
    fontSize: 16,
    color: '#111827',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  error: { color: '#DC2626', textAlign: 'center', marginBottom: 12 },
  button: {
    height: 56,
    backgroundColor: '#DC2626',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  link: {
    marginTop: 24,
    textAlign: 'center',
    color: '#EF4444',
    fontWeight: '600',
    textDecorationLine: 'underline',
    fontSize: 15,
  },
})