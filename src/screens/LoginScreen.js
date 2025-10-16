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
  Image,
} from 'react-native'
import { supabase } from '../../supabaseClient'

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    // ... (Sua lógica de login)
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
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
    if (loginError) {
      setError(loginError.message)
    } else {
      navigation.replace('Home')
    }
    setLoading(false)
  }

  return (
    // 💡 Contêiner principal View
    <View style={styles.mainContainer}> 
      
      {/* 💡 IMAGEM DE FUNDO FIXA (Posicionamento Absoluto) */}
      <Image
        source={require('../img/alertameBackground.png')}
        style={styles.fixedBackground}
        resizeMode="cover"
      />
      {/* 💡 Overlay Escuro Fixo */}
      <View style={styles.overlay} />

      {/* 💡 CONTEÚDO PRINCIPAL (Flutuando sobre a imagem e o overlay) */}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <StatusBar barStyle="light-content" />
        
        {/* 💡 Usamos uma View com ScrollView Interno (se o conteúdo for muito grande) ou apenas View */}
        {/* Usaremos uma View simples com padding e centralização (flex) */}
        <View style={styles.contentWrapper}>
          <View style={styles.header}>
            <Image
              source={require('../img/logo-alertame-removebg-preview.png')}
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
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  // 💡 1. Contêiner principal com overflow: 'hidden' para matar a rolagem
  mainContainer: {
    flex: 1,
    overflow: 'hidden', // Tenta impedir qualquer rolagem nativa
  },
  
  // 💡 2. Imagem de fundo FIXA
  fixedBackground: {
    ...StyleSheet.absoluteFillObject, // Atalho para {position: 'absolute', top: 0, bottom: 0, left: 0, right: 0}
    width: '100%',
    height: '100%',
    zIndex: -2, // Garante que fique no fundo
  },
  
  // 💡 3. Overlay Fixo
  overlay: { 
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: -1, // Fica entre a imagem e o conteúdo
  },

  // 💡 4. View que envolve o KeyboardAvoidingView
  keyboardView: { 
    flex: 1, 
    // zIndex: 1, // Garantir que está na frente (opcional)
  },
  
  // 💡 5. Onde o conteúdo fica. Centraliza e adiciona padding.
  contentWrapper: {
    flex: 1,
    justifyContent: 'center', // Centraliza verticalmente
    paddingHorizontal: 24, // Adiciona o padding que estava no ScrollView
  },

  // ... (o restante dos seus estilos permanece igual)
  header: { alignItems: 'center', marginBottom: 40 },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 16,
    alignSelf: 'center',
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
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
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  signupText: { fontSize: 15, color: '#6B7280' },
  signupLink: {
    fontSize: 15,
    color: '#EF4444',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
})