import { useEffect, useState } from 'react'
import {
  Alert,
  FlatList, Image, RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBadge } from '../components/UI'
import { supabase } from '../config/supabase'
import { Colors } from '../config/theme'
import { useEscola } from '../hooks/useEscola'
import { getDaysUntil5 } from '../utils/helpers'

export function ProfAtletasScreen({ navigation }) {
  const { escola } = useEscola()
  const insets = useSafeAreaInsets()
  const [atletas, setAtletas]       = useState([])
  const [busca, setBusca]           = useState('')
  const [filtro, setFiltro]         = useState('todos')
  const [catFiltro, setCatFiltro]   = useState('todas')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { loadAtletas() }, [])

  async function loadAtletas() {
    const { data } = await supabase
      .from('atletas').select('*').order('nome')
    if (data) setAtletas(data)
  }

  async function onRefresh() {
    setRefreshing(true)
    await loadAtletas()
    setRefreshing(false)
  }

  async function sair() {
    Alert.alert('Sair', 'Deseja sair do painel?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: async () => {
        await supabase.auth.signOut()
        navigation.replace('Login')
      }}
    ])
  }

  const daysLeft  = getDaysUntil5()
  const pendCount = atletas.filter(a => a.status === 'pendente').length
  const total     = atletas.length
  const pagos     = atletas.filter(a => a.status === 'pago').length
  const pend      = atletas.filter(a => a.status === 'pendente').length
  const taxa      = total > 0 ? Math.round(pagos / total * 100) : 0
  const cats      = [...new Set(atletas.map(a => a.categoria).filter(Boolean))]

  const lista = atletas.filter(a => {
    const matchBusca  = busca === '' ||
      a.nome.toLowerCase().includes(busca.toLowerCase()) ||
      a.id.toLowerCase().includes(busca.toLowerCase())
    const matchFiltro = filtro === 'todos' || a.status === filtro
    const matchCat    = catFiltro === 'todas' || a.categoria === catFiltro
    return matchBusca && matchFiltro && matchCat
  })

  function isAtivo(tipo, valor) {
    if (tipo === 'todos')  return filtro === 'todos' && catFiltro === 'todas'
    if (tipo === 'status') return filtro === valor && catFiltro === 'todas'
    if (tipo === 'cat')    return catFiltro === valor
    return false
  }

  function renderAthlete({ item: a }) {
    return (
      <TouchableOpacity
        style={styles.athItem}
        onPress={() => navigation.navigate('AtletaDetalhe', {
          atletaId: a.id, onVoltar: loadAtletas
        })}
        activeOpacity={0.8}
      >
        <View style={styles.photoSm}>
          {a.foto_url
            ? <Image source={{ uri: a.foto_url }} style={{ width: 46, height: 46 }} />
            : <Text style={{ fontSize: 22 }}>⚽</Text>
          }
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.athNome} numberOfLines={1}>{a.nome}</Text>
          <Text style={styles.athMeta}>{a.id} · {a.categoria} · {a.posicao || '—'}</Text>
        </View>
        <StatusBadge status={a.status} />
      </TouchableOpacity>
    )
  }

  const FILTROS = [
    { label: 'Todos',        tipo: 'todos',  valor: null },
    { label: '✅ Pagos',     tipo: 'status', valor: 'pago' },
    { label: '❌ Pendentes', tipo: 'status', valor: 'pendente' },
    ...cats.map(c => ({ label: c, tipo: 'cat', valor: c }))
  ]

  // Tudo que fica acima da lista vai dentro do ListHeaderComponent
  function ListHeader() {
    return (
      <View>
        {/* NOTIF */}
        {daysLeft <= escola.notifDias && (
          <View style={styles.notifBanner}>
            <Text style={{ fontSize: 18 }}>🔔</Text>
            <Text style={styles.notifText}>
              Vencimento em {daysLeft} dia{daysLeft !== 1 ? 's' : ''}!
              {' '}{pendCount} pendente{pendCount !== 1 ? 's' : ''}.
            </Text>
          </View>
        )}

        {/* STATS */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{total}</Text>
            <Text style={styles.statLbl}>Atletas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: Colors.green }]}>{pagos}</Text>
            <Text style={styles.statLbl}>Pagos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: Colors.red }]}>{pend}</Text>
            <Text style={styles.statLbl}>Pend.</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: '#2979FF' }]}>{taxa}%</Text>
            <Text style={styles.statLbl}>Taxa</Text>
          </View>
        </View>

        {/* ACTIONS */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, {
              borderColor: Colors.green,
              backgroundColor: 'rgba(0,200,83,0.08)'
            }]}
            onPress={() => navigation.navigate('CadastroAtleta', { onVoltar: loadAtletas })}
          >
            <Text style={{ fontSize: 20 }}>➕</Text>
            <Text style={[styles.actionLbl, { color: Colors.green }]}>Cadastrar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}
          onPress={() => navigation.navigate('Scanner')}>
            <Text style={{ fontSize: 20 }}>📷</Text>
            <Text style={styles.actionLbl}>Scanner</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={onRefresh}>
            <Text style={{ fontSize: 20 }}>🔄</Text>
            <Text style={styles.actionLbl}>Atualizar</Text>
          </TouchableOpacity>
        </View>

        {/* BUSCA */}
        <View style={{ paddingHorizontal: 14, paddingBottom: 10 }}>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍  Buscar por nome ou código..."
            placeholderTextColor={Colors.muted}
            value={busca}
            onChangeText={setBusca}
          />
        </View>

        {/* FILTROS */}
        <View style={styles.filtrosWrap}>
          {FILTROS.map((f, i) => {
            const ativo = isAtivo(f.tipo, f.valor)
            return (
              <TouchableOpacity
                key={i}
                style={[styles.chip, ativo && styles.chipActive]}
                onPress={() => {
                  if (f.tipo === 'todos')  { setFiltro('todos'); setCatFiltro('todas') }
                  if (f.tipo === 'status') { setFiltro(f.valor); setCatFiltro('todas') }
                  if (f.tipo === 'cat')    { setCatFiltro(f.valor); setFiltro('todos') }
                }}
              >
                <Text style={[styles.chipText, ativo && styles.chipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* TÍTULO DA SEÇÃO */}
        <View style={styles.secTitle}>
          <Text style={styles.secTitleText}>ATLETAS CADASTRADOS</Text>
          <Text style={{ color: Colors.green, fontSize: 12, fontWeight: '700' }}>
            {lista.length} atleta{lista.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.root}>

      {/* HEADER FIXO */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          ⚽ {escola.nome}
        </Text>
        <TouchableOpacity style={styles.sairBtn} onPress={sair}>
          <Text style={styles.sairTxt}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* LISTA COM HEADER EMBUTIDO */}
      <FlatList
        data={lista}
        keyExtractor={a => a.id}
        renderItem={renderAthlete}
        ListHeaderComponent={<ListHeader />}
        contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', padding: 30 }}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>🔍</Text>
            <Text style={{ color: Colors.muted, fontSize: 14 }}>Nenhum atleta encontrado</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.green}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: Colors.bg },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.surf, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle:   { fontSize: 15, fontWeight: '900', color: Colors.white, textTransform: 'uppercase', flex: 1 },
  sairBtn:       { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7, marginLeft: 8 },
  sairTxt:       { color: Colors.muted, fontSize: 12, fontWeight: '600' },
  notifBanner:   { marginHorizontal: 0, marginTop: 10, marginBottom: 0, backgroundColor: 'rgba(255,214,0,0.1)', borderWidth: 1, borderColor: 'rgba(255,214,0,0.3)', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  notifText:     { fontSize: 13, color: Colors.yellow, fontWeight: '600', flex: 1 },
  statsRow:      { flexDirection: 'row', gap: 8, paddingVertical: 14, paddingHorizontal: 0 },
  statCard:      { flex: 1, backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 12, alignItems: 'center' },
  statNum:       { fontSize: 24, fontWeight: '900', color: Colors.white },
  statLbl:       { fontSize: 9, color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 1 },
  actionRow:     { flexDirection: 'row', gap: 8, paddingBottom: 14 },
  actionBtn:     { flex: 1, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 13, alignItems: 'center' },
  actionLbl:     { fontSize: 11, color: Colors.muted, fontWeight: '600', marginTop: 3 },
  searchInput:   { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 11, color: Colors.text, fontSize: 13 },
  filtrosWrap:   { flexDirection: 'row', flexWrap: 'wrap', paddingBottom: 10, gap: 8 },
  chip:          { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.card },
  chipActive:    { backgroundColor: Colors.green, borderColor: Colors.green },
  chipText:      { fontSize: 12, color: Colors.text, fontWeight: '700' },
  chipTextActive:{ color: '#000', fontWeight: '800' },
  secTitle:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8 },
  secTitleText:  { fontSize: 10, color: Colors.muted, textTransform: 'uppercase', letterSpacing: 2 },
  athItem:       { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  photoSm:       { width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.card2, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  athNome:       { fontSize: 15, fontWeight: '700', color: Colors.white, textTransform: 'uppercase' },
  athMeta:       { fontSize: 11, color: Colors.muted, marginTop: 1 },
})
