import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../navigation/AppNavigator';

import { supabase } from '../../services/supabase/client';

import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'Result'
>;

type AnalysisResult = {
  grain_coverage: number | null;
  damaged_grains: number | null;
  broken_grains: number | null;
  foreign_material: number | null;
  quality_score: number | null;
  quality_grade: string | null;
  analysis_engine: string;
};

export default function ResultScreen({
  route,
}: Props) {
  const { assessmentId } = route.params;

  const [result, setResult] =
    useState<AnalysisResult | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadResult = async () => {
      try {
        const {
          data,
          error: resultError,
        } = await supabase
          .from('analysis_results')
          .select(
            `
              grain_coverage,
              damaged_grains,
              broken_grains,
              foreign_material,
              quality_score,
              quality_grade,
              analysis_engine
            `,
          )
          .eq('assessment_id', assessmentId)
          .single();

        if (resultError) {
          throw new Error(
            resultError.message,
          );
        }

        if (!cancelled) {
          setResult(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load analysis.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadResult();

    return () => {
      cancelled = true;
    };
  }, [assessmentId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />

        <Text style={styles.loadingText}>
          Loading analysis...
        </Text>
      </View>
    );
  }

  if (error || !result) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>
          Unable to load result
        </Text>

        <Text style={styles.errorText}>
          {error || 'No analysis result was found.'}
        </Text>
      </View>
    );
  }

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
          {result.quality_grade || '--'}
        </Text>

        <Text style={styles.score}>
          {result.quality_score ?? '--'}/100
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
            {result.grain_coverage ?? '--'}%
          </Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>
            Damaged grains
          </Text>

          <Text style={styles.statValue}>
            {result.damaged_grains ?? '--'}%
          </Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>
            Broken grains
          </Text>

          <Text style={styles.statValue}>
            {result.broken_grains ?? '--'}%
          </Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>
            Foreign material
          </Text>

          <Text style={styles.statValue}>
            {result.foreign_material ?? '--'}%
          </Text>
        </View>
      </View>

      <View style={styles.engineCard}>
        <Text style={styles.engineLabel}>
          Analysis engine
        </Text>

        <Text style={styles.engineValue}>
          {result.analysis_engine === 'prototype'
            ? 'Prototype analysis'
            : result.analysis_engine}
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

  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },

  loadingText: {
    color: colors.textSecondary,
    marginTop: spacing.lg,
    fontSize: 15,
  },

  errorTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },

  errorText: {
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
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