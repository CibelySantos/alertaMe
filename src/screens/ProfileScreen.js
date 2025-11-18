// src/screens/ProfileScreen.js
import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native'
import { FontAwesome5, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons'
import { supabase, getCurrentUser, ensureProfileExists, getContactsByUser, addContactForUser, updateContact, deleteContact } from '../../supabaseClient'

const COLORS = {
  primary: '#FF0000',
  background: '#F5F5F5',
  textSecondary: '#555555',
  white: '#FFFFFF',
  black: '#000000',
  inputBackground: '#EEEEEE',
  verified: '#DC2626',
}

export default function ProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [contacts, setContacts] = useState([])
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editData, setEditData] = useState({ nome: '', telefone: '', cidade: '' })

  const [addContactModalVisible, setAddContactModalVisible] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', phone: '', relation: '', email: '' })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const current = await getCurrentUser()
      if (!current) {
        // sem usuário autent => volta ao login
        navigation.replace('Login')
        return
      }
      setUser(current)

      // garante que profile exista
      await ensureProfileExists(current.id)

      // pega profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', current.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        console.warn('Erro ao buscar profile:', profileError)
      } else {
        setProfile(profileData || { nome: '', telefone: '', cidade: '', foto_url: null })
        setEditData({
          nome: profileData?.nome || '',
          telefone: profileData?.telefone || '',
          cidade: profileData?.cidade || '',
        })
      }

      // pega contatos
      const contactsData = await getContactsByUser(current.id)
      setContacts(contactsData || [])
    } catch (e) {
      console.error('Erro carregando perfil:', e)
      Alert.alert('Erro', 'Não foi possível carregar seu perfil.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signOut()
    if (error) Alert.alert('Erro ao sair', error.message)
    else navigation.replace('Login')
    setLoading(false)
  }

  const handleSaveEdit = async () => {
    if (!user) return
    setLoading(true)
    try {
      const payload = {
        nome: editData.nome,
        telefone: editData.telefone,
        cidade: editData.cidade,
      }
      const { error } = await supabase.from('profiles').update(payload).eq('id', user.id)
      if (error) throw error
      setProfile((p) => ({ ...p, ...payload }))
      setEditModalVisible(false)
      Alert.alert('Sucesso', 'Informações atualizadas com sucesso!')
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar os dados.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleExclude = () => {
    Alert.alert('Confirmação', 'Tem certeza que deseja excluir sua conta permanentemente?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            // remover dados do usuário do banco (profiles, contacts) e depois excluir auth
            await supabase.from('contacts').delete().eq('user_id', user.id)
            await supabase.from('profiles').delete().eq('id', user.id)
            await supabase.auth.admin.deleteUser(user.id) // OBS: require service role key (pode falhar se não tiver)
            Alert.alert('Conta excluída')
            navigation.replace('Login')
          } catch (e) {
            Alert.alert('Erro', 'Não foi possível excluir a conta automaticamente.')
            console.error(e)
          }
        },
      },
    ])
  }

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.phone) {
      Alert.alert('Preencha nome e telefone')
      return
    }
    setLoading(true)
    try {
      await addContactForUser(user.id, newContact)
      const updated = await getContactsByUser(user.id)
      setContacts(updated)
      setAddContactModalVisible(false)
      setNewContact({ name: '', phone: '', relation: '', email: '' })
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível adicionar contato.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteContact = async (contactId) => {
    Alert.alert('Remover contato', 'Confirma remover este contato?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteContact(contactId)
            setContacts((c) => c.filter((it) => it.id !== contactId))
          } catch (e) {
            Alert.alert('Erro', 'Não foi possível remover o contato.')
            console.error(e)
          }
        },
      },
    ])
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.navHeader}>
        <View style={styles.navLinksLeft}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
            <Ionicons name="home-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.navText}>Página Inicial</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Post')}>
            <Ionicons name="location-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.navText}>Lugares</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navItem, styles.navItemSelected]}>
            <Ionicons name="person" size={18} color={COLORS.white} />
            <Text style={[styles.navText, { color: COLORS.white }]}>Perfil</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.navItem} onPress={handleLogout} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.textSecondary} style={{ marginRight: 4 }} />
          ) : (
            <Ionicons name="log-out-outline" size={18} color={COLORS.textSecondary} />
          )}
          <Text style={styles.navText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scrollView}>
        <View style={styles.mainTitleContainer}>
          <Text style={styles.mainTitle}>Meu perfil</Text>
          <Text style={styles.mainSubtitle}>Gerencie suas informações pessoais e de segurança</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <FontAwesome5 name="headset" size={40} color={COLORS.white} />
            </View>

            <View style={styles.profileText}>
              <Text style={styles.profileName}>{profile?.nome || user?.email}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <View style={styles.verifiedTag}>
                <Text style={styles.verifiedText}>Conta verificada</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.editButton} onPress={() => setEditModalVisible(true)}>
              <FontAwesome5 name="edit" size={18} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.card, styles.sectionMargin]}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="person" size={18} color={COLORS.primary} /> Informações pessoais
          </Text>
          <View style={styles.infoFieldContainer}><Text style={styles.infoFieldTitle}>Nome completo</Text><View style={styles.infoFieldValueBox}><Text style={styles.infoFieldValueText}>{profile?.nome || '-'}</Text></View></View>
          <View style={styles.infoFieldContainer}><Text style={styles.infoFieldTitle}>Telefone</Text><View style={styles.infoFieldValueBox}><Text style={styles.infoFieldValueText}>{profile?.telefone || '-'}</Text></View></View>
          <View style={styles.infoFieldContainer}><Text style={styles.infoFieldTitle}>Endereço</Text><View style={styles.infoFieldValueBox}><Text style={styles.infoFieldValueText}>{profile?.cidade || '-'}</Text></View></View>
        </View>

        <View style={[styles.card, styles.sectionMargin]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.sectionTitle}><MaterialCommunityIcons name="shield-account" size={18} color={COLORS.primary} /> Contatos de Emergência</Text>
            <TouchableOpacity onPress={() => setAddContactModalVisible(true)}><Text style={{ color: COLORS.primary, fontWeight: '700' }}>+ adicionar</Text></TouchableOpacity>
          </View>

          {contacts.length === 0 ? (
            <Text style={{ color: COLORS.textSecondary, marginTop: 8 }}>Nenhum contato adicionado.</Text>
          ) : (
            contacts.map((c) => (
              <View key={c.id} style={styles.contactCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={styles.contactName}>{c.name} {c.relation ? `(${c.relation})` : ''}</Text>
                    <Text style={styles.contactPhone}>{c.phone}</Text>
                    {c.email ? <Text style={{ color: COLORS.textSecondary }}>{c.email}</Text> : null}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity onPress={() => navigation.navigate('EditarContato', { contact: c })}>
                      <Text style={{ color: COLORS.primary }}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteContact(c.id)}>
                      <Text style={{ color: '#cc0000' }}>Remover</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal editar perfil */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Perfil</Text>

            <Text style={styles.label}>Nome completo</Text>
            <TextInput style={styles.input} value={editData.nome} onChangeText={(t) => setEditData({ ...editData, nome: t })} />

            <Text style={styles.label}>Telefone</Text>
            <TextInput style={styles.input} value={editData.telefone} onChangeText={(t) => setEditData({ ...editData, telefone: t })} keyboardType="phone-pad" />

            <Text style={styles.label}>Cidade</Text>
            <TextInput style={styles.input} value={editData.cidade} onChangeText={(t) => setEditData({ ...editData, cidade: t })} />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: COLORS.primary }]} onPress={handleSaveEdit}><Text style={styles.modalButtonText}>Salvar</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#999' }]} onPress={() => setEditModalVisible(false)}><Text style={styles.modalButtonText}>Cancelar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal adicionar contato */}
      <Modal visible={addContactModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Adicionar Contato</Text>

            <Text style={styles.label}>Nome</Text>
            <TextInput style={styles.input} value={newContact.name} onChangeText={(t) => setNewContact({ ...newContact, name: t })} />

            <Text style={styles.label}>Telefone</Text>
            <TextInput style={styles.input} value={newContact.phone} onChangeText={(t) => setNewContact({ ...newContact, phone: t })} keyboardType="phone-pad" />

            <Text style={styles.label}>Relacionamento</Text>
            <TextInput style={styles.input} value={newContact.relation} onChangeText={(t) => setNewContact({ ...newContact, relation: t })} />

            <Text style={styles.label}>Email (opcional)</Text>
            <TextInput style={styles.input} value={newContact.email} onChangeText={(t) => setNewContact({ ...newContact, email: t })} keyboardType="email-address" />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: COLORS.primary }]} onPress={handleAddContact}><Text style={styles.modalButtonText}>Adicionar</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#999' }]} onPress={() => setAddContactModalVisible(false)}><Text style={styles.modalButtonText}>Cancelar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

/* styles - copie os estilos originais e adicione se necessário (mantive os seus) */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 15, paddingBottom: 20, alignItems: 'center' },
  navHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.white, paddingVertical: 10, paddingTop: 35, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#EEE'
  },
  navLinksLeft: { flexDirection: 'row' },
  navItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 4, marginRight: 10 },
  navText: { fontSize: 12, color: COLORS.textSecondary, marginLeft: 3 },
  navItemSelected: { backgroundColor: COLORS.primary },
  editButton: { position: 'absolute', top: 10, right: 10, backgroundColor: COLORS.primary, padding: 8, borderRadius: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3 },
  mainTitleContainer: { paddingVertical: 20, width: '100%', alignItems: 'center' },
  mainTitle: { fontSize: 24, fontWeight: '800', color: COLORS.black, marginBottom: 5 },
  mainSubtitle: { fontSize: 13, color: COLORS.textSecondary },
  card: { backgroundColor: COLORS.white, borderRadius: 10, padding: 20, width: '100%', shadowColor: COLORS.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  sectionMargin: { marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.black, marginBottom: 15 },
  profileHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.textSecondary, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  profileText: { justifyContent: 'center' },
  profileName: { fontSize: 20, fontWeight: '700', color: COLORS.black },
  profileEmail: { fontSize: 14, color: COLORS.primary, fontWeight: '500', marginTop: 2 },
  verifiedTag: { backgroundColor: COLORS.verified, borderRadius: 5, paddingHorizontal: 8, paddingVertical: 2, marginTop: 5, alignSelf: 'flex-start' },
  verifiedText: { color: COLORS.white, fontSize: 11, fontWeight: 'bold' },
  infoFieldContainer: { marginBottom: 15 },
  infoFieldTitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 5 },
  infoFieldValueBox: { backgroundColor: COLORS.inputBackground, borderRadius: 8, padding: 12 },
  infoFieldValueText: { fontSize: 16, color: COLORS.black, fontWeight: '500' },
  contactCard: { backgroundColor: COLORS.inputBackground, borderRadius: 8, padding: 12, marginBottom: 10 },
  contactName: { fontSize: 16, fontWeight: '700', color: COLORS.black },
  contactPhone: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  dangerZoneContainer: { backgroundColor: COLORS.white, borderRadius: 10, borderWidth: 2, borderColor: COLORS.primary, padding: 20, width: '100%', marginTop: 25 },
  dangerZoneHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  dangerZoneTitle: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginLeft: 5 },
  dangerZoneText: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 15, lineHeight: 20 },
  excludeButton: { backgroundColor: COLORS.primary, padding: 12, borderRadius: 10 },
  excludeButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: COLORS.white, borderRadius: 10, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.black, marginBottom: 15 },
  label: { fontSize: 14, color: COLORS.black, marginBottom: 5, marginTop: 10 },
  input: { backgroundColor: COLORS.inputBackground, borderRadius: 8, padding: 10, color: COLORS.black },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  modalButton: { flex: 1, padding: 12, borderRadius: 10, marginHorizontal: 5 },
  modalButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
})
