import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing, Typography } from '../../constants/Theme';

export default function SettingsTermsContent() {
  const termsSections = useMemo(
    () => [
      {
        title: '1. Përdorimi i aplikacionit',
        text:
          'Ky aplikacion përdoret nga studentët për akses në shërbimet e Kartës së Studentit Shkodër, përfshirë identifikimin, informacionin personal, përfitimet, aktivitetet dhe modulet e tjera të platformës.',
      },
      {
        title: '2. Llogaria dhe pergjegjesia',
        text:
          'Përdoruesi është përgjegjës për saktësinë e të dhënave të llogarisë së vet dhe për përdorimin e sigurt të kredencialeve. Ndalohet ndarja e llogarisë me persona të tjerë ose përdorimi i saj për qëllime jo të lejuara.',
      },
      {
        title: '3. Karta dhe shërbimet',
        text:
          'Aksesi ne përfitime, kurse, aktivitete, shorte, reward-e ose shërbime të tjera varet nga statusi i kartës, rregullat e platformes dhe kushtet e caktuara nga administratori ose partneret perkates.',
      },
      {
        title: '4. Përdorimi i rregullt',
        text:
          'Përdoruesi nuk duhet të kryeje veprime qe demtojne sistemin, cenojne sigurinë, japin informacion të rreme ose përdorin aplikacionin ne menyre abuzive. Cdo përdorim i papershtatshem mund të kufizohet ose bllokohet.',
      },
      {
        title: '5. Ndryshime dhe përditësime',
        text:
          'Platforma mund të përditësohet here pas here për permiresime funksionale, sigurie ose përmbajtjeje. Disa shërbime mund të ndryshojne, pezullohen ose përditësohen sipas nevojes.',
      },
      {
        title: '6. Privatësia dhe të dhënat',
        text:
          'Përdorimi i aplikacionit shoqerohet me perpunimin e disa të dhënave të nevojshme për funksionimin e shërbimeve. Për me shumë informacion, përdoruesi duhet të lexoje seksionin Politika e Privatësisë.',
      },
      {
        title: '7. Pranimi i kushteve',
        text:
          'Duke përdorur aplikacionin, përdoruesi pranon keto kushtë baze të përdorimit dhe rregullat funksionale të platformes Karta e Studentit Shkodër.',
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
