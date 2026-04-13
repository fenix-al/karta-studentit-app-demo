import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { Colors, Radius, Spacing, Typography } from '../../constants/Theme';

export default function SettingsFaqContent() {
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  const faqItems = useMemo(
    () => [
      {
        question: 'Cfare eshte Karta e Studentit?',
        answer:
          'Eshte aplikacioni ku studenti sheh karten digjitale, perfitimet, piket, dhuratat, njoftimet dhe aktivitetin e vet.',
      },
      {
        question: 'Si hyj ne aplikacion?',
        answer:
          'Hyn me llogarine tende te studentit. Nese kredencialet jane te sakta dhe karta eshte aktive, aplikacioni hap sherbimet e tua.',
      },
      {
        question: 'Cfare bej ne faqen kryesore?',
        answer:
          'Ne faqen kryesore mund te shohesh ofertat, te kerkosh permbajtje, te hapesh njoftimet, te futesh te profili dhe te navigosh ne modulet e tjera te app-it.',
      },
      {
        question: 'Si funksionojne perfitimet?',
        answer:
          'Te perfitimet shfaqen bizneset dhe ofertat aktive. Mund te hapesh biznesin, te lexosh detajet dhe te perdoresh karten sipas rregullave te ofertes.',
      },
      {
        question: 'Si funksionojne piket dhe dhuratat?',
        answer:
          'Piket mblidhen sipas rregullave te platformes dhe perdoren te seksioni i dhuratave ose shorteve, kur ka aktivitete aktive.',
      },
      {
        question: 'Cfare eshte karta digjitale?',
        answer:
          'Karta digjitale eshte identifikimi yt ne app dhe perdoret per verifikim dhe akses ne sherbimet e Kartes se Studentit.',
      },
      {
        question: 'Cfare shoh te profili im?',
        answer:
          'Te profili mund te shohesh aplikimet, kurset, historikun, aktivitetet ACT4, startup-et, shortet, reward-et e perdorura dhe mesazhet e support-it.',
      },
      {
        question: 'Si funksionojne kurset?',
        answer:
          'Te kurset mund te shohesh listen, kategorite, detajet e kursit dhe te regjistrohesh kur kursi eshte i hapur.',
      },
      {
        question: 'Si funksionojne mundesite?',
        answer:
          'Te mundesite mund te shohesh vende praktike, pune ose thirrje dhe te aplikosh direkt nga aplikacioni kur lejohet.',
      },
      {
        question: 'Si funksionon Startup?',
        answer:
          'Te Startup mund te lexosh materiale ose thirrje dhe, kur lejohet, te dergosh idene tende nga aplikacioni.',
      },
      {
        question: 'Si funksionon ACT4?',
        answer:
          'Te ACT4 mund te shohesh aktivitete, te lexosh detajet dhe te regjistrohesh si vullnetar kur aktiviteti eshte aktiv.',
      },
      {
        question: 'Cfare eshte KVR?',
        answer:
          'KVR eshte seksioni informues ku lexohen lajme, njoftime dhe materiale te lidhura me Keshillin Vendor te Rinise.',
      },
      {
        question: 'Si funksionojne njoftimet?',
        answer:
          'Kur njoftimet push jane aktive, aplikacioni mund te te dergoje sinjalizime per oferta, permbajtje, shorte ose veprime te rendesishme.',
      },
      {
        question: 'Cfare bejne cilesimet?',
        answer:
          'Te cilesimet mund te shohesh te dhenat personale, te hapesh rikuperimin e fjalekalimit, te kontrollosh njoftimet push, te lexosh FAQ, kushtet dhe privatesine, si edhe te dalesh nga llogaria.',
      },
      {
        question: 'Si ndryshoj fjalekalimin?',
        answer:
          'Nga Siguria & Fjalekalimi hapet faqja zyrtare e rikuperimit, ku mund te kerkosh linkun per ndryshimin e fjalekalimit.',
      },
      {
        question: 'Cfare te bej nese dicka nuk punon?',
        answer:
          'Kontrollo internetin, mbylle dhe hape perseri app-in, dhe nese problemi vazhdon perdor kanalet e ndihmes ose support-it.',
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
