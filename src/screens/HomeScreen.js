import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, StatusBar, Alert, Platform
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../supabaseClient';

import Voice from '@react-native-voice/voice';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms'; // <== Novo import

const PRIMARY_RED = '#FF0000';
const COLORS = {
  primary: PRIMARY_RED,
  background: '#F5F5F5',
  textSecondary: '#555555',
  white: '#FFFFFF',
  black: '#000000',
  inputBackground: '#EEEEEE',
  verified: '#DC2626',
};

const emergencyContacts = [
  { name: 'Tereza de Jesus', role: '(Mãe)', phone: '+551140028922', isActive: true },
  { name: 'Mariana Santos', role: '(Melhor amiga)', phone: '+551140028922', isActive: true },
  { name: 'Cleiton de Jesus', role: '(Irmão)', phone: '+551140028922', isActive: true },
];

const NavigationHeader = ({ navigation, loading, handleLogout }) => (
  <View style={styles.navHeader}>
    <View style={styles.navLinksLeft}>
      <TouchableOpacity
        style={[styles.navItem, styles.navItemSelected]}
        onPress={() => navigation.navigate('Home')}
      >
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
);

const StatusBadge = ({ active, text = null }) => (
  <View style={[styles.badge, active ? styles.badgeActive : styles.badgeInactive]}>
    <Text style={styles.badgeText}>{text || (active ? 'ATIVO' : 'INATIVO')}</Text>
  </View>
);

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

export default function HomeScreen({ navigation }) {
  const [isVoiceMonitoringActive, setIsVoiceMonitoringActive] = useState(false);
  const [emergencyKeyword, setEmergencyKeyword] = useState('Socorro');
  const [isEditingKeyword, setIsEditingKeyword] = useState(false);
  const [isLocationActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState('');

  const lastTriggerAt = useRef(0);

  // Configura eventos de voz
  useEffect(() => {
    Voice.onSpeechResults = (e) => {
      const text = e.value?.join(' ') || '';
      setTranscript(text);
      if (text.toLowerCase().includes(emergencyKeyword.toLowerCase())) {
        const now = Date.now();
        if (now - lastTriggerAt.current > 20000) { // evita spam
          lastTriggerAt.current = now;
          handleEmergencyTrigger();
        }
      }
    };

    Voice.onSpeechError = (e) => console.log('Erro no reconhecimento:', e);

    return () => {
      Voice.destroy().catch(() => {});
      Voice.removeAllListeners();
    };
  }, [emergencyKeyword]);

  const toggleVoiceMonitoring = async () => {
    try {
      if (isVoiceMonitoringActive) {
        await Voice.stop();
      } else {
        await Voice.start('pt-BR');
      }
      setIsVoiceMonitoringActive(!isVoiceMonitoringActive);
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Não foi possível iniciar o reconhecimento de voz.');
    }
  };

  // Função que dispara quando a palavra-chave é detectada
  const handleEmergencyTrigger = async () => {
    try {
      // 1. Obter localização
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Permissão de localização necessária.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const lat = location.coords.latitude;
      const lon = location.coords.longitude;

      const locationLink = `https://www.google.com/maps?q=${lat},${lon}`;
      const message = `⚠️ Emergência detectada! Preciso de ajuda!\n\nMinha localização: ${locationLink}`;

      // 2. Enviar SMS para todos contatos ativos
      const activeContacts = emergencyContacts.filter(c => c.isActive);
      const numbers = activeContacts.map(c => c.phone);

      const isAvailable = await SMS.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Erro', 'Envio de SMS não suportado neste dispositivo.');
        return;
      }

      await SMS.sendSMSAsync(numbers, message);
      Alert.alert('Mensagem pronta', 'SMS de emergência preparado para envio.');

    } catch (error) {
      console.error('Erro ao enviar SMS:', error);
      Alert.alert('Erro', 'Não foi possível enviar o SMS.');
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Erro ao sair', error.message);
    else navigation.replace('Login');
    setLoading(false);
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <NavigationHeader navigation={navigation} loading={loading} handleLogout={handleLogout} />

      <Text style={styles.logo}>
        <Text style={{ fontWeight: 'bold' }}>Alerta</Text>
        <Text style={{ color: PRIMARY_RED, fontWeight: 'bold' }}>Me</Text>
      </Text>
      <Text style={styles.subtitle}>Sua segurança em primeiro lugar.</Text>

      <ScrollView contentContainerStyle={styles.container}>
        <SectionContainer title="Monitoramento de voz" iconName="shield" iconLibrary={MaterialCommunityIcons}>
          <View style={styles.voiceMonitorRow}>
            <StatusBadge active={isVoiceMonitoringActive} />
            <TouchableOpacity
              style={[styles.startButton, isVoiceMonitoringActive ? styles.stopButton : styles.startButton]}
              onPress={toggleVoiceMonitoring}
            >
              <MaterialCommunityIcons name="microphone" size={20} color="#FFFFFF" />
              <Text style={styles.startButtonText}>
                {isVoiceMonitoringActive ? 'Parar' : 'Iniciar monitoramento'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.keywordLabel}>Palavra-chave de emergência</Text>
          {isEditingKeyword ? (
            <TextInput
              style={styles.keywordInput}
              value={emergencyKeyword}
              onChangeText={setEmergencyKeyword}
              onSubmitEditing={() => setIsEditingKeyword(false)}
            />
          ) : (
            <View style={styles.keywordDisplay}><Text>{emergencyKeyword}</Text></View>
          )}

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditingKeyword(!isEditingKeyword)}
          >
            <Text style={styles.editButtonText}>
              {isEditingKeyword ? 'Salvar' : 'Editar palavra-chave'}
            </Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 12, color: '#555', marginTop: 10 }}>
            Última transcrição: {transcript || 'Nenhuma ainda'}
          </Text>
        </SectionContainer>

        <SectionContainer title="Contatos de Emergência" iconName="account-group" iconLibrary={MaterialCommunityIcons}>
          {emergencyContacts.map((c, i) => (
            <View key={i} style={styles.contactRow}>
              <View>
                <Text style={styles.contactName}>{c.name} <Text style={styles.contactRole}>{c.role}</Text></Text>
                <Text style={styles.contactPhone}>{c.phone}</Text>
              </View>
              <StatusBadge active={c.isActive} />
            </View>
          ))}
        </SectionContainer>
      </ScrollView>
    </View>
  );
}

// estilos mantidos
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  container: { paddingHorizontal: 15, paddingBottom: 20 },
  navHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.white, paddingVertical: 10, paddingTop: 35, paddingHorizontal: 15,
    borderBottomWidth: 1, borderBottomColor: '#EEE' },
  navLinksLeft: { flexDirection: 'row' },
  navItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 5,
    borderRadius: 4, marginRight: 10 },
  navText: { fontSize: 12, color: COLORS.textSecondary, marginLeft: 3 },
  navItemSelected: { backgroundColor: COLORS.primary },
  logo: { fontSize: 24, textAlign: 'center', marginTop: 15, marginBottom: 5, color: COLORS.black },
  subtitle: { textAlign: 'center', fontSize: 14, color: '#666', marginBottom: 20 },
  sectionContainer: { backgroundColor: COLORS.white, borderRadius: 8, padding: 15, marginBottom: 20,
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41,
    borderWidth: 1, borderColor: '#E0E0E0' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionIcon: { marginRight: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: PRIMARY_RED },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeActive: { backgroundColor: PRIMARY_RED },
  badgeInactive: { backgroundColor: '#999' },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  voiceMonitorRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  startButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: PRIMARY_RED,
    paddingVertical: 8, paddingHorizontal: 15, borderRadius: 5 },
  stopButton: { backgroundColor: '#555' },
  startButtonText: { color: '#FFFFFF', fontWeight: 'bold', marginLeft: 5 },
  keywordLabel: { fontSize: 12, color: '#666', marginBottom: 5 },
  keywordDisplay: { backgroundColor: '#F0F0F0', padding: 10, borderRadius: 5, marginBottom: 10,
    borderWidth: 1, borderColor: '#CCC' },
  keywordInput: { backgroundColor: '#F0F0F0', padding: 10, borderRadius: 5, marginBottom: 10,
    borderWidth: 1, borderColor: PRIMARY_RED, color: '#000' },
  editButton: { backgroundColor: PRIMARY_RED, padding: 10, borderRadius: 5, alignItems: 'center' },
  editButtonText: { color: '#FFFFFF', fontWeight: 'bold' },
  contactRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  contactName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  contactRole: { fontSize: 14, fontWeight: 'normal', color: '#666' },
  contactPhone: { fontSize: 14, color: '#666' },
});
