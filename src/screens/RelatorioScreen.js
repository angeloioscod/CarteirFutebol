import { useEffect, useState } from 'react'
import {
    RefreshControl,
    ScrollView, StyleSheet,
    Text,
    View
} from 'react-native'
import { supabase } from '../config/supabase'
import { Colors } from '../config/theme'
import { getMonthRef } from '../utils/helpers'

export function RelatorioScreen() {
  const [atletas, setAtletas]       = useState([])
  const [presTotal, setPresTotal]   = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data: aths } = await supabase
      .from('atletas')
      .select('*')
      .order('nome')
    if (aths) setAtletas(aths)

    const { count } = await supabase
      .from('presencas')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'presente')
    setPresTotal(count || 0)
  }

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const ref   = getMonthRef()
  const pagos = atletas.filter(a => a.status === 'pago')
  const pend  = atletas.filter(a => a.status === 'pendente')
  const total = atletas.length
  const taxa  = total > 0 ? Math.round(pagos.length / total * 100) : 0
  const cats  = [...new Set(atletas.map(a => a.categoria))]

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.green}
        />
      }
    >
      <Text style={styles.pageTitle}>📊 Relatório – {ref}</Text>

      {/* SUMMARY */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: Colors.green }]}>{pagos.length}</Text>
          <Text style={styles.statLbl}>Pagos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: Colors.red }]}>{pend.length}</Text>
          <Text style={styles.statLbl}>Pendentes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: Colors.blue }]}>{taxa}%</Text>
          <Text style={styles.statLbl}>Adimpl.</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{presTotal}</Text>
          <Text style={styles.statLbl}>Presenças</Text>
        </View>
      </View>

      {/* INADIMPLENTES */}
      <View style={styles.section}>
        <Text style={styles.secTitle}>⚠️ Inadimplentes ({pend.length})</Text>
        {pend.length === 0
          ? <Text style={styles.allGood}>🎉 Todos os atletas pagaram!</Text>
          : pend.map(a => (
              <View key={a.id} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName}>{a.nome}</Text>
                  <Text style={styles.rowMeta}>{a.categoria} · {a.telefone}</Text>
                </View>
                <View style={styles.badgePend}>
                  <Text style={{ color: Colors.red, fontSize: 11, fontWeight: '700' }}>
                    PENDENTE
                  </Text>
                </View>
              </View>
            ))
        }
      </View>

      {/* PAGOS */}
      <View style={styles.section}>
        <Text style={styles.secTitle}>✅ Pagamentos Confirmados ({pagos.length})</Text>
        {pagos.length === 0
          ? <Text style={{ color: Colors.muted, fontSize: 13, textAlign: 'center', padding: 12 }}>
              Nenhum pagamento confirmado ainda.
            </Text>
          : pagos.map(a => (
              <View key={a.id} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName}>{a.nome}</Text>
                  <Text style={styles.rowMeta}>{a.categoria} · Ref. {a.mes_pago}</Text>
                </View>
                <Text style={{ fontSize: 16 }}>
                  {a.comprovante_url ? '📎✅' : '✅'}
                </Text>
              </View>
            ))
        }
      </View>

      {/* POR CATEGORIA */}
      <View style={styles.section}>
        <Text style={styles.secTitle}>📋 Por Categoria</Text>
        {cats.map(cat => {
          const catAtletas = atletas.filter(a => a.categoria === cat)
          const catPagos   = catAtletas.filter(a => a.status === 'pago').length
          const catPct     = catAtletas.length > 0
            ? Math.round(catPagos / catAtletas.length * 100)
            : 0
          return (
            <View key={cat} style={styles.catRow}>
              <Text style={styles.catName}>{cat}</Text>
              <View style={styles.catBar}>
                <View style={[
                  styles.catFill,
                  {
                    width: `${catPct}%`,
                    backgroundColor: catPct >= 75 ? Colors.green : Colors.red
                  }
                ]} />
              </View>
              <Text style={[
                styles.catPct,
                { color: catPct >= 75 ? Colors.green : Colors.red }
              ]}>
                {catPct}%
              </Text>
            </View>
          )
        })}
        {cats.length === 0 && (
          <Text style={{ color: Colors.muted, fontSize: 13, textAlign: 'center', padding: 12 }}>
            Nenhuma categoria cadastrada ainda.
          </Text>
        )}
      </View>

      {/* RESUMO GERAL */}
      <View style={[styles.section, { borderColor: 'rgba(0,200,83,0.3)' }]}>
        <Text style={styles.secTitle}>📈 Resumo Geral</Text>
        <View style={styles.resumoRow}>
          <Text style={styles.resumoLbl}>Total de atletas</Text>
          <Text style={styles.resumoVal}>{total}</Text>
        </View>
        <View style={styles.resumoRow}>
          <Text style={styles.resumoLbl}>Taxa de adimplência</Text>
          <Text style={[styles.resumoVal, { color: taxa >= 75 ? Colors.green : Colors.red }]}>
            {taxa}%
          </Text>
        </View>
        <View style={styles.resumoRow}>
          <Text style={styles.resumoLbl}>Total de presenças</Text>
          <Text style={styles.resumoVal}>{presTotal}</Text>
        </View>
        <View style={styles.resumoRow}>
          <Text style={styles.resumoLbl}>Mês de referência</Text>
          <Text style={styles.resumoVal}>{ref}</Text>
        </View>
      </View>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: Colors.bg },
  pageTitle:  { fontSize: 20, fontWeight: '900', color: Colors.white, textTransform: 'uppercase', letterSpacing: 1, padding: 16 },
  statsRow:   { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 14 },
  statCard:   { flex: 1, backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 12, alignItems: 'center' },
  statNum:    { fontSize: 22, fontWeight: '900', color: Colors.white },
  statLbl:    { fontSize: 9, color: Colors.muted, textTransform: 'uppercase', marginTop: 1 },
  section:    { backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 14, marginHorizontal: 14, marginBottom: 12 },
  secTitle:   { fontSize: 13, fontWeight: '700', color: Colors.white, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  allGood:    { textAlign: 'center', color: Colors.green, fontWeight: '700', padding: 12, fontSize: 14 },
  row:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.card2, borderRadius: 8, padding: 10, marginBottom: 6, borderWidth: 1, borderColor: Colors.border },
  rowName:    { fontSize: 13, color: Colors.text, fontWeight: '600' },
  rowMeta:    { fontSize: 11, color: Colors.muted, marginTop: 1 },
  badgePend:  { backgroundColor: 'rgba(255,23,68,0.15)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(255,23,68,0.3)' },
  catRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  catName:    { fontSize: 12, color: Colors.text, width: 60, fontWeight: '600' },
  catBar:     { flex: 1, height: 8, backgroundColor: Colors.card2, borderRadius: 4, overflow: 'hidden' },
  catFill:    { height: '100%', borderRadius: 4 },
  catPct:     { fontSize: 12, fontWeight: '700', width: 36, textAlign: 'right' },
  resumoRow:  { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  resumoLbl:  { fontSize: 13, color: Colors.muted },
  resumoVal:  { fontSize: 13, color: Colors.white, fontWeight: '700' },
})