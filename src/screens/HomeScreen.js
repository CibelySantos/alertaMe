import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  Alert,
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "../../supabaseClient";
import * as Location from "expo-location";
import * as SMS from "expo-sms";
import { Audio } from "expo-av";
import { transcribeAudio } from "../utils/transcribeAudio";

const PRIMARY_RED = "#FF0000";
const COLORS = {
  primary: PRIMARY_RED,
  background: "#F5F5F5",
  textSecondary: "#555555",
  white: "#FFFFFF",
  black: "#000000",
  inputBackground: "#EEEEEE",
  verified: "#DC2626",
};

const emergencyContacts = [
  { name: "Luiz", role: "(Teste)", phone: "+5512996216306", isActive: true },
  {
    name: "Mariana Santos",
    role: "(Melhor amiga)",
    phone: "+551140028922",
    isActive: true,
  },
  {
    name: "Cleiton de Jesus",
    role: "(Irmão)",
    phone: "+551140028922",
    isActive: true,
  },
];

/* 🧭 Barra de navegação */
const NavigationHeader = ({ navigation, loading, handleLogout }) => (
  <View style={styles.navHeader}>
    <View style={styles.navLinksLeft}>
      <TouchableOpacity
        style={[styles.navItem, styles.navItemSelected]}
        onPress={() => navigation.navigate("Home")}
      >
        <Ionicons name="home" size={18} color={COLORS.white} />
        <Text style={[styles.navText, { color: COLORS.white }]}>
          Página Inicial
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate("Post")}
      >
        <Ionicons name="location-outline" size={18} color={COLORS.textSecondary} />
        <Text style={styles.navText}>Lugares</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate("Perfil")}
      >
        <Ionicons name="person-outline" size={18} color={COLORS.textSecondary} />
        <Text style={styles.navText}>Perfil</Text>
      </TouchableOpacity>
    </View>

    <TouchableOpacity
      style={styles.navItem}
      onPress={handleLogout}
      disabled={loading}
    >
      <Ionicons name="log-out-outline" size={18} color={COLORS.textSecondary} />
      <Text style={styles.navText}>Sair</Text>
    </TouchableOpacity>
  </View>
);

const StatusBadge = ({ active, text = null }) => (
  <View style={[styles.badge, active ? styles.badgeActive : styles.badgeInactive]}>
    <Text style={styles.badgeText}>
      {text || (active ? "ATIVO" : "INATIVO")}
    </Text>
  </View>
);

const SectionContainer = ({ title, iconName, children, iconLibrary = Feather }) => {
  const Icon = iconLibrary;
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        {Icon && (
          <Icon
            name={iconName}
            size={20}
            color={PRIMARY_RED}
            style={styles.sectionIcon}
          />
        )}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
};

export default function HomeScreen({ navigation }) {
  const [emergencyKeyword, setEmergencyKeyword] = useState("Socorro");
  const [isEditingKeyword, setIsEditingKeyword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);

  const recordingRef = useRef(null);
  const lastTriggerAt = useRef(0);

  /* 🚨 Envio manual de alerta */
  const handleEmergencyTrigger = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissão negada", "Permissão de localização necessária.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
        maximumAge: 5000,
        timeout: 10000,
      });

      const lat = location.coords.latitude;
      const lon = location.coords.longitude;
      const locationLink = `https://www.google.com/maps?q=${lat},${lon}`;
      const message = `🚨 Emergência detectada! Preciso de ajuda!\n\nMinha localização: ${locationLink}`;

      const activeContacts = emergencyContacts.filter((c) => c.isActive);
      const numbers = activeContacts.map((c) => c.phone);

      const isAvailable = await SMS.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert("Erro", "Envio de SMS não suportado neste dispositivo.");
        return;
      }

      await SMS.sendSMSAsync(numbers, message);
      Alert.alert("Mensagem enviada", "O SMS de emergência foi enviado!");
    } catch (error) {
      console.error("Erro ao enviar SMS:", error);
      Alert.alert("Erro", "Não foi possível enviar o SMS.");
    }
  };

  /* 🎙️ Iniciar gravação */
  const startRecording = async () => {
    try {
      console.log("🎙️ Iniciando gravação...");
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      recordingRef.current = recording;
      setIsRecording(true);

      console.log("🌐 Testando conexão com Supabase...");
      const ping = await fetch(
        "https://grqgsehkgnornqibknbu.supabase.co/rest/v1/"
      );
      console.log("🔁 Status:", ping.status);

      // ⏱️ Parar automaticamente após 3,5 segundos
      setTimeout(async () => {
        console.log("⏱️ Tempo limite atingido — parando gravação...");
        if (recordingRef.current) {
          await stopRecording(true);
        }
      }, 3500);
    } catch (err) {
      console.error("Erro ao iniciar gravação:", err);
    }
  };

  /* 🛑 Parar gravação e transcrever */
  const stopRecording = async (auto = false) => {
    console.log(auto ? "🛑 Parando automaticamente..." : "🛑 Parando gravação...");
    setIsRecording(false);

    const activeRecording = recordingRef.current;
    if (!activeRecording) {
      console.warn("⚠️ Nenhuma gravação ativa encontrada.");
      return;
    }

    try {
      await activeRecording.stopAndUnloadAsync();
      const uri = activeRecording.getURI();
      console.log("🎧 Áudio salvo em:", uri);

      recordingRef.current = null;

      // 🧠 Transcrever via Gemini
      const text = await transcribeAudio(uri);

      if (text) {
        console.log("✅ Texto reconhecido:", text);
        Alert.alert("🗣️ Transcrição concluída", text);

        if (text.toLowerCase().includes(emergencyKeyword.toLowerCase())) {
          Alert.alert("🚨 Palavra-chave detectada!", "Enviando alerta de emergência...");
          await handleEmergencyTrigger();
        }
      } else {
        Alert.alert("Erro", "Não foi possível transcrever o áudio.");
      }
    } catch (err) {
      console.error("❌ Erro ao parar ou transcrever gravação:", err);
      Alert.alert("Erro", "Ocorreu um problema ao processar o áudio.");
    }
  };

  /* 🚪 Logout */
  const handleLogout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert("Erro ao sair", error.message);
    else navigation.replace("Login");
    setLoading(false);
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <NavigationHeader
        navigation={navigation}
        loading={loading}
        handleLogout={handleLogout}
      />

      <Text style={styles.logo}>
        <Text style={{ fontWeight: "bold" }}>Alerta</Text>
        <Text style={{ color: PRIMARY_RED, fontWeight: "bold" }}>Me</Text>
      </Text>
      <Text style={styles.subtitle}>Sua segurança em primeiro lugar.</Text>

      <ScrollView contentContainerStyle={styles.container}>
        {/* 🚨 Botões principais */}
        <SectionContainer
          title="Alerta de Emergência"
          iconName="alert-octagon"
          iconLibrary={Feather}
        >
          <Text style={{ color: "#555", marginBottom: 15 }}>
            Pressione o botão abaixo para enviar sua localização via SMS aos
            contatos de segurança.
          </Text>

          <TouchableOpacity
            style={styles.alertButton}
            onPress={handleEmergencyTrigger}
          >
            <MaterialCommunityIcons name="alert" size={22} color="#FFF" />
            <Text style={styles.alertButtonText}>
              🚨 Enviar alerta de emergência
            </Text>
          </TouchableOpacity>

          {/* 🎙️ Gravação e comando de voz */}
          <TouchableOpacity
            style={[
              styles.alertButton,
              { marginTop: 10, backgroundColor: "#444" },
            ]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <MaterialCommunityIcons
              name={isRecording ? "stop-circle" : "microphone"}
              size={22}
              color="#FFF"
            />
            <Text style={styles.alertButtonText}>
              {isRecording
                ? "Parar e analisar comando"
                : "🎙️ Ativar reconhecimento de voz"}
            </Text>
          </TouchableOpacity>
        </SectionContainer>

        {/* ⚙️ Palavra-chave */}
        <SectionContainer
          title="Configurações da palavra-chave"
          iconName="key"
          iconLibrary={Feather}
        >
          <Text style={styles.keywordLabel}>Palavra-chave atual:</Text>
          {isEditingKeyword ? (
            <TextInput
              style={styles.keywordInput}
              value={emergencyKeyword}
              onChangeText={setEmergencyKeyword}
              onSubmitEditing={() => setIsEditingKeyword(false)}
            />
          ) : (
            <View style={styles.keywordDisplay}>
              <Text>{emergencyKeyword}</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditingKeyword(!isEditingKeyword)}
          >
            <Text style={styles.editButtonText}>
              {isEditingKeyword ? "Salvar" : "Editar palavra-chave"}
            </Text>
          </TouchableOpacity>
        </SectionContainer>

        {/* 👥 Contatos */}
        <SectionContainer
          title="Contatos de Emergência"
          iconName="account-group"
          iconLibrary={MaterialCommunityIcons}
        >
          {emergencyContacts.map((c, i) => (
            <View key={i} style={styles.contactRow}>
              <View>
                <Text style={styles.contactName}>
                  {c.name} <Text style={styles.contactRole}>{c.role}</Text>
                </Text>
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

/* 🎨 ESTILOS */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  container: { paddingHorizontal: 15, paddingBottom: 20 },
  navHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    paddingTop: 35,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  navLinksLeft: { flexDirection: "row" },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
    marginRight: 10,
  },
  navText: { fontSize: 12, color: COLORS.textSecondary, marginLeft: 3 },
  navItemSelected: { backgroundColor: COLORS.primary },
  logo: {
    fontSize: 24,
    textAlign: "center",
    marginTop: 15,
    marginBottom: 5,
    color: COLORS.black,
  },
  subtitle: { textAlign: "center", fontSize: 14, color: "#666", marginBottom: 20 },
  sectionContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  sectionIcon: { marginRight: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: PRIMARY_RED },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeActive: { backgroundColor: PRIMARY_RED },
  badgeInactive: { backgroundColor: "#999" },
  badgeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "bold" },
  alertButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PRIMARY_RED,
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  alertButtonText: { color: "#FFF", fontSize: 16, fontWeight: "bold", marginLeft: 8 },
  keywordLabel: { fontSize: 12, color: "#666", marginBottom: 5 },
  keywordDisplay: {
    backgroundColor: "#F0F0F0",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#CCC",
  },
  keywordInput: {
    backgroundColor: "#F0F0F0",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: PRIMARY_RED,
    color: "#000",
  },
  editButton: {
    backgroundColor: PRIMARY_RED,
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  editButtonText: { color: "#FFFFFF", fontWeight: "bold" },
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  contactName: { fontSize: 16, fontWeight: "bold", color: "#333" },
  contactRole: { fontSize: 14, fontWeight: "normal", color: "#666" },
  contactPhone: { fontSize: 14, color: "#666" },
});
