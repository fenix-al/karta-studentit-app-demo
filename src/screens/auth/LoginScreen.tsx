// ─────────────────────────────────────────────────────────────────────────────
// LOGIN SCREEN — Karta e Studentit App
// JWT-based login against WordPress /wp-json/jwt-auth/v1/token.
// On success: fetches /sk/v1/me → passes StudentCard up via onSuccess.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Eye, EyeOff, GraduationCap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors, Typography, Spacing, Radius } from '../../constants/Theme';
import { ApiError, fetchMe, login, logout } from '../../services/api';
import { StudentCard } from '../../types';

interface Props {
  onSuccess: (card: StudentCard) => void;
  notice?: string | null;
}

export default function LoginScreen({ onSuccess, notice }: Props) {
  const insets = useSafeAreaInsets();

  const [username,    setUsername]    = useState('');
  const [password,    setPassword]    = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [isLoading,   setIsLoading]   = useState(false);
  const [userError,   setUserError]   = useState('');
  const [passError,   setPassError]   = useState('');

  const validate = (): boolean => {
    let ok = true;
    if (!username.trim()) { setUserError('Shkruaj emrin e përdoruesit.'); ok = false; }
    else setUserError('');
    if (!password) { setPassError('Shkruaj fjalëkalimin.'); ok = false; }
    else setPassError('');
    return ok;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await login(username.trim(), password);
      const card = await fetchMe();
      onSuccess(card);
    } catch (err: any) {
      if (err instanceof ApiError && err.code === 'no_card') {
        await logout();
        Alert.alert('Nuk disponohet', 'Kjo llogari nuk ka nje karte aktive per momentin.');
        return;
      }
      const msg: string = err?.message ?? 'Ndodhi një gabim. Provo përsëri.';
      if (msg.toLowerCase().includes('fjalëkalim') || msg.toLowerCase().includes('password')) {
        setPassError(msg);
      } else {
        Alert.alert('Gabim', msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ── Brand ──────────────────────────────────────────────────────── */}
        <View style={styles.brandWrap}>
          <LinearGradient
            colors={['#a3e635', '#65a30d']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.logoBox}
          >
            <GraduationCap size={32} color="#fff" strokeWidth={2} />
          </LinearGradient>
          <Text style={styles.brandTitle}>Karta e Studentit</Text>
          <Text style={styles.brandSub}>Shkodër</Text>
        </View>

        {/* ── Card ───────────────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hyrja në llogari</Text>
          <Text style={styles.cardSub}>Përdor kredencialet e dhëna nga bashkia.</Text>

          {!!notice && (
            <View style={styles.noticeBox}>
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          )}

          {/* Username */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Emri i përdoruesit</Text>
            <View style={[styles.inputBox, !!userError && styles.inputError]}>
              <TextInput
                style={styles.input}
                placeholder="p.sh. student.shkoder"
                placeholderTextColor={Colors.textMuted}
                value={username}
                onChangeText={t => { setUsername(t); setUserError(''); }}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
            {!!userError && <Text style={styles.errorText}>{userError}</Text>}
          </View>

          {/* Password */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Fjalëkalimi</Text>
            <View style={[styles.inputBox, !!passError && styles.inputError]}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={t => { setPassword(t); setPassError(''); }}
                secureTextEntry={!showPass}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPass(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                {showPass
                  ? <EyeOff size={18} color={Colors.textMuted} strokeWidth={2} />
                  : <Eye    size={18} color={Colors.textMuted} strokeWidth={2} />
                }
              </TouchableOpacity>
            </View>
            {!!passError && <Text style={styles.errorText}>{passError}</Text>}
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.btn, isLoading && styles.btnDisabled]}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#a3e635', '#65a30d']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              {isLoading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.btnText}>Hyr në llogari</Text>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <Text style={styles.footer}>
          Karta e Studentit Shkodër · v2.0{'\n'}
          <Text style={styles.footerMuted}>Ndërtuar nga Bashkia Shkodër</Text>
        </Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: Colors.surfaceBg },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xxl, alignItems: 'center' },

  // Brand
  brandWrap: { alignItems: 'center', marginBottom: Spacing.xxxl },
  logoBox: {
    width: 72, height: 72, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.lg,
    shadowColor: '#65a30d', shadowOpacity: 0.35, shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  brandTitle: {
    fontFamily: Typography.fontExtraBold,
    fontSize: Typography.h2,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  brandSub: {
    fontFamily: Typography.fontMedium,
    fontSize: Typography.lg,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Card
  card: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: Radius.xxl,
    padding: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
    marginBottom: Spacing.xxxl,
  },
  cardTitle: {
    fontFamily: Typography.fontExtraBold,
    fontSize: Typography.xl,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  cardSub: {
    fontFamily: Typography.fontMedium,
    fontSize: Typography.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.xl,
    lineHeight: 18,
  },
  noticeBox: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    marginBottom: Spacing.lg,
  },
  noticeText: {
    fontFamily: Typography.fontMedium,
    fontSize: Typography.sm,
    color: '#9a3412',
    lineHeight: 18,
  },

  // Field
  fieldWrap:  { marginBottom: Spacing.lg },
  label: {
    fontFamily: Typography.fontBold,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceBg,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  inputError: { borderColor: Colors.danger },
  input: {
    fontFamily: Typography.fontMedium,
    fontSize: Typography.md,
    color: Colors.textPrimary,
  },
  errorText: {
    fontFamily: Typography.fontMedium,
    fontSize: Typography.sm,
    color: Colors.danger,
    marginTop: 6,
  },

  // Button
  btn:         { borderRadius: Radius.lg, overflow: 'hidden', marginTop: Spacing.sm },
  btnDisabled: { opacity: 0.7 },
  btnGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  btnText: {
    fontFamily: Typography.fontExtraBold,
    fontSize: Typography.md,
    color: '#fff',
    letterSpacing: 0.3,
  },

  // Footer
  footer: {
    fontFamily: Typography.fontBold,
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerMuted: {
    fontFamily: Typography.fontMedium,
    color: Colors.textMuted,
  },
});
