import React, { useState, useRef, useEffect } from "react";
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
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "../../supabaseClient";
import * as Location from "expo-location";
import * as SMS from "expo-sms";
import * as Linking from "expo-linking";
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

// === removed initialContacts: we load from DB ===

const NavigationHeader = ({ navigation, loading, handleLogout }) => (
  <View style={styles.navHeader}>
    <View style={styles.navLinksLeft}>
      <TouchableOpacity
        style={[styles.navItem, styles.navItemSelected]}
        onPress={() => navigation.navigate("Home")}
      >
        <Ionicons name="home" size={18} color={COLORS.white} />
        <Text style={[styles.navText, { color: COLORS.white }]}>Página Inicial</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Post")}>
        <Ionicons name="location-outline" size={18} color={COLORS.textSecondary} />
        <Text style={styles.navText}>Lugares</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Perfil")}>
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
    <Text style={styles.badgeText}>{text || (active ? "ATIVO" : "INATIVO")}</Text>
  </View>
);

const SectionContainer = ({ title, iconName, children, iconLibrary = Feather }) => {
  const Icon = iconLibrary;
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        {Icon && (
          <Icon name={iconName} size={20} color={PRIMARY_RED} style={styles.sectionIcon} />
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
  const [contacts, setContacts] = useState([]); // agora vém do banco
  const [editingContactIndex, setEditingContactIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [userId, setUserId] = useState(null);

  const recordingRef = useRef(null);
  // Busca a palavra-chave (profiles.frase) do usuário logado
  const loadKeyword = async (uid) => {
    try {
      const userIdToUse = uid || userId;
      if (!userIdToUse) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("frase")
        .eq("id", userIdToUse)
        .single();

      if (!error && data?.frase) {
        setEmergencyKeyword(data.frase);
      }
    } catch (err) {
      console.log("Erro ao carregar palavra-chave:", err);
    }
  };

  useEffect(() => {
    (async () => {
      await initUserAndLoadContacts();
    })();
  }, []);

  // tentativa robusta de obter usuário (getUser() ou user())
  const getCurrentUser = async () => {
    try {
      // supabase-js v2
      if (supabase.auth && supabase.auth.getUser) {
        const res = await supabase.auth.getUser();
        return res?.data?.user ?? null;
      }
      // fallback supabase-js v1
      if (supabase.auth && supabase.auth.user) {
        return supabase.auth.user();
      }
    } catch (err) {
      console.warn("Erro ao obter usuário:", err);
    }
    return null;
  };

  const initUserAndLoadContacts = async () => {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        // Se não estiver logado, redireciona para login
        navigation.replace("Login");
        return;
      }
      setUserId(user.id);
      await loadContacts(user.id);
      await loadKeyword(user.id);   // <-- adiciona esta linha

    } catch (err) {
      console.error("Erro init:", err);
      Alert.alert("Erro", "Não foi possível inicializar dados.");
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async (uid) => {
    setLoading(true);
    try {
      const user_id = uid || userId;
      if (!user_id) return;

      const { data, error } = await supabase
        .from("contacts")
        .select("id, user_id, name, phone, relation, email, created_at")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar contatos:", error);
        Alert.alert("Erro", "Não foi possível carregar contatos.");
        return;
      }

      // marca todos como isActive true por padrão (você pode extender com coluna no DB se quiser)
      const normalized = (data || []).map((c) => ({ ...c, isActive: true }));
      setContacts(normalized);
    } catch (err) {
      console.error("Erro loadContacts:", err);
      Alert.alert("Erro", "Não foi possível carregar contatos.");
    } finally {
      setLoading(false);
    }
  };

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

      const activeContacts = contacts.filter((c) => c.isActive);
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

  const handleCallPolice = async () => {
    const policeNumber = "190";
    const url = `tel:${policeNumber}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Erro", "Não foi possível abrir o discador neste dispositivo.");
    }
  };

  const startRecording = async () => {
    try {
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

      setTimeout(async () => {
        if (recordingRef.current) {
          await stopRecording(true);
        }
      }, 3500);
    } catch (err) {
      console.error("Erro ao iniciar gravação:", err);
    }
  };

  const stopRecording = async (auto = false) => {
    setIsRecording(false);
    const activeRecording = recordingRef.current;
    if (!activeRecording) return;

    try {
      await activeRecording.stopAndUnloadAsync();
      const uri = activeRecording.getURI();
      recordingRef.current = null;
      const text = await transcribeAudio(uri);
      if (text && text.toLowerCase().includes(emergencyKeyword.toLowerCase())) {
        await handleEmergencyTrigger();
      }
    } catch (err) {
      console.error("Erro ao processar áudio:", err);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert("Erro ao sair", error.message);
    else navigation.replace("Login");
    setLoading(false);
  };

  // === DB operations: create / update / delete ===

  const saveContactToDB = async (contact) => {
    // contact: { id?, name, phone, relation, email }
    try {
      if (!userId) {
        const user = await getCurrentUser();
        if (!user) throw new Error("Usuário não autenticado");
        setUserId(user.id);
      }

      if (contact.id) {
        // update existing
        const { data, error } = await supabase
          .from("contacts")
          .update({
            name: contact.name,
            phone: contact.phone,
            relation: contact.relation,
            email: contact.email,
          })
          .eq("id", contact.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // insert new
        const { data, error } = await supabase
          .from("contacts")
          .insert([
            {
              user_id: userId,
              name: contact.name,
              phone: contact.phone,
              relation: contact.relation,
              email: contact.email,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (err) {
      console.error("Erro ao salvar contato:", err);
      Alert.alert("Erro", "Não foi possível salvar o contato.");
      throw err;
    }
  };

  const deleteContactFromDB = async (contactId) => {
    try {
      const { error } = await supabase.from("contacts").delete().eq("id", contactId);
      if (error) throw error;
      // após deletar, recarrega
      await loadContacts();
    } catch (err) {
      console.error("Erro ao deletar contato:", err);
      Alert.alert("Erro", "Não foi possível remover o contato.");
    }
  };

  // Atualiza estado local quando editando inputs
  const updateContactLocal = (index, field, value) => {
    const updated = [...contacts];
    updated[index] = { ...updated[index], [field]: value };
    setContacts(updated);
  };

  // Quando o usuário clica no ícone: se estava editando => salva; se não => habilita edição
  const onToggleEditContact = async (index) => {
    // se já editando esse index => gravar
    if (editingContactIndex === index) {
      const contact = contacts[index];
      setLoading(true);
      try {
        const saved = await saveContactToDB(contact);
        // replace no array local com dados retornados (id, created_at, etc)
        const updated = [...contacts];
        updated[index] = { ...saved, isActive: true };
        setContacts(updated);
        setEditingContactIndex(null);
      } catch (err) {
        // erro tratado em saveContactToDB
      } finally {
        setLoading(false);
      }
    } else {
      // iniciar edição
      setEditingContactIndex(index);
    }
  };

  const onAddNewContact = () => {
    // adiciona um contato vazio temporário no estado e abre edição
    const newContact = { name: "", relation: "", phone: "", email: "", isActive: true };
    setContacts([newContact, ...contacts]);
    setEditingContactIndex(0);
  };

  const onRemoveContact = async (index) => {
    const c = contacts[index];
    if (c?.id) {
      // pergunta confirmação
      Alert.alert("Remover contato", "Deseja remover este contato do banco?", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            await deleteContactFromDB(c.id);
          },
        },
      ]);
    } else {
      // contato ainda não salvo no DB: só remover do estado
      const updated = contacts.filter((_, i) => i !== index);
      setContacts(updated);
      if (editingContactIndex === index) setEditingContactIndex(null);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <NavigationHeader navigation={navigation} loading={loading} handleLogout={handleLogout} />

      <Text style={styles.logo}>
        <Text style={{ fontWeight: "bold" }}>Alerta</Text>
        <Text style={{ color: PRIMARY_RED, fontWeight: "bold" }}>Me</Text>
      </Text>
      <Text style={styles.subtitle}>Sua segurança em primeiro lugar.</Text>

      <ScrollView contentContainerStyle={styles.container}>
        <SectionContainer title="Alerta de Emergência" iconName="alert-octagon" iconLibrary={Feather}>
          <Text style={{ color: "#555", marginBottom: 15 }}>
            Pressione o botão abaixo para enviar sua localização via SMS aos contatos de segurança.
          </Text>

          <TouchableOpacity style={styles.alertButton} onPress={handleEmergencyTrigger}>
            <MaterialCommunityIcons name="alert" size={22} color="#FFF" />
            <Text style={styles.alertButtonText}>Enviar alerta de emergência</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.alertButton, { marginTop: 10, backgroundColor: "#1E90FF" }]}
            onPress={handleCallPolice}
          >
            <Ionicons name="call" size={22} color="#FFF" />
            <Text style={styles.alertButtonText}>Ligar para a Polícia (190)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.alertButton, { marginTop: 10, backgroundColor: "#444" }]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <MaterialCommunityIcons name={isRecording ? "stop-circle" : "microphone"} size={22} color="#FFF" />
            <Text style={styles.alertButtonText}>
              {isRecording ? "Parar e analisar comando" : "Ativar reconhecimento de voz"}
            </Text>
          </TouchableOpacity>
        </SectionContainer>

        <SectionContainer title="Palavra-chave" iconName="key" iconLibrary={Feather}>
          <View style={styles.keywordRow}>
            {isEditingKeyword ? (
              <TextInput
                style={styles.keywordInput}
                value={emergencyKeyword}
                onChangeText={setEmergencyKeyword}
                onSubmitEditing={() => setIsEditingKeyword(false)}
              />
            ) : (
              <Text style={styles.keywordDisplay}>{emergencyKeyword}</Text>
            )}

            <TouchableOpacity onPress={() => setIsEditingKeyword(!isEditingKeyword)}>
              <Feather name={isEditingKeyword ? "check" : "edit-2"} size={20} color={PRIMARY_RED} />
            </TouchableOpacity>
          </View>
        </SectionContainer>

        <SectionContainer title="Contatos de Emergência" iconName="account-group" iconLibrary={MaterialCommunityIcons}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ color: COLORS.textSecondary }}>Seus contatos salvos</Text>
            <TouchableOpacity onPress={onAddNewContact} style={{ padding: 6 }}>
              <Feather name="plus" size={18} color={PRIMARY_RED} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator />
          ) : contacts.length === 0 ? (
            <Text style={{ color: COLORS.textSecondary }}>Nenhum contato salvo.</Text>
          ) : (
            contacts.map((c, i) => (
              <View key={c.id ?? `new-${i}`} style={styles.contactRow}>
                {editingContactIndex === i ? (
                  <View style={{ flex: 1 }}>
                    <TextInput
                      style={styles.contactInput}
                      value={c.name}
                      onChangeText={(v) => updateContactLocal(i, "name", v)}
                      placeholder="Nome"
                    />
                    <TextInput
                      style={styles.contactInput}
                      value={c.relation}
                      onChangeText={(v) => updateContactLocal(i, "relation", v)}
                      placeholder="Relação"
                    />
                    <TextInput
                      style={styles.contactInput}
                      value={c.phone}
                      onChangeText={(v) => updateContactLocal(i, "phone", v)}
                      placeholder="Telefone"
                      keyboardType="phone-pad"
                    />
                    <TextInput
                      style={styles.contactInput}
                      value={c.email}
                      onChangeText={(v) => updateContactLocal(i, "email", v)}
                      placeholder="Email (opcional)"
                      keyboardType="email-address"
                    />
                  </View>
                ) : (
                  <View>
                    <Text style={styles.contactName}>
                      {c.name} <Text style={styles.contactRole}>{c.relation}</Text>
                    </Text>
                    <Text style={styles.contactPhone}>{c.phone}</Text>
                    {c.email ? <Text style={{ color: "#666", fontSize: 13 }}>{c.email}</Text> : null}
                  </View>
                )}

                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TouchableOpacity onPress={() => onToggleEditContact(i)} style={{ marginRight: 12 }}>
                    <Feather name={editingContactIndex === i ? "check" : "edit-2"} size={20} color={PRIMARY_RED} />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => onRemoveContact(i)}>
                    <Feather name="trash-2" size={18} color="#999" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </SectionContainer>
      </ScrollView>
    </View>
  );
}

/* 🎨 ESTILOS (mantidos iguais ao original) */
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
  keywordRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  keywordDisplay: { fontSize: 16, color: "#333" },
  keywordInput: {
    backgroundColor: "#F0F0F0",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
  },
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
  contactInput: {
    backgroundColor: "#F0F0F0",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#DDD",
    padding: 6,
    marginBottom: 5,
  },
});
