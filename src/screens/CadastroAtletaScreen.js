import * as ImagePicker from 'expo-image-picker'
import { useEffect, useState } from 'react'
import {
  Alert, Image, Keyboard, KeyboardAvoidingView,
  Platform, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, TouchableWithoutFeedback, View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BtnPrimary } from '../components/UI'
import { supabase, uploadImagem } from '../config/supabase'
import { Colors } from '../config/theme'
import { genAtletaId, getMonthRef, isDue } from '../utils/helpers'

const CATEGORIAS = ['Sub-07','Sub-09','Sub-11','Sub-13','Sub-15','Sub-17','Sub-20']
const POSICOES   = ['Goleiro','Lateral','Zagueiro','Volante','Meia','Atacante']

export function CadastroAtletaScreen({ route, navigation }) {
  const { atletaId, onVoltar } = route.params || {}
  const isEdicao = !!atletaId
  const insets   = useSafeAreaInsets()

  const [nome, setNome]       = useState('')
  const [nasc, setNasc]       = useState('')
  const [cat, setCat]         = useState('Sub-13')
  const [tel, setTel]         = useState('')
  const [resp, setResp]       = useState('')
  const [pos, setPos]         = useState('')
  const [fotoUri, setFotoUri] = useState(null)
  const [fotoUrl, setFotoUrl] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isEdicao) loadAtleta()
  }, [])

  async function loadAtleta() {
    const { data } = await supabase
      .from('atletas').select('*').eq('id', atletaId).single()
    if (data) {
      setNome(data.nome || '')
      setNasc(String(data.nascimento || ''))
      setCat(data.categoria || 'Sub-13')
      setTel(data.telefone || '')
      setResp(data.responsavel || '')
      setPos(data.posicao || '')
      setFotoUrl(data.foto_url || null)
    }
  }

  async function pickFoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permissão negada', 'Precisamos acessar a galeria.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7
    })
    if (!result.canceled) setFotoUri(result.assets[0].uri)
  }

  async function tirarFoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permissão negada', 'Precisamos acessar a câmera.')
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7
    })
    if (!result.canceled) setFotoUri(result.assets[0].uri)
  }

  async function uploadFoto(id) {
    if (!fotoUri) return fotoUrl
    const fileName = `foto_${id}_${Date.now()}.jpg`
    const url = await uploadImagem(fotoUri, fileName)
    return url || fotoUrl
  }

  async function salvar() {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'Digite o nome do atleta.')
      return
    }
    setLoading(true)
    try {
      if (isEdicao) {
        const novaFotoUrl = await uploadFoto(atletaId)
        await supabase.from('atletas').update({
          nome:        nome.trim(),
          nascimento:  parseInt(nasc) || 2010,
          categoria:   cat,
          telefone:    tel.trim(),
          responsavel: resp.trim(),
          posicao:     pos,
          foto_url:    novaFotoUrl,
        }).eq('id', atletaId)
        Alert.alert('✅ Atualizado!', 'Dados salvos com sucesso.')
        onVoltar?.()
        navigation.goBack()
      } else {
        const { data: todosIds } = await supabase .from('atletas').select('id')
        let proximoNum = 1
        if (todosIds && todosIds.length > 0) { const nums = todosIds.map(a => {
          const partes = a.id.split('-')
          return parseInt(partes[partes.length - 1]) || 0
          })
          proximoNum = Math.max(...nums) + 1
          }
          const id = genAtletaId(proximoNum)
        const novaFotoUrl = await uploadFoto(id)
        const status      = isDue() ? 'pendente' : 'pago'
        await supabase.from('atletas').insert({
          id,
          nome:        nome.trim(),
          nascimento:  parseInt(nasc) || 2010,
          categoria:   cat,
          telefone:    tel.trim(),
          responsavel: resp.trim(),
          posicao:     pos,
          foto_url:    novaFotoUrl,
          status,
          mes_pago:    status === 'pago' ? getMonthRef() : '',
        })
        Alert.alert('✅ Cadastrado!', `Código: ${id}`)
        onVoltar?.()
        navigation.goBack()
      }
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar: ' + e.message)
    }
    setLoading(false)
  }

  const fotoDisplay = fotoUri || fotoUrl

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.fotoArea}>
            <View style={styles.fotoCircle}>
              {fotoDisplay
                ? <Image source={{ uri: fotoDisplay }} style={styles.fotoImg} />
                : <Text style={{ fontSize: 44 }}>📸</Text>
              }
            </View>
            <View style={styles.fotoBtnsRow}>
              <TouchableOpacity style={styles.fotoBtn} onPress={pickFoto}>
                <Text style={styles.fotoBtnText}>📁 Galeria</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.fotoBtn} onPress={tirarFoto}>
                <Text style={styles.fotoBtnText}>📷 Câmera</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Field label="Nome Completo *" value={nome} onChangeText={setNome} placeholder="Nome do atleta" />
          <Field label="Ano de Nascimento" value={nasc} onChangeText={setNasc} placeholder="2010" keyboardType="number-pad" maxLength={4} />
          <Field label="Telefone do Responsável" value={tel} onChangeText={setTel} placeholder="(00) 00000-0000" keyboardType="phone-pad" />
          <Field label="Nome do Responsável" value={resp} onChangeText={setResp} placeholder="Pai / mãe / responsável" />

          <Text style={styles.label}>Categoria</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16 }}>
              {CATEGORIAS.map(c => (
                <TouchableOpacity key={c} style={[styles.chip, cat === c && styles.chipActive]} onPress={() => setCat(c)}>
                  <Text style={[styles.chipText, cat === c && { color: Colors.green }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Text style={styles.label}>Posição</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16 }}>
              {POSICOES.map(p => (
                <TouchableOpacity key={p} style={[styles.chip, pos === p && styles.chipActive]} onPress={() => setPos(pos === p ? '' : p)}>
                  <Text style={[styles.chipText, pos === p && { color: Colors.green }]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={{ paddingHorizontal: 16 }}>
            <BtnPrimary
              label={isEdicao ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR ATLETA'}
              onPress={salvar}
              loading={loading}
            />
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  )
}

function Field({ label, value, onChangeText, placeholder, keyboardType, maxLength }) {
  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.muted}
        keyboardType={keyboardType}
        maxLength={maxLength}
        returnKeyType="next"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  scroll:       { paddingTop: 10 },
  fotoArea:     { alignItems: 'center', paddingVertical: 20 },
  fotoCircle:   { width: 110, height: 110, borderRadius: 55, backgroundColor: Colors.card2, borderWidth: 3, borderColor: Colors.green, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 12 },
  fotoImg:      { width: 110, height: 110, borderRadius: 55 },
  fotoBtnsRow:  { flexDirection: 'row', gap: 10 },
  fotoBtn:      { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10 },
  fotoBtnText:  { fontSize: 13, color: Colors.green, fontWeight: '700' },
  label:        { fontSize: 10, color: Colors.muted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 5, paddingHorizontal: 16 },
  input:        { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 14, color: Colors.text, fontSize: 14 },
  chip:         { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card },
  chipActive:   { backgroundColor: 'rgba(0,200,83,0.15)', borderColor: Colors.green },
  chipText:     { fontSize: 12, color: Colors.muted, fontWeight: '600' },
  });