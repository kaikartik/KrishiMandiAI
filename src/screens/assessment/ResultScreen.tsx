import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../navigation/AppNavigator';

import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'Result'
>;

export default function ResultScreen({
  route,
}: Props) {
  const { result } = route.params;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.eyebrow}>
        KRISHIMANDAI AI
      </Text>

      <Text style={styles.title}>
        Grain Sample Result
      </Text>

      <View style={styles.gradeCard}>
        <Text style={styles.gradeLabel}>
          Overall Quality
        </Text>

        <Text style={styles.grade}>
          {result.quality_grade}
        </Text>

        <Text style={styles.score}>
          {result.quality_score}/100
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Sample Analysis
        </Text>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>
            Grain coverage
          </Text>

          <Text style={styles.statValue}>
            {result.grain_coverage}%
          </Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>
            Damaged grains
          </Text>

          <Text style={styles.statValue}>
            {result.damaged_grains}%
          </Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>
            Broken grains
          </Text>

          <Text style={styles.statValue}>
            {result.broken_grains}%
          </Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>
            Foreign material
          </Text>

          <Text style={styles.statValue}>
            {result.foreign_material}%
          </Text>
        </View>
      </View>

      <View style={styles.engineCard}>
        <Text style={styles.engineLabel}>
          Analysis engine
        </Text>

        <Text style={styles.engineValue}>
          On-device ONNX
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: spacing.xl,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxxl,
  },

  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    marginTop: spacing.sm,
  },

  gradeCard: {
    marginTop: spacing.xl,
    padding: spacing.xl,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },

  gradeLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },

  grade: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
    marginTop: spacing.sm,
  },

  score: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
    marginTop: spacing.xs,
  },

  section: {
    marginTop: spacing.xl,
    padding: spacing.xl,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },

  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },

  statLabel: {
    color: colors.textSecondary,
    fontSize: 15,
  },

  statValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },

  engineCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: '#F3F3F3',
  },

  engineLabel: {
    color: colors.textSecondary,
    fontSize: 12,
  },

  engineValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
});

