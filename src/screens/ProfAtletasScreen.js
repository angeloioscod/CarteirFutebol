import { useEffect, useState } from 'react'
import {
  Alert,
  FlatList, Image, RefreshControl,
  ScrollView, StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { EmptyState, SectionTitle, StatusBadge } from '../components/UI'
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
    const { data, error } = await supabase
      .from('atletas')
      .select('*')
      .order('nome')
    if (data) setAtletas(data)
    if (error) console.log('Erro:', error)
  }

  async function onRefresh() {
    setRefreshing(true)
    await loadAtletas()
    setRefreshing(false)
  }

  async function sair() {
    Alert.alert('Sair', 'Deseja sair do painel?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair', style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut()
          navigation.replace('Login')
        }
      }
    ])
  }

  const daysLeft  = getDaysUntil5()
  const pendCount = atletas.filter(a => a.status === 'pendente').length
  const total     = atletas.length
  const pagos     = atletas.filter(a => a.status === 'pago').length
  const pend      = atletas.filter(a => a.status === 'pendente').length
  const taxa      = total > 0 ? Math.round(pagos / total * 100) : 0

  // Pega categorias únicas
  const cats = [...new Set(atletas.map(a => a.categoria).filter(Boolean))]

  // Filtra lista corretamente
  const lista = atletas.filter(a => {
    const matchBusca = busca === '' ||
      a.nome.toLowerCase().includes(busca.toLowerCase()) ||
      a.id.toLowerCase().includes(busca.toLowerCase())
    const matchFiltro = filtro === 'todos' || a.status === filtro
    const matchCat    = catFiltro === 'todas' || a.categoria === catFiltro
    return matchBusca && matchFiltro && matchCat
  })

  function setFiltroStatus(f) {
    setFiltro(f)
    setCatFiltro('todas')
  }

  function setFiltroCat(c) {
    setCatFiltro(c)
    setFiltro('todos')
  }

  function renderAthlete({ item: a }) {
    return (
      <TouchableOpacity
        style={styles.athItem}
        onPress={() => navigation.navigate('AtletaDetalhe', {
          atletaId: a.id,
          onVoltar: loadAtletas
        })}
        activeOpacity={0.8}
      >
        <View style={styles.photoSm}>
          {a.foto_url
            ? <Image
                source={{ uri: a.foto_url }}
                style={{ width: 46, height: 46 }}
                onError={() => {}}
              />
            : <Text style={{ fontSize: 22 }}>⚽</Text>
          }
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.athNome} numberOfLines={1}>{a.nome}</Text>
          <Text style={styles.athMeta}>
            {a.id} · {a.categoria} · {a.posicao || '—'}
          </Text>
        </View>
        <StatusBadge status={a.status} />
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.root}>

      {/* HEADER COM BOTÃO SAIR */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>⚽ {escola.nome}</Text>
        <TouchableOpacity style={styles.sairBtn} onPress={sair}>
          <Text style={styles.sairTxt}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* NOTIF BANNER */}
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
          <Text style={[styles.statNum, { color: Colors.blue }]}>{taxa}%</Text>
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

      {/* FILTROS STATUS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        <TouchableOpacity
          style={[styles.chip, filtro === 'todos' && catFiltro === 'todas' && styles.chipActive]}
          onPress={() => { setFiltro('todos'); setCatFiltro('todas') }}
        >
          <Text style={[styles.chipText, filtro === 'todos' && catFiltro === 'todas' && { color: Colors.green }]}>
            Todos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, filtro === 'pago' && styles.chipActive]}
          onPress={() => setFiltroStatus('pago')}
        >
          <Text style={[styles.chipText, filtro === 'pago' && { color: Colors.green }]}>
            ✅ Pagos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, filtro === 'pendente' && styles.chipActive]}
          onPress={() => setFiltroStatus('pendente')}
        >
          <Text style={[styles.chipText, filtro === 'pendente' && { color: Colors.green }]}>
            ❌ Pendentes
          </Text>
        </TouchableOpacity>

        {cats.map(c => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, catFiltro === c && styles.chipActive]}
            onPress={() => setFiltroCat(c)}
          >
            <Text style={[styles.chipText, catFiltro === c && { color: Colors.green }]}>
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <SectionTitle
        title="Atletas Cadastrados"
        right={`${lista.length} atleta${lista.length !== 1 ? 's' : ''}`}
      />

      <FlatList
        data={lista}
        keyExtractor={a => a.id}
        renderItem={renderAthlete}
        contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 20 }}
        ListEmptyComponent={
          <EmptyState icon="🔍" text="Nenhum atleta encontrado" />
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
  root:         { flex: 1, backgroundColor: Colors.bg },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.surf, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle:  { fontSize: 16, fontWeight: '900', color: Colors.white, textTransform: 'uppercase', flex: 1 },
  sairBtn:      { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  sairTxt:      { color: Colors.muted, fontSize: 12, fontWeight: '600' },
  notifBanner:  { marginHorizontal: 14, marginTop: 10, marginBottom: 0, backgroundColor: 'rgba(255,214,0,0.1)', borderWidth: 1, borderColor: 'rgba(255,214,0,0.3)', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  notifText:    { fontSize: 13, color: Colors.yellow, fontWeight: '600', flex: 1 },
  statsRow:     { flexDirection: 'row', gap: 8, padding: 14 },
  statCard:     { flex: 1, backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 12, alignItems: 'center' },
  statNum:      { fontSize: 24, fontWeight: '900', color: Colors.white },
  statLbl:      { fontSize: 9, color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 1 },
  actionRow:    { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 14 },
  actionBtn:    { flex: 1, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 13, alignItems: 'center' },
  actionLbl:    { fontSize: 11, color: Colors.muted, fontWeight: '600', marginTop: 3 },
  searchInput:  { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 11, color: Colors.text, fontSize: 13 },
  chipRow: { paddingHorizontal: 14, paddingBottom: 12, gap: 8, alignItems: 'center' },
  chip:       { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, backgroundColor:
  Colors.card, minWidth: 60, alignItems: 'center' },
  chipActive: { backgroundColor: 'rgba(0,200,83,0.2)', borderColor: Colors.green, borderWidth: 2 },
  chipText:   { fontSize: 12, color: Colors.text, fontWeight: '700' },
  athItem:      { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  photoSm:      { width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.card2, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  athNome:      { fontSize: 15, fontWeight: '700', color: Colors.white, textTransform: 'uppercase' },
  athMeta:      { fontSize: 11, color: Colors.muted, marginTop: 1 },
})
