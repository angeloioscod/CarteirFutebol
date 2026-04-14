import {
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import { Colors } from '../config/theme'

export function LicencaBloqueadaScreen({ motivo, onRetry }) {
  return (
    <View style={styles.container}>

      <Text style={styles.icon}>🔒</Text>

      <Text style={styles.title}>Acesso Bloqueado</Text>

      <Text style={styles.motivo}>
        {motivo || 'Sua licença expirou ou está inativa.'}
      </Text>

      {/* CARD EXPLICAÇÃO */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>O que aconteceu?</Text>
        <Text style={styles.cardText}>
          O período de uso do sistema expirou ou foi bloqueado
          pelo administrador. Entre em contato para renovar
          o acesso e continuar usando o app.
        </Text>
      </View>

      {/* CARD INSTRUÇÕES */}
      <View style={[styles.card, { borderColor: 'rgba(0,200,83,0.3)' }]}>
        <Text style={[styles.cardTitle, { color: Colors.green }]}>
          Como renovar?
        </Text>
        <Text style={styles.cardText}>
          1. Entre em contato com o suporte{'\n'}
          2. Informe o nome da sua escola{'\n'}
          3. Realize o pagamento{'\n'}
          4. Aguarde a liberação e toque em verificar
        </Text>
      </View>

      {/* BOTÃO WHATSAPP */}
      <TouchableOpacity
        style={styles.btnWhatsapp}
        onPress={() => Linking.openURL(
          'https://wa.me/5511999999999?text=Olá!+Preciso+renovar+minha+licença+do+app+Carteira+Futebol.'
        )}
      >
        <Text style={styles.btnWhatsappText}>
          💬 Falar com Suporte via WhatsApp
        </Text>
      </TouchableOpacity>

      {/* BOTÃO VERIFICAR */}
      <TouchableOpacity
        style={styles.btnRetry}
        onPress={onRetry}
      >
        <Text style={styles.btnRetryText}>
          🔄 Verificar novamente
        </Text>
      </TouchableOpacity>

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  icon: {
    fontSize: 72,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 8,
  },
  motivo: {
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,23,68,0.3)',
    padding: 16,
    marginBottom: 12,
    width: '100%',
  },
  cardTitle: {
    fontSize: 12,
    color: Colors.red,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 13,
    color: Colors.muted,
    lineHeight: 22,
  },
  btnWhatsapp: {
    backgroundColor: '#25D366',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#25D366',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnWhatsappText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 1,
  },
  btnRetry: {
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
    alignItems: 'center',
  },
  btnRetryText: {
    color: Colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
})