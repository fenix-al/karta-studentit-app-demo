import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Briefcase,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  Image as ImageIcon,
  ImagePlus,
  Lightbulb,
  MessageCircle,
  Send,
  Wrench,
  X,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

import { BRANDING } from '../constants/branding';
import { Colors, Radius, Typography } from '../constants/Theme';
import { useFetch } from '../hooks/useFetch';
import {
  createSupportTicket,
  fetchMySupportTickets,
  markSupportTicketsRead,
  replySupportTicket,
  uploadSupportAttachment,
} from '../services/api';
import { SupportTicketApiItem } from '../types';

const categories = [
  { id: 'karta', label: 'Karta ime', Icon: CreditCard },
  { id: 'sugjerim', label: 'Sugjerim', Icon: Lightbulb },
  { id: 'biznes', label: 'Një biznes', Icon: Briefcase },
  { id: 'teknike', label: 'Teknike', Icon: Wrench },
] as const;

type CategoryId = (typeof categories)[number]['id'];
type ModalTab = 'form' | 'history';

interface Props {
  openRequest?: { key: number; tab: ModalTab };
  onHandledOpenRequest?: () => void;
}

export default function FloatingChat({ openRequest, onHandledOpenRequest }: Props) {
  const [isBubbleOpen, setIsBubbleOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<ModalTab>('form');
  const [activeCategory, setActiveCategory] = useState<CategoryId | ''>('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<{ uri: string; name: string; mimeType: string } | null>(null);
  const [expandedTicketId, setExpandedTicketId] = useState<number | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittingReplyTicketId, setSubmittingReplyTicketId] = useState<number | null>(null);
  const scale = useRef(new Animated.Value(1)).current;

  const {
    data: supportTicketsData,
    loading: supportTicketsLoading,
    error: supportTicketsError,
    reload: reloadSupportTickets,
  } = useFetch(() => fetchMySupportTickets());

  const supportTickets = useMemo(
    () => (supportTicketsData ?? []).map((item: SupportTicketApiItem) => ({
      id: item.id,
      subject: item.subject,
      categoryLabel: item.category_label,
      status: item.status_label,
      statusRaw: item.status,
      unreadCount: item.unread_count ?? 0,
      hasUnread: Boolean(item.has_unread),
      messages: (item.messages ?? []).map((m) => ({
        id: m.id,
        senderType: m.sender_type,
        senderName: m.sender_name,
        message: m.message,
        attachmentUrl: m.attachment_url,
        createdAt: formatTicketDate(m.created_at),
      })),
    })),
    [supportTicketsData],
  );

  const totalUnread = useMemo(
    () => supportTickets.reduce((sum, ticket) => sum + ticket.unreadCount, 0),
    [supportTickets],
  );

  useEffect(() => {
    if (!openRequest?.key) return;
    setModalTab(openRequest.tab);
    setIsModalOpen(true);
    setIsBubbleOpen(true);
    reloadSupportTickets();
    onHandledOpenRequest?.();
  }, [openRequest?.key]);

  useEffect(() => {
    if (!isModalOpen || modalTab !== 'history' || totalUnread <= 0) return;
    let cancelled = false;
    (async () => {
      try {
        await markSupportTicketsRead();
        if (!cancelled) await reloadSupportTickets();
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [isModalOpen, modalTab, totalUnread, reloadSupportTickets]);

  const selectedCategory = useMemo(
    () => categories.find((item) => item.id === activeCategory) ?? null,
    [activeCategory],
  );

  const toggleBubble = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    setIsBubbleOpen((prev) => !prev);
  };

  const resetForm = () => {
    setActiveCategory('');
    setSubject('');
    setMessage('');
    setAttachment(null);
    setIsSubmitting(false);
    setIsSuccess(false);
  };

  const closeModal = () => {
    if (isSubmitting || submittingReplyTicketId !== null) return;
    setIsModalOpen(false);
    setTimeout(() => {
      resetForm();
      setModalTab('form');
    }, 220);
  };

  const handleAttachmentPress = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Leja mungon', 'Lejo aksesin të fotot për të bashkëngjitur një screenshot.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const mimeType = asset.mimeType || 'image/jpeg';
    const extension = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
    setAttachment({
      uri: asset.uri,
      name: asset.fileName || `support-ticket.${extension}`,
      mimeType,
    });
  };

  const handleSubmit = async () => {
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();
    if (!selectedCategory) {
      Alert.alert('Kategoria', 'Zgjidh një kategori para se ta dërgosh mesazhin.');
      return;
    }
    if (!cleanSubject || !cleanMessage) {
      Alert.alert('Plotëso fushat', 'Shkruaj subjektin dhe mesazhin.');
      return;
    }
    setIsSubmitting(true);
    try {
      let uploadedAttachment: { attachment_id: number; attachment_url: string } | undefined;
      if (attachment) uploadedAttachment = await uploadSupportAttachment(attachment);
      const result = await createSupportTicket({
        category: selectedCategory.id,
        subject: cleanSubject,
        message: cleanMessage,
        attachment_id: uploadedAttachment?.attachment_id,
        attachment_url: uploadedAttachment?.attachment_url,
      });
      if (!result?.success) throw new Error(result?.msg || 'Mesazhi nuk u dërgua.');
      setIsSuccess(true);
      await reloadSupportTickets();
      setTimeout(() => {
        resetForm();
        setModalTab('history');
      }, 1800);
    } catch (error: any) {
      Alert.alert('Gabim', error?.message || 'Nuk u lidh me serverin. Provo përsëri.');
      setIsSubmitting(false);
    }
  };

  const handleReply = async (ticketId: number) => {
    const draft = (replyDrafts[ticketId] || '').trim();
    if (!draft) return;
    setSubmittingReplyTicketId(ticketId);
    try {
      const result = await replySupportTicket(ticketId, { message: draft });
      if (!result?.success) throw new Error(result?.msg || 'Përgjigjja nuk u dërgua.');
      setReplyDrafts((prev) => ({ ...prev, [ticketId]: '' }));
      await reloadSupportTickets();
      setExpandedTicketId(ticketId);
    } catch (error: any) {
      Alert.alert('Gabim', error?.message || 'Përgjigjja nuk u dërgua.');
    } finally {
      setSubmittingReplyTicketId(null);
    }
  };

  return (
    <>
      <Animated.View style={[styles.root, { transform: [{ scale }] }]}>
        {isBubbleOpen ? (
          <View style={styles.expandedWrap}>
            <TouchableOpacity style={styles.closeBtn} onPress={toggleBubble} activeOpacity={0.9}>
              <X size={10} color={Colors.textSecondary} strokeWidth={3} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.pill} onPress={() => setIsModalOpen(true)} activeOpacity={0.92}>
              <View style={styles.pillIconWrap}>
                <MessageCircle size={20} color="#ffffff" strokeWidth={2.2} />
              </View>
              <Text style={styles.pillLabel}>Zëri Yt</Text>
              {totalUnread > 0 ? (
                <View style={styles.badgeRed}>
                  <Text style={styles.badgeRedText}>{totalUnread > 99 ? '99+' : totalUnread}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.minTab} onPress={toggleBubble} activeOpacity={0.9}>
            <MessageCircle size={18} color="#3b82f6" strokeWidth={2} />
            {totalUnread > 0 ? <View style={styles.minDot} /> : null}
          </TouchableOpacity>
        )}
      </Animated.View>

      <Modal visible={isModalOpen} animationType="slide" transparent onRequestClose={closeModal}>
        <Pressable style={styles.backdrop} onPress={closeModal} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalShell}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <TouchableOpacity onPress={closeModal} activeOpacity={0.85} style={styles.sheetClose}>
              <X size={18} color={Colors.textSecondary} strokeWidth={2.2} />
            </TouchableOpacity>

            <View style={styles.headerRow}>
              <Image source={BRANDING.assets.appLogo} style={styles.headerLogo} resizeMode="contain" />
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Suporti</Text>
                <Text style={styles.subtitle}>Kërko ndihmë nga stafi</Text>
              </View>
              <Image source={BRANDING.assets.municipalityLogoHorizontal} style={styles.headerMunicipality} resizeMode="contain" />
            </View>

            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, modalTab === 'form' && styles.tabActive]}
                onPress={() => setModalTab('form')}
                activeOpacity={0.9}
              >
                <Text style={[styles.tabText, modalTab === 'form' && styles.tabTextActive]}>Na shkruaj</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, modalTab === 'history' && styles.tabActive]}
                onPress={() => {
                  setModalTab('history');
                  reloadSupportTickets();
                }}
                activeOpacity={0.9}
              >
                <Text style={[styles.tabText, modalTab === 'history' && styles.tabTextActive]}>Mesazhet</Text>
                {totalUnread > 0 ? (
                  <View style={[styles.tabBadge, modalTab === 'history' && styles.tabBadgeActive]}>
                    <Text style={[styles.tabBadgeText, modalTab === 'history' && styles.tabBadgeTextActive]}>
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {modalTab === 'form' ? (
                isSuccess ? (
                  <View style={styles.successWrap}>
                    <View style={styles.successIconWrap}>
                      <CheckCircle2 size={42} color="#16a34a" strokeWidth={2.2} />
                    </View>
                    <Text style={styles.successTitle}>Mesazhi u dërgua</Text>
                    <Text style={styles.successText}>Përgjigjet e stafit do t'i shohësh të skeda Mesazhet.</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.group}>
                      <Text style={styles.groupLabel}>Lloji i kërkesës</Text>
                      <View style={styles.categoryWrap}>
                        {categories.map(({ id, label, Icon }) => {
                          const active = activeCategory === id;
                          return (
                            <TouchableOpacity key={id} onPress={() => setActiveCategory(id)} activeOpacity={0.92} style={[styles.chip, active && styles.chipActive]}>
                              <Icon size={15} color={active ? Colors.white : '#003366'} strokeWidth={2.2} />
                              <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                    <View style={styles.group}>
                      <Text style={styles.groupLabel}>Subjekti</Text>
                      <TextInput value={subject} onChangeText={setSubject} placeholder="P.sh. Problem me zbritjen" placeholderTextColor={Colors.textMuted} style={styles.input} />
                    </View>
                    <View style={styles.group}>
                      <Text style={styles.groupLabel}>Mesazhi</Text>
                      <TextInput value={message} onChangeText={setMessage} placeholder="Përshkruaje me detaje problemin ose sugjerimin..." placeholderTextColor={Colors.textMuted} style={[styles.input, styles.textarea]} multiline textAlignVertical="top" />
                    </View>
                    <TouchableOpacity onPress={handleAttachmentPress} activeOpacity={0.9} style={styles.attachmentBox}>
                      <View style={styles.attachmentIcon}>
                        {attachment ? <ImageIcon size={20} color="#003366" strokeWidth={2} /> : <ImagePlus size={20} color="#003366" strokeWidth={2} />}
                      </View>
                      <Text style={styles.attachmentTitle}>{attachment ? 'Foto e zgjedhur' : 'Shto foto'}</Text>
                      <Text style={styles.attachmentHint}>{attachment ? attachment.name : 'Shto një screenshot ose foto sqaruese.'}</Text>
                      {attachment ? <Image source={{ uri: attachment.uri }} style={styles.attachmentPreview} /> : null}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSubmit} activeOpacity={0.92} disabled={!activeCategory || isSubmitting} style={[styles.submitBtn, !activeCategory && styles.submitBtnDisabled]}>
                      <LinearGradient colors={!activeCategory ? ['#cbd5e1', '#cbd5e1'] : ['#e30613', '#c10410']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitGradient}>
                        {isSubmitting ? <ActivityIndicator color="#fff" size="small" /> : <><Send size={18} color="#fff" strokeWidth={2.1} /><Text style={styles.submitText}>Dërgo Kërkesën</Text></>}
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                )
              ) : supportTicketsLoading ? (
                <View style={styles.stateWrap}>
                  <ActivityIndicator color="#0f172a" />
                  <Text style={styles.stateText}>Duke ngarkuar mesazhet...</Text>
                </View>
              ) : supportTicketsError ? (
                <View style={styles.stateWrap}>
                  <Text style={styles.stateTitle}>Nuk u hapën mesazhet</Text>
                  <Text style={styles.stateText}>{supportTicketsError}</Text>
                </View>
              ) : supportTickets.length === 0 ? (
                <View style={styles.stateWrap}>
                  <Text style={styles.stateTitle}>Ende pa mesazhe</Text>
                  <Text style={styles.stateText}>Kërkesat e suportit do t'i gjesh këtu sapo të dërgosh një të re.</Text>
                </View>
              ) : (
                <View style={styles.historyWrap}>
                  {supportTickets.map((ticket) => {
                    const expanded = expandedTicketId === ticket.id;
                    return (
                      <View key={ticket.id} style={styles.ticketCard}>
                        <TouchableOpacity activeOpacity={0.9} onPress={() => setExpandedTicketId(expanded ? null : ticket.id)} style={styles.ticketHeader}>
                          <View style={styles.ticketTopRow}>
                            <View style={styles.ticketMetaLeft}>
                              <Text style={styles.ticketId}>#{ticket.id}</Text>
                              <View style={[styles.ticketStatus, ticket.statusRaw === 'closed' ? styles.ticketStatusClosed : ticket.statusRaw === 'in_progress' ? styles.ticketStatusProgress : styles.ticketStatusOpen]}>
                                <Text style={[styles.ticketStatusText, ticket.statusRaw === 'closed' ? styles.ticketStatusTextClosed : ticket.statusRaw === 'in_progress' ? styles.ticketStatusTextProgress : styles.ticketStatusTextOpen]}>{ticket.status}</Text>
                              </View>
                            </View>
                            <View style={styles.ticketMetaRight}>
                              {ticket.hasUnread ? <View style={styles.badgeRed}><Text style={styles.badgeRedText}>{ticket.unreadCount > 99 ? '99+' : ticket.unreadCount}</Text></View> : null}
                              <ChevronDown size={16} color="#64748b" strokeWidth={2.2} style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }} />
                            </View>
                          </View>
                          <Text style={styles.ticketSubject}>{ticket.subject}</Text>
                          <Text style={styles.ticketCategory}>{ticket.categoryLabel}</Text>
                        </TouchableOpacity>
                        {expanded ? (
                          <View style={styles.ticketBody}>
                            {ticket.messages.map((m) => {
                              const isStaff = m.senderType === 'staff';
                              return (
                                <View key={`${ticket.id}-${m.id}-${m.createdAt}`} style={[styles.threadBubble, isStaff ? styles.threadBubbleStaff : styles.threadBubbleStudent]}>
                                  <Text style={[styles.threadSender, isStaff ? styles.threadSenderStaff : styles.threadSenderStudent]}>{m.senderName}</Text>
                                  {m.message ? <Text style={styles.threadText}>{m.message}</Text> : null}
                                  {m.attachmentUrl ? <Image source={{ uri: m.attachmentUrl }} style={styles.threadImage} /> : null}
                                  <View style={styles.threadMeta}><Clock size={11} color="#94a3b8" strokeWidth={2} /><Text style={styles.threadMetaText}>{m.createdAt}</Text></View>
                                </View>
                              );
                            })}
                            <View style={styles.replyComposer}>
                              <TextInput value={replyDrafts[ticket.id] || ''} onChangeText={(value) => setReplyDrafts((prev) => ({ ...prev, [ticket.id]: value }))} placeholder="Shkruaj një përgjigje..." placeholderTextColor={Colors.textMuted} style={styles.replyInput} multiline textAlignVertical="top" />
                              <TouchableOpacity onPress={() => handleReply(ticket.id)} activeOpacity={0.9} disabled={submittingReplyTicketId === ticket.id || !(replyDrafts[ticket.id] || '').trim()} style={[styles.replyBtn, (submittingReplyTicketId === ticket.id || !(replyDrafts[ticket.id] || '').trim()) && styles.replyBtnDisabled]}>
                                {submittingReplyTicketId === ticket.id ? <ActivityIndicator color="#fff" size="small" /> : <><Send size={15} color="#fff" strokeWidth={2} /><Text style={styles.replyBtnText}>Dërgo</Text></>}
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

function formatTicketDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('sq-AL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  root: { position: 'absolute', right: 0, zIndex: 40, alignItems: 'flex-end' },
  expandedWrap: { alignItems: 'flex-end' },
  closeBtn: { width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center', marginBottom: -8, marginRight: 5, zIndex: 1 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    paddingVertical: 7,
    paddingLeft: 7,
    paddingRight: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  pillIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillLabel: { fontFamily: Typography.fontExtraBold, fontSize: Typography.base, color: '#0f172a' },
  badgeRed: { minWidth: 22, height: 22, paddingHorizontal: 6, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e30613' },
  badgeRedText: { fontFamily: Typography.fontExtraBold, fontSize: 10, color: '#fff' },
  minTab: {
    backgroundColor: Colors.white,
    width: 40,
    height: 44,
    borderTopLeftRadius: 22,
    borderBottomLeftRadius: 22,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: -4, height: 8 },
    elevation: 10,
    paddingLeft: 4,
  },
  minDot: { position: 'absolute', top: 8, right: 8, width: 10, height: 10, borderRadius: 5, backgroundColor: '#e30613' },
  backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.42)' },
  modalShell: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end' },
  sheet: { height: '86%', backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 22 },
  handle: { alignSelf: 'center', width: 48, height: 5, borderRadius: Radius.full, backgroundColor: '#cbd5e1', marginBottom: 18 },
  sheetClose: { position: 'absolute', top: 14, right: 18, width: 34, height: 34, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: Colors.borderLight, zIndex: 2 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, paddingRight: 40 },
  headerLogo: { width: 42, height: 42 },
  headerMunicipality: { width: 112, height: 36 },
  title: { fontFamily: Typography.fontExtraBold, fontSize: Typography.xxl, color: '#003366' },
  subtitle: { fontFamily: Typography.fontMedium, fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  tabs: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 16, padding: 4, marginBottom: 14 },
  tab: { flex: 1, minHeight: 42, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  tabActive: { backgroundColor: Colors.white },
  tabText: { fontFamily: Typography.fontBold, fontSize: Typography.sm, color: Colors.textSecondary },
  tabTextActive: { color: '#003366' },
  tabBadge: { minWidth: 20, height: 20, paddingHorizontal: 6, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e30613' },
  tabBadgeActive: { backgroundColor: '#fee2e2' },
  tabBadgeText: { fontFamily: Typography.fontExtraBold, fontSize: 10, color: '#fff' },
  tabBadgeTextActive: { color: '#b91c1c' },
  content: { paddingBottom: 18, gap: 18 },
  group: { gap: 10 },
  groupLabel: { fontFamily: Typography.fontBold, fontSize: Typography.sm, color: '#003366', textTransform: 'uppercase' },
  categoryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: Colors.white },
  chipActive: { backgroundColor: '#003366', borderColor: '#003366' },
  chipText: { fontFamily: Typography.fontSemiBold, fontSize: Typography.sm, color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  input: { minHeight: 52, borderRadius: 18, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 16, paddingVertical: 14, fontFamily: Typography.fontMedium, fontSize: Typography.md, color: Colors.textPrimary },
  textarea: { minHeight: 124 },
  attachmentBox: { borderWidth: 2, borderStyle: 'dashed', borderColor: '#e2e8f0', borderRadius: 18, paddingVertical: 18, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fcfdff' },
  attachmentIcon: { width: 42, height: 42, borderRadius: Radius.full, backgroundColor: Colors.white, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  attachmentTitle: { fontFamily: Typography.fontBold, fontSize: Typography.sm, color: '#003366', marginBottom: 4 },
  attachmentHint: { fontFamily: Typography.fontMedium, fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center' },
  attachmentPreview: { width: '100%', height: 160, borderRadius: 14, marginTop: 12 },
  submitBtn: { borderRadius: 18, overflow: 'hidden' },
  submitBtnDisabled: { opacity: 0.7 },
  submitGradient: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  submitText: { fontFamily: Typography.fontBold, fontSize: Typography.lg, color: Colors.white },
  successWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  successIconWrap: { width: 88, height: 88, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(22, 163, 74, 0.08)', marginBottom: 18 },
  successTitle: { fontFamily: Typography.fontExtraBold, fontSize: Typography.xxl, color: '#003366', marginBottom: 10 },
  successText: { fontFamily: Typography.fontMedium, fontSize: Typography.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, maxWidth: 280 },
  stateWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 56, gap: 10 },
  stateTitle: { fontFamily: Typography.fontExtraBold, fontSize: Typography.xl, color: Colors.textPrimary },
  stateText: { fontFamily: Typography.fontMedium, fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  historyWrap: { gap: 12 },
  ticketCard: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 18, backgroundColor: Colors.white, overflow: 'hidden' },
  ticketHeader: { padding: 16 },
  ticketTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  ticketMetaLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ticketMetaRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ticketId: { fontFamily: Typography.fontExtraBold, fontSize: 11, color: '#94a3b8' },
  ticketStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  ticketStatusOpen: { backgroundColor: '#e0f2fe', borderColor: '#bae6fd' },
  ticketStatusProgress: { backgroundColor: '#fef3c7', borderColor: '#fde68a' },
  ticketStatusClosed: { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' },
  ticketStatusText: { fontFamily: Typography.fontExtraBold, fontSize: 10 },
  ticketStatusTextOpen: { color: '#0369a1' },
  ticketStatusTextProgress: { color: '#92400e' },
  ticketStatusTextClosed: { color: '#166534' },
  ticketSubject: { fontFamily: Typography.fontBold, fontSize: Typography.md, color: '#003366', marginBottom: 4 },
  ticketCategory: { fontFamily: Typography.fontMedium, fontSize: Typography.sm, color: Colors.textSecondary },
  ticketBody: { borderTopWidth: 1, borderTopColor: '#f1f5f9', backgroundColor: '#f8fafc', padding: 14, gap: 12 },
  threadBubble: { padding: 12, borderRadius: 14, borderWidth: 1 },
  threadBubbleStudent: { backgroundColor: Colors.white, borderColor: '#e2e8f0', marginLeft: 18 },
  threadBubbleStaff: { backgroundColor: '#e0f2fe', borderColor: '#bae6fd', marginRight: 18 },
  threadSender: { fontFamily: Typography.fontBold, fontSize: Typography.sm, marginBottom: 6 },
  threadSenderStudent: { color: Colors.textSecondary },
  threadSenderStaff: { color: '#0369a1' },
  threadText: { fontFamily: Typography.fontMedium, fontSize: Typography.sm, color: Colors.textPrimary, lineHeight: 20 },
  threadImage: { width: '100%', height: 150, borderRadius: 12, marginTop: 10 },
  threadMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  threadMetaText: { fontFamily: Typography.fontMedium, fontSize: 10, color: '#94a3b8' },
  replyComposer: { gap: 10, marginTop: 4 },
  replyInput: { minHeight: 86, borderRadius: 16, borderWidth: 1, borderColor: '#dbe3ee', backgroundColor: Colors.white, paddingHorizontal: 14, paddingVertical: 12, fontFamily: Typography.fontMedium, fontSize: Typography.sm, color: Colors.textPrimary },
  replyBtn: { alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#003366', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  replyBtnDisabled: { backgroundColor: '#94a3b8' },
  replyBtnText: { fontFamily: Typography.fontBold, fontSize: Typography.sm, color: '#fff' },
});
