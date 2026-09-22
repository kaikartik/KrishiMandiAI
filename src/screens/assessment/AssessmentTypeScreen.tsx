import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../navigation/AppNavigator';

import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { typography } from '../../styles/typography';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'AssessmentType'
>;

export default function AssessmentTypeScreen({
  navigation,
  route,
}: Props) {
  const {
    cropId,
    cropName,
  } = route.params;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>
        Assessment Type
      </Text>

      <Text style={styles.subtitle}>
        Choose how you want to assess your grain sample.
      </Text>

      <View style={styles.options}>
        <Pressable
          style={styles.optionCard}
          onPress={() =>
            navigation.navigate('SamplePrep', {
              cropId,
              cropName,
            })
          }
        >
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>⚡</Text>
          </View>

          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>
              Quick Assessment
            </Text>

            <Text style={styles.optionDescription}>
              Analyze one representative sample for a
              quick quality estimate.
            </Text>

            <Text style={styles.optionMeta}>
              1 sample
            </Text>
          </View>
        </Pressable>

        <Pressable
          style={styles.optionCard}
          onPress={() =>
            navigation.navigate('SamplePrep', {
              cropId,
              cropName,
            })
          }
        >
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>◎</Text>
          </View>

          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>
              Detailed Assessment
            </Text>

            <Text style={styles.optionDescription}>
              Analyze multiple samples from different
              portions for a more representative estimate.
            </Text>

            <Text style={styles.optionMeta}>
              Multiple samples
            </Text>
          </View>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: spacing.xl,
    paddingTop: spacing.xxxl,
  },

  title: {
    ...typography.title,
  },

  subtitle: {
    ...typography.bodySecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },

  options: {
    gap: spacing.md,
  },

  optionCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
    flexDirection: 'row',
  },

  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },

  icon: {
    fontSize: 24,
  },

  optionContent: {
    flex: 1,
  },

  optionTitle: {
    ...typography.subheading,
  },

  optionDescription: {
    ...typography.bodySecondary,
    marginTop: spacing.xs,
    lineHeight: 20,
  },

  optionMeta: {
    marginTop: spacing.sm,
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
});