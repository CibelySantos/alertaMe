// ----------------------------------------------------------------------
// AUTORES: Cibely, Júlia Fortunato, Luiz Gustavo e Gabriel Moreira
// TELA: Relatório de Locais
// ----------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  TextInput,
  Text,
  ActivityIndicator,
  Alert,
  FlatList,
  TouchableOpacity,
  Platform,
  StyleSheet,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

// ----------------------------------------------------------------------
// MOCKS E CONSTANTES
// ----------------------------------------------------------------------

const AsyncStorage = {
  getItem: async (key) => {
    if (key === 'reports')
      return JSON.stringify([
        {
          id: 'mock1',
          userName: 'Usuário Teste',
          local: 'Rua das Flores, 144',
          type: 'incidente',
          text: 'Simulação de relatório antigo.',
          imageUrl: null,
          likes: 5,
          comments: ['ok', 'certo'],
        },
      ]);
    return null;
  },
  setItem: async (key, value) => console.log('Relatórios atualizados:', value),
};

const supabase = { auth: { signOut: async () => ({ error: null }) } };
const s3 = { upload: (params, callback) => callback(null, { Location: 'https://mock-image-url.com/image.jpg' }) };
const bucket = 'mock-bucket-name';

const REPORT_TYPES = [
  { label: 'Incidente', value: 'incidente' },
  { label: 'Cuidado', value: 'cuidado' },
  { label: 'Lugar Seguro', value: 'lugar_seguro' },
];

// Paleta de cores centralizada
const COLORS = {
  primaryRed: '#FF0000',
  primaryRedDark: '#CC0000',
  lightGray: '#F5F5F5',
  darkGrayText: '#333333',
  mediumGrayText: '#555555',
  blackText: '#000000',
  white: '#FFFFFF',
  headerBorder: '#E0E0E0',
  inputBorder: '#E0E0E0',
  shadowColor: '#000000',
  safeColor: '#1E90FF',
};

// ----------------------------------------------------------------------
// COMPONENTE: NavigationHeader
// ----------------------------------------------------------------------

const NavigationHeader = ({ navigation, loading, handleLogout, activeScreen }) => (
  <View style={navHeaderStyles.navHeader}>
    <View style={navHeaderStyles.navLinksLeft}>
      {/* Página Inicial */}
      <TouchableOpacity
        style={[navHeaderStyles.navItem, activeScreen === 'Home' && navHeaderStyles.navItemSelected]}
        onPress={() => navigation.navigate('Home')}
      >
        <Ionicons
          name="home-outline"
          size={18}
          color={activeScreen === 'Home' ? COLORS.white : COLORS.mediumGrayText}
        />
        <Text style={[navHeaderStyles.navText, activeScreen === 'Home' && { color: COLORS.white }]}>
          Página Inicial
        </Text>
      </TouchableOpacity>

      {/* Lugares */}
      <TouchableOpacity
        style={[navHeaderStyles.navItem, activeScreen === 'Posts' && navHeaderStyles.navItemSelected]}
        onPress={() => navigation.navigate('Posts')}
      >
        <Ionicons
          name="location"
          size={18}
          color={activeScreen === 'Posts' ? COLORS.white : COLORS.mediumGrayText}
        />
        <Text style={[navHeaderStyles.navText, activeScreen === 'Posts' && { color: COLORS.white }]}>
          Lugares
        </Text>
      </TouchableOpacity>

      {/* Perfil */}
      <TouchableOpacity
        style={[navHeaderStyles.navItem, activeScreen === 'Perfil' && navHeaderStyles.navItemSelected]}
        onPress={() => navigation.navigate('Perfil')}
      >
        <Ionicons
          name="person-outline"
          size={18}
          color={activeScreen === 'Perfil' ? COLORS.white : COLORS.mediumGrayText}
        />
        <Text style={[navHeaderStyles.navText, activeScreen === 'Perfil' && { color: COLORS.white }]}>
          Perfil
        </Text>
      </TouchableOpacity>
    </View>

    {/* Sair */}
    <TouchableOpacity style={navHeaderStyles.navItem} onPress={handleLogout} disabled={loading}>
      <Ionicons name="log-out-outline" size={18} color={COLORS.mediumGrayText} />
      <Text style={navHeaderStyles.navText}>Sair</Text>
    </TouchableOpacity>
  </View>
);

// ----------------------------------------------------------------------
// COMPONENTE: ReportCard
// ----------------------------------------------------------------------

const ReportCard = ({ item, onLike, onComment }) => {
  const tagColor =
    item.type === 'incidente' || item.type === 'cuidado' ? COLORS.primaryRed : COLORS.safeColor;
  const tagText = item.type ? item.type.toUpperCase() : 'RELATO';

  return (
    <View style={cardStyles.cardContainer}>
      <View style={cardStyles.titleRow}>
        <FontAwesome5 name="map-marker-alt" size={16} color={COLORS.primaryRed} style={{ marginRight: 8 }} />
        <Text style={cardStyles.localText}>{item.local || 'Local Não Informado'}</Text>
        <View style={[cardStyles.tag, { backgroundColor: tagColor }]}>
          <Text style={cardStyles.tagText}>{tagText}</Text>
        </View>
      </View>

      <Text style={cardStyles.descriptionText}>{item.text}</Text>

      {item.imageUrl && (
        Platform.OS === 'web' ? (
          <img
            src={item.imageUrl}
            alt="Imagem do Relatório"
            style={{ width: '100%', height: 200, marginTop: 10, borderRadius: 5, objectFit: 'cover' }}
          />
        ) : (
          <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 200, marginTop: 10, borderRadius: 5 }} />
        )
      )}

      <View style={cardStyles.postInfoRow}>
        <Text style={cardStyles.userNameText}>Postado por: {item.userName}</Text>
      </View>

      <View style={cardStyles.actionsRow}>
        <TouchableOpacity onPress={() => onLike(item.id)} style={cardStyles.actionButton}>
          <Ionicons name="heart-outline" size={16} color={COLORS.darkGrayText} />
          <Text style={cardStyles.actionText}>Curtir ({item.likes})</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            const comment = prompt('Digite seu comentário:');
            if (comment) onComment(item.id, comment);
          }}
          style={cardStyles.actionButton}
        >
          <Ionicons name="chatbox-outline" size={16} color={COLORS.darkGrayText} />
          <Text style={cardStyles.actionText}>Comentar</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={item.comments}
        keyExtractor={(comment, index) => index.toString()}
        renderItem={({ item: comment }) => <Text style={cardStyles.commentText}>• {comment}</Text>}
      />
    </View>
  );
};

// ----------------------------------------------------------------------
// TELA PRINCIPAL: RelatorioDeLocaisScreen
// ----------------------------------------------------------------------

export default function RelatorioDeLocaisScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [comentario, setComentario] = useState('');
  const [uploading, setUploading] = useState(false);
  const [reports, setReports] = useState([]);
  const [userName, setUserName] = useState('');
  const [local, setLocal] = useState('');
  const [tipoRelato, setTipoRelato] = useState(REPORT_TYPES[0].value);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    requestPermissions();
    loadReports();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos da permissão para acessar suas imagens.');
    }
  };

  const loadReports = async () => {
    try {
      const stored = await AsyncStorage.getItem('reports');
      if (stored) setReports(JSON.parse(stored));
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    }
  };

  const saveReports = async (newReports) => {
    try {
      await AsyncStorage.setItem('reports', JSON.stringify(newReports));
    } catch (error) {
      console.error('Erro ao salvar relatórios:', error);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const createReport = (imageUrl) => {
    const newReport = {
      id: Date.now().toString(),
      userName: userName || 'Usuário Anônimo',
      local,
      type: tipoRelato,
      text: comentario,
      imageUrl,
      likes: 0,
      comments: [],
    };
    const updated = [newReport, ...reports];
    setReports(updated);
    saveReports(updated);
    setImage(null);
    setComentario('');
    setLocal('');
    setTipoRelato(REPORT_TYPES[0].value);
  };

  const uploadImageAndCreateReport = async () => {
    if (!local || !comentario || !tipoRelato) {
      Alert.alert('Erro', 'Preencha o Local, o Tipo de Relato e o Comentário.');
      return;
    }
    if (image) {
      setUploading(true);
      const response = await fetch(image);
      const blob = await response.blob();
      const params = {
        Key: `imagens/${Date.now()}.jpg`,
        Bucket: bucket,
        Body: blob,
        ContentType: 'image/jpeg',
        ACL: 'public-read',
      };
      s3.upload(params, (err, data) => {
        setUploading(false);
        if (err) {
          Alert.alert('Erro ao fazer upload');
        } else {
          createReport(data.Location);
        }
      });
    } else {
      createReport(null);
    }
  };

  const handleLike = (id) => {
    const updated = reports.map((r) => (r.id === id ? { ...r, likes: r.likes + 1 } : r));
    setReports(updated);
    saveReports(updated);
  };

  const handleComment = (id, comment) => {
    const updated = reports.map((r) =>
      r.id === id ? { ...r, comments: [...r.comments, comment] } : r
    );
    setReports(updated);
    saveReports(updated);
  };

  const handleLogout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (!error) navigation.replace('Login');
    setLoading(false);
  };

  const filteredReports = reports.filter(
    (r) =>
      r.local.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <NavigationHeader navigation={navigation} loading={loading} handleLogout={handleLogout} activeScreen="Posts" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.mainTitle}>Relatório de Locais</Text>
        <Text style={styles.mainSubtitle}>Compartilhe suas experiências para ajudar outros</Text>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.mediumGrayText} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar"
            placeholderTextColor={COLORS.mediumGrayText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Novo relatório */}
        <View style={styles.newReportContainer}>
          <View style={styles.newReportTitleRow}>
            <Ionicons name="add-circle" size={24} color={COLORS.primaryRed} style={{ marginRight: 8 }} />
            <Text style={styles.newReportTitle}>Novo relatório</Text>
          </View>

          <TextInput
            style={styles.formInput}
            placeholder="Local*"
            placeholderTextColor={COLORS.mediumGrayText}
            value={local}
            onChangeText={setLocal}
          />
          <TextInput
            style={styles.formInput}
            placeholder="Seu nome (opcional)"
            placeholderTextColor={COLORS.mediumGrayText}
            value={userName}
            onChangeText={setUserName}
          />

          <View style={styles.formInputPickerContainer}>
            <Picker selectedValue={tipoRelato} onValueChange={(v) => setTipoRelato(v)} style={styles.pickerStyle}>
              {REPORT_TYPES.map((item) => (
                <Picker.Item key={item.value} label={item.label} value={item.value} color={COLORS.darkGrayText} />
              ))}
            </Picker>
          </View>

          <TextInput
            style={styles.formCommentArea}
            placeholder="Comentário*"
            placeholderTextColor={COLORS.mediumGrayText}
            value={comentario}
            onChangeText={setComentario}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity onPress={pickImage} style={styles.selectImageButton}>
            <Ionicons name="images-outline" size={20} color={COLORS.darkGrayText} />
            <Text style={styles.selectImageText}>Selecionar Imagem (Opcional)</Text>
          </TouchableOpacity>

          {image && (
            <Image source={{ uri: image }} style={{ width: '100%', height: 150, marginTop: 10, borderRadius: 8 }} />
          )}

          {uploading && <ActivityIndicator size="large" color={COLORS.primaryRed} style={{ marginTop: 10 }} />}

          <TouchableOpacity
            style={styles.addButton}
            onPress={uploadImageAndCreateReport}
            disabled={uploading}
          >
            <Text style={styles.addButtonText}>{uploading ? 'Enviando...' : 'Adicionar relatório'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.reportsSectionTitle}>Relatórios</Text>
        <FlatList
          data={filteredReports}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ReportCard item={item} onLike={handleLike} onComment={handleComment} />
          )}
          scrollEnabled={false}
          ListEmptyComponent={() => (
            <Text style={{ textAlign: 'center', color: COLORS.mediumGrayText, padding: 20 }}>
              Nenhum relatório encontrado.
            </Text>
          )}
        />
      </ScrollView>
    </View>
  );
}

// ----------------------------------------------------------------------
// ESTILOS
// ----------------------------------------------------------------------

const navHeaderStyles = StyleSheet.create({
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
    backgroundColor: COLORS.primaryRed,
  },
});

const cardStyles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: COLORS.headerBorder,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  localText: { color: COLORS.blackText, fontWeight: 'bold', fontSize: 16, flex: 1 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999, marginLeft: 10 },
  tagText: { color: COLORS.white, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  descriptionText: { color: COLORS.darkGrayText, fontSize: 14, lineHeight: 20, marginVertical: 5 },
  postInfoRow: { marginTop: 10, marginBottom: 5 },
  userNameText: { fontSize: 12, color: COLORS.mediumGrayText },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: 10,
    marginTop: 10,
  },
  actionButton: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  actionText: { marginLeft: 5, fontSize: 14, color: COLORS.darkGrayText },
  commentText: { marginTop: 5, color: COLORS.mediumGrayText, fontSize: 12, paddingLeft: 10 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 50 },
  mainTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.blackText },
  mainSubtitle: { fontSize: 14, color: COLORS.mediumGrayText, marginBottom: 20 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 9999,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    marginBottom: 24,
  },
  searchInput: { flex: 1, fontSize: 16, color: COLORS.darkGrayText, padding: 0 },
  newReportContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.headerBorder,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  newReportTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  newReportTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.blackText },
  formInput: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.darkGrayText,
    marginBottom: 12,
  },
  formInputPickerContainer: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 10,
    justifyContent: 'center',
    height: 50,
  },
  pickerStyle: { height: '100%', width: '100%', color: COLORS.darkGrayText },
  formCommentArea: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.darkGrayText,
    marginBottom: 15,
    minHeight: 100,
  },
  selectImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 5,
    backgroundColor: COLORS.lightGray,
    marginBottom: 10,
  },
  selectImageText: { marginLeft: 8, color: COLORS.darkGrayText, fontSize: 14 },
  addButton: {
    backgroundColor: COLORS.primaryRed,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  reportsSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.blackText,
    marginTop: 24,
    marginBottom: 16,
  },
});
