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

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
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
} from 'lucide-react-native';

import { Colors, Typography, Spacing, Radius } from '../../constants/Theme';
import { ACCOUNT_DELETION_URL } from '../../constants/config';
import { useAuth } from '../../context/AuthContext';
import {
  ApiError,
  fetchBizTopStudents,
  fetchBizCampaigns,
  fetchBizVerifyCard,
  postBizCampaign,
  postBizScan,
} from '../../services/api';
import { BizCampaign, BizScanResponse, BizTopStudent } from '../../types';

type Tab = 'dashboard' | 'scanner' | 'promo' | 'profile';

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

function getScannerSubmitErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'not_found':
        return 'Ky QR nuk i perket asnje karte studenti ne sistem.';
      case 'expired':
        return 'Karta e studentit ka skaduar dhe nuk mund te pranohet.';
      case 'inactive':
        return 'Karta e studentit nuk eshte aktive dhe nuk mund te pranohet.';
      case 'scan_cooldown_active':
        return error.message;
      case 'missing_token':
        return 'Tokeni i QR mungon. Provo nje kod tjeter.';
      default:
        return error.message || 'Ndodhi nje gabim ne server. Provo perseri.';
    }
  }

  return error instanceof Error
    ? 'Nuk u lidhem me serverin. Kontrollo internetin dhe provo perseri.'
    : 'Ndodhi nje gabim i papritur. Provo perseri.';
}

function getScannerErrorResult(error: ApiError): BizScanResponse | null {
  const data = error.details?.data as Partial<BizScanResponse> | undefined;
  if (!data) return null;

  const student = typeof data.student === 'string'
    ? data.student
    : [data.emri, data.mbiemeri].filter(Boolean).join(' ').trim();

  if (!student || typeof data.nim !== 'string') return null;

  return {
    student,
    emri: typeof data.emri === 'string' ? data.emri : '',
    mbiemeri: typeof data.mbiemeri === 'string' ? data.mbiemeri : '',
    nim: data.nim,
    nr_karte: typeof data.nr_karte === 'string' ? data.nr_karte : '',
    foto: typeof data.foto === 'string' ? data.foto : null,
    msg: getScannerSubmitErrorMessage(error),
    last_scan_at: typeof data.last_scan_at === 'string' ? data.last_scan_at : undefined,
    next_allowed_at: typeof data.next_allowed_at === 'string' ? data.next_allowed_at : undefined,
    cooldown_seconds: typeof data.cooldown_seconds === 'number' ? data.cooldown_seconds : undefined,
    retry_after_seconds: typeof data.retry_after_seconds === 'number' ? data.retry_after_seconds : undefined,
    cooldown_active: typeof data.cooldown_active === 'boolean' ? data.cooldown_active : undefined,
    scan_count: typeof data.scan_count === 'number' ? data.scan_count : undefined,
  };
}

function formatBizOffer(value: string): string {
  const offer = value.trim();
  if (!offer) return '—';

  if (/%|zbritje|ofert|falas/i.test(offer)) return offer;
  if (/^\d+$/.test(offer)) return `${offer}%`;

  return offer;
}

export default function BizHomeScreen() {
  const { bizProfile, onLogout, refreshCard } = useAuth();
  const insets = useSafeAreaInsets();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const [topStudents,      setTopStudents]      = useState<BizTopStudent[]>([]);
  const [topStudentsLoading, setTopStudentsLoading] = useState(true);
  const [topStudentsError,   setTopStudentsError]   = useState(false);

  const loadTopStudents = useCallback(async (showLoader = true) => {
    if (showLoader) setTopStudentsLoading(true);
    setTopStudentsError(false);

    try {
      const data = await fetchBizTopStudents();
      setTopStudents(data);
    } catch (_) {
      setTopStudentsError(true);
    } finally {
      if (showLoader) setTopStudentsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTopStudents();
  }, [loadTopStudents]);

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
  const [scanPreview,    setScanPreview]    = useState<BizScanResponse | null>(null);
  const [scanPreviewLoading, setScanPreviewLoading] = useState(false);
  const [scanPreviewError, setScanPreviewError] = useState('');
  const [scanSubmitting, setScanSubmitting] = useState(false);
  const [scanResult,     setScanResult]     = useState<BizScanResponse | null>(null);
  const [scanSubmitError, setScanSubmitError] = useState('');
  const [cooldownRemaining, setCooldownRemaining] = useState<number | null>(null);
  const [scanRequiresReset, setScanRequiresReset] = useState(false);

  // Lazy-load campaigns on first visit to promo tab
  const campaignsLoadedRef = useRef(false);

  const loadCampaigns = useCallback(async () => {
    setCampaignsLoading(true);
    setCampaignsError(false);

    try {
      const data = await fetchBizCampaigns();
      setCampaigns(data);
    } catch (_) {
      setCampaignsError(true);
    } finally {
      setCampaignsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab !== 'promo' || campaignsLoadedRef.current) return;
    campaignsLoadedRef.current = true;
    loadCampaigns();
  }, [activeTab, loadCampaigns]);

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
    setScanPreview(null);
    setScanPreviewLoading(false);
    setScanPreviewError('');
    setScanResult(null);
    setScanSubmitError('');
    setCooldownRemaining(null);
    setScanRequiresReset(false);
  };

  const handleBarcodeScanned = async (result: BarcodeScanningResult) => {
    if (scannerCapture || scanPreviewLoading) return;

    const rawValue = result.data?.trim() ?? '';
    const token = extractScanToken(rawValue);

    if (!token) {
      setScannerError('Kodi u lexua, por tokeni nuk u nxor. Provo nje QR tjeter.');
      return;
    }

    setScannerError('');
    setScanPreview(null);
    setScanPreviewError('');
    setScanResult(null);
    setScanSubmitError('');
    setCooldownRemaining(null);
    setScanRequiresReset(false);
    setScannerCapture({
      type: result.type,
      rawValue,
      token,
    });

    setScanPreviewLoading(true);
    try {
      const preview = await fetchBizVerifyCard(token);
      setScanPreview(preview);
    } catch (error) {
      setScanPreviewError(
        error instanceof Error
          ? error.message
          : 'Nuk u ngarkuan te dhenat e kartes per kontroll me foto.'
      );
    } finally {
      setScanPreviewLoading(false);
    }
  };

  const handleScanSubmit = async () => {
    if (!scannerCapture?.token || scanSubmitting) return;

    setScanSubmitting(true);
    setScanSubmitError('');

    try {
      const response = await postBizScan(scannerCapture.token);
      setScanResult(response);
      setCooldownRemaining(response.retry_after_seconds ?? null);
      setScanRequiresReset(true);
      await Promise.allSettled([
        refreshCard(),
        loadTopStudents(false),
      ]);
    } catch (error) {
      if (error instanceof ApiError) {
        const errorResult = getScannerErrorResult(error);
        if (errorResult) {
          setScanResult(errorResult);
          setCooldownRemaining(errorResult.retry_after_seconds ?? null);
        }

        if (['missing_token', 'not_found', 'expired', 'inactive', 'scan_cooldown_active'].includes(error.code ?? '')) {
          setScanRequiresReset(true);
        }
      }
      setScanSubmitError(getScannerSubmitErrorMessage(error));
    } finally {
      setScanSubmitting(false);
    }
  };

  const openAccountDeletionPage = async () => {
    try {
      await Linking.openURL(ACCOUNT_DELETION_URL);
    } catch {
      Alert.alert('Gabim', 'Nuk u arrit te hapej faqja publike per fshirjen e llogarise.');
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
            <Text style={styles.periodPillText}>Në Kohë Reale</Text>
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
        <Text style={styles.sectionTitle}>Top Klientët Kryesorë</Text>

        {topStudentsLoading && (
          <View style={styles.comingCard}>
            <ActivityIndicator size="small" color={Colors.textMuted} style={{ marginBottom: 8 }} />
            <Text style={styles.comingText}>Duke u ngarkuar klientët kryesorë…</Text>
          </View>
        )}

        {!topStudentsLoading && topStudentsError && (
          <View style={styles.comingCard}>
            <Text style={styles.comingText}>Nuk u ngarkua lista. Provo përsëri.</Text>
            <TouchableOpacity
              style={[styles.scannerSecondaryBtn, styles.retryInlineBtn]}
              onPress={() => { loadTopStudents(); }}
              activeOpacity={0.85}
            >
              <Text style={styles.scannerSecondaryBtnText}>Provo përsëri</Text>
            </TouchableOpacity>
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
    const scanHasResolvedResult = !!(scanResult?.msg || scanSubmitError);
    const scanStatusIsError = !!scanSubmitError;
    const previewStudent = scanPreview ?? scanResult;
    const previewIsValid = previewStudent?.valid === true || previewStudent?.msg === 'E VLEFSHME';
    const scanPreviewIsInvalid = !!scanPreview && !previewIsValid;
    const scanActionDisabled = scanSubmitting || scanPreviewLoading || cooldownRemaining != null || scanRequiresReset || scanPreviewIsInvalid;
    const scanActionLabel = scanSubmitting
      ? 'Duke verifikuar...'
      : scanPreviewLoading
        ? 'Duke ngarkuar te dhenat...'
        : cooldownRemaining != null
        ? `Prit ${formatCountdown(cooldownRemaining)}`
        : scanRequiresReset
          ? 'Skano QR tjetër'
          : 'Verifiko Karten';
    const previewInitials = previewStudent?.student
      ? previewStudent.student.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase()
      : '?';

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
            Lejo kamerën, skano QR-në e studentit dhe verifiko menjëherë vlefshmërinë
            e kartës nga ky ekran.
          </Text>
        </View>

        {!isPermissionReady && (
          <View style={styles.scannerInfoCard}>
            <Text style={styles.scannerInfoTitle}>Akses te kamera</Text>
            <Text style={styles.scannerInfoText}>
              {cameraPermission
                ? 'Ky funksion kërkon leje për kamerën që të lexosh QR-në e studentit.'
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
                Kamera është bllokuar nga cilësimet e pajisjes. Aktivizoje nga Settings
                dhe pastaj kthehu te ky ekran për të vazhduar skanimin.
              </Text>
            )}
          </View>
        )}

        {(scannerCapture || scannerError) && (
          <View style={styles.scannerInfoCard}>
            {scannerCapture ? (
              <>
                {scanPreviewLoading ? (
                  <View style={styles.studentPreviewCard}>
                    <ActivityIndicator size="small" color="#003366" />
                    <Text style={styles.studentPreviewLoadingText}>
                      Po ngarkohet foto dhe identiteti i studentit...
                    </Text>
                  </View>
                ) : previewStudent ? (
                  <View style={styles.studentPreviewCard}>
                    {previewStudent.foto ? (
                      <Image source={{ uri: previewStudent.foto }} style={styles.studentPreviewPhoto} />
                    ) : (
                      <View style={styles.studentPreviewFallback}>
                        <Text style={styles.studentPreviewFallbackText}>{previewInitials}</Text>
                      </View>
                    )}
                    <View style={styles.studentPreviewInfo}>
                      <Text style={styles.studentPreviewEyebrow}>Kontrollo personin</Text>
                      <Text style={styles.studentPreviewName}>{previewStudent.student}</Text>
                      <Text style={styles.studentPreviewMeta}>NIM: {previewStudent.nim}</Text>
                      {!!previewStudent.nr_karte && (
                        <Text style={styles.studentPreviewMeta}>Nr. kartes: {previewStudent.nr_karte}</Text>
                      )}
                      {!!previewStudent.msg && (
                        <Text style={[
                          styles.studentPreviewStatus,
                          previewIsValid
                            ? styles.studentPreviewStatusOk
                            : styles.studentPreviewStatusWarn,
                        ]}>
                          {previewStudent.msg}
                        </Text>
                      )}
                    </View>
                  </View>
                ) : scanPreviewError ? (
                  <View style={[styles.scanStatusBox, styles.scanStatusErrorBox]}>
                    <Text style={[styles.scanStatusText, styles.scanStatusErrorText]}>
                      {scanPreviewError}
                    </Text>
                  </View>
                ) : null}

                {scanHasResolvedResult ? (
                  <View style={[
                    styles.scanStatusBox,
                    scanStatusIsError ? styles.scanStatusErrorBox : styles.scanStatusSuccessBox,
                  ]}>
                    <Text style={[
                      styles.scanStatusText,
                      scanStatusIsError ? styles.scanStatusErrorText : styles.scanStatusSuccessText,
                    ]}>
                      {scanSubmitError || scanResult?.msg}
                    </Text>
                    {cooldownRemaining != null && (
                      <Text style={styles.scanCooldownText}>
                        Skanimi tjetër lejohet pas {formatCountdown(cooldownRemaining)}
                      </Text>
                    )}
                    {scanResult?.student ? (
                      <Text style={styles.scanMetaText}>
                        {scanResult.student} • {scanResult.nim}
                      </Text>
                    ) : null}
                    {scanResult?.nr_karte ? (
                      <Text style={styles.scanMetaText}>
                        Nr. kartës: {scanResult.nr_karte}
                      </Text>
                    ) : null}
                    {!scanStatusIsError && typeof scanResult?.scan_count === 'number' ? (
                      <Text style={styles.scanMetaText}>
                        Ky student është skanuar {scanResult.scan_count} herë nga biznesi juaj.
                      </Text>
                    ) : null}
                    {scanStatusIsError && cooldownRemaining != null ? (
                      <Text style={styles.scanMetaText}>
                        Bllokimi 5-orësh është ende aktiv për këtë student.
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                {!scanPreviewIsInvalid && (
                  <TouchableOpacity
                    style={[
                      styles.scannerPrimaryBtn,
                      scanActionDisabled && styles.formBtnDisabled,
                    ]}
                    onPress={handleScanSubmit}
                    activeOpacity={0.85}
                    disabled={scanActionDisabled}
                  >
                    <Text style={styles.scannerPrimaryBtnText}>
                      {scanActionLabel}
                    </Text>
                  </TouchableOpacity>
                )}

                {scanSubmitError && !scanResult?.msg ? (
                  <View style={[styles.scanStatusBox, styles.scanStatusErrorBox]}>
                    <Text style={[styles.scanStatusText, styles.scanStatusErrorText]}>
                      {scanSubmitError}
                    </Text>
                  </View>
                ) : null}
              </>
            ) : (
              <>
                <Text style={styles.scannerInfoTitle}>QR nuk u kuptua</Text>
                <Text style={styles.scannerInfoText}>{scannerError}</Text>
              </>
            )}

            <TouchableOpacity
              style={styles.scannerSecondaryBtn}
              onPress={resetScannerCapture}
              activeOpacity={0.85}
            >
              <Text style={styles.scannerSecondaryBtnText}>Skano QR tjetër</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.cameraShell}>
          {isPermissionReady ? (
            <>
            <CameraView
              style={styles.cameraPreview}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              mute
              onBarcodeScanned={handleBarcodeScanned}
            />
              <View style={styles.cameraOverlay}>
                <View style={styles.scannerFrame} />
                <Text style={styles.cameraOverlayText}>
                  Vendose QR-në brenda kornizës. Sapo të lexohet, karta mund të
                  verifikohet menjëherë.
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.cameraPlaceholder}>
              <QrCode size={56} color={Colors.textMuted} strokeWidth={1.5} />
              <Text style={styles.placeholderTitle}>Pamja e kamerës</Text>
              <Text style={styles.placeholderSub}>
                Jep lejen e kamerës për të aktivizuar skanimin e QR në këtë ekran.
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
          <TouchableOpacity
            style={[styles.scannerSecondaryBtn, styles.retryInlineBtn]}
            onPress={() => { loadCampaigns(); }}
            activeOpacity={0.85}
          >
            <Text style={styles.scannerSecondaryBtnText}>Provo përsëri</Text>
          </TouchableOpacity>
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
          { label: 'Oferta aktive', value: formatBizOffer(bizProfile.zbritja) },
        ].map((row, i, arr) => (
          <View key={row.label} style={[styles.infoRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>{row.label}</Text>
            <Text style={styles.infoValue}>{row.value}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.profileActionCard}
        onPress={() => setActiveTab('promo')}
        activeOpacity={0.88}
      >
        <View style={styles.profileActionIcon}>
          <Megaphone size={22} color="#003366" strokeWidth={2.2} />
        </View>
        <View style={styles.profileActionContent}>
          <Text style={styles.profileActionTitle}>{'K\u00ebrko promovim'}</Text>
          <Text style={styles.profileActionText}>
            {'D\u00ebrgo nj\u00eb ofert\u00eb, zbritje ose ngjarje p\u00ebr student\u00ebt.'}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.desktopInfoCard}>
        <View style={styles.desktopInfoIcon}>
          <TrendingUp size={20} color="#0f766e" strokeWidth={2.2} />
        </View>
        <View style={styles.desktopInfoContent}>
          <Text style={styles.desktopInfoTitle}>{'Raporte dhe t\u00eb dh\u00ebna t\u00eb detajuara'}</Text>
          <Text style={styles.desktopInfoText}>
            {'P\u00ebr analiza m\u00eb t\u00eb plota, eksportime dhe shkarkim t\u00eb dh\u00ebnash, hyni n\u00eb platform\u00eb nga desktop.'}
          </Text>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.85}>
        <LogOut size={16} color="#fff" strokeWidth={2} style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>Çkyçu nga llogaria</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.accountDeleteBtn} onPress={openAccountDeletionPage} activeOpacity={0.85}>
        <Text style={styles.accountDeleteText}>Kerko fshirjen e llogarise</Text>
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
  retryInlineBtn: {
    alignSelf: 'center',
    marginTop: Spacing.md,
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
    ...StyleSheet.absoluteFillObject,
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
  studentPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  studentPreviewPhoto: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: Colors.surfaceBg,
    borderWidth: 3,
    borderColor: '#0aa8a7',
  },
  studentPreviewFallback: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#e0f2fe',
    borderWidth: 3,
    borderColor: '#0aa8a7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentPreviewFallbackText: {
    fontSize: Typography.xl,
    fontFamily: Typography.fontExtraBold,
    color: '#003366',
  },
  studentPreviewInfo: {
    flex: 1,
  },
  studentPreviewEyebrow: {
    fontSize: Typography.xs,
    fontFamily: Typography.fontExtraBold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  studentPreviewName: {
    fontSize: Typography.lg,
    fontFamily: Typography.fontExtraBold,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  studentPreviewMeta: {
    marginTop: 3,
    fontSize: Typography.sm,
    fontFamily: Typography.fontMedium,
    color: Colors.textSecondary,
  },
  studentPreviewStatus: {
    marginTop: 8,
    fontSize: Typography.sm,
    fontFamily: Typography.fontExtraBold,
  },
  studentPreviewStatusOk: {
    color: '#065f46',
  },
  studentPreviewStatusWarn: {
    color: '#92400e',
  },
  studentPreviewLoadingText: {
    flex: 1,
    fontSize: Typography.sm,
    fontFamily: Typography.fontMedium,
    color: Colors.textSecondary,
    lineHeight: 19,
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
  profileActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  profileActionIcon: {
    width: 46,
    height: 46,
    borderRadius: Radius.lg,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  profileActionContent: {
    flex: 1,
  },
  profileActionTitle: {
    fontSize: Typography.md,
    fontFamily: Typography.fontExtraBold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  profileActionText: {
    fontSize: Typography.sm,
    fontFamily: Typography.fontMedium,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  desktopInfoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ecfdf5',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  desktopInfoIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.lg,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  desktopInfoContent: {
    flex: 1,
  },
  desktopInfoTitle: {
    fontSize: Typography.sm,
    fontFamily: Typography.fontExtraBold,
    color: '#064e3b',
    marginBottom: 5,
  },
  desktopInfoText: {
    fontSize: Typography.sm,
    fontFamily: Typography.fontMedium,
    color: '#0f766e',
    lineHeight: 19,
  },
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
  accountDeleteBtn: {
    marginTop: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 13,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  accountDeleteText: {
    color: '#dc2626',
    fontSize: Typography.md,
    fontFamily: Typography.fontBold,
    textAlign: 'center',
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
