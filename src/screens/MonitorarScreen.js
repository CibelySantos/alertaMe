import React, { useState, useEffect, useRef } from 'react';
import { 
    View, Text, StyleSheet, TouchableOpacity, PermissionsAndroid, Platform, 
    Modal, TextInput, ScrollView, Alert 
} from 'react-native';
import Voice from 'react-native-voice';
import Geolocation from 'react-native-geolocation-service';
import BackgroundActions from 'react-native-background-actions';
import Icon from 'react-native-vector-icons/FontAwesome'; 
import { FontAwesome5, Ionicons } from '@expo/vector-icons'; 

// MOCK SERVICES
const supabase = { 
    from: () => ({ select: () => ({ eq: () => ({ data: [
        { id: 1, name: "Tereza de Jesus", relation: "Mãe", phone: "+5511988887777", status: 'ativo' },
        { id: 2, name: "Mariana Santos", relation: "Amiga", phone: "+5511966665555", status: 'ativo' },
        { id: 3, name: "Cleiton de Jesus", relation: "Irmão", phone: "+5511944443333", status: 'ativo' },
    ], error: null }) }) }), 
    channel: () => ({ on: () => ({ subscribe: () => {} }) }), 
    removeChannel: () => {}, 
};

const sendSMS = async (number, message) => { console.log(`[SMS MOCK] Enviando para ${number}: ${message}`); };
const listenForKeyword = () => new Promise(resolve => setTimeout(() => resolve(['Nada falado']), 3000)); 

const sleep = (time) => new Promise(resolve => setTimeout(resolve, time));
const getCurrentLocation = () => new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 });
});

async function sendEmergencyMessage(location, contacts) {
    const mapLink = `http://maps.google.com/?q=${location.coords.latitude},${location.coords.longitude}`;
    const message = `Alerta de emergência! Minha localização atual é: ${mapLink}`;
    for (const number of contacts.map(c => c.phone)) {
        await sendSMS(number, message);
    }
}

const task = async ({ keyword, contacts }) => {
    while (BackgroundActions.isRunning()) {
        try {
            const speechResults = await listenForKeyword(); 
            if (speechResults.some(r => r.toLowerCase().includes(keyword.toLowerCase()))) {
                const location = await getCurrentLocation();
                await sendEmergencyMessage(location, contacts);
                BackgroundActions.stop(); 
                break; 
            }
        } catch (e) {
            console.error("Erro monitoramento voz:", e);
        }
        await sleep(5000); 
    }
};

const options = {
    taskName: 'VoiceMonitoring',
    taskTitle: 'AlertaMe - Monitoramento de Voz',
    taskDesc: 'Monitorando palavra-chave de emergência.',
    taskIcon: { name: 'ic_launcher', type: 'mipmap' },
    linkingURI: 'your-app://', 
    parameters: { delay: 1000 },
};

export default function MonitorarScreen() {
    const [isVoiceMonitoringActive, setIsVoiceMonitoringActive] = useState(false);
    const [emergencyKeyword, setEmergencyKeyword] = useState('Socorro');
    const [keywordInput, setKeywordInput] = useState('Socorro'); 
    const [showKeywordModal, setShowKeywordModal] = useState(false);
    const [contacts, setContacts] = useState([]);
    const [isLocationActive, setIsLocationActive] = useState(false);
    const userId = 'seu-id-de-usuario-aqui'; 

    const keywordRef = useRef(emergencyKeyword);
    const contactsRef = useRef(contacts);
    
    useEffect(() => { keywordRef.current = emergencyKeyword; }, [emergencyKeyword]);
    useEffect(() => { contactsRef.current = contacts; }, [contacts]);

    async function requestPermissions() {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            ]);
            const audioGranted = granted['android.permission.RECORD_AUDIO'] === 'granted';
            const locationGranted = granted['android.permission.ACCESS_FINE_LOCATION'] === 'granted';
            if (!audioGranted || !locationGranted) {
                Alert.alert("Permissão Necessária", "Áudio e Localização são necessários.");
                return false;
            }
        }
        return true;
    }

    const startMonitoring = async () => {
        if (isVoiceMonitoringActive) return;
        const hasPermissions = await requestPermissions();
        if (hasPermissions) {
            try {
                await BackgroundActions.start(task, {
                    ...options,
                    parameters: { keyword: keywordRef.current, contacts: contactsRef.current }
                });
                setIsVoiceMonitoringActive(true);
                Alert.alert("Monitoramento Ativo", `Monitorando palavra: ${keywordRef.current}`);
            } catch (e) {
                console.error('Erro iniciar serviço background:', e);
                Alert.alert("Erro", "Não foi possível iniciar monitoramento.");
            }
        }
    };

    const stopMonitoring = async () => {
        await BackgroundActions.stop();
        setIsVoiceMonitoringActive(false);
        Alert.alert("Monitoramento Parado", "O monitoramento de voz foi desativado.");
    };

    const fetchEmergencyContacts = async (id) => {
        const { data, error } = await supabase.from('emergency_contacts').select('*').eq('user_id', id);
        if (error) console.error('Erro ao buscar contatos:', error);
        else setContacts(data);
    };

    useEffect(() => {
        fetchEmergencyContacts(userId);
        const watchId = Geolocation.watchPosition(
            () => setIsLocationActive(true),
            (error) => { console.log("Erro localização:", error.code, error.message); setIsLocationActive(false); },
            { enableHighAccuracy: true, distanceFilter: 10 }
        );
        return () => Geolocation.clearWatch(watchId);
    }, [userId]);

    useEffect(() => {
        const channel = supabase
            .channel('emergency_contacts')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_contacts', filter: `user_id=eq.${userId}` }, () => {
                fetchEmergencyContacts(userId);
            })
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [userId]);

    const handleSaveKeyword = () => {
        if (!keywordInput.trim()) { Alert.alert("Erro", "Palavra-chave não pode ser vazia."); return; }
        setEmergencyKeyword(keywordInput.trim());
        setShowKeywordModal(false);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.topBar}>
                    <Ionicons name="alert-circle" size={24} color="#E74C3C" />
                    <View style={styles.navLinks}>
                        <TouchableOpacity style={styles.navItemActive}><Icon name="home" size={14} color="#FFF" /></TouchableOpacity>
                        <TouchableOpacity style={styles.navItem}><Icon name="map-marker-alt" size={14} color="#555" /></TouchableOpacity>
                        <TouchableOpacity style={styles.navItem}><Icon name="user" size={14} color="#555" /></TouchableOpacity>
                    </View>
                    <TouchableOpacity><Icon name="sign-out" size={16} color="#555" /></TouchableOpacity>
                </View>
                <View style={styles.logoArea}>
                    <Text style={styles.logoText}>Alerta<Text style={styles.logoMe}>Me</Text></Text>
                    <Text style={styles.subtitle}>Sua segurança em primeiro lugar.</Text>
                </View>
            </View>

            <View style={[styles.card, styles.cardRedBorder]}>
                <Text style={styles.cardTitle}><FontAwesome5 name="shield-alt" size={18} color="#E74C3C" /> Monitoramento de voz</Text>
                <View style={styles.monitoramentoStatusRow}>
                    <Text style={[styles.statusTag, isVoiceMonitoringActive ? styles.statusActive : styles.statusInactive]}>
                        {isVoiceMonitoringActive ? 'ATIVO' : 'INATIVO'}
                    </Text>
                    <TouchableOpacity style={[styles.btnPrimary]} onPress={isVoiceMonitoringActive ? stopMonitoring : startMonitoring}>
                        <FontAwesome5 name="microphone" size={16} color="#FFF" />
                        <Text style={styles.btnPrimaryText}>{isVoiceMonitoringActive ? 'Parar monitoramento' : 'Iniciar monitoramento'}</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.label}>Palavra-chave de emergência</Text>
                <TextInput style={styles.textInput} value={emergencyKeyword} editable={false} />
                <TouchableOpacity style={styles.btnSecondary} onPress={() => { setKeywordInput(emergencyKeyword); setShowKeywordModal(true); }}>
                    <Text style={styles.btnSecondaryText}>Editar palavra-chave</Text>
                </TouchableOpacity>
            </View>

            <View style={[styles.card, styles.cardRedBorder]}>
                <Text style={styles.cardTitle}><FontAwesome5 name="users" size={16} color="#E74C3C" /> Contatos de Emergência</Text>
                {contacts.map((contact, index) => (
                    <View key={contact.id || index} style={[styles.contactItem, index === contacts.length - 1 && { borderBottomWidth: 0 }]}>
                        <View>
                            <Text style={styles.contactName}>{contact.name} ({contact.relation})</Text>
                            <Text style={styles.contactPhone}>{contact.phone}</Text>
                        </View>
                        <Text style={[styles.statusTag, styles.statusActive]}>ATIVO</Text>
                    </View>
                ))}
            </View>

            <View style={[styles.card, styles.cardRedBorder]}>
                <Text style={styles.cardTitle}><FontAwesome5 name="map-marker-alt" size={16} color="#E74C3C" /> Localização</Text>
                <View style={styles.localizacaoRow}>
                    <Text style={styles.localizacaoLabel}>Status de localização</Text>
                    <Text style={[styles.statusTag, isLocationActive ? styles.statusActive : styles.statusInactive]}>
                        {isLocationActive ? 'ATIVO' : 'INATIVO'}
                    </Text>
                </View>
                <Text style={styles.localizacaoNote}>Necessário para envio de coordenadas em emergências</Text>
            </View>

            <Modal visible={showKeywordModal} animationType="fade" transparent={true} onRequestClose={() => setShowKeywordModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Editar Palavra-chave</Text>
                        <TextInput
                            style={styles.modalTextInput}
                            onChangeText={setKeywordInput}
                            value={keywordInput}
                            placeholder="Digite a nova palavra-chave"
                            placeholderTextColor="#999"
                            autoCapitalize="words"
                        />
                        <TouchableOpacity style={[styles.modalButton, styles.btnPrimary]} onPress={handleSaveKeyword}>
                            <Text style={styles.btnPrimaryText}>Salvar Palavra-chave</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.modalButton, styles.btnSecondary, { marginTop: 10 }]} onPress={() => setShowKeywordModal(false)}>
                            <Text style={styles.btnSecondaryText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F4F9' },
    header: { backgroundColor: '#FFF', paddingTop: 40, paddingHorizontal: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#EEE' },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    navLinks: { flexDirection: 'row', alignItems: 'center' },
    navItem: { padding: 8, borderRadius: 4, marginHorizontal: 5 },
    navItemActive: { padding: 8, borderRadius: 4, marginHorizontal: 5, backgroundColor: '#E74C3C' },
    logoArea: { alignItems: 'center', marginTop: 10 },
    logoText: { fontSize: 32, fontWeight: '700', color: '#333' },
    logoMe: { color: '#E74C3C' },
    subtitle: { fontSize: 14, color: '#555', marginTop: 5 },
    card: { backgroundColor: '#FFF', marginHorizontal: 15, marginTop: 20, padding: 15, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    cardRedBorder: { borderTopWidth: 5, borderTopColor: '#E74C3C' },
    cardTitle: { fontSize: 18, fontWeight: '500', color: '#333', marginBottom: 15 },
    monitoramentoStatusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    label: { fontSize: 14, color: '#555', marginTop: 15, marginBottom: 5 },
    textInput: { backgroundColor: '#F8F8F8', padding: 10, borderRadius: 5, borderWidth: 1, borderColor: '#CCC', color: '#333', fontWeight: '500' },
    btnPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E74C3C', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 5, flex: 1, marginLeft: 10 },
    btnPrimaryText: { color: '#FFF', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
    btnSecondary: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E74C3C', paddingVertical: 10, borderRadius: 5, marginTop: 15, flex: 1, marginLeft: 0 },
    btnSecondaryText: { color: '#E74C3C', fontWeight: 'bold', textAlign: 'center', fontSize: 16 },
    statusTag: { paddingVertical: 5, paddingHorizontal: 8, borderRadius: 4, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center', width: 80, borderWidth: 1 },
    statusActive: { backgroundColor: '#ECF0F1', color: '#E74C3C', borderColor: '#E74C3C' },
    statusInactive: { backgroundColor: '#EEE', color: '#999', borderColor: '#CCC' },
    contactItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EEE' },
    contactName: { fontWeight: '500', color: '#333', fontSize: 15 },
    contactPhone: { fontSize: 14, color: '#555', marginTop: 2 },
    localizacaoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    localizacaoLabel: { fontWeight: '500', color: '#333' },
    localizacaoNote: { fontSize: 13, color: '#555' },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
    modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 10, width: '85%', alignItems: 'stretch' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: '#333' },
    modalTextInput: { padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, marginBottom: 20, fontSize: 16, color: '#333', backgroundColor: '#f9f9f9' },
    modalButton: { width: '100%' }
});