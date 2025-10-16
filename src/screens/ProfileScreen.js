import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { FontAwesome5, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons'
import { supabase } from '../../supabaseClient' // Importação do Supabase

// Constantes de estilo para manter a consistência
const COLORS = {
  primary: '#FF0000',
  background: '#F5F5F5',
  textSecondary: '#555555',
  white: '#FFFFFF',
  black: '#000000',
  inputBackground: '#EEEEEE',
  verified: '#DC2626',
}

// MOCK DATA para simular o usuário logado
const MOCK_USER = {
  name: 'Maria Silva',
  email: 'mariasil@email.com',
  phone: '+55 11 40028922',
  address: 'Rua dos pássaros, 88 – São Paulo, SP',
}

const MOCK_CONTACTS = [
  { id: 1, name: 'Tereza de Jesus', relation: 'Mãe', phone: '+55 11 4002-8922' },
  {
    id: 2,
    name: 'Mariana Santos',
    relation: 'Melhor amiga',
    phone: '+55 11 4002-8922',
  },
  {
    id: 3,
    name: 'Cleiton de Jesus',
    relation: 'Irmão',
    phone: '+55 11 4002-8922',
  },
]

// Componente para exibir um campo de informação
const InfoField = ({ title, value }) => (
  <View style={styles.infoFieldContainer}>
    <Text style={styles.infoFieldTitle}>{title}</Text>
    <View style={styles.infoFieldValueBox}>
      <Text style={styles.infoFieldValueText}>{value}</Text>
    </View>
  </View>
)

// Componente para exibir um contato de emergência
const ContactCard = ({ contact }) => (
  <View style={styles.contactCard}>
    <Text style={styles.contactName}>
      {contact.name} ({contact.relation})
    </Text>
    <Text style={styles.contactPhone}>{contact.phone}</Text>
  </View>
)

// Componente do cabeçalho de navegação (Restaurado)
const NavigationHeader = ({ navigation, loading, handleLogout }) => (
  <View style={styles.navHeader}>
    <View style={styles.navLinksLeft}>
      {/* PÁGINA INICIAL */}
      <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
        <Ionicons name="home-outline" size={18} color={COLORS.textSecondary} />
        <Text style={styles.navText}>Página Inicial</Text>
      </TouchableOpacity>

      {/* LUGARES */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate('Post')} // <- Adicionado
      >
        <Ionicons name="location-outline" size={18} color={COLORS.textSecondary} />
        <Text style={styles.navText}>Lugares</Text>
      </TouchableOpacity>


      {/* PERFIL (Selecionado) */}
      <TouchableOpacity style={[styles.navItem, styles.navItemSelected]}>
        <Ionicons name="person" size={18} color={COLORS.white} />
        <Text style={[styles.navText, { color: COLORS.white }]}>Perfil</Text>
      </TouchableOpacity>
    </View>

    {/* SAIR / LOGOUT */}
    <TouchableOpacity style={styles.navItem} onPress={handleLogout} disabled={loading}>
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.textSecondary} style={{ marginRight: 4 }} />
      ) : (
        <Ionicons name="log-out-outline" size={18} color={COLORS.textSecondary} />
      )}
      <Text style={styles.navText}>Sair</Text>
    </TouchableOpacity>
  </View>
)

export default function ProfileScreen({ navigation }) {
  const [loading, setLoading] = React.useState(false)

  // Funções de ação (MOCKADAS por enquanto)
  const handleSave = () => {
    Alert.alert('Sucesso', 'Informações salvas! (Lógica de API aqui)')
  }
  const handleExclude = () => {
    Alert.alert('Confirmação', 'Tem certeza que deseja excluir sua conta permanentemente?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive', onPress: () => {
          // Lógica de exclusão da conta aqui
          alert('Conta excluída (lógica de exclusão + logout)')
        }
      }
    ])
  }

  // --- Função de Logout com Supabase ---
  const handleLogout = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signOut()

    if (error) {
      Alert.alert('Erro ao sair', error.message)
    } else {
      // Navega para a tela de Login e remove o histórico
      navigation.replace('Login')
    }
    setLoading(false)
  }

  return (
    <SafeAreaView style={styles.safeArea}>

      {/* Cabeçalho de Navegação com Funcionalidade */}
      <NavigationHeader
        navigation={navigation}
        loading={loading}
        handleLogout={handleLogout}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Título Principal */}
        <View style={styles.mainTitleContainer}>
          <Text style={styles.mainTitle}>Meu perfil</Text>
          <Text style={styles.mainSubtitle}>
            Gerencie suas informações pessoais e de segurança
          </Text>
        </View>

        {/* Card de Perfil */}
        <View style={styles.card}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <FontAwesome5 name="headset" size={40} color={COLORS.white} />
            </View>
            <View style={styles.profileText}>
              <Text style={styles.profileName}>{MOCK_USER.name}</Text>
              <Text style={styles.profileEmail}>{MOCK_USER.email}</Text>
              <View style={styles.verifiedTag}>
                <Text style={styles.verifiedText}>Conta verificada</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Sessão Informações Pessoais */}
        <View style={[styles.card, styles.sectionMargin]}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="person" size={18} color={COLORS.primary} /> Informações pessoais
          </Text>
          <InfoField title="Nome completo" value={MOCK_USER.name} />
          <InfoField title="Telefone" value={MOCK_USER.phone} />
          <InfoField title="Endereço" value={MOCK_USER.address} />
        </View>

        {/* Sessão Contatos de Emergência */}
        <View style={[styles.card, styles.sectionMargin]}>
          <Text style={styles.sectionTitle}>
            <MaterialCommunityIcons name="shield-account" size={18} color={COLORS.primary} /> Contatos de Emergência
          </Text>
          {MOCK_CONTACTS.map((contact) => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
        </View>

        {/* Botão Salvar */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Salvar todas as alterações</Text>
        </TouchableOpacity>

        {/* Zona de Perigo */}
        <View style={styles.dangerZoneContainer}>
          <View style={styles.dangerZoneHeader}>
            <Ionicons name="warning-outline" size={20} color={COLORS.primary} />
            <Text style={styles.dangerZoneTitle}>ZONA DE PERIGO</Text>
          </View>
          <Text style={styles.dangerZoneText}>
            A exclusão da conta é permanente e não pode ser desfeita. Todos os
            seus dados serão removidos.
          </Text>
          <TouchableOpacity style={styles.excludeButton} onPress={handleExclude}>
            <Text style={styles.excludeButtonText}>Excluir conta permanentemente</Text>
          </TouchableOpacity>
        </View>

        {/* Espaçamento extra no final */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
    alignItems: 'center', // Centraliza os cards e botões
  },

  // --- Nav Header Styles ---
  navHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    paddingTop: 35,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  navLinksLeft: {
    flexDirection: 'row',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
    marginRight: 10,
  },
  navText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 3,
  },
  navItemSelected: {
    backgroundColor: COLORS.primary,
  },
  // -------------------------

  // --- Main Title Styles ---
  mainTitleContainer: {
    paddingVertical: 20,
    width: '100%',
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.black,
    marginBottom: 5,
  },
  mainSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  // --- General Card/Section Styles ---
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 20,
    width: '100%',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionMargin: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 15,
  },

  // --- Profile Card Styles ---
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileText: {
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.black,
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
    marginTop: 2,
  },
  verifiedTag: {
    backgroundColor: COLORS.verified,
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 5,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: 'bold',
  },

  // --- Info Fields Styles ---
  infoFieldContainer: {
    marginBottom: 15,
  },
  infoFieldTitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 5,
  },
  infoFieldValueBox: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: 8,
    padding: 12,
  },
  infoFieldValueText: {
    fontSize: 16,
    color: COLORS.black,
    fontWeight: '500',
  },

  // --- Contacts Styles ---
  contactCard: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
  },
  contactPhone: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // --- Save Button Styles ---
  saveButton: {
    backgroundColor: COLORS.primary,
    width: '100%',
    padding: 15,
    borderRadius: 10,
    marginTop: 25,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // --- Danger Zone Styles ---
  dangerZoneContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
    padding: 20,
    width: '100%',
    marginTop: 25,
  },
  dangerZoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dangerZoneTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 5,
  },
  dangerZoneText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 15,
    lineHeight: 20,
  },
  excludeButton: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 10,
  },
  excludeButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
})