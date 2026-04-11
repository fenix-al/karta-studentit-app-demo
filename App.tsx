import React from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import ModernLoader from './src/components/ModernLoader';
import HomeScreen    from './src/screens/HomeScreen';
import BizHomeScreen from './src/screens/biz/BizHomeScreen';
import LoginScreen   from './src/screens/auth/LoginScreen';
import { Colors }    from './src/constants/Theme';

// ── Inner component — consumes AuthContext (must be inside AuthProvider) ──────
function AppNavigator() {
  const {
    isLoading,
    isLoggedIn,
    role,
    onStudentLoginSuccess,
    onBizLoginSuccess,
    authNotice,
  } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.surfaceBg }}>
        <ModernLoader
          fullscreen
          title="Po hapet aplikacioni"
          subtitle="Po kontrollojme sesionin tuaj."
        />
      </View>
    );
  }

  if (!isLoggedIn) {
    return (
      <LoginScreen
        onStudentSuccess={onStudentLoginSuccess}
        onBizSuccess={onBizLoginSuccess}
        notice={authNotice}
      />
    );
  }

  if (role === 'business') return <BizHomeScreen />;
  return <HomeScreen />;
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.surfaceBg }}>
        <ModernLoader
          fullscreen
          title="Po pergatiten fontet"
          subtitle="Aplikacioni po ngarkohet."
        />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
