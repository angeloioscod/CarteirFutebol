import {
  ActivityIndicator, Image,
  StyleSheet,
  Text, TouchableOpacity,
  View
} from 'react-native'
import { Colors, Radius, Spacing } from '../config/theme'

// ── BTN PRIMARY ───────────────────────────────────────────────
export function BtnPrimary({ label, onPress, loading, color, style }) {
  const bg = color || Colors.green
  return (
    <TouchableOpacity
      style={[styles.btnPrimary, { backgroundColor: bg }, style]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {loading
        ? <ActivityIndicator color="#000" />
        : <Text style={styles.btnPrimaryText}>{label}</Text>
      }
    </TouchableOpacity>
  )
}

// ── BTN OUTLINE ───────────────────────────────────────────────
export function BtnOutline({ label, onPress, color, style }) {
  const c = color || Colors.muted
  return (
    <TouchableOpacity
      style={[styles.btnOutline, { borderColor: c }, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.btnOutlineText, { color: c }]}>{label}</Text>
    </TouchableOpacity>
  )
}

// ── STATUS BADGE ──────────────────────────────────────────────
export function StatusBadge({ status }) {
  const isPago = status === 'pago'
  return (
    <View style={[styles.badge, isPago ? styles.badgePago : styles.badgePend]}>
      <Text style={[styles.badgeText, { color: isPago ? Colors.green : Colors.red }]}>
        {isPago ? '✅ Pago' : '❌ Pend.'}
      </Text>
    </View>
  )
}

// ── CARD ──────────────────────────────────────────────────────
export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>
}

// ── INFO ROW ──────────────────────────────────────────────────
export function InfoRow({ label, value, valueColor }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLbl}>{label}</Text>
      <Text style={[styles.infoVal, valueColor ? { color: valueColor } : {}]}>
        {value || '—'}
      </Text>
    </View>
  )
}

// ── SECTION TITLE ─────────────────────────────────────────────
export function SectionTitle({ title, right }) {
  return (
    <View style={styles.secTitle}>
      <Text style={styles.secTitleText}>{title}</Text>
      {right && (
        <Text style={{ color: Colors.green, fontSize: 12, fontWeight: '700' }}>
          {right}
        </Text>
      )}
    </View>
  )
}

// ── ATHLETE PHOTO ─────────────────────────────────────────────
export function AthletePhoto({ uri, size = 48, border = 2 }) {
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: Colors.card2,
      borderWidth: border, borderColor: Colors.green,
      overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
    }}>
      {uri
        ? <Image source={{ uri }} style={{ width: size, height: size }} />
        : <Text style={{ fontSize: size * 0.45 }}>⚽</Text>
      }
    </View>
  )
}

// ── EMPTY STATE ───────────────────────────────────────────────
export function EmptyState({ icon = '🔍', text = 'Nenhum resultado' }) {
  return (
    <View style={styles.empty}>
      <Text style={{ fontSize: 44, marginBottom: 10 }}>{icon}</Text>
      <Text style={{ color: Colors.muted, fontSize: 14 }}>{text}</Text>
    </View>
  )
}

// ── STAT CARD ─────────────────────────────────────────────────
export function StatCard({ num, label, color }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statNum, color ? { color } : {}]}>{num}</Text>
      <Text style={styles.statLbl}>{label}</Text>
    </View>
  )
}

// ── LOADING SCREEN ────────────────────────────────────────────
export function LoadingScreen() {
  return (
    <View style={{
      flex: 1, backgroundColor: Colors.bg,
      alignItems: 'center', justifyContent: 'center'
    }}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>⚽</Text>
      <ActivityIndicator color={Colors.green} size="large" />
    </View>
  )
}

const styles = StyleSheet.create({
  btnPrimary: {
    borderRadius: Radius.md,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.green,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  btnPrimaryText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  btnOutline: {
    borderRadius: Radius.md,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  btnOutlineText: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  badgePago: {
    backgroundColor: 'rgba(0,200,83,0.15)',
    borderColor: 'rgba(0,200,83,0.3)'
  },
  badgePend: {
    backgroundColor: 'rgba(255,23,68,0.15)',
    borderColor: 'rgba(255,23,68,0.3)'
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
infoRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: Colors.card,
  borderRadius: Radius.md,
  borderWidth: 1,
  borderColor: Colors.border,
  paddingHorizontal: 14,
  paddingVertical: 11,
  marginBottom: 5,
  gap: 8,
},
infoLbl: {
  fontSize: 12,
  color: Colors.muted,
  flexShrink: 0,
  minWidth: 90,
},
infoVal: {
  fontSize: 12,
  color: Colors.text,
  fontWeight: '600',
  flex: 1,
  textAlign: 'right',
},
  secTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: 8,
  },
  secTitleText: {
    fontSize: 10,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  empty: { padding: 40, alignItems: 'center' },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    alignItems: 'center',
  },
  statNum: { fontSize: 26, fontWeight: '900', color: Colors.white },
  statLbl: {
    fontSize: 9,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },
})