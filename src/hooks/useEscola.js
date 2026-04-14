import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../config/supabase'

const EscolaContext = createContext({})

export function EscolaProvider({ children }) {
  const [escola, setEscolaState] = useState({
    id: null,
    nome: 'Escola de Futebol',
    treinador: 'Professor',
    pixChave: '',
    pixTipo: 'Celular',
    cor: '#00C853',
    logoUrl: null,
    notifDias: 3,
  })

  useEffect(() => {
    loadEscola()
  }, [])

  async function loadEscola() {
    try {
      const { data, error } = await supabase
        .from('escola')
        .select('*')
        .single()

      if (data && !error) {
        setEscolaState({
          id: data.id,
          nome: data.nome,
          treinador: data.treinador,
          pixChave: data.pix_chave,
          pixTipo: data.pix_tipo,
          cor: data.cor,
          logoUrl: data.logo_url,
          notifDias: data.notif_dias,
        })
      } else {
        const cached = await AsyncStorage.getItem('@escola')
        if (cached) setEscolaState(JSON.parse(cached))
      }
    } catch (e) {
      console.log('Erro ao carregar escola:', e)
    }
  }

  async function updateEscola(fields) {
    const updated = { ...escola, ...fields }
    setEscolaState(updated)
    await AsyncStorage.setItem('@escola', JSON.stringify(updated))

    if (escola.id) {
      await supabase.from('escola').update({
        nome: updated.nome,
        treinador: updated.treinador,
        pix_chave: updated.pixChave,
        pix_tipo: updated.pixTipo,
        cor: updated.cor,
        logo_url: updated.logoUrl,
        notif_dias: updated.notifDias,
      }).eq('id', escola.id)
    }
  }

  return (
    <EscolaContext.Provider value={{ escola, updateEscola, loadEscola }}>
      {children}
    </EscolaContext.Provider>
  )
}

export const useEscola = () => useContext(EscolaContext)