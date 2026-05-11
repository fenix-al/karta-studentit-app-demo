import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Linking,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Landmark,
  LogIn,
  Trash2,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors, Typography, Spacing, Radius } from '../../constants/Theme';
import { BRANDING } from '../../constants/branding';
import { PASSWORD_RESET_URL } from '../../constants/config';
import {
  clearRememberedLogin,
  detectUserRole,
  getRememberedLogin,
  login,
  logout,
  RememberedLogin,
  saveRememberedLogin,
} from '../../services/api';
import { BizProfile, StudentCard } from '../../types';

interface Props {
  onStudentSuccess: (card: StudentCard) => void;
  onBizSuccess: (biz: BizProfile) => void;
  notice?: string | null;
}

export default function LoginScreen({ onStudentSuccess, onBizSuccess, notice }: Props) {
  const insets = useSafeAreaInsets();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userError, setUserError] = useState('');
  const [passError, setPassError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [savedLogin, setSavedLogin] = useState<RememberedLogin | null>(null);
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    let alive = true;

    (async () => {
      const remembered = await getRememberedLogin();
      if (!alive || !remembered) return;

      setSavedLogin(remembered);
      setRememberMe(true);
      setUsername(remembered.username);
    })();

    return () => {
      alive = false;
    };
  }, []);

  const validate = (nextUsername: string, nextPassword: string): boolean => {
    let ok = true;

    if (!nextUsername.trim()) {
      setUserError('Shkruaj emrin e përdoruesit.');
      ok = false;
    } else {
      setUserError('');
    }

    if (!nextPassword) {
      setPassError('Shkruaj fjalëkalimin.');
      ok = false;
    } else {
      setPassError('');
    }

    return ok;
  };

  const resetPrefillUrl = useMemo(() => {
    const typedUsername = username.trim();
    const rememberedEmail = savedLogin?.email?.trim();
    const query = new URLSearchParams();

    if (typedUsername) {
      query.set('username', typedUsername);
      query.set('user_login', typedUsername);
      if (typedUsername.includes('@')) query.set('email', typedUsername);
    } else if (savedLogin?.username) {
      query.set('username', savedLogin.username);
      query.set('user_login', savedLogin.username);
    }

    if (rememberedEmail) {
      query.set('email', rememberedEmail);
    }

    const queryString = query.toString();
    return queryString ? `${PASSWORD_RESET_URL}?${queryString}` : PASSWORD_RESET_URL;
  }, [savedLogin, username]);

  const persistRememberedLogin = async (
    nextUsername: string,
    email?: string | null,
    displayName?: string | null,
  ) => {
    if (!rememberMe) {
      await clearRememberedLogin();
      setSavedLogin(null);
      return;
    }

    const remembered: RememberedLogin = {
      username: nextUsername,
      email: email ?? null,
      displayName: displayName ?? null,
    };

    await saveRememberedLogin(remembered);
    setSavedLogin(remembered);
  };

  const performLogin = async (nextUsername: string, nextPassword: string) => {
    const cleanUsername = nextUsername.trim();
    if (!validate(cleanUsername, nextPassword)) return;

    setIsLoading(true);
    setGeneralError('');

    try {
      const loginResponse = await login(cleanUsername, nextPassword);
      await persistRememberedLogin(
        cleanUsername,
        loginResponse.user_email,
        loginResponse.user_display_name,
      );

      const result = await detectUserRole();

      if (result?.role === 'student') {
        onStudentSuccess(result.studentCard);
      } else if (result?.role === 'business') {
        onBizSuccess(result.bizProfile);
      } else if (result?.role === 'no_card') {
        await logout();
        setGeneralError('Kjo llogari nuk ka një kartë aktive për momentin.');
      } else {
        await logout();
        setGeneralError('Kjo llogari nuk ka akses ne aplikacion.');
      }
    } catch (err: any) {
      const msg: string = err?.message ?? 'Ndodhi një gabim. Provo përsëri.';
      if (msg.toLowerCase().includes('fjalëkalim') || msg.toLowerCase().includes('password')) {
        setPassError(msg);
      } else {
        setGeneralError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => performLogin(username, password);

  const handleSavedLogin = async () => {
    if (!savedLogin) return;

    setUsername(savedLogin.username);
    setPassword('');
    setPassError('Shkruaj fjalëkalimin për të hyrë në këtë pajisje.');
  };

  const handleOpenPasswordReset = async () => {
    try {
      await Linking.openURL(resetPrefillUrl);
    } catch (_) {
      Alert.alert('Gabim', 'Nuk u hap faqja e rikuperimit. Provo përsëri.');
    }
  };

  const handleClearSavedLogin = async () => {
    await clearRememberedLogin();
    setSavedLogin(null);
    setRememberMe(false);
    setPassword('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandWrap}>
          <View style={styles.brandVisuals}>
            <LinearGradient
              colors={['#ffffff', '#f8fafc']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoBox}
            >
              <Image
                source={BRANDING.assets.appLogo}
                style={styles.appLogo}
                resizeMode="contain"
              />
            </LinearGradient>

            <View style={styles.municipalityBadge}>
              <Image
                source={BRANDING.assets.municipalityLogo}
                style={styles.municipalityLogo}
                resizeMode="contain"
              />
            </View>
          </View>

          <Text style={styles.brandTitle}>{BRANDING.appName}</Text>
          <Text style={styles.brandSub}>{BRANDING.cityName}</Text>

          <View style={styles.brandMeta}>
            <Landmark size={14} color={Colors.textSecondary} strokeWidth={2} />
            <Text style={styles.brandMetaText}>{BRANDING.municipalityName}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hyrja ne llogari</Text>
          <Text style={styles.cardSub}>Përdor kredencialet e dhena nga bashkia.</Text>

          {!!notice && (
            <View style={styles.noticeBox}>
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          )}

          {!!generalError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>{generalError}</Text>
            </View>
          )}

          {!!savedLogin && (
            <View style={styles.savedBox}>
              <View style={styles.savedCopy}>
                <Text style={styles.savedTitle}>
                  {savedLogin.displayName?.trim() || savedLogin.username}
                </Text>
                <Text style={styles.savedSub}>
                  {savedLogin.email?.trim() || savedLogin.username}
                </Text>
              </View>

              <View style={styles.savedActions}>
                <TouchableOpacity
                  style={styles.savedBtn}
                  onPress={handleSavedLogin}
                  activeOpacity={0.85}
                  disabled={isLoading}
                >
                  <LogIn size={16} color={Colors.brandGreenDark} strokeWidth={2} />
                  <Text style={styles.savedBtnText}>Përdor llogarine</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.savedClearBtn}
                  onPress={handleClearSavedLogin}
                  activeOpacity={0.85}
                  disabled={isLoading}
                >
                  <Trash2 size={15} color={Colors.textMuted} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Emri i përdoruesit</Text>
            <View style={[styles.inputBox, !!userError && styles.inputError]}>
              <TextInput
                style={styles.input}
                placeholder="p.sh. student.shkoder"
                placeholderTextColor={Colors.textMuted}
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  setUserError('');
                  setGeneralError('');
                }}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
            {!!userError && <Text style={styles.errorText}>{userError}</Text>}
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Fjalëkalimi</Text>
            <View style={[styles.inputBox, !!passError && styles.inputError]}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="........"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setPassError('');
                  setGeneralError('');
                }}
                secureTextEntry={!showPass}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                onPress={() => setShowPass((value) => !value)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {showPass ? (
                  <EyeOff size={18} color={Colors.textMuted} strokeWidth={2} />
                ) : (
                  <Eye size={18} color={Colors.textMuted} strokeWidth={2} />
                )}
              </TouchableOpacity>
            </View>
            {!!passError && <Text style={styles.errorText}>{passError}</Text>}
          </View>

          <View style={styles.helperRow}>
            <TouchableOpacity
              style={styles.rememberToggle}
              onPress={() => setRememberMe((value) => !value)}
              activeOpacity={0.85}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                {rememberMe ? <Check size={14} color="#fff" strokeWidth={3} /> : null}
              </View>
              <Text style={styles.rememberText}>Mbaje mend këtë llogari</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleOpenPasswordReset}
              activeOpacity={0.8}
              style={styles.resetLink}
            >
              <Text style={styles.resetLinkText}>Rikupero fjalëkalimin</Text>
              <ExternalLink size={14} color={Colors.brandGreenDark} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <Text style={styles.helperText}>
            Ruhet vetëm llogaria në këtë pajisje. Fjalëkalimi nuk ruhet në aplikacion.
          </Text>

          <TouchableOpacity
            style={[styles.btn, isLoading && styles.btnDisabled]}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#a3e635', '#65a30d']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.btnText}>Hyr ne llogari</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          {BRANDING.appName} {BRANDING.cityName} - {BRANDING.footerVersion}{'\n'}
          <Text style={styles.footerMuted}>Ndertuar nga {BRANDING.municipalityName}</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surfaceBg },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xxl, alignItems: 'center' },

  brandWrap: { alignItems: 'center', marginBottom: Spacing.xxxl },
  brandVisuals: {
    position: 'relative',
    marginBottom: Spacing.lg,
  },
  logoBox: {
    width: 104,
    height: 104,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  appLogo: {
    width: 72,
    height: 72,
  },
  municipalityBadge: {
    position: 'absolute',
    right: -12,
    bottom: -8,
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  municipalityLogo: {
    width: 28,
    height: 28,
  },
  brandTitle: {
    fontFamily: Typography.fontExtraBold,
    fontSize: Typography.h2,
    color: Colors.textPrimary,
  },
  brandSub: {
    fontFamily: Typography.fontMedium,
    fontSize: Typography.lg,
    color: Colors.textMuted,
    marginTop: 2,
  },
  brandMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  brandMetaText: {
    fontFamily: Typography.fontMedium,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },

  card: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: Radius.xxl,
    padding: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
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
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    marginBottom: Spacing.lg,
  },
  errorBoxText: {
    fontFamily: Typography.fontMedium,
    fontSize: Typography.sm,
    color: '#991b1b',
    lineHeight: 18,
  },
  savedBox: {
    backgroundColor: '#f7fee7',
    borderWidth: 1,
    borderColor: Colors.brandGreenBorder,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  savedCopy: {
    gap: 2,
  },
  savedTitle: {
    fontFamily: Typography.fontBold,
    fontSize: Typography.md,
    color: Colors.textPrimary,
  },
  savedSub: {
    fontFamily: Typography.fontMedium,
    fontSize: Typography.sm,
    color: Colors.brandGreenText,
  },
  savedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  savedBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: Radius.md,
    backgroundColor: '#ecfccb',
    borderWidth: 1,
    borderColor: Colors.brandGreenBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: Spacing.md,
  },
  savedBtnText: {
    fontFamily: Typography.fontBold,
    fontSize: Typography.sm,
    color: Colors.brandGreenDeep,
  },
  savedClearBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },

  fieldWrap: { marginBottom: Spacing.lg },
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
  passwordInput: {
    flex: 1,
  },
  errorText: {
    fontFamily: Typography.fontMedium,
    fontSize: Typography.sm,
    color: Colors.danger,
    marginTop: 6,
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
    flexWrap: 'wrap',
  },
  rememberToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.brandGreenDark,
    borderColor: Colors.brandGreenDark,
  },
  rememberText: {
    fontFamily: Typography.fontMedium,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  resetLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resetLinkText: {
    fontFamily: Typography.fontBold,
    fontSize: Typography.sm,
    color: Colors.brandGreenDark,
  },
  helperText: {
    fontFamily: Typography.fontMedium,
    fontSize: Typography.sm,
    color: Colors.textMuted,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },

  btn: { borderRadius: Radius.lg, overflow: 'hidden', marginTop: Spacing.sm },
  btnDisabled: { opacity: 0.7 },
  btnGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  btnText: {
    fontFamily: Typography.fontExtraBold,
    fontSize: Typography.md,
    color: '#fff',
    letterSpacing: 0.3,
  },

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
