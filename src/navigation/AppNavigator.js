import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { Image, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Colors } from '../config/theme'
import { useEscola } from '../hooks/useEscola'

import { AlunoWalletScreen } from '../screens/AlunoWalletScreen'
import { AtletaDetalheScreen } from '../screens/AtletaDetalheScreen'
import { CadastroAtletaScreen } from '../screens/CadastroAtletaScreen'
import { ConfigScreen } from '../screens/ConfigScreen'
import { LoginScreen } from '../screens/LoginScreen'
import { PresencaScreen } from '../screens/PresencaScreen'
import { ProfAtletasScreen } from '../screens/ProfAtletasScreen'
import { RelatorioScreen } from '../screens/RelatorioScreen'

const Stack = createStackNavigator()
const Tab   = createBottomTabNavigator()

function HeaderLogo() {
  const { escola } = useEscola()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: Colors.card2,
        borderWidth: 2, borderColor: Colors.green,
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden'
      }}>
        {escola.logoUrl
          ? <Image source={{ uri: escola.logoUrl }} style={{ width: 28, height: 28 }} />
          : <Text style={{ fontSize: 14 }}>⚽</Text>
        }
      </View>
      <Text style={{
        color: Colors.white, fontSize: 16,
        fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1
      }}>
        {escola.nome}
      </Text>
    </View>
  )
}

const defaultHeader = {
  headerStyle: {
    backgroundColor: Colors.surf,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTintColor: Colors.green,
  headerTitleStyle: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerBackTitleVisible: false,
}

function ProfTabs() {
  const insets = useSafeAreaInsets()
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: Colors.surf,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 6,
          height: 60 + (insets.bottom > 0 ? insets.bottom : 10),
        },
        tabBarActiveTintColor:   Colors.green,
        tabBarInactiveTintColor: Colors.muted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
        headerStyle: {
          backgroundColor: Colors.surf,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: Colors.white,
          fontWeight: '700',
          fontSize: 16,
          textTransform: 'uppercase',
          letterSpacing: 1,
        },
        headerTintColor: Colors.green,
      }}
    >
      <Tab.Screen
        name="Atletas"
        component={ProfAtletasScreen}
        options={{
          tabBarLabel: 'Atletas',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>👥</Text>
          ),
          headerTitle: () => <HeaderLogo />,
        }}
      />
      <Tab.Screen
        name="Presenca"
        component={PresencaScreen}
        options={{
          tabBarLabel: 'Presença',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>📋</Text>
          ),
          headerTitle: 'Controle de Presença',
        }}
      />
      <Tab.Screen
        name="Relatorio"
        component={RelatorioScreen}
        options={{
          tabBarLabel: 'Relatório',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>📊</Text>
          ),
          headerTitle: 'Relatório Mensal',
        }}
      />
      <Tab.Screen
        name="Config"
        component={ConfigScreen}
        options={{
          tabBarLabel: 'Config',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>⚙️</Text>
          ),
          headerTitle: 'Personalização',
        }}
      />
    </Tab.Navigator>
  )
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={defaultHeader}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AlunoWallet"
          component={AlunoWalletScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ProfTabs"
          component={ProfTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AtletaDetalhe"
          component={AtletaDetalheScreen}
          options={{ headerTitle: 'Detalhes do Atleta' }}
        />
        <Stack.Screen
          name="CadastroAtleta"
          component={CadastroAtletaScreen}
          options={({ route }) => ({
            headerTitle: route.params?.atletaId
              ? 'Editar Atleta'
              : 'Cadastrar Atleta'
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}