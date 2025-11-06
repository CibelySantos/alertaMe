import { createClient } from '@supabase/supabase-js'

// 🔑 Suas credenciais do Supabase
export const SUPABASE_URL = 'https://grqgsehkgnornqibknbu.supabase.co'
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdycWdzZWhrZ25vcm5xaWJrbmJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3OTQwMDcsImV4cCI6MjA3MTM3MDAwN30.mmUw1OyIxhSZvQVnPni9NV60ORX1rwEf5IuNTgfR_f8'

// 🚀 Criação do client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
