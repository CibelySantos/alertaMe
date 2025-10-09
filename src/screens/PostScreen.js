// Cibely, Júlia Fortunato, Luiz Gustavo e Gabriel Moreira (Manutenção de Autoria)

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
// Importação de Ícones
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons'; // Adicionado MaterialCommunityIcons
// Para o Dropdown (Tipo de Relato) - É necessário instalar: expo install @react-native-picker/picker
import { Picker } from '@react-native-picker/picker';

// AVISO: É necessário importar ou definir AsyncStorage, s3 e bucket para o código funcionar
// Exemplo (precisa ser definido ou importado no seu ambiente):
const AsyncStorage = {
    getItem: async (key) => {
        // Simulação de dados salvos
        if (key === 'reports') return JSON.stringify([{ id: 'mock1', userName: 'Usuário Teste', local: 'Rua das Flores, 144', type: 'Incidente', text: 'Simulação de relatório antigo.', imageUrl: null, likes: 5, comments: ['ok', 'certo'] }]);
        return null;
    },
    setItem: async (key, value) => console.log('Relatórios salvos/atualizados:', value),
};

// **MOCK:** Funções do Supabase para o Header funcionar
const supabase = { auth: { signOut: async () => ({ error: null }) } }; 

const s3 = { upload: (params, callback) => { /* Mock S3 upload */ callback(null, { Location: 'https://mock-image-url.com/image.jpg' }); } };
const bucket = 'mock-bucket-name';
const REPORT_TYPES = [
    { label: 'Incidente', value: 'incidente' },
    { label: 'Cuidado', value: 'cuidado' },
    { label: 'Lugar Seguro', value: 'lugar_seguro' },
];

// --- PALETA DE CORES ---
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
    safeColor: '#1E90FF', // Exemplo de cor para 'Lugar Seguro'
};

// ----------------------------------------------------------------------
// --- NOVO COMPONENTE: NavigationHeader (Copiado e Adaptado) ---
// ----------------------------------------------------------------------

// Componente do cabeçalho de navegação. 
// ATENÇÃO: A prop 'activeScreen' é usada para destacar o item correto.
const NavigationHeader = ({ navigation, loading, handleLogout }) => (
    <View style={navHeaderStyles.navHeader}>
        <View style={navHeaderStyles.navLinksLeft}>
            {/* PÁGINA INICIAL */}
            <TouchableOpacity 
                style={navHeaderStyles.navItem} 
                onPress={() => navigation.navigate('Home')}
            >
                <Ionicons name="home-outline" size={18} color={COLORS.mediumGrayText} />
                <Text style={navHeaderStyles.navText}>Página Inicial</Text>
            </TouchableOpacity>
            
            {/* LUGARES (Selecionado) */}
            <TouchableOpacity 
                style={[navHeaderStyles.navItem, navHeaderStyles.navItemSelected]} 
                onPress={() => { /* navigation.navigate('Places') - Já está aqui, ou Post, o que for a rota */ }}
            >
                {/* Ícone de location sem contorno, pois o fundo já o destaca */}
                <Ionicons name="location" size={18} color={COLORS.white} /> 
                <Text style={[navHeaderStyles.navText, { color: COLORS.white }]}>Lugares</Text>
            </TouchableOpacity>
            
            {/* PERFIL */}
            <TouchableOpacity style={navHeaderStyles.navItem} onPress={() => navigation.navigate('Perfil')}>
                {/* Note que estamos usando 'Perfil' com P maiúsculo como sua rota */}
                <Ionicons name="person-outline" size={18} color={COLORS.mediumGrayText} />
                <Text style={navHeaderStyles.navText}>Perfil</Text>
            </TouchableOpacity>
        </View>
        
        {/* SAIR / LOGOUT */}
        <TouchableOpacity style={navHeaderStyles.navItem} onPress={handleLogout} disabled={loading}>
            <Ionicons name="log-out-outline" size={18} color={COLORS.mediumGrayText} />
            <Text style={navHeaderStyles.navText}>Sair</Text>
        </TouchableOpacity>
    </View>
);

// --- COMPONENTES AUXILIARES (inalterados) ---

// Componente do Card de Relatório
const ReportCard = ({ item, onLike, onComment }) => {
    const isCaution = item.type === 'cuidado' || item.type === 'incidente';
    const tagColor = item.type === 'incidente' ? COLORS.primaryRed : item.type === 'cuidado' ? COLORS.primaryRed : COLORS.safeColor;
    const tagText = item.type ? item.type.toUpperCase() : 'RELATO';

    return (
        <View style={cardStyles.cardContainer}>
            <View style={cardStyles.titleRow}>
                <FontAwesome5
                    name="map-marker-alt"
                    size={16}
                    color={COLORS.primaryRed}
                    style={{ marginRight: 8 }}
                />
                <Text style={cardStyles.localText}>{item.local || 'Local Não Informado'}</Text>
                <View style={[cardStyles.tag, { backgroundColor: tagColor }]}>
                    <Text style={cardStyles.tagText}>{tagText}</Text>
                </View>
            </View>
            
            <Text style={cardStyles.descriptionText}>
                {item.text}
            </Text>

            {item.imageUrl && (
                Platform.OS === 'web' ? (
                    <img src={item.imageUrl} alt="Imagem do Relatório" style={{ width: '100%', height: 200, marginTop: 10, borderRadius: 5, objectFit: 'cover' }} />
                ) : (
                    <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 200, marginTop: 10, borderRadius: 5 }} />
                )
            )}

            {/* Ações e Informações do Post */}
            <View style={cardStyles.postInfoRow}>
                <Text style={cardStyles.userNameText}>
                    Postado por: **{item.userName}**
                </Text>
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

            {/* Lista de Comentários */}
            <FlatList
                data={item.comments}
                keyExtractor={(comment, index) => index.toString()}
                renderItem={({ item: comment }) => (
                    <Text style={cardStyles.commentText}>• {comment}</Text>
                )}
            />
        </View>
    );
};

// O componente Header original foi REMOVIDO/SUBSTITUÍDO

// --- TELA PRINCIPAL: RelatorioDeLocaisScreen ---
export default function RelatorioDeLocaisScreen({ navigation }) {
    // ... Estados (Inalterados)
    const [image, setImage] = useState(null);
    const [comentario, setComentario] = useState(''); // Era 'text'
    const [uploading, setUploading] = useState(false);
    const [reports, setReports] = useState([]); // Era 'posts'
    const [userName, setUserName] = useState('');
    const [local, setLocal] = useState('');
    const [tipoRelato, setTipoRelato] = useState(REPORT_TYPES[0].value);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false); // Adicionado para o NavigationHeader

    // ... useEffects e Funções de Lógica (Inalterados)

    useEffect(() => {
        requestPermissions();
        loadReports(); // Chamando a função de carregar posts, agora relatórios
    }, []);

    const requestPermissions = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permissão necessária', 'Precisamos da permissão para acessar suas imagens.');
        }
    };

    const loadReports = async () => {
        try {
            const storedPosts = await AsyncStorage.getItem('reports'); // Chave alterada para 'reports'
            if (storedPosts) {
                setReports(JSON.parse(storedPosts));
            }
        } catch (error) {
            console.error('Erro ao carregar relatórios:', error);
        }
    };

    const saveReports = async (newReports) => {
        try {
            await AsyncStorage.setItem('reports', JSON.stringify(newReports)); // Chave alterada
        } catch (error) {
            console.error('Erro ao salvar relatórios:', error);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
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

            const filename = `imagens/${Date.now()}.jpg`;

            const params = {
                Key: filename,
                Bucket: bucket,
                Body: blob,
                ContentType: 'image/jpeg',
                ACL: 'public-read',
            };

            s3.upload(params, (err, data) => {
                setUploading(false);
                if (err) {
                    Alert.alert('Erro ao fazer upload', 'Verifique a conexão ou permissões do S3.');
                    console.log(err);
                } else {
                    console.log('Imagem enviada. URL:', data.Location);
                    Alert.alert('Upload feito com sucesso! Criando relatório...');
                    createReport(data.Location);
                }
            });
        } else {
            // Cria o post mesmo sem imagem (funcionalidade adaptada)
            createReport(null);
        }
    };

    const createReport = (imageUrl) => {
        const newReport = {
            id: Date.now().toString(),
            userName: userName || 'Usuário Anônimo',
            local: local,
            type: tipoRelato,
            text: comentario,
            imageUrl: imageUrl,
            likes: 0,
            comments: [],
        };

        const updatedReports = [newReport, ...reports];
        setReports(updatedReports);
        saveReports(updatedReports);

        // Resetar formulário
        setImage(null);
        setComentario('');
        setLocal('');
        setTipoRelato(REPORT_TYPES[0].value);
    };

    // Lógicas de Ação de Postagem (curtir e comentar) - MANTIDAS
    const handleLike = (reportId) => {
        const updated = reports.map(report =>
            report.id === reportId ? { ...report, likes: report.likes + 1 } : report
        );
        setReports(updated);
        saveReports(updated);
    };

    const handleComment = (reportId, comment) => {
        const updated = reports.map(report =>
            report.id === reportId ? { ...report, comments: [...report.comments, comment] } : report
        );
        setReports(updated);
        saveReports(updated);
    };

    // Função de Logout (adaptada para a estrutura do NavigationHeader)
    const handleLogout = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signOut(); 

        if (error) {
            Alert.alert('Erro ao sair', error.message);
        } else {
            // Navega para a tela de Login e remove o histórico
            navigation.replace('Login'); 
        }
        setLoading(false);
    };

    // Filtra relatórios com base na pesquisa (adaptado)
    const filteredReports = reports.filter(report =>
        report.local.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.text.toLowerCase().includes(searchQuery.toLowerCase())
    );

return (
        <View style={styles.container}>
            {/* 🔝 SUBSTITUIÇÃO: Novo NavigationHeader */}
            <NavigationHeader 
                navigation={navigation} 
                loading={loading} 
                handleLogout={handleLogout} 
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Título e Busca (mantidos) */}
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

                {/* 📝 Bloco “Novo relatório” (mantido) */}
                <View style={styles.newReportContainer}>
                    <View style={styles.newReportTitleRow}>
                        <Ionicons name="add-circle" size={24} color={COLORS.primaryRed} style={{ marginRight: 8 }} />
                        <Text style={styles.newReportTitle}>Novo relatório</Text>
                    </View>

                    {/* Campo: Local* */}
                    <TextInput
                        style={styles.formInput}
                        placeholder="Local*"
                        placeholderTextColor={COLORS.mediumGrayText}
                        value={local}
                        onChangeText={setLocal}
                    />
                    {/* Campo: Seu Nome (mantido) */}
                    <TextInput
                        style={styles.formInput}
                        placeholder="Seu nome (para identificação)"
                        placeholderTextColor={COLORS.mediumGrayText}
                        value={userName}
                        onChangeText={setUserName}
                    />

                    {/* CAMPO AJUSTADO: Tipo de relato* (Dropdown) */}
                    <View style={styles.formInputPickerContainer}>
                        <Picker
                            selectedValue={tipoRelato}
                            onValueChange={(itemValue) => setTipoRelato(itemValue)}
                            style={styles.pickerStyle}
                            itemStyle={{ height: 120 }} 
                            mode={Platform.OS === 'android' ? "dropdown" : "dialog"}
                        >
                            {REPORT_TYPES.map(item => (
                                <Picker.Item 
                                    key={item.value} 
                                    label={item.label} 
                                    value={item.value} 
                                    color={COLORS.darkGrayText}
                                />
                            ))}
                        </Picker>
                    </View>

                    {/* Campo: Comentário* */}
                    <TextInput
                        style={styles.formCommentArea}
                        placeholder="Comentário* (Descreva o que aconteceu ou suas observações...)"
                        placeholderTextColor={COLORS.mediumGrayText}
                        value={comentario}
                        onChangeText={setComentario}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />

                    {/* Lógica de Imagem e Botão de Ação (mantidos) */}
                    <View style={styles.imageUploadContainer}>
                        <TouchableOpacity onPress={pickImage} style={styles.selectImageButton}>
                            <Ionicons name="images-outline" size={20} color={COLORS.darkGrayText} />
                            <Text style={styles.selectImageText}>Selecionar Imagem (Opcional)</Text>
                        </TouchableOpacity>
                    </View>

                    {image && (
                        Platform.OS === 'web' ? (
                            <img src={image} alt="Preview" style={{ width: '100%', height: 150, marginTop: 10, borderRadius: 8, objectFit: 'cover' }} />
                        ) : (
                            <Image source={{ uri: image }} style={{ width: '100%', height: 150, marginTop: 10, borderRadius: 8 }} />
                        )
                    )}

                    {uploading && <ActivityIndicator size="large" color={COLORS.primaryRed} style={{ marginTop: 10 }} />}

                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={uploadImageAndCreateReport}
                        activeOpacity={0.8}
                        disabled={uploading}
                    >
                        <Text style={styles.addButtonText}>
                           {uploading ? 'Enviando...' : 'Adicionar relatório'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Seção "Seus relatórios" (mantida) */}
                <Text style={styles.reportsSectionTitle}>Seus relatórios</Text>
                <FlatList
                    data={filteredReports}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <ReportCard item={item} onLike={handleLike} onComment={handleComment} />
                    )}
                    scrollEnabled={false} 
                    ListEmptyComponent={() => (
                           <Text style={{textAlign: 'center', color: COLORS.mediumGrayText, padding: 20}}>Nenhum relatório encontrado.</Text>
                    )}
                />
            </ScrollView>
        </View>
    );
}

// --- ESTILOS ADICIONAIS PARA O NOVO HEADER ---
const navHeaderStyles = StyleSheet.create({
    navHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        paddingTop: Platform.OS === 'android' ? 30 : 50, // Ajuste para status bar
        paddingVertical: 10,
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
        color: COLORS.mediumGrayText, // Usando mediumGrayText para links inativos
        marginLeft: 3,
    },
    navItemSelected: {
        backgroundColor: COLORS.primaryRed, // Destaque para Lugares
    },
});

// --- Estilos da Tela Principal (Mantidos, apenas a seção de headerStyles foi removida) ---
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
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    localText: {
        color: COLORS.blackText,
        fontWeight: 'bold',
        fontSize: 16,
        flex: 1,
    },
    tag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 9999,
        marginLeft: 10,
    },
    tagText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    descriptionText: {
        color: COLORS.darkGrayText,
        fontSize: 14,
        lineHeight: 20,
        marginVertical: 5,
    },
    postInfoRow: {
        marginTop: 10,
        marginBottom: 5,
    },
    userNameText: {
        fontSize: 12,
        color: COLORS.mediumGrayText,
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        borderTopWidth: 1,
        borderTopColor: COLORS.lightGray,
        paddingTop: 10,
        marginTop: 10,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 15,
        paddingHorizontal: 5,
    },
    actionText: {
        marginLeft: 5,
        fontSize: 14,
        color: COLORS.darkGrayText,
    },
    commentText: {
        marginTop: 5,
        color: COLORS.mediumGrayText,
        fontSize: 12,
        paddingLeft: 10,
    }
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 50,
        backgroundColor: COLORS.white,
    },
    mainTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.blackText,
    },
    mainSubtitle: {
        fontSize: 14,
        color: COLORS.mediumGrayText,
        marginBottom: 20,
    },
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
        shadowColor: COLORS.shadowColor,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: COLORS.darkGrayText,
        padding: 0,
    },
    newReportContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        shadowColor: COLORS.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 5,
        borderWidth: 1,
        borderColor: COLORS.headerBorder,
    },
    newReportTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    newReportTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.blackText,
    },
    formInput: {
        backgroundColor: COLORS.lightGray,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: COLORS.darkGrayText,
        marginBottom: 12,
    },
    formInputPickerContainer: {
        backgroundColor: COLORS.lightGray, // Fundo cinza claro
        borderRadius: 8, // Bordas arredondadas
        marginBottom: 12,
        paddingHorizontal: 10, 
        paddingVertical: Platform.OS === 'ios' ? 4 : 0, // Ajuste sutil por plataforma
        justifyContent: 'center',
        height: Platform.OS === 'ios' ? 48 : 50, 
        overflow: 'hidden',
    },
    pickerStyle: {
        height: '100%',
        width: '100%',
        color: COLORS.darkGrayText,
    },
    formCommentArea: {
        backgroundColor: COLORS.lightGray,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: COLORS.darkGrayText,
        marginBottom: 15,
        minHeight: 100,
    },
    imageUploadContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginBottom: 10,
    },
    selectImageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 5,
        backgroundColor: COLORS.lightGray,
    },
    selectImageText: {
        marginLeft: 8,
        color: COLORS.darkGrayText,
        fontSize: 14,
    },
    addButton: {
        backgroundColor: COLORS.primaryRed,
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    addButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    reportsSectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.blackText,
        marginTop: 24,
        marginBottom: 16,
    },
});