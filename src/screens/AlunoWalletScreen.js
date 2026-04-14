import { useEffect, useState } from 'react'
import {
  Dimensions,
  Image, Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { InfoRow } from '../components/UI'
import { supabase } from '../config/supabase'
import { Colors, Spacing } from '../config/theme'
import { useEscola } from '../hooks/useEscola'
import { getAge, getDaysUntil5 } from '../utils/helpers'

const { width, height } = Dimensions.get('window')

export function AlunoWalletScreen({ route, navigation }) {
  const { atleta: atletaInicial } = route.params
  const { escola }    = useEscola()
  const insets        = useSafeAreaInsets()
  const [atleta, setAtleta]       = useState(atletaInicial)
  const [presencas, setPresencas] = useState({})
  const [imgModal, setImgModal]   = useState(null)

  useEffect(() => { loadPresencas() }, [])

  async function loadPresencas() {
    const { data } = await supabase
      .from('presencas')
      .select('data, status')
      .eq('atleta_id', atleta.id)
    if (data) {
      const map = {}
      data.forEach(p => { map[p.data] = p.status })
      setPresencas(map)
    }
  }

  const isPago   = atleta.status === 'pago'
  const daysLeft = getDaysUntil5()
  const showWarn = !isPago && daysLeft <= escola.notifDias
  const vals     = Object.values(presencas)
  const total    = vals.length
  const presente = vals.filter(v => v === 'presente').length
  const pct      = total > 0 ? Math.round(presente / total * 100) : 100

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.surf} />

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={styles.logoIcon}>
            {escola.logoUrl
              ? <Image source={{ uri: escola.logoUrl }} style={{ width: 28, height: 28 }} />
              : <Text>⚽</Text>
            }
          </View>
          <Text style={styles.logoText} numberOfLines={1}>{escola.nome}</Text>
        </View>
        <TouchableOpacity
          style={styles.hdrBtn}
          onPress={() => navigation.replace('Login')}
        >
          <Text style={{ color: Colors.muted, fontSize: 12, fontWeight: '600' }}>Sair</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* AVISO VENCIMENTO */}
        {showWarn && (
          <View style={styles.warnBanner}>
            <Text style={{ fontSize: 22 }}>🔔</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.warnTitle}>
                Vence em {daysLeft} dia{daysLeft !== 1 ? 's' : ''}!
              </Text>
              <Text style={styles.warnSub}>
                Entre em contato com o professor.
              </Text>
            </View>
          </View>
        )}

        {/* CARTÃO DO ATLETA */}
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.photoWrap}>
              {atleta.foto_url
                ? <Image source={{ uri: atleta.foto_url }} style={styles.photo} />
                : <Text style={{ fontSize: 30 }}>⚽</Text>
              }
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.atletaNome} numberOfLines={2}>
                {atleta.nome}
              </Text>
              <Text style={styles.atletaCodigo}>{atleta.id}</Text>
              <Text style={styles.atletaMeta}>
                {atleta.categoria} · {atleta.posicao || '—'} · {getAge(atleta.nascimento)} anos
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLbl}>Nasc.</Text>
              <Text style={styles.statVal}>{atleta.nascimento}</Text>
            </View>
            <View style={[styles.statItem, styles.statBorder]}>
              <Text style={styles.statLbl}>Venc.</Text>
              <Text style={styles.statVal}>Dia 05</Text>
            </View>
            <View style={[styles.statItem, styles.statBorder]}>
              <Text style={styles.statLbl}>Presença</Text>
              <Text style={[styles.statVal, {
                color: pct >= 75 ? Colors.green : Colors.red
              }]}>{pct}%</Text>
            </View>
            <View style={[styles.statItem, styles.statBorder]}>
              <Text style={styles.statLbl}>Treinos</Text>
              <Text style={styles.statVal}>{presente}</Text>
            </View>
          </View>
        </View>

        {/* MENSALIDADE */}
        <View style={[styles.payBanner, isPago ? styles.payPago : styles.payPend]}>
          <Text style={{ fontSize: 32 }}>{isPago ? '✅' : '❌'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.payTitle, {
              color: isPago ? Colors.green : Colors.red
            }]}>
              {isPago ? 'MENSALIDADE PAGA' : 'MENSALIDADE PENDENTE'}
            </Text>
            <Text style={styles.paySub}>
              {isPago
                ? `Pago · Ref. ${atleta.mes_pago}`
                : 'Entre em contato com o professor'}
            </Text>
          </View>
        </View>

        {/* PIX */}
        <View style={styles.pixSection}>
          <Text style={styles.sectionTitle}>💳 PAGAMENTO VIA PIX</Text>
          <View style={styles.pixInfo}>
            <Text style={{ fontSize: 26 }}>💰</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.pixLbl}>{escola.pixTipo}</Text>
              <Text style={styles.pixKey} numberOfLines={1}>
                {escola.pixChave || 'Não configurado'}
              </Text>
              <Text style={styles.pixTrainer}>{escola.treinador}</Text>
            </View>
          </View>

          {/* COMPROVANTE */}
          {atleta.comprovante_url && (
            <View style={styles.compBox}>
              <TouchableOpacity
                onPress={() => setImgModal(atleta.comprovante_url)}
                activeOpacity={0.85}
              >
                <Image
                  source={{ uri: atleta.comprovante_url }}
                  style={styles.compImg}
                  resizeMode="cover"
                />
                <View style={styles.compOverlay}>
                  <Text style={styles.compOverlayTxt}>🔍 Toque para ampliar</Text>
                </View>
              </TouchableOpacity>
              <Text style={styles.compLabel}>Comprovante Pix ✅</Text>
            </View>
          )}
        </View>

        {/* QR CODE */}
        <View style={styles.qrSection}>
          <Text style={styles.sectionTitle}>QR CODE DE IDENTIFICAÇÃO</Text>
          <View style={styles.qrBox}>
            <QRCode
              value={atleta.id}
              size={148}
              color="#111111"
              backgroundColor="#ffffff"
            />
          </View>
          <Text style={styles.qrCode}>{atleta.id}</Text>
        </View>

        {/* INFORMAÇÕES */}
        <View style={{ paddingHorizontal: Spacing.md }}>
          <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>
            INFORMAÇÕES DO ATLETA
          </Text>
          <InfoRow label="Responsável" value={atleta.responsavel} />
          <InfoRow label="Telefone"    value={atleta.telefone} />
          <InfoRow label="Treinador"   value={escola.treinador} />
          <InfoRow label="Escola"      value={escola.nome} />
          <InfoRow label="Código"      value={atleta.id} valueColor={Colors.green} />
        </View>
      </ScrollView>

      {/* IMAGE VIEWER MODAL */}
      <Modal
        visible={!!imgModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setImgModal(null)}
      >
        <View style={styles.imgModalBg}>
          <TouchableOpacity
            style={styles.imgModalCloseBtn}
            onPress={() => setImgModal(null)}
            activeOpacity={0.8}
          >
            <Text style={styles.imgModalCloseTxt}>✕  Fechar</Text>
          </TouchableOpacity>
          {imgModal && (
            <Image
              source={{ uri: imgModal }}
              style={styles.imgModalImg}
              resizeMode="contain"
            />
          )}
          <Text style={styles.imgModalHint}>Toque em Fechar para voltar</Text>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: Colors.bg },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.surf, borderBottomWidth: 1, borderBottomColor: Colors.border },
  logoIcon:       { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.card2, borderWidth: 2, borderColor: Colors.green, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logoText:       { fontSize: 16, fontWeight: '900', color: Colors.white, textTransform: 'uppercase', maxWidth: 200 },
  hdrBtn:         { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  warnBanner:     { margin: 14, backgroundColor: 'rgba(255,214,0,0.1)', borderWidth: 1, borderColor: 'rgba(255,214,0,0.3)', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  warnTitle:      { fontSize: 13, fontWeight: '700', color: Colors.yellow },
  warnSub:        { fontSize: 12, color: Colors.muted, marginTop: 2 },
  card:           { margin: 14, backgroundColor: Colors.card, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  cardTop:        { padding: 18, paddingBottom: 0, flexDirection: 'row', alignItems: 'center', gap: 14 },
  photoWrap:      { width: 70, height: 70, borderRadius: 35, borderWidth: 3, borderColor: Colors.green, backgroundColor: Colors.card2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  photo:          { width: 70, height: 70 },
  atletaNome:     { fontSize: 19, fontWeight: '700', color: Colors.white, textTransform: 'uppercase', lineHeight: 22 },
  atletaCodigo:   { fontSize: 11, color: Colors.green, letterSpacing: 2, marginTop: 2, fontWeight: '600' },
  atletaMeta:     { fontSize: 11, color: Colors.muted, marginTop: 2 },
  divider:        { height: 1, backgroundColor: Colors.border, margin: 14 },
  statsRow:       { flexDirection: 'row', paddingHorizontal: 18, paddingBottom: 18 },
  statItem:       { flex: 1, alignItems: 'center' },
  statBorder:     { borderLeftWidth: 1, borderLeftColor: Colors.border },
  statLbl:        { fontSize: 9, color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  statVal:        { fontSize: 15, fontWeight: '700', color: Colors.white, marginTop: 2 },
  payBanner:      { marginHorizontal: 14, marginBottom: 14, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1 },
  payPago:        { backgroundColor: 'rgba(0,200,83,0.12)', borderColor: 'rgba(0,200,83,0.3)' },
  payPend:        { backgroundColor: 'rgba(255,23,68,0.12)', borderColor: 'rgba(255,23,68,0.3)' },
  payTitle:       { fontSize: 16, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  paySub:         { fontSize: 12, color: Colors.muted, marginTop: 2 },
  pixSection:     { marginHorizontal: 14, marginBottom: 14, backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16 },
  pixInfo:        { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.card2, borderRadius: 10, padding: 12 },
  pixLbl:         { fontSize: 10, color: Colors.muted, textTransform: 'uppercase', letterSpacing: 1 },
  pixKey:         { fontSize: 15, color: Colors.green, fontWeight: '700', marginTop: 2 },
  pixTrainer:     { fontSize: 11, color: Colors.muted, marginTop: 2 },
  compBox:        { marginTop: 12, borderRadius: 10, overflow: 'hidden' },
  compImg:        { width: '100%', height: 180, borderRadius: 10 },
  compOverlay:    { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.55)', padding: 8, alignItems: 'center' },
  compOverlayTxt: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  compLabel:      { fontSize: 11, color: Colors.green, textAlign: 'center', marginTop: 6, fontWeight: '600' },
  qrSection:      { marginHorizontal: 14, marginBottom: 14, backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 18, alignItems: 'center', gap: 12 },
  qrBox:          { backgroundColor: '#ffffff', padding: 12, borderRadius: 12 },
  qrCode:         { fontSize: 14, color: Colors.green, letterSpacing: 3, fontWeight: '700' },
  sectionTitle:   { fontSize: 10, color: Colors.muted, textTransform: 'uppercase', letterSpacing: 2 },
  imgModalBg:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.97)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  imgModalCloseBtn:{ position: 'absolute', top: 50, right: 20, backgroundColor: Colors.red, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 10, zIndex: 10 },
  imgModalCloseTxt:{ color: Colors.white, fontWeight: '800', fontSize: 14 },
  imgModalImg:    { width: width - 40, height: height * 0.65, borderRadius: 12 },
  imgModalHint:   { color: Colors.muted, marginTop: 16, fontSize: 12 },
})
