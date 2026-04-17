import * as ImagePicker from 'expo-image-picker'
import { useEffect, useState } from 'react'
import {
  Alert, Dimensions, Image, Modal, ScrollView,
  StyleSheet, Text, TouchableOpacity, View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { InfoRow } from '../components/UI'
import { supabase, uploadImagem } from '../config/supabase'
import { Colors } from '../config/theme'
import { fmtDate, getMonthRef } from '../utils/helpers'

const { width, height } = Dimensions.get('window')

export function AtletaDetalheScreen({ route, navigation }) {
  const { atletaId } = route.params
  const insets = useSafeAreaInsets()
  const [atleta, setAtleta]       = useState(null)
  const [presencas, setPresencas] = useState({})
  const [imgModal, setImgModal]   = useState(null)
  const [loading, setLoading]     = useState(false)

  useEffect(() => { loadAtleta(); loadPresencas() }, [])

  async function loadAtleta() {
    const { data, error } = await supabase
      .from('atletas').select('*').eq('id', atletaId).single()
    if (error) { console.log('Erro:', error); return }
    if (data) setAtleta({ ...data, mes_pago: data.mes_pago || '' })
  }

  async function loadPresencas() {
    const { data } = await supabase
      .from('presencas').select('data, status').eq('atleta_id', atletaId)
    if (data) {
      const map = {}
      data.forEach(p => { map[p.data] = p.status })
      setPresencas(map)
    }
  }

  async function togglePay() {
    const novo = atleta.status === 'pago' ? 'pendente' : 'pago'
    const updates = {
      status: novo,
      mes_pago: novo === 'pago' ? getMonthRef() : '',
      comprovante_url: novo === 'pendente' ? null : atleta.comprovante_url
    }
    await supabase.from('atletas').update(updates).eq('id', atletaId)
    setAtleta(prev => ({ ...prev, ...updates }))
    Alert.alert(
      novo === 'pago' ? '✅ Confirmado!' : '⚠️ Pendente',
      'Status atualizado.'
    )
  }

  async function uploadComprovante() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, quality: 0.7
    })
    if (result.canceled) return
    setLoading(true)
    try {
      const fileName = `comp_${atletaId}_${Date.now()}.jpg`
      const url = await uploadImagem(result.assets[0].uri, fileName)
      if (!url) { Alert.alert('Erro', 'Falha no upload.'); setLoading(false); return }
      await supabase.from('atletas').update({
        comprovante_url: url, status: 'pago', mes_pago: getMonthRef()
      }).eq('id', atletaId)
      setAtleta(prev => ({
        ...prev, comprovante_url: url, status: 'pago', mes_pago: getMonthRef()
      }))
      Alert.alert('✅ Sucesso!', 'Comprovante anexado!')
    } catch (e) { Alert.alert('Erro', e.message) }
    setLoading(false)
  }

  async function removerAtleta() {
    Alert.alert('Remover Atleta', `Deseja remover ${atleta.nome}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        await supabase.from('presencas').delete().eq('atleta_id', atletaId)
        await supabase.from('atletas').delete().eq('id', atletaId)
        navigation.goBack()
      }}
    ])
  }

  if (!atleta) return (
    <View style={styles.loadingBox}>
      <Text style={{ color: Colors.muted, fontSize: 14 }}>Carregando...</Text>
    </View>
  )

  const isPago   = (atleta.status || '').trim().toLowerCase() === 'pago'
  const mesRef   = atleta.mes_pago || '—'
  const presVals = Object.values(presencas)
  const total    = presVals.length
  const presente = presVals.filter(v => v === 'presente').length
  const pct      = total > 0 ? Math.round(presente / total * 100) : 100
  const dates    = Object.keys(presencas).sort().reverse()

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* TOPO */}
        <View style={styles.topCard}>
          <View style={styles.detPhoto}>
            {atleta.foto_url
              ? <Image source={{ uri: atleta.foto_url }} style={styles.detPhotoImg} />
              : <Text style={{ fontSize: 34 }}>⚽</Text>
            }
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.detNome}>{atleta.nome}</Text>
            <Text style={styles.detCode}>{atleta.id} · {atleta.categoria}</Text>
            <Text style={styles.detPos}>{atleta.posicao || 'Posição não definida'}</Text>
          </View>
        </View>

        {/* STATUS */}
        <View style={[styles.statusBox, isPago ? styles.statusPago : styles.statusPend]}>
          <Text style={[styles.statusTxt, { color: isPago ? Colors.green : Colors.red }]}>
            {isPago ? '✅ MENSALIDADE PAGA' : '❌ MENSALIDADE PENDENTE'}
          </Text>
          <Text style={styles.statusSub}>
            {isPago ? `Referência: ${mesRef}` : 'Aguardando pagamento · Vence dia 05'}
          </Text>
        </View>

        {/* INFO */}
        <View style={{ paddingHorizontal: 14 }}>
          <InfoRow label="Responsável" value={atleta.responsavel} />
          <InfoRow label="Telefone"    value={atleta.telefone} />
          <InfoRow label="Nascimento"  value={String(atleta.nascimento)} />
          <InfoRow label="Categoria"   value={atleta.categoria} />
          <InfoRow label="Posição"     value={atleta.posicao} />
          <InfoRow
            label="Presença"
            value={`${pct}% (${presente}/${total})`}
            valueColor={pct >= 75 ? Colors.green : Colors.red}
          />
        </View>

        {/* COMPROVANTE */}
        {atleta.comprovante_url && (
          <View style={styles.compSection}>
            <Text style={styles.compTitle}>📎 COMPROVANTE PIX</Text>
            <TouchableOpacity onPress={() => setImgModal(atleta.comprovante_url)} activeOpacity={0.9}>
              <Image source={{ uri: atleta.comprovante_url }} style={styles.compImg} resizeMode="cover" />
              <View style={styles.compOverlay}>
                <Text style={styles.compOverlayText}>🔍 Toque para ampliar</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* AÇÕES */}
        <View style={styles.actionsBox}>
          <TouchableOpacity
            style={[styles.actionBtn, {
              backgroundColor: isPago ? 'rgba(255,23,68,0.1)' : Colors.green,
              borderColor: isPago ? Colors.red : Colors.green
            }]}
            onPress={togglePay}
          >
            <Text style={[styles.actionBtnText, { color: isPago ? Colors.red : '#000' }]}>
              {isPago ? 'Marcar como Pendente' : '✅ Confirmar Pagamento'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: 'rgba(41,121,255,0.1)', borderColor: '#2979FF' }]}
            onPress={uploadComprovante}
          >
            <Text style={[styles.actionBtnText, { color: '#2979FF' }]}>
              {loading ? 'Enviando...' : atleta.comprovante_url ? '📎 Trocar Comprovante' : '📎 Anexar Comprovante Pix'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: 'rgba(255,214,0,0.1)', borderColor: Colors.yellow }]}
            onPress={() => navigation.navigate('CadastroAtleta', { atletaId, onVoltar: loadAtleta })}
          >
            <Text style={[styles.actionBtnText, { color: Colors.yellow }]}>✏️ Editar Dados do Atleta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: 'rgba(255,23,68,0.3)' }]}
            onPress={removerAtleta}
          >
            <Text style={[styles.actionBtnText, { color: Colors.red }]}>🗑️ Remover Atleta</Text>
          </TouchableOpacity>
        </View>

        {/* HISTÓRICO */}
        {dates.length > 0 && (
          <View style={{ paddingHorizontal: 14, marginTop: 8 }}>
            <Text style={styles.sectionTitle}>HISTÓRICO DE PRESENÇA</Text>
            {dates.slice(0, 10).map(d => (
              <View key={d} style={styles.presHistItem}>
                <Text style={styles.presHistDate}>{fmtDate(d)}</Text>
                <View style={[
                  styles.presHistBadge,
                  presencas[d] === 'presente' ? styles.phsPres :
                  presencas[d] === 'falta'    ? styles.phsFalt : styles.phsJust
                ]}>
                  <Text style={[styles.presHistTxt, {
                    color: presencas[d] === 'presente' ? Colors.green :
                           presencas[d] === 'falta'    ? Colors.red   : Colors.yellow
                  }]}>
                    {presencas[d] === 'presente' ? '✅ Presente' :
                     presencas[d] === 'falta'    ? '❌ Falta'    : '📝 Justificada'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* IMAGE VIEWER */}
      <Modal visible={!!imgModal} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setImgModal(null)}>
        <View style={styles.imgModalContainer}>
          <TouchableOpacity style={styles.imgModalClose} onPress={() => setImgModal(null)}>
            <Text style={styles.imgModalCloseTxt}>✕  Fechar</Text>
          </TouchableOpacity>
          {imgModal && (
            <Image source={{ uri: imgModal }} style={styles.imgModalImg} resizeMode="contain" />
          )}
          <Text style={styles.imgModalHint}>Toque em Fechar para voltar</Text>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  root:             { flex: 1, backgroundColor: Colors.bg },
  loadingBox:       { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  topCard:          { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  detPhoto:         { width: 76, height: 76, borderRadius: 38, backgroundColor: Colors.card2, borderWidth: 3, borderColor: Colors.green, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  detPhotoImg:      { width: 76, height: 76 },
  detNome:          { fontSize: 20, fontWeight: '700', color: Colors.white, textTransform: 'uppercase' },
  detCode:          { fontSize: 11, color: Colors.green, letterSpacing: 2, marginTop: 2 },
  detPos:           { fontSize: 12, color: Colors.muted, marginTop: 2 },
  statusBox:        { margin: 14, borderRadius: 12, padding: 14, borderWidth: 1, alignItems: 'center' },
  statusPago:       { backgroundColor: 'rgba(0,200,83,0.1)', borderColor: 'rgba(0,200,83,0.3)' },
  statusPend:       { backgroundColor: 'rgba(255,23,68,0.1)', borderColor: 'rgba(255,23,68,0.3)' },
  statusTxt:        { fontSize: 18, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  statusSub:        { fontSize: 13, color: Colors.white, marginTop: 4, fontWeight: '600' },
  compSection:      { marginHorizontal: 14, marginTop: 8, backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 14, overflow: 'hidden' },
  compTitle:        { fontSize: 10, color: Colors.muted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 },
  compImg:          { width: '100%', height: 180, borderRadius: 10 },
  compOverlay:      { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, alignItems: 'center' },
  compOverlayText:  { color: Colors.white, fontSize: 12, fontWeight: '700' },
  actionsBox:       { padding: 14, gap: 8 },
  actionBtn:        { borderRadius: 12, padding: 15, borderWidth: 1, alignItems: 'center' },
  actionBtnText:    { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  sectionTitle:     { fontSize: 10, color: Colors.muted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
  presHistItem:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.card, borderRadius: 8, padding: 10, marginBottom: 5, borderWidth: 1, borderColor: Colors.border },
  presHistDate:     { fontSize: 13, color: Colors.muted },
  presHistBadge:    { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  phsPres:          { backgroundColor: 'rgba(0,200,83,0.15)' },
  phsFalt:          { backgroundColor: 'rgba(255,23,68,0.15)' },
  phsJust:          { backgroundColor: 'rgba(255,214,0,0.15)' },
  presHistTxt:      { fontSize: 12, fontWeight: '700' },
  imgModalContainer:{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  imgModalClose:    { position: 'absolute', top: 50, right: 20, backgroundColor: Colors.red, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, zIndex: 10 },
  imgModalCloseTxt: { color: Colors.white, fontWeight: '800', fontSize: 14 },
  imgModalImg:      { width: width - 40, height: height * 0.7, borderRadius: 12 },
  imgModalHint:     { color: Colors.muted, marginTop: 16, fontSize: 12 },
})
