import AsyncStorage from '@react-native-async-storage/async-storage'
import { useEffect, useState } from 'react'
import { supabase } from '../config/supabase'

export function useLicenca(escolaId) {
  const [licenca, setLicenca] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (escolaId) checkLicenca(escolaId)
  }, [escolaId])

  async function checkLicenca(id) {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('licencas')
        .select('*')
        .eq('escola_id', id)
        .eq('ativa', true)
        .order('data_expiracao', { ascending: false })
        .limit(1)
        .single()

      if (error || !data) {
        setLicenca({
          ativa: false,
          motivo: 'Nenhuma licença encontrada. Entre em contato com o administrador.'
        })
      } else {
        const expira = new Date(data.data_expiracao)
        const agora  = new Date()
        const diasRestantes = Math.ceil((expira - agora) / (1000 * 60 * 60 * 24))

        if (agora > expira) {
          setLicenca({
            ativa: false,
            motivo: 'Sua licença expirou. Entre em contato com o administrador.',
            diasRestantes: 0
          })
        } else {
          setLicenca({
            ativa: true,
            expira,
            diasRestantes,
            observacao: data.observacao
          })
          await AsyncStorage.setItem('@licenca_cache', JSON.stringify({
            ativa: true,
            expira: expira.toISOString(),
            diasRestantes,
            cachedAt: agora.toISOString()
          }))
        }
      }
    } catch (e) {
      const cached = await AsyncStorage.getItem('@licenca_cache')
      if (cached) {
        const c = JSON.parse(cached)
        const cachedAt = new Date(c.cachedAt)
        const horas = (new Date() - cachedAt) / (1000 * 60 * 60)
        if (horas < 24 && c.ativa) {
          setLicenca({
            ativa: true,
            expira: new Date(c.expira),
            diasRestantes: c.diasRestantes,
            offline: true
          })
        } else {
          setLicenca({
            ativa: false,
            motivo: 'Sem conexão e licença expirada.'
          })
        }
      } else {
        setLicenca({
          ativa: false,
          motivo: 'Sem conexão para verificar licença.'
        })
      }
    }
    setLoading(false)
  }

  return { licenca, loading, checkLicenca }
}
