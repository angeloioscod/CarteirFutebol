import { useEffect, useState } from 'react'
import {
    Alert, Image, RefreshControl,
    ScrollView, StyleSheet,
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
    const atual     = presMap[atletaId]
    const novoStatus = atual === status ? null : status

    setPresMap(prev => {
      const updated = { ...prev }
      if (novoStatus) {
        updated[atletaId] = novoStatus
      } else {
        delete updated[atletaId]
      }
      return updated
    })

    if (novoStatus) {
      await supabase.from('presencas').upsert(
        { atleta_id: atletaId, data, status: novoStatus },
        { onConflict: 'atleta_id,data' }
      )
    } else {
      await supabase
        .from('presencas')
        .delete()
        .eq('atleta_id', atletaId)
        .eq('data', data)
    }
  }

  async function marcarTodos() {
    const lista   = filteredAtletas
    const upserts = lista.map(a => ({
      atleta_id: a.id,
      data,
      status: 'presente'
    }))
    await supabase
      .from('presencas')
      .upsert(upserts, { onConflict: 'atleta_id,data' })
    const map = { ...presMap }
    lista.forEach(a => { map[a.id] = 'presente' })
    setPresMap(map)
    Alert.alert('✅', 'Todos marcados como presentes!')
  }

  function mudarData(direcao) {
    const d    = new Date(data)
    d.setDate(d.getDate() + direcao)
    setData(d.toISOString().slice(0, 10))
  }

  const cats            = ['todas', ...new Set(atletas.map(a => a.categoria))]
  const filteredAtletas = catFiltro === 'todas'
    ? atletas
    : atletas.filter(a => a.categoria === catFiltro)

  const presentes   = filteredAtletas.filter(a => presMap[a.id] === 'presente').length
  const faltas      = filteredAtletas.filter(a => presMap[a.id] === 'falta').length
  const naoMarcados = filteredAtletas.filter(a => !presMap[a.id]).length

  return (
    <View style={styles.root}>

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

      {/* FILTRO CATEGORIA */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {cats.map(c => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, catFiltro === c && styles.chipActive]}
            onPress={() => setCatFiltro(c)}
          >
            <Text style={[styles.chipText, catFiltro === c && { color: Colors.green }]}>
              {c === 'todas' ? 'Todas' : c}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.dateLabel}>Treino – {fmtDate(data)}</Text>

      {/* LISTA */}
      <ScrollView
        contentContainerStyle={{ padding: 14, paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.green}
          />
        }
      >
        <View style={styles.presCard}>
          {filteredAtletas.length === 0 && (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: Colors.muted, fontSize: 13 }}>
                Nenhum atleta nesta categoria
              </Text>
            </View>
          )}
          {filteredAtletas.map((a, i) => (
            <View
              key={a.id}
              style={[
                styles.presRow,
                i < filteredAtletas.length - 1 && styles.presRowBorder
              ]}
            >
              <View style={styles.presPhoto}>
                {a.foto_url
                  ? <Image source={{ uri: a.foto_url }} style={{ width: 28, height: 28 }} />
                  : <Text style={{ fontSize: 14 }}>⚽</Text>
                }
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.presNome}>{a.nome}</Text>
                <Text style={styles.presCat}>{a.categoria}</Text>
              </View>
              <View style={styles.presBtns}>
                <TouchableOpacity
                  style={[
                    styles.presBtn,
                    presMap[a.id] === 'presente' && styles.presBtnPres
                  ]}
                  onPress={() => marcar(a.id, 'presente')}
                >
                  <Text style={{ fontSize: 16 }}>✅</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.presBtn,
                    presMap[a.id] === 'falta' && styles.presBtnFalt
                  ]}
                  onPress={() => marcar(a.id, 'falta')}
                >
                  <Text style={{ fontSize: 16 }}>❌</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.presBtn,
                    presMap[a.id] === 'justificada' && styles.presBtnJust
                  ]}
                  onPress={() => marcar(a.id, 'justificada')}
                >
                  <Text style={{ fontSize: 16 }}>📝</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {filteredAtletas.length > 0 && (
          <TouchableOpacity
            style={styles.btnMarcarTodos}
            onPress={marcarTodos}
          >
            <Text style={styles.btnMarcarTodosText}>
              ✅ Marcar Todos como Presente
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

    </View>
  )
}

const styles = StyleSheet.create({
  root:               { flex: 1, backgroundColor: Colors.bg },
  statsRow:           { flexDirection: 'row', gap: 8, padding: 14 },
  statCard:           { flex: 1, backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 12, alignItems: 'center' },
  statNum:            { fontSize: 26, fontWeight: '900', color: Colors.white },
  statLbl:            { fontSize: 9, color: Colors.muted, textTransform: 'uppercase', marginTop: 2 },
  dateRow:            { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingBottom: 10 },
  dateArrow:          { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  dateArrowText:      { color: Colors.green, fontSize: 22, fontWeight: '700' },
  dateCentro:         { flex: 1, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 10, alignItems: 'center' },
  dateText:           { color: Colors.text, fontSize: 14, fontWeight: '700' },
  btnHoje:            { backgroundColor: 'rgba(0,200,83,0.1)', borderWidth: 1, borderColor: Colors.green, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  btnHojeText:        { color: Colors.green, fontWeight: '700', fontSize: 12 },
  chipRow:            { paddingHorizontal: 14, paddingBottom: 10, gap: 7 },
  chip:               { paddingHorizontal: 13, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card },
  chipActive:         { backgroundColor: 'rgba(0,200,83,0.15)', borderColor: Colors.green },
  chipText:           { fontSize: 11, color: Colors.muted, fontWeight: '600' },
  dateLabel:          { paddingHorizontal: 14, paddingBottom: 8, fontSize: 10, color: Colors.muted, textTransform: 'uppercase', letterSpacing: 2 },
  presCard:           { backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  presRow:            { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11 },
  presRowBorder:      { borderBottomWidth: 1, borderBottomColor: Colors.border },
  presPhoto:          { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.card2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  presNome:           { fontSize: 13, color: Colors.text, fontWeight: '600' },
  presCat:            { fontSize: 10, color: Colors.muted },
  presBtns:           { flexDirection: 'row', gap: 6 },
  presBtn:            { padding: 6, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  presBtnPres:        { backgroundColor: 'rgba(0,200,83,0.2)', borderColor: Colors.green },
  presBtnFalt:        { backgroundColor: 'rgba(255,23,68,0.2)', borderColor: Colors.red },
  presBtnJust:        { backgroundColor: 'rgba(255,214,0,0.2)', borderColor: Colors.yellow },
  btnMarcarTodos:     { backgroundColor: Colors.green, borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 12 },
  btnMarcarTodosText: { color: '#000', fontWeight: '800', fontSize: 14, letterSpacing: 1, textTransform: 'uppercase' },
})