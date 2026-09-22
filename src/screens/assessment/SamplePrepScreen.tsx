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
  'SamplePrep'
>;

export default function SamplePrepScreen({
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
        Prepare Your Sample
      </Text>

      <Text style={styles.subtitle}>
        Follow these steps before capturing your grain sample.
      </Text>

      <View style={styles.preview}>
        <Text style={styles.previewIcon}>🌾</Text>

        <Text style={styles.previewTitle}>
          Spread grains in a single layer
        </Text>

        <Text style={styles.previewText}>
          Place a representative sample on a clean,
          plain and contrasting surface.
        </Text>
      </View>

      <View style={styles.steps}>
        <View style={styles.step}>
          <View style={styles.number}>
            <Text style={styles.numberText}>1</Text>
          </View>

          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>
              Use a clean surface
            </Text>

            <Text style={styles.stepText}>
              Choose a plain surface that contrasts with
              the grain.
            </Text>
          </View>
        </View>

        <View style={styles.step}>
          <View style={styles.number}>
            <Text style={styles.numberText}>2</Text>
          </View>

          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>
              Spread the grains
            </Text>

            <Text style={styles.stepText}>
              Keep grains in a single layer and avoid
              unnecessary overlap.
            </Text>
          </View>
        </View>

        <View style={styles.step}>
          <View style={styles.number}>
            <Text style={styles.numberText}>3</Text>
          </View>

          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>
              Ensure good lighting
            </Text>

            <Text style={styles.stepText}>
              Avoid strong shadows, glare and very dark
              surroundings.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.note}>
        <Text style={styles.noteTitle}>
          Important
        </Text>

        <Text style={styles.noteText}>
          The AI analyzes the visible grains in the
          captured sample. Use a representative sample
          for a more reliable estimate.
        </Text>
      </View>

      <Pressable
        style={styles.button}
        onPress={() =>
          navigation.navigate('Camera', {
            cropId,
            cropName,
          })
        }
      >
        <Text style={styles.buttonText}>
          Continue to Camera
        </Text>
      </Pressable>
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
    paddingBottom: spacing.xxxl,
  },

  title: {
    ...typography.title,
  },

  subtitle: {
    ...typography.bodySecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },

  preview: {
    backgroundColor: colors.primaryLight,
    borderRadius: 18,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },

  previewIcon: {
    fontSize: 58,
    marginBottom: spacing.md,
  },

  previewTitle: {
    ...typography.subheading,
    textAlign: 'center',
  },

  previewText: {
    ...typography.bodySecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
  },

  steps: {
    gap: spacing.md,
  },

  step: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.lg,
  },

  number: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  numberText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },

  stepContent: {
    flex: 1,
  },

  stepTitle: {
    ...typography.subheading,
    fontSize: 16,
  },

  stepText: {
    ...typography.bodySecondary,
    marginTop: spacing.xs,
    lineHeight: 19,
  },

  note: {
    backgroundColor: colors.white,
    borderLeftWidth: 4,
    borderLeftColor: colors.gold,
    padding: spacing.lg,
    marginTop: spacing.xl,
    borderRadius: 10,
  },

  noteTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },

  noteText: {
    ...typography.bodySecondary,
    marginTop: spacing.xs,
    lineHeight: 19,
  },

  button: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },

  buttonText: {
    ...typography.button,
  },
});