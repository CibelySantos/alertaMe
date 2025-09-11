
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, PermissionsAndroid, Platform, Modal, TextInput } from 'react-native';
import Voice from 'react-native-voice';
import Geolocation from 'react-native-geolocation-service';
import BackgroundActions from 'react-native-background-actions';
import { supabase } from '../../supabaseClient'; // Asumindo que o cliente Supabase está configurado em outro arquivo
import { sendSMS } from '../../smsService'; // Exemplo de serviço para envio de SMS
import Icon from 'react-native-vector-icons/FontAwesome'; // Importe uma biblioteca de ícones

// Constantes e Tarefa de Background
const sleep = (time) => new Promise((resolve) => setTimeout(() => resolve(), time));
const task = async (taskData) => {
  if (Platform.OS === 'ios') {
    // Ações para iOS, que pode exigir uma abordagem diferente
  } else {
    // Lógica principal de monitoramento em background
    const { keyword, contacts } = taskData;
    while (BackgroundActions.isRunning()) {
      try {
        const speechResults = await listenForKeyword();
        if (speechResults.some(result => result.toLowerCase().includes(keyword.toLowerCase()))) {
          const location = await getCurrentLocation();
          await sendEmergencyMessage(location, contacts);
          break; // Parar o loop após enviar a mensagem
        }
      } catch (e) {
        console.error("Erro durante o monitoramento de voz em background:", e);
      }
      await sleep(1000); // Pausa para não sobrecarregar
    }
  }
};

const options = {
  taskName: 'VoiceMonitoring',
  taskTitle: 'AlertaMe - Monitoramento de Voz',
  taskDesc: 'Monitorando palavra-chave de emergência.',
  taskIcon: {
    name: 'ic_launcher',
    type: 'mipmap',
  },
  linkingURI: 'your-app://', // Seu URI de link
  parameters: {
    delay: 1000,
  },
};

export default function AlertaMe() {
  const [isVoiceMonitoringActive, setIsVoiceMonitoringActive] = useState(false);
  const [emergencyKeyword, setEmergencyKeyword] = useState('ajuda');
  const [showKeywordModal, setShowKeywordModal] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [isLocationActive, setIsLocationActive] = useState(false);
  const userId = 'seu-id-de-usuario-aqui'; // Obtenha o ID do usuário autenticado

  // Referências
  const keywordRef = useRef(emergencyKeyword);
  const contactsRef = useRef(contacts);
  
  // Sincronizar estados com referências para uso em background
  useEffect(() => {
    keywordRef.current = emergencyKeyword;
  }, [emergencyKeyword]);

  useEffect(() => {
    contactsRef.current = contacts;
  }, [contacts]);

  // Funções de Serviço
  async function requestPermissions() {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.SEND_SMS
      ]);
      return granted['android.permission.RECORD_AUDIO'] === 'granted' &&
             granted['android.permission.ACCESS_FINE_LOCATION'] === 'granted' &&
             granted['android.permission.SEND_SMS'] === 'granted';
    }
    // Lógica para iOS, que pode exigir permissões no Info.plist
    return true;
  }

  async function getCurrentLocation() {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve(position);
        },
        (error) => {
          console.log(error.code, error.message);
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });
  }

  async function sendEmergencyMessage(location, contacts) {
    const message = `Alerta de emergência! Minha localização atual é: https://www.google.com/maps/search/?api=1&query=${location.coords.latitude},${location.coords.longitude}`;
    const contactNumbers = contacts.map(c => c.phone);
    for (const number of contactNumbers) {
      await sendSMS(number, message);
    }
  }

  const listenForKeyword = () => {
    return new Promise((resolve, reject) => {
      Voice.onSpeechResults = (e) => {
        resolve(e.value);
        Voice.stop();
      };
      Voice.onSpeechError = (e) => {
        console.error("Erro no reconhecimento de voz:", e);
        reject(e.error);
      };
      Voice.start('pt-BR');
    });
  };

  // Funções de Gerenciamento
  const startMonitoring = async () => {
    const hasPermissions = await requestPermissions();
    if (hasPermissions && !BackgroundActions.isRunning()) {
      try {
        await BackgroundActions.start(task, {
          ...options,
          parameters: {
            keyword: keywordRef.current,
            contacts: contactsRef.current
          }
        });
        setIsVoiceMonitoringActive(true);
      } catch (e) {
        console.error('Erro ao iniciar o serviço em background:', e);
      }
    } else {
      console.warn("Permissões não concedidas ou serviço já em execução.");
    }
  };

  const stopMonitoring = async () => {
    await BackgroundActions.stop();
    setIsVoiceMonitoringActive(false);
  };

  const fetchEmergencyContacts = async (userId) => {
    const { data, error } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Erro ao buscar contatos:', error);
    } else {
      setContacts(data);
    }
  };
  
  // Efeito para buscar contatos na inicialização
  useEffect(() => {
    fetchEmergencyContacts(userId);
    
    // Monitorar localização
    Geolocation.watchPosition(
      () => setIsLocationActive(true),
      (error) => {
        console.log("Erro ao monitorar localização:", error);
        setIsLocationActive(false);
      },
      { enableHighAccuracy: true, distanceFilter: 10 }
    );
  }, [userId]);

  // Efeito para real-time do Supabase
  useEffect(() => {
    const channel = supabase
      .channel('emergency_contacts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_contacts', filter: `user_id=eq.${userId}` }, (payload) => {
        fetchEmergencyContacts(userId);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Estrutura de UI
  return (
    <View style={styles.container}>
      {/* Card de Monitoramento de Voz */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Monitoramento de voz</Text>
        <View style={styles.statusContainer}>
          <Text>Status: </Text>
          <View style={[styles.statusBadge, { backgroundColor: isVoiceMonitoringActive ? 'green' : 'gray' }]}>
            <Text style={styles.statusText}>{isVoiceMonitoringActive ? 'ATIVO' : 'INATIVO'}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={[styles.button, styles.redButton]} 
          onPress={isVoiceMonitoringActive ? stopMonitoring : startMonitoring}
        >
          <Icon name="microphone" size={20} color="#fff" />
          <Text style={styles.buttonText}>{isVoiceMonitoringActive ? 'Parar monitoramento' : 'Iniciar monitoramento'}</Text>
        </TouchableOpacity>
        <View style={styles.keywordContainer}>
          <Text>Palavra-chave: {emergencyKeyword}</Text>
          <TouchableOpacity style={[styles.button, styles.editButton]} onPress={() => setShowKeywordModal(true)}>
            <Text style={styles.buttonText}>Editar palavra-chave</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Card de Contatos de Emergência */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contatos de Emergência</Text>
        {contacts.map((contact, index) => (
          <View key={index} style={styles.contactItem}>
            <Text style={styles.contactName}>{contact.name} ({contact.relation})</Text>
            <Text style={styles.contactPhone}>{contact.phone}</Text>
            <View style={[styles.statusBadge, { backgroundColor: contact.status === 'ativo' ? 'green' : 'gray' }]}>
              <Text style={styles.statusText}>{contact.status.toUpperCase()}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Card de Localização */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Localização</Text>
        <View style={styles.locationStatusContainer}>
          <Text>Status: Necessário para envio de coordenadas em emergências.</Text>
          <View style={[styles.statusBadge, { backgroundColor: isLocationActive ? 'green' : 'gray' }]}>
            <Text style={styles.statusText}>{isLocationActive ? 'ATIVO' : 'INATIVO'}</Text>
          </View>
        </View>
      </View>

      {/* Modal para Edição da Palavra-chave */}
      <Modal
        visible={showKeywordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowKeywordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Palavra-chave</Text>
            <TextInput
              style={styles.textInput}
              onChangeText={setEmergencyKeyword}
              value={emergencyKeyword}
              placeholder="Digite a nova palavra-chave"
            />
            <TouchableOpacity style={styles.modalButton} onPress={() => setShowKeywordModal(false)}>
              <Text style={styles.modalButtonText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f4f4f4',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 5,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    paddingVertical: 10,
    marginTop: 10,
  },
  redButton: {
    backgroundColor: 'red',
  },
  editButton: {
    backgroundColor: 'red',
    paddingHorizontal: 15,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  keywordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  contactName: {
    fontWeight: 'bold',
    flex: 1,
  },
  contactPhone: {
    color: '#666',
    marginRight: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  textInput: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 15,
  },
  modalButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
