import { useEffect, useState } from 'react'
import {
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'
import { supabase } from '../config/supabase'
import { Colors } from '../config/theme'
import { fmtDate, todayStr } from '../utils/helpers'

export function PresencaScreen() {
  const [atletas, setAtletas]       = useState([])
  const [presMap, setPresMap]       = useState({})
  const [data, setData]             = useState(todayStr())
  const [catFiltro, setCatFiltro]   = useState('todas')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { loadAtletas() }, [])
  useEffect(() => { loadPresencas() }, [data])

  async function loadAtletas() {
    const { data: rows } = await supabase
      .from('atletas')
      .select('id, nome, categoria, foto_url')
      .order('nome')
    if (rows) setAtletas(rows)
  }

  async function loadPresencas() {
    const { data: rows } = await supabase
      .from('presencas')
      .select('atleta_id, status')
      .eq('data', data)
    if (rows) {
      const map = {}
      rows.forEach(r => { map[r.atleta_id] = r.status })
      setPresMap(map)
    }
  }

  async function onRefresh() {
    setRefreshing(true)
    await loadPresencas()
    setRefreshing(false)
  }

  async function marcar(atletaId, status) {
    const atual = presMap[atletaId]
    const novoStatus = atual === status ? null : status

    setPresMap(prev => {
      const updated = { ...prev }
      if (novoStatus) updated[atletaId] = novoStatus
      else delete updated[atletaId]
      return updated
    })

    if (novoStatus) {
      await supabase.from('presencas').upsert(
        { atleta_id: atletaId, data, status: novoStatus },
        { onConflict: 'atleta_id,data' }
      )
    } else {
      await supabase.from('presencas').delete()
        .eq('atleta_id', atletaId).eq('data', data)
    }
  }

  async function marcarTodos() {
    const lista = filteredAtletas
    const upserts = lista.map(a => ({
      atleta_id: a.id, data, status: 'presente'
    }))
    await supabase.from('presencas')
      .upsert(upserts, { onConflict: 'atleta_id,data' })
    const map = { ...presMap }
    lista.forEach(a => { map[a.id] = 'presente' })
    setPresMap(map)
    Alert.alert('✅', 'Todos marcados como presentes!')
  }

  function mudarData(direcao) {
    const d = new Date(data)
    d.setDate(d.getDate() + direcao)
    setData(d.toISOString().slice(0, 10))
  }

  const cats = ['todas', ...new Set(atletas.map(a => a.categoria).filter(Boolean))]
  const filteredAtletas = catFiltro === 'todas'
    ? atletas
    : atletas.filter(a => a.categoria === catFiltro)

  const presentes   = filteredAtletas.filter(a => presMap[a.id] === 'presente').length
  const faltas      = filteredAtletas.filter(a => presMap[a.id] === 'falta').length
  const naoMarcados = filteredAtletas.filter(a => !presMap[a.id]).length

  function renderAtleta({ item: a }) {
    const cur = presMap[a.id] || ''
    return (
      <View style={styles.presRow}>
        <View style={styles.presPhoto}>
          {a.foto_url
            ? <Image source={{ uri: a.foto_url }} style={{ width: 36, height: 36 }} />
            : <Text style={{ fontSize: 18 }}>⚽</Text>
          }
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.presNome}>{a.nome}</Text>
          <Text style={styles.presCat}>{a.categoria}</Text>
        </View>
        <View style={styles.presBtns}>
          <TouchableOpacity
            style={[styles.presBtn, cur === 'presente' && styles.presBtnPres]}
            onPress={() => marcar(a.id, 'presente')}
          >
            <Text style={{ fontSize: 18 }}>✅</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.presBtn, cur === 'falta' && styles.presBtnFalt]}
            onPress={() => marcar(a.id, 'falta')}
          >
            <Text style={{ fontSize: 18 }}>❌</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.presBtn, cur === 'justificada' && styles.presBtnJust]}
            onPress={() => marcar(a.id, 'justificada')}
          >
            <Text style={{ fontSize: 18 }}>📝</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  function ListHeader() {
    return (
      <View>
        {/* STATS */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: Colors.green }]}>{presentes}</Text>
            <Text style={styles.statLbl}>Presentes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: Colors.red }]}>{faltas}</Text>
            <Text style={styles.statLbl}>Faltas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{naoMarcados}</Text>
            <Text style={styles.statLbl}>Não marc.</Text>
          </View>
        </View>

        {/* SELETOR DE DATA */}
        <View style={styles.dateRow}>
          <TouchableOpacity style={styles.dateArrow} onPress={() => mudarData(-1)}>
            <Text style={styles.dateArrowText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.dateCentro}>
            <Text style={styles.dateText}>{fmtDate(data)}</Text>
          </View>
          <TouchableOpacity style={styles.dateArrow} onPress={() => mudarData(1)}>
            <Text style={styles.dateArrowText}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnHoje} onPress={() => setData(todayStr())}>
            <Text style={styles.btnHojeText}>Hoje</Text>
          </TouchableOpacity>
        </View>

        {/* FILTROS CATEGORIA */}
        <View style={styles.filtrosWrap}>
          {cats.map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, catFiltro === c && styles.chipActive]}
              onPress={() => setCatFiltro(c)}
            >
              <Text style={[styles.chipText, catFiltro === c && styles.chipTextActive]}>
                {c === 'todas' ? 'Todas' : c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.dateLabel}>Treino – {fmtDate(data)}</Text>

        {/* BOTÃO MARCAR TODOS */}
        {filteredAtletas.length > 0 && (
          <TouchableOpacity style={styles.btnMarcarTodos} onPress={marcarTodos}>
            <Text style={styles.btnMarcarTodosText}>✅ MARCAR TODOS COMO PRESENTE</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={filteredAtletas}
        keyExtractor={a => a.id}
        renderItem={renderAtleta}
        ListHeaderComponent={<ListHeader />}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', padding: 30 }}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>👥</Text>
            <Text style={{ color: Colors.muted, fontSize: 14 }}>
              Nenhum atleta nesta categoria
            </Text>
          </View>
        }
        contentContainerStyle={{ padding: 14, paddingBottom: 20 }}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: Colors.border }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.green}
          />
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root:               { flex: 1, backgroundColor: Colors.bg },
  statsRow:           { flexDirection: 'row', gap: 8, paddingBottom: 14 },
  statCard:           { flex: 1, backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 12, alignItems: 'center' },
  statNum:            { fontSize: 26, fontWeight: '900', color: Colors.white },
  statLbl:            { fontSize: 9, color: Colors.muted, textTransform: 'uppercase', marginTop: 2 },
  dateRow:            { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 12 },
  dateArrow:          { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  dateArrowText:      { color: Colors.green, fontSize: 22, fontWeight: '700' },
  dateCentro:         { flex: 1, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 10, alignItems: 'center' },
  dateText:           { color: Colors.text, fontSize: 14, fontWeight: '700' },
  btnHoje:            { backgroundColor: 'rgba(0,200,83,0.1)', borderWidth: 1, borderColor: Colors.green, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  btnHojeText:        { color: Colors.green, fontWeight: '700', fontSize: 12 },
  filtrosWrap:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 10 },
  chip:               { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.card },
  chipActive:         { backgroundColor: Colors.green, borderColor: Colors.green },
  chipText:           { fontSize: 12, color: Colors.text, fontWeight: '700' },
  chipTextActive:     { color: '#000', fontWeight: '800' },
  dateLabel:          { fontSize: 10, color: Colors.muted, textTransform: 'uppercase', letterSpacing: 2, paddingBottom: 10 },
  btnMarcarTodos:     { backgroundColor: Colors.green, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 10 },
  btnMarcarTodosText: { color: '#000', fontWeight: '800', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' },
  presRow:            { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, backgroundColor: Colors.card, paddingHorizontal: 12, borderRadius: 10, marginBottom: 2 },
  presPhoto:          { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.card2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  presNome:           { fontSize: 13, color: Colors.text, fontWeight: '600' },
  presCat:            { fontSize: 10, color: Colors.muted },
  presBtns:           { flexDirection: 'row', gap: 6 },
  presBtn:            { padding: 6, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  presBtnPres:        { backgroundColor: 'rgba(0,200,83,0.2)', borderColor: Colors.green },
  presBtnFalt:        { backgroundColor: 'rgba(255,23,68,0.2)', borderColor: Colors.red },
  presBtnJust:        { backgroundColor: 'rgba(255,214,0,0.2)', borderColor: Colors.yellow },
})