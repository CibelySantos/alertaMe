import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://grqgsehkgnornqibknbu.supabase.co'
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdycWdzZWhrZ25vcm5xaWJrbmJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3OTQwMDcsImV4cCI6MjA3MTM3MDAwN30.mmUw1OyIxhSZvQVnPni9NV60ORX1rwEf5IuNTgfR_f8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/* ============================================================
   👤 AUTENTICAÇÃO
   ============================================================ */

export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser()
  return data.user
}

/* ============================================================
   👤 PERFIL DO USUÁRIO
   ============================================================ */

// garante que o perfil existe
export const ensureProfileExists = async (userId) => {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single()

  if (!data) {
    await supabase.from('profiles').insert([
      { id: userId, nome: '', telefone: '', cidade: '' }
    ])
  }
}

export const getUserProfile = async (userId) => {
  return await supabase.from('profiles').select('*').eq('id', userId).single()
}

export const updateUserProfile = async (userId, updates) => {
  return await supabase.from('profiles').update(updates).eq('id', userId)
}

/* ============================================================
   🚨 CONTATOS DE EMERGÊNCIA
   ============================================================ */

// pega todos os contatos do usuário
export const getContactsByUser = async (userId) => {
  const { data } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', userId)
    .order('id', { ascending: true })

  return data || []
}

// adiciona contato
export const addContactForUser = async (userId, contact) => {
  const payload = {
    user_id: userId,
    name: contact.name,
    phone: contact.phone,
    relation: contact.relation || '',
    email: contact.email || '',
  }

  return await supabase.from('contacts').insert([payload])
}

// editar contato (caso você use em outra tela)
export const updateContact = async (contactId, updates) => {
  return await supabase.from('contacts').update(updates).eq('id', contactId)
}

// deletar contato
export const deleteContact = async (contactId) => {
  return await supabase.from('contacts').delete().eq('id', contactId)
}
