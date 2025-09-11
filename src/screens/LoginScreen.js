// LoginScreen.js
import React, { useState } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  Image,
} from 'react-native'
import { supabase } from '../../supabaseClient'

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos')
      return
    }

    if (!email.includes('@')) {
      setError('Por favor, insira um email válido')
      return
    }

    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
    } else {
      navigation.replace('Home')
    }
    setLoading(false)
  }

  return (
    <ImageBackground
      source={require('../img/alertameBackground.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <StatusBar barStyle="light-content" />
          <View style={styles.header}>
            <Image
              source={require('../img/logo-alertame-removebg-preview.png')} // Substitua pelo caminho da sua imagem
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.welcomeText}>Bem-vindo de volta!</Text>
            <Text style={styles.subtitle}>Entre na sua conta</Text>
          </View>

          <View style={styles.card}>
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

            {error && <Text style={styles.error}>⚠️ {error}</Text>}

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Text>
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Não tem uma conta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.signupLink}>Criar conta</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  keyboardView: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 16,
    alignSelf: 'center',
  },
  welcomeText: { fontSize: 32, fontWeight: '800', color: '#fff', textShadowColor: '#000', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 4,},
  subtitle: { fontSize: 16, color: '#ccc', textShadowColor: '#000', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 4, },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 32 },
  input: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
  },
  error: { color: '#DC2626', textAlign: 'center', marginBottom: 12 },
  loginButton: {
    height: 56,
    backgroundColor: '#EF4444',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  signupContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  signupText: { fontSize: 15, color: '#6B7280' },
  signupLink: { fontSize: 15, color: '#EF4444', fontWeight: '600', textDecorationLine: 'underline' },
})
