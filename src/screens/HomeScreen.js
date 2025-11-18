// src/screens/HomeScreen.js
import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { supabase, getCurrentUser, getContactsByUser } from '../../supabaseClient'

const PRIMARY_RED = '#FF0000'
const COLORS = {
  primary: PRIMARY_RED,
  background: '#F5F5F5',
  textSecondary: '#555555',
  white: '#FFFFFF',
  black: '#000000',
  inputBackground: '#EEEEEE',
  verified: '#DC2626',
}

const StatusBadge = ({ active, text = null }) => (
  <View style={[styles.badge, active ? styles.badgeActive : styles.badgeInactive]}>
    <Text style={styles.badgeText}>{text || (active ? 'ATIVO' : 'INATIVO')}</Text>
  </View>
)

const SectionContainer = ({ title, iconName, children, iconLibrary = Feather }) => {
  const Icon = iconLibrary
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        {Icon && <Icon name={iconName} size={20} color={PRIMARY_RED} style={styles.sectionIcon} />}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  )
}

export default function HomeScreen({ navigation }) {
  const [isVoiceMonitoringActive, setIsVoiceMonitoringActive] = useState(false)
  const [emergencyKeyword, setEmergencyKeyword] = useState('Socorro')
  const [isEditingKeyword, setIsEditingKeyword] = useState(false)
  const [isLocationActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [contacts, setContacts] = useState([])

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    setLoading(true)
    try {
      const user = await getCurrentUser()
      if (!user) return
      const data = await getContactsByUser(user.id)
      setContacts(data || [])
    } catch (e) {
      console.error('Erro carregando contatos:', e)
    } finally {
      setLoading(false)
    }
  }

  const toggleVoiceMonitoring = () => {
    setIsVoiceMonitoringActive((prev) => !prev)
  }

  const handleEditKeyword = () => setIsEditingKeyword(true)
  const handleSaveKeyword = () => setIsEditingKeyword(false)

  const handleLogout = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signOut()
    if (error) {
      Alert.alert('Erro ao sair', error.message)
    } else {
      navigation.replace('Login')
    }
    setLoading(false)
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.navHeader}>
        <View style={styles.navLinksLeft}>
          <TouchableOpacity style={[styles.navItem, styles.navItemSelected]} onPress={() => navigation.navigate('Home')}>
            <Ionicons name="home" size={18} color={COLORS.white} />
            <Text style={[styles.navText, { color: COLORS.white }]}>Página Inicial</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Post')}>
            <Ionicons name="location-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.navText}>Lugares</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Perfil')}>
            <Ionicons name="person-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.navText}>Perfil</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.navItem} onPress={handleLogout} disabled={loading}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.textSecondary} />
          <Text style={styles.navText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.logo}>
        <Text style={{ fontWeight: 'bold' }}>Alerta</Text>
        <Text style={{ color: PRIMARY_RED, fontWeight: 'bold' }}>Me</Text>
      </Text>
      <Text style={styles.subtitle}>Sua segurança em primeiro lugar.</Text>

      <ScrollView contentContainerStyle={styles.container}>
        <SectionContainer title="Monitoramento de voz" iconName="shield" iconLibrary={MaterialCommunityIcons}>
          <View style={styles.voiceMonitorRow}>
            <StatusBadge active={isVoiceMonitoringActive} />
            <TouchableOpacity style={[styles.startButton, isVoiceMonitoringActive ? styles.stopButton : styles.startButton]} onPress={toggleVoiceMonitoring}>
              <MaterialCommunityIcons name="microphone" size={20} color="#FFFFFF" />
              <Text style={styles.startButtonText}>{isVoiceMonitoringActive ? 'Parar monitoramento' : 'Iniciar monitoramento'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.keywordLabel}>Palavra-chave de emergência</Text>
          {isEditingKeyword ? (
            <TextInput style={styles.keywordInput} value={emergencyKeyword} onChangeText={setEmergencyKeyword} autoFocus onSubmitEditing={handleSaveKeyword} />
          ) : (
            <View style={styles.keywordDisplay}>
              <Text>{emergencyKeyword}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.editButton} onPress={isEditingKeyword ? handleSaveKeyword : handleEditKeyword}>
            <Text style={styles.editButtonText}>{isEditingKeyword ? 'Salvar palavra-chave' : 'Editar palavra-chave'}</Text>
          </TouchableOpacity>
        </SectionContainer>

        <SectionContainer title="Contatos de Emergência" iconName="account-group" iconLibrary={MaterialCommunityIcons}>
          {loading ? (
            <ActivityIndicator />
          ) : contacts.length === 0 ? (
            <Text style={{ color: COLORS.textSecondary }}>Nenhum contato salvo.</Text>
          ) : (
            contacts.map((c) => (
              <View key={c.id} style={styles.contactRow}>
                <View>
                  <Text style={styles.contactName}>
                    {c.name} {c.relation ? `(${c.relation})` : ''}
                  </Text>
                  <Text style={styles.contactPhone}>{c.phone}</Text>
                </View>
                <StatusBadge active={true} />
              </View>
            ))
          )}
        </SectionContainer>

        <SectionContainer title="Localização" iconName="map-marker" iconLibrary={MaterialCommunityIcons}>
          <View style={styles.locationRow}>
            <View>
              <Text style={styles.locationLabel}>Status de localização</Text>
              <Text style={styles.locationStatusText}>Necessário para envio de coordenadas em emergências</Text>
            </View>
            <StatusBadge active={isLocationActive} text="ATIVO" />
          </View>
        </SectionContainer>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  container: { paddingHorizontal: 15, paddingBottom: 20 },
  navHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.white, paddingVertical: 10, paddingTop: 35, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  navLinksLeft: { flexDirection: 'row' },
  navItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 4, marginRight: 10 },
  navText: { fontSize: 12, color: COLORS.textSecondary, marginLeft: 3 },
  navItemSelected: { backgroundColor: COLORS.primary },
  logo: { fontSize: 24, textAlign: 'center', marginTop: 15, marginBottom: 5, color: COLORS.black },
  subtitle: { textAlign: 'center', fontSize: 14, color: '#666', marginBottom: 20 },
  sectionContainer: { backgroundColor: COLORS.white, borderRadius: 8, padding: 15, marginBottom: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41, borderWidth: 1, borderColor: '#E0E0E0' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionIcon: { marginRight: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: PRIMARY_RED },
  sectionContent: { paddingTop: 5 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeActive: { backgroundColor: PRIMARY_RED },
  badgeInactive: { backgroundColor: '#999' },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  voiceMonitorRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  startButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: PRIMARY_RED, paddingVertical: 8, paddingHorizontal: 15, borderRadius: 5 },
  stopButton: { backgroundColor: '#555' },
  startButtonText: { color: '#FFFFFF', fontWeight: 'bold', marginLeft: 5 },
  keywordLabel: { fontSize: 12, color: '#666', marginBottom: 5 },
  keywordDisplay: { backgroundColor: '#F0F0F0', padding: 10, borderRadius: 5, marginBottom: 10, borderWidth: 1, borderColor: '#CCC' },
  keywordInput: { backgroundColor: '#F0F0F0', padding: 10, borderRadius: 5, marginBottom: 10, borderWidth: 1, borderColor: PRIMARY_RED, color: '#000' },
  editButton: { backgroundColor: PRIMARY_RED, padding: 10, borderRadius: 5, alignItems: 'center' },
  editButtonText: { color: '#FFFFFF', fontWeight: 'bold' },
  contactRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  contactName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  contactRole: { fontSize: 14, fontWeight: 'normal', color: '#666' },
  contactPhone: { fontSize: 14, color: '#666' },
  locationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  locationLabel: { fontSize: 16, fontWeight: 'bold', marginBottom: 3, color: '#333' },
  locationStatusText: { fontSize: 12, color: '#666', width: 200 },
})
