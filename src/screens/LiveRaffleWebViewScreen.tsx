import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ExternalLink, RefreshCw } from 'lucide-react-native';
import { Colors, Spacing, Typography, Radius } from '../constants/Theme';
import { allowedAppOriginWhitelist, sanitizeAllowedAppUrl } from '../utils/urlSecurity';

// react-native-webview is an optional peer dependency.
// Install with: npx expo install react-native-webview
// If not installed, falls back to Linking.openURL (external browser).
let WebView: React.ComponentType<any> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  WebView = require('react-native-webview').WebView;
} catch {
  WebView = null;
}

interface Props {
  url: string;
  title?: string;
  onBack: () => void;
}

export default function LiveRaffleWebViewScreen({ url, title = 'Live Raffle', onBack }: Props) {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const safeUrl = sanitizeAllowedAppUrl(url);

  const header = (
    <View style={[s.header, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity style={s.iconBtn} onPress={onBack} activeOpacity={0.75}>
        <ChevronLeft size={20} color={Colors.textSecondary} strokeWidth={2.5} />
      </TouchableOpacity>
      <Text style={s.headerTitle} numberOfLines={1}>{title}</Text>
      <TouchableOpacity
        style={s.iconBtn}
        onPress={() => {
          if (WebView) { setError(false); webViewRef.current?.reload(); }
          else if (safeUrl) Linking.openURL(safeUrl);
        }}
        activeOpacity={0.8}
      >
        {WebView
          ? <RefreshCw size={16} color={Colors.textPrimary} strokeWidth={2.2} />
          : <ExternalLink size={16} color={Colors.textPrimary} strokeWidth={2.2} />}
      </TouchableOpacity>
    </View>
  );

  // ── Fallback: no WebView package — open in system browser ─────────────────
  if (!safeUrl) {
    return (
      <View style={s.root}>
        {header}
        <View style={s.errorWrap}>
          <Text style={s.errorTitle}>Link i pavlefshem</Text>
          <Text style={s.errorSub}>Ky link nuk eshte nga domain-i zyrtar i aplikacionit.</Text>
        </View>
      </View>
    );
  }

  if (!WebView) {
    return (
      <View style={s.root}>
        {header}
        <View style={s.errorWrap}>
          <Text style={s.errorTitle}>Hap lojën në browser</Text>
          <Text style={s.errorSub}>
            Ky version i app-it hap lojën live në browserin e telefonit.{'\n'}
            Linku i lojtarit është unik dhe i dërguar nga admini.
          </Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => Linking.openURL(safeUrl)} activeOpacity={0.85}>
            <Text style={s.retryBtnText}>Hap në browser</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Normal path: embedded WebView ─────────────────────────────────────────
  return (
    <View style={s.root}>
      {header}
      {error ? (
        <View style={s.errorWrap}>
          <Text style={s.errorTitle}>Nuk u hap dot loja</Text>
          <Text style={s.errorSub}>Kontrollo lidhjen dhe provo sërish.</Text>
          <TouchableOpacity
            style={s.retryBtn}
            onPress={() => { setError(false); webViewRef.current?.reload(); }}
            activeOpacity={0.85}
          >
            <Text style={s.retryBtnText}>Provo sërish</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.retryBtn, { marginTop: 8, backgroundColor: Colors.surfaceBg, borderWidth: 1, borderColor: Colors.borderLight }]}
            onPress={() => Linking.openURL(safeUrl)}
            activeOpacity={0.85}
          >
            <Text style={[s.retryBtnText, { color: Colors.textPrimary }]}>Hap në browser</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.webWrap}>
          <WebView
            ref={webViewRef}
            source={{ uri: safeUrl }}
            style={s.webView}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
            onShouldStartLoadWithRequest={(request: { url: string }) => !!sanitizeAllowedAppUrl(request.url)}
            originWhitelist={allowedAppOriginWhitelist()}
            startInLoadingState={false}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
          />
          {loading ? (
            <View style={s.loadingOverlay}>
              <ActivityIndicator size="large" color={Colors.brandGreenDark} />
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surfaceBg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontFamily: Typography.fontExtraBold,
    fontSize: Typography.lg,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceBg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webWrap: { flex: 1, position: 'relative' },
  webView: { flex: 1, backgroundColor: '#0b1120' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceBg,
  },
  errorWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    gap: 10,
  },
  errorTitle: {
    fontFamily: Typography.fontExtraBold,
    fontSize: Typography.xl,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  errorSub: {
    fontFamily: Typography.fontMedium,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryBtn: {
    marginTop: 8,
    backgroundColor: Colors.brandGreenDark,
    borderRadius: Radius.xl,
    paddingHorizontal: 28,
    paddingVertical: 13,
  },
  retryBtnText: {
    fontFamily: Typography.fontBold,
    fontSize: Typography.base,
    color: Colors.white,
  },
});
