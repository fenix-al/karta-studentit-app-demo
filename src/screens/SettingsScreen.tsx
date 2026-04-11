import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Switch, Alert, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft, ChevronRight,
  User, Lock, Bell,
  HelpCircle, FileText, Shield, LogOut,
} from 'lucide-react-native';

import { Colors, Typography, Spacing, Radius } from '../constants/Theme';

interface Props {
  onBack:      () => void;
  bottomInset: number;
  onLogout?:   () => void;
}

// Shared row component
function SettingRow({
  icon, iconBg, iconColor, title,
  rightElement, isLast = false, isDestructive = false, onPress,
}: {
  icon:           React.ReactNode;
  iconBg:         string;
  iconColor:      string;
  title:          string;
  rightElement?:  React.ReactNode;
  isLast?:        boolean;
  isDestructive?: boolean;
  onPress?:       () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, !isLast && styles.rowBorder]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
          {icon}
        </View>
        <Text style={[styles.rowTitle, isDestructive && styles.rowTitleDestructive]}>
          {title}
        </Text>
      </View>
      <View style={styles.rowRight}>
        {rightElement}
        {!isDestructive && !rightElement && (
          <ChevronRight size={16} color={Colors.textMuted} strokeWidth={2} />
        )}
        {!isDestructive && rightElement && typeof rightElement !== 'object' && (
          <ChevronRight size={16} color={Colors.textMuted} strokeWidth={2} />
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen({ onBack, bottomInset, onLogout }: Props) {
  const insets = useSafeAreaInsets();
  const [notifEnabled, setNotifEnabled] = useState(true);

  const confirmLogout = () =>
    Alert.alert('Kujdes', 'Jeni te sigurt qe deshironi te dilni nga llogaria?', [
      { text: 'Anulo', style: 'cancel' },
      { text: 'Dil', style: 'destructive', onPress: onLogout },
    ]);


  return (
    <View style={styles.root}>

      {/* Header */}
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

        {/* Llogaria Ime */}
        <Text style={styles.groupLabel}>Llogaria Ime</Text>
        <View style={styles.group}>
          <SettingRow
            icon={<User size={16} color="#0284c7" strokeWidth={2} />}
            iconBg="#e0f2fe" iconColor="#0284c7"
            title="Të dhënat personale"
            onPress={() => Alert.alert('Nuk disponohet', 'Kjo faqe do te shtohet se shpejti.')}
          />
          <SettingRow
            icon={<Lock size={16} color="#d97706" strokeWidth={2} />}
            iconBg="#fffbeb" iconColor="#d97706"
            title="Siguria & Fjalëkalimi"
            onPress={() => Alert.alert('Nuk disponohet', 'Kjo faqe do te shtohet se shpejti.')}
          />
          <SettingRow
            icon={<Bell size={16} color="#e11d48" strokeWidth={2} />}
            iconBg="#fff1f2" iconColor="#e11d48"
            title="Njoftimet (Push)"
            isLast
            rightElement={
              <Switch
                value={notifEnabled}
                onValueChange={setNotifEnabled}
                trackColor={{ false: Colors.border, true: '#10b981' }}
                thumbColor="#fff"
              />
            }
          />
        </View>

        {/* Ndihmë & Informacion */}
        <Text style={styles.groupLabel}>Ndihmë & Informacion</Text>
        <View style={styles.group}>
          <SettingRow
            icon={<HelpCircle size={16} color="#0d9488" strokeWidth={2} />}
            iconBg="#f0fdfa" iconColor="#0d9488"
            title="Qendra e Ndihmës (FAQ)"
            onPress={() => {}}
          />
          <SettingRow
            icon={<FileText size={16} color="#64748b" strokeWidth={2} />}
            iconBg="#f8fafc" iconColor="#64748b"
            title="Kushtet e Përdorimit"
            onPress={() => {}}
          />
          <SettingRow
            icon={<Shield size={16} color="#64748b" strokeWidth={2} />}
            iconBg="#f8fafc" iconColor="#64748b"
            title="Politikat e Privatësisë"
            isLast
            onPress={() => {}}
          />
        </View>

        {/* Zona e Rrezikut */}
        <View style={styles.group}>
          <SettingRow
            icon={<LogOut size={16} color="#e11d48" strokeWidth={2} />}
            iconBg="#fff1f2" iconColor="#e11d48"
            title="Dil nga llogaria"
            isDestructive
            isLast
            onPress={confirmLogout}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>Karta e Studentit Shkodër</Text>
          <Text style={styles.footerSub}>Versioni 2.0.1 • Ndërtuar nga Bashkia</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.surfaceBg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xl },

  // Header
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  iconBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: {
    fontFamily: Typography.fontExtraBold, fontSize: Typography.xl, color: Colors.textPrimary,
  },

  // Group
  groupLabel: {
    fontFamily: Typography.fontBold, fontSize: 11,
    color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.9,
    marginBottom: 8, marginLeft: 4, marginTop: Spacing.xl,
  },
  group: {
    backgroundColor: Colors.white, borderRadius: Radius.xxl,
    borderWidth: 1, borderColor: Colors.borderLight, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },

  // Row
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: 14,
    backgroundColor: Colors.white,
  },
  rowBorder: {
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  rowLeft:  { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowIcon: {
    width: 36, height: 36, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  rowTitle: {
    fontFamily: Typography.fontBold, fontSize: Typography.md, color: Colors.textPrimary,
  },
  rowTitleDestructive: { color: '#e11d48' },
  rowHint: {
    fontFamily: Typography.fontBold, fontSize: Typography.sm, color: Colors.textMuted,
  },

  // Footer
  footer: { alignItems: 'center', paddingTop: Spacing.xxxl, paddingBottom: Spacing.lg },
  footerTitle: {
    fontFamily: Typography.fontExtraBold, fontSize: Typography.md, color: Colors.textPrimary, marginBottom: 4,
  },
  footerSub: {
    fontFamily: Typography.fontMedium, fontSize: 11, color: Colors.textMuted,
  },
});

