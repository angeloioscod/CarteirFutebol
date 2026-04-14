import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { EscolaProvider } from './src/hooks/useEscola'
import { AppNavigator } from './src/navigation/AppNavigator'

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <EscolaProvider>
          <StatusBar style="light" backgroundColor="#090E09" />
          <AppNavigator />
        </EscolaProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}