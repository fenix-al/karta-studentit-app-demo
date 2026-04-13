import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing, Typography } from '../../constants/Theme';

export default function SettingsTermsContent() {
  const termsSections = useMemo(
    () => [
      {
        title: '1. Perdorimi i aplikacionit',
        text:
          'Ky aplikacion perdoret nga studentet per akses ne sherbimet e Kartes se Studentit Shkoder, perfshire identifikimin, informacionin personal, perfitimet, aktivitetet dhe modulet e tjera te platformes.',
      },
      {
        title: '2. Llogaria dhe pergjegjesia',
        text:
          'Perdoruesi eshte pergjegjes per saktesine e te dhenave te llogarise se vet dhe per perdorimin e sigurt te kredencialeve. Ndalohet ndarja e llogarise me persona te tjere ose perdorimi i saj per qellime jo te lejuara.',
      },
      {
        title: '3. Karta dhe sherbimet',
        text:
          'Aksesi ne perfitime, kurse, aktivitete, shorte, reward-e ose sherbime te tjera varet nga statusi i kartes, rregullat e platformes dhe kushtet e caktuara nga administratori ose partneret perkates.',
      },
      {
        title: '4. Perdorimi i rregullt',
        text:
          'Perdoruesi nuk duhet te kryeje veprime qe demtojne sistemin, cenojne sigurine, japin informacion te rreme ose perdorin aplikacionin ne menyre abuzive. Cdo perdorim i papershtatshem mund te kufizohet ose bllokohet.',
      },
      {
        title: '5. Ndryshime dhe perditesime',
        text:
          'Platforma mund te perditesohet here pas here per permiresime funksionale, sigurie ose permbajtjeje. Disa sherbime mund te ndryshojne, pezullohen ose perditesohen sipas nevojes.',
      },
      {
        title: '6. Privatesia dhe te dhenat',
        text:
          'Perdorimi i aplikacionit shoqerohet me perpunimin e disa te dhenave te nevojshme per funksionimin e sherbimeve. Per me shume informacion, perdoruesi duhet te lexoje seksionin Politika e Privatesise.',
      },
      {
        title: '7. Pranimi i kushteve',
        text:
          'Duke perdorur aplikacionin, perdoruesi pranon keto kushte baze te perdorimit dhe rregullat funksionale te platformes Karta e Studentit Shkoder.',
      },
    ],
    [],
  );

  return (
    <View style={styles.termsCard}>
      {termsSections.map((section, index) => (
        <View
          key={section.title}
          style={[styles.termsSection, index !== termsSections.length - 1 && styles.termsSectionBorder]}
        >
          <Text style={styles.termsTitle}>{section.title}</Text>
          <Text style={styles.termsText}>{section.text}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  termsCard: {
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
  termsSection: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xl,
    gap: 10,
  },
  termsSectionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  termsTitle: {
    fontFamily: Typography.fontBold,
    fontSize: Typography.md,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  termsText: {
    fontFamily: Typography.fontRegular,
    fontSize: Typography.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
