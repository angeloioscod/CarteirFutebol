import { useState } from 'react'
import {
  Alert, Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BtnPrimary } from '../components/UI'
import { supabase } from '../config/supabase'
import { Colors, Radius } from '../config/theme'
import { useEscola } from '../hooks/useEscola'

export function LoginScreen({ navigation }) {
  const { escola }            = useEscola()
  const insets                = useSafeAreaInsets()
  const [tab, setTab]         = useState('aluno')
  const [codigo, setCodigo]   = useState('')
  const [email, setEmail]     = useState('')
  const [senha, setSenha]     = useState('')
  const [loading, setLoading] = useState(false)

  async function loginAluno() {
    const code = codigo.trim().toUpperCase()
    if (!code) {
      Alert.alert('Atenção', 'Digite o código do atleta.')
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('atletas')
        .select('*')
        .eq('id', code)
        .single()
      if (error || !data) {
        Alert.alert('Não encontrado', 'Código inválido. Verifique com seu professor.')
      } else {
        navigation.replace('AlunoWallet', { atleta: data })
      }
    } catch (e) {
      Alert.alert('Erro', 'Sem conexão com o servidor.')
    }
    setLoading(false)
  }

  async function loginProf() {
    if (!email || !senha) {
      Alert.alert('Atenção', 'Preencha e-mail e senha.')
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      })
      if (error) {
        Alert.alert('Erro de Login', 'E-mail ou senha incorretos.')
      } else {
        navigation.replace('ProfTabs')
      }
    } catch (e) {
      Alert.alert('Erro', 'Sem conexão com o servidor.')
    }
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 20 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* HERO */}
          <View style={[styles.hero, { paddingTop: insets.top + 40 }]}>
            <View style={styles.logoWrap}>
              {escola.logoUrl
                ? <Image source={{ uri: escola.logoUrl }} style={styles.logoImg} />
                : <Text style={{ fontSize: 36 }}>⚽</Text>
              }
            </View>
            <Text style={styles.heroTitle}>
              Carteira{'\n'}
              <Text style={{ color: Colors.green }}>Digital</Text>
            </Text>
            <Text style={styles.heroSub}>{escola.nome}</Text>
          </View>

          {/* TABS */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'aluno' && styles.tabActive]}
              onPress={() => { setTab('aluno'); Keyboard.dismiss() }}
            >
              <Text style={[styles.tabText, tab === 'aluno' && styles.tabActiveText]}>
                🎽 Aluno
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'prof' && styles.tabActive]}
              onPress={() => { setTab('prof'); Keyboard.dismiss() }}
            >
              <Text style={[styles.tabText, tab === 'prof' && styles.tabActiveText]}>
                📋 Professor
              </Text>
            </TouchableOpacity>
          </View>

          {/* FORM ALUNO */}
          {tab === 'aluno' && (
            <View style={styles.form}>
              <Text style={styles.label}>Código do Atleta</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: AF-2026-0001"
                placeholderTextColor={Colors.muted}
                value={codigo}
                onChangeText={setCodigo}
                autoCapitalize="characters"
                maxLength={15}
                returnKeyType="done"
                onSubmitEditing={loginAluno}
              />
              <BtnPrimary
                label="ACESSAR CARTEIRA"
                onPress={loginAluno}
                loading={loading}
              />
              <Text style={styles.hint}>
                Código fornecido pelo seu professor
              </Text>
            </View>
          )}

          {/* FORM PROFESSOR */}
          {tab === 'prof' && (
            <View style={styles.form}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                style={styles.input}
                placeholder="professor@escola.com"
                placeholderTextColor={Colors.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
              />
              <Text style={[styles.label, { marginTop: 12 }]}>Senha</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={Colors.muted}
                value={senha}
                onChangeText={setSenha}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={loginProf}
              />
              <BtnPrimary
                label="ENTRAR NO PAINEL"
                onPress={loginProf}
                loading={loading}
                style={{ marginTop: 4 }}
              />
              <Text style={styles.hint}>
                Use o e-mail e senha cadastrados no Supabase
              </Text>
            </View>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  hero: {
    backgroundColor: '#0C190C',
    paddingHorizontal: 28,
    paddingBottom: 36,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  logoWrap: {
    width: 80, height: 80,
    borderRadius: 40,
    backgroundColor: Colors.card2,
    borderWidth: 3,
    borderColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  logoImg:      { width: 80, height: 80 },
  heroTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: Colors.white,
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: 42,
  },
  heroSub: {
    color: Colors.muted,
    fontSize: 13,
    marginTop: 8,
  },
  tabs: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: Colors.surf,
    borderRadius: Radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabBtn: {
    flex: 1, padding: 11,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.green,
    shadowColor: Colors.green,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: {
    color: Colors.muted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tabActiveText: { color: '#000' },
  form:  { padding: 16, gap: 10 },
  label: {
    fontSize: 10,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: 15,
    color: Colors.text,
    fontSize: 15,
  },
  hint: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.muted,
    marginTop: 4,
  },
})
