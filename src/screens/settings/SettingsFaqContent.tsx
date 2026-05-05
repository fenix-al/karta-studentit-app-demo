import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { Colors, Radius, Spacing, Typography } from '../../constants/Theme';

export default function SettingsFaqContent() {
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  const faqItems = useMemo(
    () => [
      {
        question: 'Cfare është Karta e Studentit?',
        answer:
          'Është aplikacioni ku studenti sheh kartën digjitale, përfitimet, pikët, dhuratat, njoftimet dhe aktivitetin e vet.',
      },
      {
        question: 'Si hyj ne aplikacion?',
        answer:
          'Hyn me llogarine tende të studentit. Nese kredencialet janë të sakta dhe karta është aktive, aplikacioni hap shërbimet e tua.',
      },
      {
        question: 'Cfare bej ne faqen kryesore?',
        answer:
          'Ne faqen kryesore mund të shohesh ofertat, të kërkosh përmbajtje, të hapesh njoftimet, të futesh të profili dhe të navigosh ne modulet e tjera të app-it.',
      },
      {
        question: 'Si funksionojnë përfitimet?',
        answer:
          'Te përfitimet shfaqen bizneset dhe ofertat aktive. Mund të hapësh biznesin, të lexosh detajet dhe të përdorësh kartën sipas rregullave të ofertës.',
      },
      {
        question: 'Si funksionojne pikët dhe dhuratat?',
        answer:
          'Pikët mblidhen sipas rregullave të platformes dhe përdoren të seksioni i dhuratave ose shorteve, kur ka aktivitetë aktive.',
      },
      {
        question: 'Cfare është karta digjitale?',
        answer:
          'Karta digjitale është identifikimi yt ne app dhe përdoret për verifikim dhe akses ne shërbimet e Kartës se Studentit.',
      },
      {
        question: 'Cfare shoh të profili im?',
        answer:
          'Të profili mund të shohesh aplikimet, kurset, historikun, aktivitetet ACT4, startup-et, shortet, reward-et e përdorura dhe mesazhet e support-it.',
      },
      {
        question: 'Si funksionojne kurset?',
        answer:
          'Të kurset mund të shohesh listen, kategorite, detajet e kursit dhe të regjistrohesh kur kursi është i hapur.',
      },
      {
        question: 'Si funksionojnë mundësitë?',
        answer:
          'Te mundësitë mund të shohësh vende praktike, pune ose thirrje dhe të aplikosh direkt nga aplikacioni kur lejohet.',
      },
      {
        question: 'Si funksionon Startup?',
        answer:
          'Të Startup mund të lexosh materiale ose thirrje dhe, kur lejohet, të dërgosh idene tende nga aplikacioni.',
      },
      {
        question: 'Si funksionon ACT4?',
        answer:
          'Të ACT4 mund të shohesh aktivitete, të lexosh detajet dhe të regjistrohesh si vullnetar kur aktiviteti është aktiv.',
      },
      {
        question: 'Cfare është KVR?',
        answer:
          'KVR është seksioni informues ku lexohen lajme, njoftime dhe materiale të lidhura me Keshillin Vendor të Rinisë.',
      },
      {
        question: 'Si funksionojne njoftimet?',
        answer:
          'Kur njoftimet push janë aktive, aplikacioni mund të të dërgoje sinjalizime për oferta, përmbajtje, shortë ose veprime të rendesishme.',
      },
      {
        question: 'Cfare bejne cilësimet?',
        answer:
          'Të cilësimet mund të shohesh të dhënat personale, të hapesh rikuperimin e fjalëkalimit, të kontrollosh njoftimet push, të lexosh FAQ, kushtet dhe privatësine, si edhe të dalesh nga llogaria.',
      },
      {
        question: 'Si ndryshoj fjalëkalimin?',
        answer:
          'Nga Siguria & Fjalëkalimi hapet faqja zyrtare e rikuperimit, ku mund të kërkosh linkun për ndryshimin e fjalëkalimit.',
      },
      {
        question: 'Cfare të bej nese dicka nuk punon?',
        answer:
          'Kontrollo internetin, mbylle dhe hape përsëri app-in, dhe nese problemi vazhdon përdor kanalet e ndihmes ose support-it.',
      },
    ],
    [],
  );

  return (
    <View style={styles.faqList}>
      {faqItems.map((item, index) => {
        const isOpen = expandedFaqIndex === index;
        return (
          <View key={item.question} style={styles.faqItem}>
            <TouchableOpacity
              style={styles.faqQuestionRow}
              activeOpacity={0.8}
              onPress={() => setExpandedFaqIndex(isOpen ? null : index)}
            >
              <Text style={styles.faqQuestion}>{item.question}</Text>
              <ChevronRight
                size={18}
                color={Colors.textMuted}
                strokeWidth={2}
                style={isOpen ? styles.faqChevronOpen : undefined}
              />
            </TouchableOpacity>
            {isOpen ? <Text style={styles.faqAnswer}>{item.answer}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  faqList: {
    gap: Spacing.lg,
  },
  faqItem: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  faqQuestionRow: {
    minHeight: 60,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  faqQuestion: {
    flex: 1,
    fontFamily: Typography.fontBold,
    fontSize: Typography.md,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  faqAnswer: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.xl,
    fontFamily: Typography.fontRegular,
    fontSize: Typography.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  faqChevronOpen: {
    transform: [{ rotate: '90deg' }],
  },
});
