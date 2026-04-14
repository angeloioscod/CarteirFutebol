export function getMonthRef() {
  const d = new Date()
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

export function isDue() {
  return new Date().getDate() > 5
}

export function getDaysUntil5() {
  const n  = new Date()
  const d5 = new Date(n.getFullYear(), n.getMonth(), 5)
  if (d5 < n) d5.setMonth(d5.getMonth() + 1)
  return Math.ceil((d5 - n) / (1000 * 60 * 60 * 24))
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export function fmtDate(str) {
  if (!str) return '—'
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

export function genAtletaId(seq) {
  const year = new Date().getFullYear()
  const num  = String(seq).padStart(4, '0')
  return `AF-${year}-${num}`
}

export function calcPresencaPct(presence = {}) {
  const vals    = Object.values(presence)
  const total   = vals.length
  const present = vals.filter(v => v === 'presente').length
  return total > 0 ? Math.round((present / total) * 100) : 100
}

export function getAge(birthYear) {
  return new Date().getFullYear() - birthYear
}