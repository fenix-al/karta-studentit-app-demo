import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import CustomSplashScreen from './src/components/CustomSplashScreen';
import HomeScreen from './src/screens/HomeScreen';
import BizHomeScreen from './src/screens/biz/BizHomeScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import { Colors } from './src/constants/Theme';

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Native splash may already be controlled by Expo in dev mode.
});

function AppNavigator() {
  const {
    isLoggedIn,
    role,
    onStudentLoginSuccess,
    onBizLoginSuccess,
    authNotice,
  } = useAuth();

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

function AppShell() {
  const { isLoading } = useAuth();
  const [introFinished, setIntroFinished] = useState(false);

  if (!introFinished || isLoading) {
    return (
      <CustomSplashScreen
        onAnimationComplete={() => setIntroFinished(true)}
      />
    );
  }

  return <AppNavigator />;
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {
        // Ignore hide races during fast refresh.
      });
    }
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: Colors.surfaceBg }} />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
