import * as ImagePicker from 'expo-image-picker'
import { useState } from 'react'
import {
  Alert, Image, ScrollView, StyleSheet,
  Switch, Text, TextInput, TouchableOpacity, View
} from 'react-native'
import { BtnPrimary } from '../components/UI'
import { uploadImagem } from '../config/supabase'
import { Colors } from '../config/theme'
import { useEscola } from '../hooks/useEscola'

const PALETTE    = ['#00C853','#FF6D00','#2979FF','#D500F9','#FF1744','#00BFA5','#FFD600','#795548']
const PIX_TIPOS  = ['Celular','CPF','E-mail','CNPJ','Aleatória']
const NOTIF_DIAS = [1, 2, 3, 5, 7]

export function ConfigScreen() {
  const { escola, updateEscola } = useEscola()

  const [nome, setNome]           = useState(escola.nome)
  const [treinador, setTreinador] = useState(escola.treinador)
  const [pixChave, setPixChave]   = useState(escola.pixChave)
  const [pixTipo, setPixTipo]     = useState(escola.pixTipo)
  const [notifOn, setNotifOn]     = useState(escola.notifDias > 0)
  const [notifDias, setNotifDias] = useState(escola.notifDias || 3)
  const [saving, setSaving]       = useState(false)

  async function salvarInfos() {
    setSaving(true)
    await updateEscola({ nome, treinador })
    setSaving(false)
    Alert.alert('✅ Salvo!', 'Informações atualizadas.')
  }

  async function salvarPix() {
    await updateEscola({ pixChave, pixTipo })
    Alert.alert('✅ Salvo!', 'Chave Pix atualizada.')
  }

  async function salvarNotif() {
    await updateEscola({ notifDias: notifOn ? notifDias : 0 })
    Alert.alert('✅ Salvo!', 'Configurações salvas.')
  }

  async function pickLogo() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permissão negada', 'Precisamos acessar a galeria.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8
    })
    if (result.canceled) return
    try {
      const fileName = `escola_logo_${Date.now()}.jpg`
      const url = await uploadImagem(result.assets[0].uri, fileName)
      if (!url) {
        Alert.alert('Erro', 'Falha no upload da logo.')
        return
      }
      await updateEscola({ logoUrl: url })
      Alert.alert('✅ Logo atualizada!')
    } catch (e) {
      Alert.alert('Erro', e.message)
    }
  }

  async function setColor(cor) {
    await updateEscola({ cor })
    Alert.alert('✅ Cor aplicada!')
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.pageTitle}>⚙️ Personalização</Text>

      {/* LOGO */}
      <View style={styles.section}>
        <Text style={styles.secTitle}>Logo da Escola</Text>
        <TouchableOpacity style={styles.logoArea} onPress={pickLogo}>
          <View style={styles.logoCircle}>
            {escola.logoUrl
              ? <Image source={{ uri: escola.logoUrl }} style={{ width: 80, height: 80 }} onError={() => {}} />
              : <Text style={{ fontSize: 36 }}>🏟️</Text>
            }
          </View>
          <Text style={styles.logoHint}>
            Toque para {escola.logoUrl ? 'trocar' : 'adicionar'} a logo
          </Text>
        </TouchableOpacity>
      </View>

      {/* INFORMAÇÕES */}
      <View style={styles.section}>
        <Text style={styles.secTitle}>Informações da Escola</Text>
        <Text style={styles.label}>Nome da Escola</Text>
        <TextInput
          style={styles.input}
          value={nome}
          onChangeText={setNome}
          placeholder="Nome da escola"
          placeholderTextColor={Colors.muted}
        />
        <Text style={styles.label}>Nome do Treinador</Text>
        <TextInput
          style={styles.input}
          value={treinador}
          onChangeText={setTreinador}
          placeholder="Prof. Nome"
          placeholderTextColor={Colors.muted}
        />
        <BtnPrimary
          label="SALVAR INFORMAÇÕES"
          onPress={salvarInfos}
          loading={saving}
          style={{ marginTop: 4 }}
        />
      </View>

      {/* CORES */}
      <View style={styles.section}>
        <Text style={styles.secTitle}>Cor Principal</Text>
        <View style={styles.colorGrid}>
          {PALETTE.map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.swatch, { backgroundColor: c }, escola.cor === c && styles.swatchSelected]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>
      </View>

      {/* PIX */}
      <View style={styles.section}>
        <Text style={styles.secTitle}>Chave Pix</Text>
        <Text style={styles.label}>Tipo</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {PIX_TIPOS.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, pixTipo === t && styles.chipActive]}
                onPress={() => setPixTipo(t)}
              >
                <Text style={[styles.chipText, pixTipo === t && { color: Colors.green }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <Text style={styles.label}>Chave</Text>
        <TextInput
          style={styles.input}
          value={pixChave}
          onChangeText={setPixChave}
          placeholder="Sua chave Pix"
          placeholderTextColor={Colors.muted}
        />
        <BtnPrimary label="SALVAR CHAVE PIX" onPress={salvarPix} style={{ marginTop: 4 }} />
      </View>

      {/* NOTIFICAÇÕES */}
      <View style={styles.section}>
        <Text style={styles.secTitle}>🔔 Alertas de Vencimento</Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Alertar antes do vencimento</Text>
          <Switch
            value={notifOn}
            onValueChange={setNotifOn}
            trackColor={{ false: Colors.card2, true: Colors.green }}
            thumbColor={notifOn ? '#000' : Colors.muted}
          />
        </View>
        {notifOn && (
          <>
            <Text style={styles.label}>Quantos dias antes?</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {NOTIF_DIAS.map(d => (
                <TouchableOpacity
                  key={d}
                  style={[styles.chip, notifDias === d && styles.chipActive]}
                  onPress={() => setNotifDias(d)}
                >
                  <Text style={[styles.chipText, notifDias === d && { color: Colors.green }]}>
                    {d} dia{d !== 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
        <BtnPrimary label="SALVAR CONFIGURAÇÕES" onPress={salvarNotif} style={{ marginTop: 12 }} />
      </View>

      {/* LICENÇA */}
      <View style={[styles.section, { borderColor: 'rgba(255,214,0,0.3)' }]}>
        <Text style={styles.secTitle}>🔑 Licença do Sistema</Text>
        <Text style={styles.licText}>
          Para renovar ou verificar sua licença, entre em contato com o administrador.
        </Text>
        <TouchableOpacity style={styles.btnWhatsapp}>
          <Text style={styles.btnWaText}>💬 Falar com Suporte</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: Colors.bg },
  pageTitle:      { fontSize: 22, fontWeight: '900', color: Colors.white, textTransform: 'uppercase', letterSpacing: 2, padding: 16 },
  section:        { backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 16, marginHorizontal: 14, marginBottom: 12 },
  secTitle:       { fontSize: 15, fontWeight: '700', color: Colors.white, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },
  label:          { fontSize: 10, color: Colors.muted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 5, marginTop: 10 },
  input:          { backgroundColor: Colors.card2, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 13, color: Colors.text, fontSize: 14, marginBottom: 4 },
  logoArea:       { alignItems: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.border, borderRadius: 12, padding: 20 },
  logoCircle:     { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.card2, borderWidth: 3, borderColor: Colors.green, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 8 },
  logoHint:       { fontSize: 12, color: Colors.muted },
  colorGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  swatch:         { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: 'transparent' },
  swatchSelected: { borderColor: Colors.white, transform: [{ scale: 1.2 }] },
  chip:           { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card2 },
  chipActive:     { backgroundColor: 'rgba(0,200,83,0.15)', borderColor: Colors.green },
  chipText:       { fontSize: 12, color: Colors.muted, fontWeight: '600' },
  switchRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4, marginBottom: 8 },
  switchLabel:    { fontSize: 13, color: Colors.text },
  licText:        { fontSize: 13, color: Colors.muted, lineHeight: 20, marginBottom: 14 },
  btnWhatsapp:    { backgroundColor: '#25D366', borderRadius: 10, padding: 14, alignItems: 'center' },
  btnWaText:      { color: '#fff', fontWeight: '800', fontSize: 14 },
})
