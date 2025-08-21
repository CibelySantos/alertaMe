import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://grqgsehkgnornqibknbu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdycWdzZWhrZ25vcm5xaWJrbmJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3OTQwMDcsImV4cCI6MjA3MTM3MDAwN30.mmUw1OyIxhSZvQVnPni9NV60ORX1rwEf5IuNTgfR_f8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
