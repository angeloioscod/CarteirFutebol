import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { readAsStringAsync } from 'expo-file-system/legacy'

const SUPABASE_URL = 'https://gzgflcqqbkqcfhaxqvnr.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6Z2ZsY3FxYmtxY2ZoYXhxdm5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NTU2MzEsImV4cCI6MjA5MTIzMTYzMX0.kGmLMGIPKgJ10sLI8pn-8HNHbHdPEz-eJ07_Gw6mkOc'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

export async function uploadImagem(uri, fileName) {
  try {
    console.log('Iniciando upload:', fileName)

    const base64String = await readAsStringAsync(uri, {
      encoding: 'base64',
    })

    console.log('Base64 OK, tamanho:', base64String.length)

    const binaryString = atob(base64String)
    const len   = binaryString.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    let pasta = 'fotos'
    if (fileName.startsWith('comp_'))   pasta = 'comprovantes'
    if (fileName.startsWith('escola_')) pasta = 'logos'

    const caminho = `${pasta}/${fileName}`

    const { error } = await supabase.storage
      .from('fotos-atletas')
      .upload(caminho, bytes, {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (error) {
      console.log('Erro storage:', error.message)
      return null
    }

    const { data: urlData } = supabase.storage
      .from('fotos-atletas')
      .getPublicUrl(caminho)

    console.log('Upload OK:', urlData.publicUrl)
    return urlData.publicUrl

  } catch (e) {
    console.log('Erro uploadImagem:', e.message)
    return null
  }
}