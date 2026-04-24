import { CameraView, useCameraPermissions } from 'expo-camera'
import { useState } from 'react'
import {
    Alert, Image, Modal, StyleSheet,
    Text, TouchableOpacity, View
} from 'react-native'
import { supabase } from '../config/supabase'
import { Colors } from '../config/theme'

export function ScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned]           = useState(false)
  const [loading, setLoading]           = useState(false)
  const [atleta, setAtleta]             = useState(null)
  const [modalVisible, setModalVisible] = useState(false)

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={{ color: Colors.muted }}>Carregando câmera...</Text>
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>
          Precisamos da câmera para escanear o QR Code
        </Text>
        <TouchableOpacity style={styles.btnPerm} onPress={requestPermission}>
          <Text style={styles.btnPermText}>PERMITIR CÂMERA</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnVoltar} onPress={() => navigation.goBack()}>
          <Text style={{ color: Colors.muted, fontSize: 13 }}>Voltar</Text>
        </TouchableOpacity>
      </View>
    )
  }

  async function handleBarCodeScanned({ data }) {
    if (scanned || loading) return
    setScanned(true)
    setLoading(true)
    try {
      const codigo = data.trim().toUpperCase()
      const { data: atletaData, error } = await supabase
        .from('atletas')
        .select('*')
        .eq('id', codigo)
        .single()

      if (error || !atletaData) {
        Alert.alert(
          '❌ Não encontrado',
          `Código "${codigo}" não encontrado no sistema.`,
          [{ text: 'OK', onPress: () => setScanned(false) }]
        )
      } else {
        // Igual ao AtletaDetalheScreen — garante mes_pago preenchido
        setAtleta({ ...atletaData, mes_pago: atletaData.mes_pago || '' })
        setModalVisible(true)
      }
    } catch (e) {
      Alert.alert('Erro', 'Sem conexão com o servidor.')
      setScanned(false)
    }
    setLoading(false)
  }

  function fecharModal() {
    setModalVisible(false)
    setAtleta(null)
    setScanned(false)
  }

  // Igual ao AtletaDetalheScreen
  const isPago  = (atleta?.status || '').trim().toLowerCase() === 'pago'
  const mesRef  = atleta?.mes_pago || '—'

  return (
    <View style={styles.root}>

      {/* CAMERA */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleBarCodeScanned}
      />

      {/* OVERLAY */}
      <View style={styles.overlay}>

        {/* TOPO */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.btnFechar} onPress={() => navigation.goBack()}>
            <Text style={styles.btnFecharText}>✕ Fechar</Text>
          </TouchableOpacity>
          <Text style={styles.titulo}>Scanner QR Code</Text>
        </View>

        {/* ÁREA DE SCAN */}
        <View style={styles.scanArea}>
          <View style={styles.scanBox}>
            <View style={[styles.canto, styles.cantoTopLeft]} />
            <View style={[styles.canto, styles.cantoTopRight]} />
            <View style={[styles.canto, styles.cantoBottomLeft]} />
            <View style={[styles.canto, styles.cantoBottomRight]} />
          </View>
          <Text style={styles.scanHint}>
            {loading ? 'Buscando atleta...' : 'Aponte para o QR Code do atleta'}
          </Text>
        </View>

        {/* RODAPÉ */}
        <View style={styles.bottomBar}>
          <Text style={styles.bottomText}>
            ⚽ Escaneie a carteira digital do atleta
          </Text>
        </View>
      </View>

      {/* MODAL RESULTADO */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={fecharModal}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>

            {/* FOTO */}
            <View style={styles.modalFotoWrap}>
              {atleta?.foto_url
                ? <Image source={{ uri: atleta.foto_url }} style={styles.modalFoto} />
                : <Text style={{ fontSize: 48 }}>⚽</Text>
              }
            </View>

            {/* NOME */}
            <Text style={styles.modalNome}>{atleta?.nome}</Text>
            <Text style={styles.modalCodigo}>
              {atleta?.id} · {atleta?.categoria}
            </Text>

            {/* STATUS — igual ao AtletaDetalheScreen */}
            <View style={[
              styles.modalStatus,
              isPago ? styles.modalStatusPago : styles.modalStatusPend
            ]}>
              <Text style={[
                styles.modalStatusText,
                { color: isPago ? Colors.green : Colors.red }
              ]}>
                {isPago ? '✅ MENSALIDADE PAGA' : '❌ MENSALIDADE PENDENTE'}
              </Text>
              <Text style={styles.modalStatusSub}>
                {isPago
                  ? `Referência: ${mesRef}`
                  : 'Aguardando pagamento · Vence dia 05'}
              </Text>
            </View>

            {/* INFO */}
            <View style={styles.modalInfo}>
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalInfoLbl}>Responsável</Text>
                <Text style={styles.modalInfoVal}>{atleta?.responsavel || '—'}</Text>
              </View>
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalInfoLbl}>Posição</Text>
                <Text style={styles.modalInfoVal}>{atleta?.posicao || '—'}</Text>
              </View>
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalInfoLbl}>Nascimento</Text>
                <Text style={styles.modalInfoVal}>{atleta?.nascimento || '—'}</Text>
              </View>
            </View>

            {/* BOTÕES */}
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.btnScanNovo} onPress={fecharModal}>
                <Text style={styles.btnScanNovoText}>📷 Escanear Outro</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnVoltar2}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.btnVoltar2Text}>Voltar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  root:               { flex: 1, backgroundColor: '#000' },
  center:             { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  permText:           { color: Colors.text, fontSize: 16, textAlign: 'center', marginBottom: 20 },
  btnPerm:            { backgroundColor: Colors.green, borderRadius: 12, padding: 16, width: '100%', alignItems: 'center', marginBottom: 10 },
  btnPermText:        { color: '#000', fontWeight: '800', fontSize: 15 },
  btnVoltar:          { padding: 12 },
  overlay:            { flex: 1, justifyContent: 'space-between' },
  topBar:             { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: 'rgba(0,0,0,0.6)' },
  btnFechar:          { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, marginRight: 12 },
  btnFecharText:      { color: '#fff', fontWeight: '700', fontSize: 14 },
  titulo:             { color: '#fff', fontSize: 18, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  scanArea:           { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scanBox:            { width: 250, height: 250, position: 'relative' },
  canto:              { position: 'absolute', width: 30, height: 30, borderColor: Colors.green, borderWidth: 3 },
  cantoTopLeft:       { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cantoTopRight:      { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cantoBottomLeft:    { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cantoBottomRight:   { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanHint:           { color: '#fff', marginTop: 20, fontSize: 14, textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  bottomBar:          { padding: 20, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center' },
  bottomText:         { color: Colors.muted, fontSize: 13 },
  modalBg:            { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalCard:          { backgroundColor: Colors.surf, borderRadius: 24, padding: 24, margin: 12, borderWidth: 1, borderColor: Colors.border },
  modalFotoWrap:      { width: 90, height: 90, borderRadius: 45, backgroundColor: Colors.card2, borderWidth: 3, borderColor: Colors.green, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 12 },
  modalFoto:          { width: 90, height: 90 },
  modalNome:          { fontSize: 22, fontWeight: '900', color: Colors.white, textAlign: 'center', textTransform: 'uppercase' },
  modalCodigo:        { fontSize: 12, color: Colors.green, textAlign: 'center', letterSpacing: 2, marginTop: 4, marginBottom: 14 },
  modalStatus:        { borderRadius: 12, padding: 14, borderWidth: 1, alignItems: 'center', marginBottom: 14 },
  modalStatusPago:    { backgroundColor: 'rgba(0,200,83,0.1)', borderColor: 'rgba(0,200,83,0.3)' },
  modalStatusPend:    { backgroundColor: 'rgba(255,23,68,0.1)', borderColor: 'rgba(255,23,68,0.3)' },
  modalStatusText:    { fontSize: 18, fontWeight: '700', textTransform: 'uppercase' },
  modalStatusSub:     { fontSize: 13, color: Colors.white, marginTop: 4, fontWeight: '600' },
  modalInfo:          { backgroundColor: Colors.card, borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  modalInfoRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalInfoLbl:       { fontSize: 12, color: Colors.muted, flex: 1 },
  modalInfoVal:       { fontSize: 12, color: Colors.text, fontWeight: '600', flex: 1, textAlign: 'right' },
  modalBtns:          { gap: 8 },
  btnScanNovo:        { backgroundColor: Colors.green, borderRadius: 12, padding: 14, alignItems: 'center' },
  btnScanNovoText:    { color: '#000', fontWeight: '800', fontSize: 15 },
  btnVoltar2:         { borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  btnVoltar2Text:     { color: Colors.muted, fontWeight: '600', fontSize: 13 },
})