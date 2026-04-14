import React, { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, User, Lock, Bell, HelpCircle, FileText, Shield, LogOut } from 'lucide-react-native';

import { BRANDING } from '../constants/branding';
import { PASSWORD_RESET_URL } from '../constants/config';
import { Colors, Typography, Spacing, Radius } from '../constants/Theme';
import { useAuth } from '../context/AuthContext';
import { fetchPrivacyPolicy, PrivacyPolicyApiResponse } from '../services/api';
import {
  getPushNotificationsPreference,
  PUSH_NOTIFICATIONS_ENABLED_KEY,
  syncPushTokenWithBackend,
  unregisterPushTokenFromBackend,
} from '../services/pushNotifications';
import SettingsFaqContent from './settings/SettingsFaqContent';
import SettingsSubscreen from './settings/SettingsSubscreen';
import SettingsTermsContent from './settings/SettingsTermsContent';

type SettingsView =
  | 'settings'
  | 'personal'
  | 'security'
  | 'notifications'
  | 'faq'
  | 'terms'
  | 'privacy';

interface Props {
  onBack: () => void;
  bottomInset: number;
  onLogout?: () => void;
  initialScreen?: SettingsView;
  onInitialScreenHandled?: () => void;
}

function SettingRow({
  icon,
  title,
  rightElement,
  isLast = false,
  isDestructive = false,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  rightElement?: React.ReactNode;
  isLast?: boolean;
  isDestructive?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.row, !isLast && styles.rowBorder]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowLeft}>
        <View style={styles.rowIcon}>{icon}</View>
        <Text style={[styles.rowTitle, isDestructive && styles.rowTitleDestructive]}>{title}</Text>
      </View>
      <View style={styles.rowRight}>
        {rightElement}
        {!isDestructive && !rightElement && <ChevronRight size={16} color={Colors.textMuted} strokeWidth={2} />}
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen({
  onBack,
  bottomInset,
  onLogout,
  initialScreen = 'settings',
  onInitialScreenHandled,
}: Props) {
  const insets = useSafeAreaInsets();
  const { card } = useAuth();
  const [activeView, setActiveView] = useState<SettingsView>(initialScreen);
  const [policy, setPolicy] = useState<PrivacyPolicyApiResponse | null>(null);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  useEffect(() => {
    setActiveView(initialScreen);
    onInitialScreenHandled?.();
  }, [initialScreen]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        if (!mounted) return;
        setNotificationsEnabled(await getPushNotificationsPreference());
      } catch {
        if (mounted) setNotificationsEnabled(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const confirmLogout = () =>
    Alert.alert('Kujdes', 'Jeni të sigurt që dëshironi të dilni nga llogaria?', [
      { text: 'Anulo', style: 'cancel' },
      { text: 'Dil', style: 'destructive', onPress: onLogout },
    ]);

  const openPasswordReset = async () => {
    try {
      const supported = await Linking.canOpenURL(PASSWORD_RESET_URL);
      if (!supported) {
        Alert.alert('Gabim', 'Lidhja per rikuperimin e fjalekalimit nuk mund te hapet ne kete pajisje.');
        return;
      }
      await Linking.openURL(PASSWORD_RESET_URL);
    } catch {
      Alert.alert('Gabim', 'Nuk u arrit te hapej faqja e rikuperimit te fjalekalimit.');
    }
  };

  const handleNotificationsToggle = async (nextValue: boolean) => {
    if (notificationsLoading) return;

    setNotificationsLoading(true);
    try {
      if (nextValue) {
        const synced = await syncPushTokenWithBackend();
        if (!synced) {
          Alert.alert(
            'Njoftimet nuk u aktivizuan',
            'Lejo njoftimet ne pajisje dhe provo perseri. Ne Expo Go ky funksion nuk aktivizohet.',
          );
          return;
        }
      } else {
        await unregisterPushTokenFromBackend();
      }

      setNotificationsEnabled(nextValue);
      await AsyncStorage.setItem(PUSH_NOTIFICATIONS_ENABLED_KEY, String(nextValue));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nuk u arrit te perditesoheshin njoftimet push. Provo perseri.';
      Alert.alert('Gabim', message);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const loadPrivacyPolicy = async () => {
    setPolicyLoading(true);
    setPolicyError(null);

    try {
      const data = await fetchPrivacyPolicy();
      setPolicy(data);
    } catch (error: any) {
      setPolicyError(error?.message || 'Nuk u arrit të ngarkohej politika e privatësisë.');
    } finally {
      setPolicyLoading(false);
    }
  };

  useEffect(() => {
    if (activeView === 'privacy' && !policy && !policyLoading) {
      loadPrivacyPolicy();
    }
  }, [activeView, policy, policyLoading]);

  useEffect(() => {
    if (activeView !== 'privacy') return;

    const safetyTimer = setTimeout(() => {
      setPolicyLoading((current) => {
        if (!current) return current;
        setPolicyError('Politika nuk u ngarkua nga serveri. Kontrollo nëse endpoint-i i WordPress është aktiv.');
        return false;
      });
    }, 15000);

    return () => clearTimeout(safetyTimer);
  }, [activeView, policyLoading]);

  const policyParagraphs = useMemo(() => {
    const raw = policy?.content_text?.trim();
    if (!raw) return [];
    return raw.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
  }, [policy?.content_text]);

  const personalInfoRows = useMemo(
    () => [
      { label: 'Emri', value: card?.emeri },
      { label: 'Mbiemri', value: card?.mbiemeri },
      { label: 'Email', value: card?.email },
      { label: 'Telefoni', value: card?.telefoni },
      { label: 'NIM', value: card?.nim },
      { label: 'Nr. karte', value: card?.nr_karte },
      { label: 'Fakulteti', value: card?.fakulteti },
      { label: 'Programi', value: card?.programi },
      { label: 'Cikli', value: card?.cikli },
      { label: 'Datelindja', value: card?.datelindja },
      { label: 'Vlefshme deri', value: card?.valid_until },
      { label: 'Statusi', value: mapCardStatusLabel(card?.statusi) },
    ],
    [card],
  );

  if (activeView === 'personal') {
    return (
      <SettingsSubscreen
        title="Të dhënat personale"
        description="Këtu do të qëndrojnë të dhënat bazë të profilit të studentit."
        bottomInset={bottomInset}
        onBack={() => setActiveView('settings')}
      >
        <View style={styles.infoCard}>
          {card ? (
            personalInfoRows.map((item, index) => (
              <View
                key={item.label}
                style={[styles.infoRow, index !== personalInfoRows.length - 1 && styles.infoRowBorder]}
              >
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{formatProfileValue(item.value)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>
              Te dhenat e profilit nuk jane ngarkuar ende. Kthehu mbrapa dhe provo perseri.
            </Text>
          )}
        </View>
      </SettingsSubscreen>
    );
  }

  if (activeView === 'security') {
    return (
      <SettingsSubscreen
        title="Siguria & Fjalëkalimi"
        description="Kjo faqe do të mbajë veprimet që lidhen me sigurinë e llogarisë dhe fjalëkalimin."
        bottomInset={bottomInset}
        onBack={() => setActiveView('settings')}
      >
        <View style={styles.infoCard}>
          <View style={[styles.infoRow, styles.infoRowBorder]}>
            <Text style={styles.infoLabel}>Emaili i llogarise</Text>
            <Text style={styles.infoValue}>{formatProfileValue(card?.email)}</Text>
          </View>
          <View style={[styles.infoRow, styles.infoRowBorder]}>
            <Text style={styles.infoLabel}>Menyra e ndryshimit</Text>
            <Text style={styles.infoValue}>
              Ndryshimi i fjalekalimit behet permes faqes zyrtare te rikuperimit ne WordPress.
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Siguria</Text>
            <Text style={styles.infoValue}>
              Pasi te hapet faqja, mund te kerkosh linkun e rikuperimit dhe te vendosesh nje fjalekalim te ri.
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryAction} activeOpacity={0.85} onPress={openPasswordReset}>
          <Text style={styles.primaryActionText}>Hap rikuperimin e fjalekalimit</Text>
        </TouchableOpacity>
      </SettingsSubscreen>
    );
  }

  if (activeView === 'notifications') {
    return (
      <SettingsSubscreen
        title="Njoftimet (Push)"
        description="Ketu menaxhohet aktivizimi real i njoftimeve push per kete pajisje."
        bottomInset={bottomInset}
        onBack={() => setActiveView('settings')}
      >
        <View style={styles.infoCard}>
          <View style={[styles.toggleRow, styles.infoRowBorder]}>
            <View style={styles.toggleTextWrap}>
              <Text style={styles.infoLabel}>Statusi</Text>
              <Text style={styles.infoValue}>
                {notificationsEnabled ? 'Njoftimet push jane aktive' : 'Njoftimet push jane te fikura'}
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              disabled={notificationsLoading}
              trackColor={{ false: Colors.border, true: '#10b981' }}
              thumbColor="#fff"
            />
          </View>
          <View style={[styles.infoRow, styles.infoRowBorder]}>
            <Text style={styles.infoLabel}>Pajisja</Text>
            <Text style={styles.infoValue}>
              Kur aktivizohet, aplikacioni regjistron token-in e pajisjes ne backend-in e WordPress.
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ruajtja e statusit</Text>
            <Text style={styles.infoValue}>
              Zgjedhja ruhet lokalisht ne pajisje dhe lexohet perseri kur app-i hapet ne vazhdim.
            </Text>
          </View>
        </View>

        {notificationsLoading ? (
          <View style={styles.loadingInline}>
            <ActivityIndicator size="small" color="#003366" />
            <Text style={styles.loadingInlineText}>Duke perditesuar preferencen...</Text>
          </View>
        ) : null}
      </SettingsSubscreen>
    );
  }

  if (activeView === 'faq') {
    return (
      <SettingsSubscreen
        title="Qendra e Ndihmës (FAQ)"
        description="Ketu gjen shpjegime te thjeshta per funksionet kryesore te aplikacionit."
        bottomInset={bottomInset}
        onBack={() => setActiveView('settings')}
      >
        <SettingsFaqContent />
      </SettingsSubscreen>
    );
  }

  if (activeView === 'terms') {
    return (
      <SettingsSubscreen
        title="Kushtet e Përdorimit"
        description="Keto jane kushtet baze te perdorimit te aplikacionit ne nje forme te thjeshte dhe te qarte."
        bottomInset={bottomInset}
        onBack={() => setActiveView('settings')}
      >
        <SettingsTermsContent />
      </SettingsSubscreen>
    );
  }

  if (activeView === 'privacy') {
    return (
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setActiveView('settings')}
            activeOpacity={0.75}
          >
            <ChevronLeft size={20} color={Colors.textPrimary} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Politika e Privatësisë</Text>
          <View style={styles.iconBtn} />
        </View>

        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 32 }]}
        >
          <View style={styles.policyHero}>
            <Image
              source={BRANDING.assets.municipalityLogoHorizontal}
              style={styles.policyHeroLogo}
              resizeMode="contain"
            />
            <Text style={styles.policyEyebrow}>POLITIKA E PRIVATËSISË</Text>
            <Text style={styles.policyTitle}>{policy?.title || 'Politika e Privatësisë'}</Text>
            {!!policy?.intro && <Text style={styles.policyIntro}>{policy.intro}</Text>}
          </View>

          {policyLoading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="small" color="#003366" />
              <Text style={styles.loadingText}>Duke ngarkuar përmbajtjen...</Text>
            </View>
          ) : policyError ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Nuk u ngarkua politika</Text>
              <Text style={styles.errorText}>{policyError}</Text>
              <TouchableOpacity style={styles.retryButton} activeOpacity={0.85} onPress={loadPrivacyPolicy}>
                <Text style={styles.retryButtonText}>Provo përsëri</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.policyCard}>
              {policyParagraphs.length ? (
                policyParagraphs.map((paragraph, index) => (
                  <Text key={`${index}-${paragraph.slice(0, 20)}`} style={styles.policyParagraph}>
                    {paragraph}
                  </Text>
                ))
              ) : (
                <Text style={styles.policyParagraph}>Përmbajtja e politikës do të shfaqet këtu sapo ta plotësoni nga paneli i WordPress.</Text>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.75}>
          <ChevronLeft size={20} color={Colors.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cilësimet</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 32 }]}
      >
        <Text style={styles.groupLabel}>Llogaria Ime</Text>
        <View style={styles.group}>
          <SettingRow
            icon={<User size={16} color="#0284c7" strokeWidth={2} />}
            title="Të dhënat personale"
            onPress={() => setActiveView('personal')}
          />
          <SettingRow
            icon={<Lock size={16} color="#d97706" strokeWidth={2} />}
            title="Siguria & Fjalëkalimi"
            onPress={() => setActiveView('security')}
          />
          <SettingRow
            icon={<Bell size={16} color="#e11d48" strokeWidth={2} />}
            title="Njoftimet (Push)"
            isLast
            onPress={() => setActiveView('notifications')}
            rightElement={<ChevronRight size={16} color={Colors.textMuted} strokeWidth={2} />}
          />
        </View>

        <Text style={styles.groupLabel}>Ndihmë & Informacion</Text>
        <View style={styles.group}>
          <SettingRow
            icon={<HelpCircle size={16} color="#0d9488" strokeWidth={2} />}
            title="Qendra e Ndihmës (FAQ)"
            onPress={() => setActiveView('faq')}
          />
          <SettingRow
            icon={<FileText size={16} color="#64748b" strokeWidth={2} />}
            title="Kushtet e Përdorimit"
            onPress={() => setActiveView('terms')}
          />
          <SettingRow
            icon={<Shield size={16} color="#64748b" strokeWidth={2} />}
            title="Politikat e Privatësisë"
            isLast
            onPress={() => setActiveView('privacy')}
          />
        </View>

        <View style={styles.group}>
          <SettingRow
            icon={<LogOut size={16} color="#e11d48" strokeWidth={2} />}
            title="Dil nga llogaria"
            isDestructive
            isLast
            onPress={confirmLogout}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerTitle}>Karta e Studentit Shkodër</Text>
          <Text style={styles.footerSub}>Versioni 2.0.1 • Ndërtuar nga Bashkia</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surfaceBg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xl },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Typography.fontExtraBold,
    fontSize: Typography.xl,
    color: Colors.textPrimary,
  },
  groupLabel: {
    fontFamily: Typography.fontBold,
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: 8,
    marginLeft: 4,
    marginTop: Spacing.xl,
  },
  group: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    marginBottom: Spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    backgroundColor: Colors.white,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    backgroundColor: '#f8fafc',
  },
  rowTitle: {
    fontFamily: Typography.fontBold,
    fontSize: Typography.md,
    color: Colors.textPrimary,
  },
  rowTitleDestructive: { color: '#e11d48' },
  infoCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radius.xxl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  infoRow: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: 18,
    gap: 8,
  },
  toggleRow: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  toggleTextWrap: {
    flex: 1,
    gap: 6,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: {
    fontFamily: Typography.fontBold,
    fontSize: 12,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  infoValue: {
    fontFamily: Typography.fontSemiBold,
    fontSize: Typography.md,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  emptyText: {
    fontFamily: Typography.fontRegular,
    fontSize: Typography.md,
    lineHeight: 22,
    color: Colors.textSecondary,
    padding: Spacing.xxl,
  },
  primaryAction: {
    minHeight: 52,
    marginTop: Spacing.sm,
    borderRadius: 12,
    backgroundColor: '#003366',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  primaryActionText: {
    fontFamily: Typography.fontBold,
    fontSize: Typography.base,
    color: Colors.white,
    textAlign: 'center',
  },
  loadingInline: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingInlineText: {
    fontFamily: Typography.fontMedium,
    fontSize: Typography.base,
    color: Colors.textSecondary,
  },
  policyHero: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radius.xxl,
    padding: Spacing.xxl,
    marginBottom: Spacing.xl,
  },
  policyHeroLogo: {
    width: 150,
    height: 42,
    marginBottom: 14,
    marginLeft: -10,
  },
  policyEyebrow: {
    fontFamily: Typography.fontBold,
    fontSize: 12,
    color: '#1d4ed8',
    marginBottom: 12,
  },
  policyTitle: {
    fontFamily: Typography.fontExtraBold,
    fontSize: 34,
    lineHeight: 40,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  policyIntro: {
    fontFamily: Typography.fontMedium,
    fontSize: Typography.base,
    lineHeight: 24,
    color: Colors.textSecondary,
  },
  policyCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radius.xxl,
    padding: Spacing.xxl,
    gap: 18,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  policyParagraph: {
    fontFamily: Typography.fontMedium,
    fontSize: Typography.base,
    lineHeight: 28,
    color: Colors.textSecondary,
    marginBottom: 18,
  },
  loadingCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radius.xxl,
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  loadingText: {
    fontFamily: Typography.fontMedium,
    fontSize: Typography.base,
    color: Colors.textSecondary,
  },
  errorCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: Radius.xxl,
    padding: Spacing.xxl,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  errorTitle: {
    fontFamily: Typography.fontExtraBold,
    fontSize: Typography.lg,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  errorText: {
    fontFamily: Typography.fontMedium,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  retryButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#003366',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    fontFamily: Typography.fontBold,
    fontSize: Typography.base,
    color: Colors.white,
  },
  footer: {
    alignItems: 'center',
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.lg,
  },
  footerTitle: {
    fontFamily: Typography.fontExtraBold,
    fontSize: Typography.md,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  footerSub: {
    fontFamily: Typography.fontMedium,
    fontSize: 11,
    color: Colors.textMuted,
  },
});

function formatProfileValue(value?: string | null) {
  const normalized = typeof value === 'string' ? value.trim() : value;
  if (!normalized) return 'Nuk eshte plotesuar';
  return normalized;
}

function mapCardStatusLabel(status?: string) {
  switch (status) {
    case 'active':
      return 'Aktive';
    case 'inactive':
      return 'Jo aktive';
    case 'pending':
      return 'Ne pritje';
    case 'expired':
      return 'E skaduar';
    default:
      return undefined;
  }
}

