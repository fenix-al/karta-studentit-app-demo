// ─────────────────────────────────────────────────────────────────────────────
// BIZ HOME SCREEN — Karta e Studentit App
// Business partner panel — 5-tab layout matching the reference UI.
//
// Data wired in this version:
//   Dashboard header  → bizProfile.name / initials / is_partner  (AuthContext)
//   Dashboard stats   → bizProfile.stats.sot/muaj/unik/total     (AuthContext)
//   Top students      → /biz/top-students (live fetch on mount)
//   Profile (read)    → bizProfile fields (AuthContext — no extra fetch)
//   Promo tab         → /biz/campaigns GET + POST (history + submit form)
//   Scanner tab       → BLOCKED (no camera library confirmed)
//   Chat tab          → future scope (no backend)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from 'expo-camera';
import {
  Home,
  QrCode,
  Megaphone,
  User,
  LogOut,
  TrendingUp,
  Users,
  Calendar,
  Award,
  Shield,
  MessageCircle,
} from 'lucide-react-native';

import { Colors, Typography, Spacing, Radius } from '../../constants/Theme';
import { useAuth } from '../../context/AuthContext';
import {
  ApiError,
  fetchBizTopStudents,
  fetchBizCampaigns,
  postBizCampaign,
  postBizScan,
} from '../../services/api';
import { BizCampaign, BizScanResponse, BizTopStudent } from '../../types';

type Tab = 'dashboard' | 'scanner' | 'promo' | 'chat' | 'profile';

// Approx bottom nav visible height — used to pad ScrollView content
const NAV_VISIBLE_HEIGHT = 64;

// ── Promo tab constants ────────────────────────────────────────────────────────
const LLOJI_OPTIONS = ['Zbritje', 'Ofertë Speciale', 'Ngjarje', 'Tjetër'] as const;

const STATUSI_CFG = {
  pending:  { label: 'Në Pritje', color: '#92400e', bg: '#fef3c7', border: '#fde68a' },
  approved: { label: 'Aprovuar',  color: '#065f46', bg: '#d1fae5', border: '#a7f3d0' },
  rejected: { label: 'Refuzuar',  color: '#991b1b', bg: '#fee2e2', border: '#fca5a5' },
} as const;

function fmtDate(mysql: string): string {
  // "2024-01-15 10:30:00"  →  "15/01/2024"
  const d = mysql.split(' ')[0].split('-');
  return d.length === 3 ? `${d[2]}/${d[1]}/${d[0]}` : mysql;
}

function extractScanToken(rawValue: string): string | null {
  const value = rawValue.trim();
  if (!value) return null;

  const kartaMatch = value.match(/\/karta\/([A-Za-z0-9_-]+)/i);
  if (kartaMatch?.[1]) return kartaMatch[1];

  try {
    const parsed = new URL(value);
    const queryToken = parsed.searchParams.get('token')?.trim();
    if (queryToken) return queryToken;

    const pathToken = parsed.pathname.match(/\/karta\/([A-Za-z0-9_-]+)/i)?.[1];
    if (pathToken) return pathToken;

    const segments = parsed.pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    if (lastSegment && /^[A-Za-z0-9_-]+$/.test(lastSegment)) return lastSegment;
  } catch (_) {
    // Not a URL; continue with raw token fallback.
  }

  if (/^[A-Za-z0-9_-]+$/.test(value)) return value;
  return null;
}

type ScannerCapture = {
  type: string;
  rawValue: string;
  token: string;
};

function formatCountdown(totalSeconds: number | null): string {
  if (totalSeconds == null || totalSeconds <= 0) return '00:00:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map(part => String(part).padStart(2, '0')).join(':');
}

export default function BizHomeScreen() {
  const { bizProfile, onLogout, refreshCard } = useAuth();
  const insets = useSafeAreaInsets();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const [topStudents,      setTopStudents]      = useState<BizTopStudent[]>([]);
  const [topStudentsLoading, setTopStudentsLoading] = useState(true);
  const [topStudentsError,   setTopStudentsError]   = useState(false);

  useEffect(() => {
    fetchBizTopStudents()
      .then(data => { setTopStudents(data); setTopStudentsLoading(false); })
      .catch(() => { setTopStudentsError(true); setTopStudentsLoading(false); });
  }, []);

  // ── Promo tab state ─────────────────────────────────────────────────────────
  const [campaigns,        setCampaigns]        = useState<BizCampaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [campaignsError,   setCampaignsError]   = useState(false);

  // Form
  const [formTitulli,    setFormTitulli]    = useState('');
  const [formLloji,      setFormLloji]      = useState('Zbritje');
  const [formPershkrimi, setFormPershkrimi] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError,      setFormError]      = useState('');
  const [formSuccess,    setFormSuccess]    = useState('');
  const [scannerCapture, setScannerCapture] = useState<ScannerCapture | null>(null);
  const [scannerError,   setScannerError]   = useState('');
  const [scanSubmitting, setScanSubmitting] = useState(false);
  const [scanResult,     setScanResult]     = useState<BizScanResponse | null>(null);
  const [scanSubmitError, setScanSubmitError] = useState('');
  const [cooldownRemaining, setCooldownRemaining] = useState<number | null>(null);

  // Lazy-load campaigns on first visit to promo tab
  const campaignsLoadedRef = useRef(false);

  useEffect(() => {
    if (activeTab !== 'promo' || campaignsLoadedRef.current) return;
    campaignsLoadedRef.current = true;
    setCampaignsLoading(true);
    fetchBizCampaigns()
      .then(data => { setCampaigns(data); setCampaignsLoading(false); })
      .catch(() => { setCampaignsError(true); setCampaignsLoading(false); });
  }, [activeTab]);

  useEffect(() => {
    if (cooldownRemaining == null || cooldownRemaining <= 0) {
      if (cooldownRemaining === 0) setCooldownRemaining(null);
      return;
    }

    const timer = setInterval(() => {
      setCooldownRemaining(current => {
        if (current == null || current <= 1) return null;
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  const handleCampaignSubmit = async () => {
    if (!formTitulli.trim() || !formPershkrimi.trim()) {
      setFormError('Plotëso titullin dhe përshkrimin.');
      return;
    }
    setFormSubmitting(true);
    setFormError('');
    setFormSuccess('');
    try {
      await postBizCampaign(formTitulli.trim(), formLloji, formPershkrimi.trim());
      setFormSuccess('Kërkesa u dërgua me sukses. Bashkia do ta shqyrtojë.');
      setFormTitulli('');
      setFormPershkrimi('');
      setFormLloji('Zbritje');
      // Reload history
      const updated = await fetchBizCampaigns();
      setCampaigns(updated);
    } catch (err: any) {
      setFormError(err?.message ?? 'Ndodhi një gabim. Provo përsëri.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const resetScannerCapture = () => {
    setScannerCapture(null);
    setScannerError('');
    setScanResult(null);
    setScanSubmitError('');
    setCooldownRemaining(null);
  };

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (scannerCapture) return;

    const rawValue = result.data?.trim() ?? '';
    const token = extractScanToken(rawValue);

    if (!token) {
      setScannerError('Kodi u lexua, por tokeni nuk u nxor. Provo nje QR tjeter.');
      return;
    }

    setScannerError('');
    setScanResult(null);
    setScanSubmitError('');
    setCooldownRemaining(null);
    setScannerCapture({
      type: result.type,
      rawValue,
      token,
    });
  };

  const handleScanSubmit = async () => {
    if (!scannerCapture?.token || scanSubmitting) return;

    setScanSubmitting(true);
    setScanSubmitError('');

    try {
      const response = await postBizScan(scannerCapture.token);
      setScanResult(response);
      setCooldownRemaining(response.retry_after_seconds ?? null);
      await refreshCard();
    } catch (error) {
      if (error instanceof ApiError && error.code === 'scan_cooldown_active') {
        const cooldownData = error.details?.data as BizScanResponse | undefined;
        if (cooldownData) {
          setScanResult(cooldownData);
          setCooldownRemaining(cooldownData.retry_after_seconds ?? null);
        }
      }
      setScanSubmitError(error instanceof Error ? error.message : 'Ndodhi nje gabim. Provo perseri.');
    } finally {
      setScanSubmitting(false);
    }
  };

  // Guard: bizProfile should always be populated when this screen is shown,
  // but show a spinner if it somehow arrives null (e.g. first render race).
  if (!bizProfile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#003366" />
      </View>
    );
  }

  // ── DASHBOARD ──────────────────────────────────────────────────────────────

  const renderDashboard = () => (
    <ScrollView
      style={styles.tabScroll}
      contentContainerStyle={{
        paddingBottom: NAV_VISIBLE_HEIGHT + insets.bottom + Spacing.xxxl,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Business header ── */}
      <View style={styles.dashHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{bizProfile.initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.bizName}>{bizProfile.name}</Text>
          {bizProfile.is_partner && (
            <View style={styles.partnerRow}>
              <View style={styles.partnerDot} />
              <Text style={styles.partnerLabel}>Partner Zyrtar</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Stats grid (2 × 2) — real data from /biz/me ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Statistikat Kryesore</Text>
          <View style={styles.periodPill}>
            <Text style={styles.periodPillText}>Këtë Muaj</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          {/* Row 1 */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { flex: 1 }]}>
              <View style={styles.statCardTop}>
                <Text style={styles.statCardLabel}>Skanime Sot</Text>
                <TrendingUp size={16} color="#0aa8a7" strokeWidth={2} />
              </View>
              <Text style={styles.statCardNum}>{bizProfile.stats.sot}</Text>
            </View>
            <View style={[styles.statCard, { flex: 1 }]}>
              <View style={styles.statCardTop}>
                <Text style={styles.statCardLabel}>Këtë Muaj</Text>
                <Calendar size={16} color="#3b82f6" strokeWidth={2} />
              </View>
              <Text style={styles.statCardNum}>{bizProfile.stats.muaj}</Text>
            </View>
          </View>

          {/* Row 2 */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { flex: 1 }]}>
              <View style={styles.statCardTop}>
                <Text style={styles.statCardLabel}>Studentë Unikë</Text>
                <Users size={16} color="#f97316" strokeWidth={2} />
              </View>
              <Text style={styles.statCardNum}>{bizProfile.stats.unik}</Text>
            </View>
            <View style={[styles.statCard, { flex: 1 }]}>
              <View style={styles.statCardTop}>
                <Text style={styles.statCardLabel}>Total Historik</Text>
                <Award size={16} color="#a855f7" strokeWidth={2} />
              </View>
              <Text style={styles.statCardNum}>{bizProfile.stats.total}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Top students — real data from /biz/top-students ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏆 Top Klientë (Studentë)</Text>

        {topStudentsLoading && (
          <View style={styles.comingCard}>
            <ActivityIndicator size="small" color={Colors.textMuted} style={{ marginBottom: 8 }} />
            <Text style={styles.comingText}>Duke u ngarkuar klientët kryesorë…</Text>
          </View>
        )}

        {!topStudentsLoading && topStudentsError && (
          <View style={styles.comingCard}>
            <Text style={styles.comingText}>Nuk u ngarkua lista. Provo përsëri.</Text>
          </View>
        )}

        {!topStudentsLoading && !topStudentsError && topStudents.length === 0 && (
          <View style={styles.comingCard}>
            <Text style={styles.comingText}>Asnjë student i skanuar ende.</Text>
          </View>
        )}

        {!topStudentsLoading && !topStudentsError && topStudents.length > 0 && (
          <View style={styles.topList}>
            {topStudents.map((s, i) => {
              const rankColors = ['#f59e0b', '#94a3b8', '#f97316'];
              const rankColor  = rankColors[i] ?? Colors.textMuted;
              return (
                <View key={s.card_id} style={styles.topRow}>
                  <View style={[styles.rankBadge, { backgroundColor: rankColor + '22', borderColor: rankColor + '44' }]}>
                    <Text style={[styles.rankText, { color: rankColor }]}>#{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.topName}>{s.name}</Text>
                    <Text style={styles.topNim}>{s.nim}</Text>
                  </View>
                  <View style={styles.scanBadge}>
                    <Text style={styles.scanBadgeText}>{s.scan_count} skanime</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* ── Trust badge — static, no backend needed ── */}
      <View style={styles.trustCard}>
        <Shield size={22} color="#10b981" style={{ marginBottom: 8 }} />
        <Text style={styles.trustTitle}>Siguria e Garantuar</Text>
        <Text style={styles.trustSub}>
          Sistemi menaxhohet nga Bashkia Shkodër.{'\n'}
          Të dhënat janë të koduara (End-to-End).
        </Text>
        <View style={styles.trustBrand}>
          <View style={styles.trustBrandInner}>
            <View style={{ borderRightWidth: 1, borderRightColor: '#e2e8f0', paddingRight: 12, marginRight: 12 }}>
              {/* Bashkia logo placeholder (initials) */}
              <Text style={{ fontSize: 18, fontFamily: Typography.fontExtraBold, color: '#003366' }}>BS</Text>
            </View>
            <View>
              <Text style={styles.trustBrandLabel}>Ndërtuar &amp; Menaxhuar nga</Text>
              <Text style={styles.trustBrandName}>BASHKIA SHKODËR</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  // ── SCANNER ────────────────────────────────────────────────────────────────

  const renderScanner = () => {
    const isPermissionReady = cameraPermission?.granted === true;
    const canAskAgain = cameraPermission?.canAskAgain !== false;

    return (
      <ScrollView
        style={styles.tabScroll}
        contentContainerStyle={styles.scannerScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.scannerHeader}>
          <QrCode size={28} color="#003366" strokeWidth={2} />
          <Text style={styles.scannerTitle}>Skaneri i QR</Text>
          <Text style={styles.scannerSub}>
            Lejo kamerën për të përgatitur skanimin. Verifikimi dhe dërgimi i skanimit
            do të lidhen në hapin tjetër.
          </Text>
        </View>

        {!isPermissionReady && (
          <View style={styles.scannerInfoCard}>
            <Text style={styles.scannerInfoTitle}>Akses te kamera</Text>
            <Text style={styles.scannerInfoText}>
              {cameraPermission
                ? 'Ky hap kërkon leje për kamerën që të hapet pamja e skanerit.'
                : 'Po kontrollohen lejet e kamerës për këtë pajisje.'}
            </Text>

            {cameraPermission && canAskAgain && (
              <TouchableOpacity
                style={styles.scannerPrimaryBtn}
                onPress={() => { requestCameraPermission(); }}
                activeOpacity={0.85}
              >
                <Text style={styles.scannerPrimaryBtnText}>Lejo Kamerën</Text>
              </TouchableOpacity>
            )}

            {cameraPermission && !cameraPermission.granted && !canAskAgain && (
              <Text style={styles.scannerHintText}>
                Leja është refuzuar në nivel pajisjeje. Aktivizoje nga cilësimet dhe hap
                sërish këtë tab.
              </Text>
            )}
          </View>
        )}

        {(scannerCapture || scannerError) && (
          <View style={styles.scannerInfoCard}>
            <Text style={styles.scannerInfoTitle}>
              {scannerCapture ? 'QR u lexua' : 'QR nuk u kuptua'}
            </Text>

            {scannerCapture ? (
              <>
                <Text style={styles.scannerInfoText}>
                  Tipi: {scannerCapture.type} {'\u2022'} Tokeni u nxor me sukses dhe
                  eshte gati per verifikim.
                </Text>
                <View style={styles.scannerResultBox}>
                  <Text style={styles.scannerResultLabel}>Token</Text>
                  <Text style={styles.scannerResultValue}>{scannerCapture.token}</Text>
                  <Text style={styles.scannerResultLabel}>Vlera e lexuar</Text>
                  <Text style={styles.scannerResultRaw}>{scannerCapture.rawValue}</Text>
                </View>

                {scanResult?.msg ? (
                  <View style={[
                    styles.scanStatusBox,
                    scanSubmitError ? styles.scanStatusErrorBox : styles.scanStatusSuccessBox,
                  ]}>
                    <Text style={[
                      styles.scanStatusText,
                      scanSubmitError ? styles.scanStatusErrorText : styles.scanStatusSuccessText,
                    ]}>
                      {scanSubmitError || scanResult.msg}
                    </Text>
                    {cooldownRemaining != null && (
                      <Text style={styles.scanCooldownText}>
                        Gati perseri pas {formatCountdown(cooldownRemaining)}
                      </Text>
                    )}
                    {scanResult.student ? (
                      <Text style={styles.scanMetaText}>
                        {scanResult.student} • {scanResult.nim}
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[
                    styles.scannerPrimaryBtn,
                    (scanSubmitting || cooldownRemaining != null) && styles.formBtnDisabled,
                  ]}
                  onPress={handleScanSubmit}
                  activeOpacity={0.85}
                  disabled={scanSubmitting || cooldownRemaining != null}
                >
                  <Text style={styles.scannerPrimaryBtnText}>
                    {scanSubmitting
                      ? 'Duke Verifikuar...'
                      : cooldownRemaining != null
                        ? `Gati pas ${formatCountdown(cooldownRemaining)}`
                        : 'Verifiko Karten'}
                  </Text>
                </TouchableOpacity>

                {scanSubmitError && !scanResult?.msg ? (
                  <View style={[styles.scanStatusBox, styles.scanStatusErrorBox]}>
                    <Text style={[styles.scanStatusText, styles.scanStatusErrorText]}>
                      {scanSubmitError}
                    </Text>
                  </View>
                ) : null}
              </>
            ) : (
              <Text style={styles.scannerInfoText}>{scannerError}</Text>
            )}

            <TouchableOpacity
              style={styles.scannerSecondaryBtn}
              onPress={resetScannerCapture}
              activeOpacity={0.85}
            >
              <Text style={styles.scannerSecondaryBtnText}>Skano Perseri</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.cameraShell}>
          {isPermissionReady ? (
            <CameraView
              style={styles.cameraPreview}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              mute
              onBarcodeScanned={handleBarcodeScanned}
            >
              <View style={styles.cameraOverlay}>
                <View style={styles.scannerFrame} />
                <Text style={styles.cameraOverlayText}>
                  Pamja e kamerës është gati. Lidhja me leximin dhe dërgimin e QR do të
                  shtohet në hapin tjetër.
                </Text>
              </View>
            </CameraView>
          ) : (
            <View style={styles.cameraPlaceholder}>
              <QrCode size={56} color={Colors.textMuted} strokeWidth={1.5} />
              <Text style={styles.placeholderTitle}>Pamja e kamerës</Text>
              <Text style={styles.placeholderSub}>
                Jep lejen e kamerës për të aktivizuar këtë zonë pa ndryshuar ende
                rrjedhën e skanimit.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  // ── PROMO ──────────────────────────────────────────────────────────────────

  const renderPromo = () => (
    <ScrollView
      style={styles.tabScroll}
      contentContainerStyle={{
        paddingBottom: NAV_VISIBLE_HEIGHT + insets.bottom + Spacing.xxxl,
        paddingHorizontal: Spacing.xxl,
        paddingTop: Spacing.xl,
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Submission form ── */}
      <Text style={styles.promoSectionTitle}>Kërko Promovim</Text>

      <View style={styles.formCard}>

        {/* Titulli */}
        <Text style={styles.formLabel}>Titulli i Kampanjës</Text>
        <View style={styles.formInputBox}>
          <TextInput
            style={styles.formInput}
            placeholder="p.sh. 20% zbritje për studentët"
            placeholderTextColor={Colors.textMuted}
            value={formTitulli}
            onChangeText={t => { setFormTitulli(t); setFormError(''); setFormSuccess(''); }}
            returnKeyType="next"
            maxLength={120}
          />
        </View>

        {/* Lloji */}
        <Text style={[styles.formLabel, { marginTop: Spacing.lg }]}>Lloji i Ofertës</Text>
        <View style={styles.ljojiRow}>
          {LLOJI_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt}
              style={[styles.ljojiPill, formLloji === opt && styles.ljojiPillActive]}
              onPress={() => { setFormLloji(opt); setFormError(''); setFormSuccess(''); }}
              activeOpacity={0.75}
            >
              <Text style={[styles.ljojiPillText, formLloji === opt && styles.ljojiPillTextActive]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Pershkrimi */}
        <Text style={[styles.formLabel, { marginTop: Spacing.lg }]}>Përshkrimi</Text>
        <View style={[styles.formInputBox, styles.formTextareaBox]}>
          <TextInput
            style={[styles.formInput, styles.formTextarea]}
            placeholder="Përshkruaj ofertën ose ngjarjen në detaje…"
            placeholderTextColor={Colors.textMuted}
            value={formPershkrimi}
            onChangeText={t => { setFormPershkrimi(t); setFormError(''); setFormSuccess(''); }}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={1000}
          />
        </View>

        {/* Feedback messages */}
        {!!formError && (
          <View style={styles.formMsg}>
            <Text style={styles.formMsgError}>{formError}</Text>
          </View>
        )}
        {!!formSuccess && (
          <View style={[styles.formMsg, styles.formMsgSuccessBox]}>
            <Text style={styles.formMsgSuccess}>{formSuccess}</Text>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.formBtn, formSubmitting && styles.formBtnDisabled]}
          onPress={handleCampaignSubmit}
          disabled={formSubmitting}
          activeOpacity={0.85}
        >
          {formSubmitting
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.formBtnText}>Dërgo Kërkesën</Text>
          }
        </TouchableOpacity>

      </View>

      {/* ── Campaign history ── */}
      <Text style={[styles.promoSectionTitle, { marginTop: Spacing.xxxl }]}>Kërkesat e Mia</Text>

      {campaignsLoading && (
        <View style={styles.comingCard}>
          <ActivityIndicator size="small" color={Colors.textMuted} style={{ marginBottom: 8 }} />
          <Text style={styles.comingText}>Duke u ngarkuar kërkesat…</Text>
        </View>
      )}

      {!campaignsLoading && campaignsError && (
        <View style={styles.comingCard}>
          <Text style={styles.comingText}>Nuk u ngarkua lista. Provo përsëri.</Text>
        </View>
      )}

      {!campaignsLoading && !campaignsError && campaigns.length === 0 && (
        <View style={styles.comingCard}>
          <Text style={styles.comingText}>Nuk keni kërkesa të dërguara ende.</Text>
        </View>
      )}

      {!campaignsLoading && !campaignsError && campaigns.length > 0 && (
        <View style={styles.campaignList}>
          {campaigns.map(c => {
            const statusCfg = STATUSI_CFG[c.statusi] ?? STATUSI_CFG['pending'];
            return (
              <View key={c.id} style={styles.campaignRow}>
                <View style={styles.campaignRowTop}>
                  <Text style={styles.campaignTitulli} numberOfLines={2}>{c.titulli}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg, borderColor: statusCfg.border }]}>
                    <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
                  </View>
                </View>
                <View style={styles.campaignMeta}>
                  <Text style={styles.campaignLloji}>{c.lloji}</Text>
                  <Text style={styles.campaignDate}>{fmtDate(c.created_at)}</Text>
                </View>
                {!!c.admin_notes && (
                  <View style={styles.adminNoteBox}>
                    <Text style={styles.adminNoteText}>{c.admin_notes}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

    </ScrollView>
  );

  // ── CHAT ───────────────────────────────────────────────────────────────────

  const renderChat = () => (
    <View style={styles.placeholderScreen}>
      <MessageCircle size={56} color={Colors.textMuted} strokeWidth={1.5} />
      <Text style={styles.placeholderTitle}>Mesazhet</Text>
      <Text style={styles.placeholderSub}>
        Bisedoni me stafin e Bashkisë Shkodër.{'\n'}
        Funksionalitet i ardhshëm.
      </Text>
    </View>
  );

  // ── PROFILE ────────────────────────────────────────────────────────────────

  const renderProfile = () => (
    <ScrollView
      style={styles.tabScroll}
      contentContainerStyle={{
        paddingBottom: NAV_VISIBLE_HEIGHT + insets.bottom + Spacing.xxxl,
        paddingHorizontal: Spacing.xxl,
        paddingTop: Spacing.xl,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar + name */}
      <View style={styles.profileHeader}>
        <View style={styles.profileAvatar}>
          <Text style={styles.avatarText}>{bizProfile.initials}</Text>
        </View>
        <Text style={styles.profileName}>{bizProfile.name}</Text>
        {bizProfile.is_partner && (
          <View style={styles.partnerRow}>
            <View style={styles.partnerDot} />
            <Text style={styles.partnerLabel}>Partner Zyrtar</Text>
          </View>
        )}
      </View>

      {/* Info rows */}
      <View style={styles.infoCard}>
        {[
          { label: 'Adresa',    value: bizProfile.adresa  || '—' },
          { label: 'Telefon',   value: bizProfile.telefon || '—' },
          { label: 'Zbritja',   value: bizProfile.zbritja ? `${bizProfile.zbritja}%` : '—' },
        ].map((row, i, arr) => (
          <View key={row.label} style={[styles.infoRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>{row.label}</Text>
            <Text style={styles.infoValue}>{row.value}</Text>
          </View>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.85}>
        <LogOut size={16} color="#fff" strokeWidth={2} style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>Çkyçu nga llogaria</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ── MAIN RENDER ────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* Content area */}
      <View style={{ flex: 1 }}>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'scanner'   && renderScanner()}
        {activeTab === 'promo'     && renderPromo()}
        {activeTab === 'chat'      && renderChat()}
        {activeTab === 'profile'   && renderProfile()}
      </View>

      {/* Bottom navigation */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 8 }]}>

        {/* Kreu */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('dashboard')}
          activeOpacity={0.7}
        >
          <Home
            size={24}
            color={activeTab === 'dashboard' ? '#003366' : Colors.tabInactive}
            strokeWidth={activeTab === 'dashboard' ? 2.5 : 2}
          />
          <Text style={[styles.navLabel, activeTab === 'dashboard' && styles.navLabelActive]}>
            Kreu
          </Text>
        </TouchableOpacity>

        {/* Promovo */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('promo')}
          activeOpacity={0.7}
        >
          <Megaphone
            size={24}
            color={activeTab === 'promo' ? '#003366' : Colors.tabInactive}
            strokeWidth={activeTab === 'promo' ? 2.5 : 2}
          />
          <Text style={[styles.navLabel, activeTab === 'promo' && styles.navLabelActive]}>
            Promovo
          </Text>
        </TouchableOpacity>

        {/* Scanner FAB (center, elevated) */}
        <TouchableOpacity
          style={styles.fabWrap}
          onPress={() => setActiveTab('scanner')}
          activeOpacity={0.85}
        >
          <View style={[
            styles.fab,
            activeTab === 'scanner' && styles.fabActive,
          ]}>
            <QrCode size={28} color="#fff" strokeWidth={2.5} />
          </View>
        </TouchableOpacity>

        {/* Mesazhet */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('chat')}
          activeOpacity={0.7}
        >
          <MessageCircle
            size={24}
            color={activeTab === 'chat' ? '#003366' : Colors.tabInactive}
            strokeWidth={activeTab === 'chat' ? 2.5 : 2}
          />
          <Text style={[styles.navLabel, activeTab === 'chat' && styles.navLabelActive]}>
            Mesazhet
          </Text>
        </TouchableOpacity>

        {/* Profili */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('profile')}
          activeOpacity={0.7}
        >
          <User
            size={24}
            color={activeTab === 'profile' ? '#003366' : Colors.tabInactive}
            strokeWidth={activeTab === 'profile' ? 2.5 : 2}
          />
          <Text style={[styles.navLabel, activeTab === 'profile' && styles.navLabelActive]}>
            Profili
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  root: {
    flex: 1,
    backgroundColor: Colors.surfaceBg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceBg,
  },

  // ── Tab scroll area ──────────────────────────────────────────────────────────
  tabScroll: {
    flex: 1,
  },

  // ── Dashboard header ─────────────────────────────────────────────────────────
  dashHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  avatarText: {
    color: '#fff',
    fontSize: Typography.xxl,
    fontFamily: Typography.fontExtraBold,
  },
  bizName: {
    fontSize: 20,
    fontFamily: Typography.fontExtraBold,
    color: Colors.textPrimary,
    lineHeight: 26,
    marginBottom: 4,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  partnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0aa8a7',
  },
  partnerLabel: {
    fontSize: Typography.xs,
    fontFamily: Typography.fontBold,
    color: '#0aa8a7',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // ── Section wrapper ──────────────────────────────────────────────────────────
  section: {
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.xxxl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontFamily: Typography.fontExtraBold,
    color: Colors.textPrimary,
  },
  periodPill: {
    backgroundColor: Colors.borderLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  periodPillText: {
    fontSize: Typography.xs,
    fontFamily: Typography.fontBold,
    color: Colors.textSecondary,
  },

  // ── Stats grid ───────────────────────────────────────────────────────────────
  statsGrid: {
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statCardLabel: {
    fontSize: Typography.xs,
    fontFamily: Typography.fontBold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
    marginRight: 4,
  },
  statCardNum: {
    fontSize: 28,
    fontFamily: Typography.fontExtraBold,
    color: '#003366',
    lineHeight: 34,
  },

  // ── Coming-next placeholder card ─────────────────────────────────────────────
  comingCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.xxl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  comingText: {
    fontSize: Typography.sm,
    fontFamily: Typography.fontMedium,
    color: Colors.textMuted,
    textAlign: 'center',
  },

  // ── Trust badge ──────────────────────────────────────────────────────────────
  trustCard: {
    marginHorizontal: Spacing.xxl,
    marginBottom: Spacing.xl,
    backgroundColor: Colors.borderLight,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  trustTitle: {
    fontSize: Typography.xs,
    fontFamily: Typography.fontBold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  trustSub: {
    fontSize: Typography.sm,
    fontFamily: Typography.fontMedium,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  trustBrand: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  trustBrandInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
  },
  trustBrandLabel: {
    fontSize: 9,
    fontFamily: Typography.fontBold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    lineHeight: 12,
  },
  trustBrandName: {
    fontSize: Typography.md,
    fontFamily: Typography.fontExtraBold,
    color: '#003366',
    lineHeight: 18,
  },

  // ── Top students list ────────────────────────────────────────────────────────
  topList: {
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: Typography.sm,
    fontFamily: Typography.fontExtraBold,
  },
  topName: {
    fontSize: Typography.md,
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  scannerScrollContent: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xl,
    paddingBottom: NAV_VISIBLE_HEIGHT + 32,
    gap: Spacing.lg,
  },
  scannerHeader: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  scannerTitle: {
    fontSize: Typography.xl,
    fontFamily: Typography.fontExtraBold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  scannerSub: {
    fontSize: Typography.sm,
    fontFamily: Typography.fontMedium,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  scannerInfoCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.xl,
    gap: 10,
  },
  scannerInfoTitle: {
    fontSize: Typography.md,
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
  },
  scannerInfoText: {
    fontSize: Typography.sm,
    fontFamily: Typography.fontMedium,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  scannerPrimaryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#003366',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
  },
  scannerPrimaryBtnText: {
    fontSize: Typography.sm,
    fontFamily: Typography.fontBold,
    color: '#fff',
  },
  scannerSecondaryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surfaceBg,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scannerSecondaryBtnText: {
    fontSize: Typography.sm,
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
  },
  scannerHintText: {
    fontSize: Typography.sm,
    fontFamily: Typography.fontMedium,
    color: Colors.textMuted,
    lineHeight: 19,
  },
  cameraShell: {
    minHeight: 420,
    borderRadius: Radius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: '#0f172a',
  },
  cameraPreview: {
    minHeight: 420,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    backgroundColor: 'rgba(15, 23, 42, 0.32)',
  },
  scannerFrame: {
    width: '72%',
    aspectRatio: 1,
    maxWidth: 280,
    borderRadius: Radius.xxl,
    borderWidth: 2,
    borderColor: '#ffffff',
    backgroundColor: 'transparent',
  },
  cameraOverlayText: {
    marginTop: Spacing.xl,
    fontSize: Typography.sm,
    fontFamily: Typography.fontMedium,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 20,
  },
  scannerResultBox: {
    backgroundColor: Colors.surfaceBg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
    gap: 6,
  },
  scannerResultLabel: {
    fontSize: Typography.xs,
    fontFamily: Typography.fontBold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  scannerResultValue: {
    fontSize: Typography.sm,
    fontFamily: Typography.fontExtraBold,
    color: '#003366',
  },
  scannerResultRaw: {
    fontSize: Typography.xs,
    fontFamily: Typography.fontMedium,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  scanStatusBox: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    gap: 6,
  },
  scanStatusSuccessBox: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  scanStatusErrorBox: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  scanStatusText: {
    fontSize: Typography.sm,
    fontFamily: Typography.fontBold,
    lineHeight: 20,
  },
  scanStatusSuccessText: {
    color: '#065f46',
  },
  scanStatusErrorText: {
    color: '#991b1b',
  },
  scanCooldownText: {
    fontSize: Typography.sm,
    fontFamily: Typography.fontExtraBold,
    color: '#003366',
  },
  scanMetaText: {
    fontSize: Typography.xs,
    fontFamily: Typography.fontMedium,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  cameraPlaceholder: {
    minHeight: 420,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxxl,
    gap: 12,
    backgroundColor: Colors.surfaceBg,
  },
  topNim: {
    fontSize: Typography.xs,
    fontFamily: Typography.fontMedium,
    color: Colors.textMuted,
  },
  scanBadge: {
    backgroundColor: '#eff6ff',
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  scanBadgeText: {
    fontSize: Typography.xs,
    fontFamily: Typography.fontBold,
    color: '#1d4ed8',
  },

  // ── Profile tab ──────────────────────────────────────────────────────────────
  profileHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
    paddingTop: Spacing.lg,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.lg,
  },
  profileName: {
    fontSize: Typography.xl,
    fontFamily: Typography.fontExtraBold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
    marginBottom: Spacing.xxxl,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoLabel: {
    fontSize: Typography.sm,
    fontFamily: Typography.fontBold,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: Typography.sm,
    fontFamily: Typography.fontMedium,
    color: Colors.textPrimary,
    maxWidth: '60%',
    textAlign: 'right',
  },

  // ── Full-screen placeholders (scanner / promo / chat) ────────────────────────
  // (profile tab is now a ScrollView, not a placeholder)
  placeholderScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxxl,
    gap: 12,
  },
  placeholderTitle: {
    fontSize: Typography.xxl,
    fontFamily: Typography.fontExtraBold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  placeholderSub: {
    fontSize: Typography.base,
    fontFamily: Typography.fontMedium,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Promo tab ────────────────────────────────────────────────────────────────
  promoSectionTitle: {
    fontSize: Typography.lg,
    fontFamily: Typography.fontExtraBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  formLabel: {
    fontSize: Typography.sm,
    fontFamily: Typography.fontBold,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  formInputBox: {
    backgroundColor: Colors.surfaceBg,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
  },
  formTextareaBox: {
    minHeight: 100,
  },
  formInput: {
    fontFamily: Typography.fontMedium,
    fontSize: Typography.md,
    color: Colors.textPrimary,
  },
  formTextarea: {
    minHeight: 80,
  },
  ljojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ljojiPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceBg,
  },
  ljojiPillActive: {
    backgroundColor: '#003366',
    borderColor: '#003366',
  },
  ljojiPillText: {
    fontSize: Typography.sm,
    fontFamily: Typography.fontBold,
    color: Colors.textSecondary,
  },
  ljojiPillTextActive: {
    color: '#fff',
  },
  formMsg: {
    marginTop: Spacing.md,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  formMsgError: {
    fontSize: Typography.sm,
    fontFamily: Typography.fontMedium,
    color: '#991b1b',
    lineHeight: 18,
  },
  formMsgSuccessBox: {
    backgroundColor: '#d1fae5',
    borderColor: '#a7f3d0',
  },
  formMsgSuccess: {
    fontSize: Typography.sm,
    fontFamily: Typography.fontMedium,
    color: '#065f46',
    lineHeight: 18,
  },
  formBtn: {
    marginTop: Spacing.lg,
    backgroundColor: '#003366',
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formBtnDisabled: {
    opacity: 0.6,
  },
  formBtnText: {
    fontSize: Typography.md,
    fontFamily: Typography.fontExtraBold,
    color: '#fff',
    letterSpacing: 0.3,
  },
  campaignList: {
    gap: 10,
  },
  campaignRow: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  campaignRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  campaignTitulli: {
    flex: 1,
    fontSize: Typography.md,
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  statusBadge: {
    borderRadius: Radius.sm,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: Typography.xs,
    fontFamily: Typography.fontExtraBold,
  },
  campaignMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  campaignLloji: {
    fontSize: Typography.xs,
    fontFamily: Typography.fontMedium,
    color: Colors.textMuted,
  },
  campaignDate: {
    fontSize: Typography.xs,
    fontFamily: Typography.fontMedium,
    color: Colors.textMuted,
  },
  adminNoteBox: {
    marginTop: 8,
    backgroundColor: Colors.surfaceBg,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderLeftWidth: 3,
    borderLeftColor: '#94a3b8',
  },
  adminNoteText: {
    fontSize: Typography.xs,
    fontFamily: Typography.fontMedium,
    color: Colors.textSecondary,
    lineHeight: 16,
  },

  // ── Logout button (shown in profile tab) ─────────────────────────────────────
  logoutBtn: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    borderRadius: Radius.lg,
  },
  logoutText: {
    color: '#fff',
    fontSize: Typography.md,
    fontFamily: Typography.fontBold,
  },

  // ── Bottom navigation ────────────────────────────────────────────────────────
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: Spacing.xxl,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  navLabel: {
    fontSize: Typography.xs,
    fontFamily: Typography.fontSemiBold,
    color: Colors.tabInactive,
  },
  navLabelActive: {
    fontFamily: Typography.fontBold,
    color: '#003366',
  },

  // ── Scanner FAB ──────────────────────────────────────────────────────────────
  fabWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -32, // lifts FAB above the nav bar, matching reference -top-6
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0aa8a7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.surfaceBg,
    shadowColor: '#0aa8a7',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  fabActive: {
    backgroundColor: '#003366',
  },
});
