import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
} from 'react-native';
// Certifique-se de instalar: npm install react-native-vector-icons
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// --- Constante de Cor (para fácil manutenção) ---
const PRIMARY_RED = '#f91b19'; // Novo Vermelho!

// --- Dados Mockados ---
const emergencyContacts = [
  { name: 'Tereza de Jesus', role: '(Mãe)', phone: '+55 11 4002-8922', isActive: true },
  { name: 'Mariana Santos', role: '(Melhor amiga)', phone: '+55 11 4002-8922', isActive: true },
  { name: 'Cleiton de Jesus', role: '(Irmão)', phone: '+55 11 4002-8922', isActive: true },
];

// --- Componentes Reutilizáveis ---

// Componente para o rótulo de status ATIVO/INATIVO
const StatusBadge = ({ active, text = null }) => (
  <View style={[styles.badge, active ? styles.badgeActive : styles.badgeInactive]}>
    <Text style={styles.badgeText}>{text || (active ? 'ATIVO' : 'INATIVO')}</Text>
  </View>
);

// Componente para um bloco de seção (Monitoramento, Contatos, Localização)
const SectionContainer = ({ title, iconName, children, iconLibrary = Feather }) => {
  const Icon = iconLibrary;
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        {Icon && <Icon name={iconName} size={20} color={PRIMARY_RED} style={styles.sectionIcon} />}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
};

// Componente principal que representa a tela
const SafetyScreen = () => {
  // Estados para simular a funcionalidade
  const [isVoiceMonitoringActive, setIsVoiceMonitoringActive] = useState(false);
  const [emergencyKeyword, setEmergencyKeyword] = useState('Socorro');
  const [isEditingKeyword, setIsEditingKeyword] = useState(false);
  const [isLocationActive] = useState(true); // Simula que a permissão de localização está ativa

  // Função para alternar o monitoramento de voz
  const toggleVoiceMonitoring = () => {
    setIsVoiceMonitoringActive(prev => !prev);
  };

  // Funções para a palavra-chave
  const handleEditKeyword = () => {
    setIsEditingKeyword(true);
  };
  const handleSaveKeyword = () => {
    // Aqui você adicionaria a lógica para salvar no backend/storage
    setIsEditingKeyword(false);
  };

  // --- Renderização da Tela ---

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Cabeçalho */}
      <View style={styles.header}>
        <Feather name="alert-triangle" size={24} color={PRIMARY_RED} />
        <TouchableOpacity style={styles.headerButtonActive}>
          <Feather name="home" size={20} color="#FFFFFF" />
          <Text style={styles.headerButtonTextActive}>Página Inicial</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton}>
          <Feather name="map-pin" size={20} color="#000" />
          <Text style={styles.headerButtonText}>Lugares</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton}>
          <Feather name="user" size={20} color="#000" />
          <Text style={styles.headerButtonText}>Perfil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton}>
          <Feather name="log-out" size={20} color="#000" />
          <Text style={styles.headerButtonText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.logo}>
        <Text style={{ fontWeight: 'bold' }}>Alerta</Text>
        <Text style={{ color: PRIMARY_RED, fontWeight: 'bold' }}>Me</Text>
      </Text>
      <Text style={styles.subtitle}>Sua segurança em primeiro lugar.</Text>

      <ScrollView contentContainerStyle={styles.container}>
        {/* --- 1. Monitoramento de voz --- */}
        <SectionContainer
          title="Monitoramento de voz"
          iconName="shield"
          iconLibrary={MaterialCommunityIcons}
        >
          <View style={styles.voiceMonitorRow}>
            <StatusBadge active={isVoiceMonitoringActive} />
            <TouchableOpacity
              style={[
                styles.startButton,
                isVoiceMonitoringActive ? styles.stopButton : styles.startButton,
              ]}
              onPress={toggleVoiceMonitoring}
            >
              <MaterialCommunityIcons name="microphone" size={20} color="#FFFFFF" />
              <Text style={styles.startButtonText}>
                {isVoiceMonitoringActive ? 'Parar monitoramento' : 'Iniciar monitoramento'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.keywordLabel}>Palavra-chave de emergência</Text>
          {isEditingKeyword ? (
            <TextInput
              style={styles.keywordInput}
              value={emergencyKeyword}
              onChangeText={setEmergencyKeyword}
              autoFocus
              onSubmitEditing={handleSaveKeyword}
            />
          ) : (
            <View style={styles.keywordDisplay}>
              <Text>{emergencyKeyword}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.editButton}
            onPress={isEditingKeyword ? handleSaveKeyword : handleEditKeyword}
          >
            <Text style={styles.editButtonText}>
              {isEditingKeyword ? 'Salvar palavra-chave' : 'Editar palavra-chave'}
            </Text>
          </TouchableOpacity>
        </SectionContainer>
        {/* --- 2. Contatos de Emergência --- */}
        <SectionContainer
          title="Contatos de Emergência"
          iconName="account-group"
          iconLibrary={MaterialCommunityIcons}
        >
          {emergencyContacts.map((contact, index) => (
            <View key={index} style={styles.contactRow}>
              <View>
                <Text style={styles.contactName}>
                  {contact.name} <Text style={styles.contactRole}>{contact.role}</Text>
                </Text>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
              </View>
              <StatusBadge active={contact.isActive} />
            </View>
          ))}
        </SectionContainer>

        {/* --- 3. Localização --- */}
        <SectionContainer
          title="Localização"
          iconName="map-marker"
          iconLibrary={MaterialCommunityIcons}
        >
          <View style={styles.locationRow}>
            <View>
              <Text style={styles.locationLabel}>Status de localização</Text>
              <Text style={styles.locationStatusText}>
                Necessário para envio de coordenadas em emergências
              </Text>
            </View>
            <StatusBadge active={isLocationActive} text="ATIVO" />
          </View>
        </SectionContainer>
      </ScrollView>
    </View>
  );
};

// --- Estilos ---
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },

  // Estilos do Cabeçalho
  header: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerButton: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  headerButtonActive: {
    ...this.headerButton,
    backgroundColor: PRIMARY_RED, // COR ATUALIZADA
    paddingVertical: 5,
    borderRadius: 5,
  },
  headerButtonText: {
    fontSize: 10,
    color: '#000',
  },
  headerButtonTextActive: {
    ...this.headerButtonText,
    color: '#FFFFFF',
  },
  logo: {
    fontSize: 24,
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 5,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },

  // Estilos das Seções (Blocos) - Sem o traço vermelho lateral
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    elevation: 3, // Sombra para Android
    shadowColor: '#000', // Sombra para iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    borderWidth: 1, 
    borderColor: '#E0E0E0', 
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PRIMARY_RED, // COR ATUALIZADA
  },
  sectionContent: {
    paddingTop: 5,
  },

  // Estilos do Badge de Status (ATIVO/INATIVO)
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeActive: {
    backgroundColor: PRIMARY_RED, // COR ATUALIZADA
  },
  badgeInactive: {
    backgroundColor: '#999',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Estilos do Monitoramento de Voz
  voiceMonitorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY_RED, // COR ATUALIZADA
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  stopButton: {
    backgroundColor: '#555', // Cor diferente para o estado "Parar" (se ativado)
  },
  startButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  keywordLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  keywordDisplay: {
    backgroundColor: '#F0F0F0',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#CCC',
  },
  keywordInput: {
    backgroundColor: '#F0F0F0',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: PRIMARY_RED, // COR ATUALIZADA
    color: '#000',
  },
  editButton: {
    backgroundColor: PRIMARY_RED, // COR ATUALIZADA
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  // Estilos dos Contatos de Emergência
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  contactRole: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#666',
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
  },

  // Estilos da Localização
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
    color: '#333',
  },
  locationStatusText: {
    fontSize: 12,
    color: '#666',
    width: 200, 
  },
});

export default SafetyScreen;