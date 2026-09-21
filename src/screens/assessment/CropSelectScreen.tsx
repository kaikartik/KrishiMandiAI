import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { typography } from '../../styles/typography';

export default function CropSelectScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>Select Crop</Text>

      <Text style={styles.subtitle}>
        Choose the crop you want to assess.
      </Text>

      <View style={styles.cropList}>
        <Pressable style={styles.cropCard}>
          <Text style={styles.cropIcon}>🌾</Text>

          <View style={styles.cropInfo}>
            <Text style={styles.cropName}>Rice</Text>
            <Text style={styles.cropDescription}>
              Grain quality assessment
            </Text>
          </View>
        </Pressable>

        <Pressable style={styles.cropCard}>
          <Text style={styles.cropIcon}>🌾</Text>

          <View style={styles.cropInfo}>
            <Text style={styles.cropName}>Wheat</Text>
            <Text style={styles.cropDescription}>
              Coming soon
            </Text>
          </View>
        </Pressable>

        <Pressable style={styles.cropCard}>
          <Text style={styles.cropIcon}>🫘</Text>

          <View style={styles.cropInfo}>
            <Text style={styles.cropName}>Pulses</Text>
            <Text style={styles.cropDescription}>
              Coming soon
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

  cropList: {
    gap: spacing.md,
  },

  cropCard: {
    minHeight: 90,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },

  cropIcon: {
    fontSize: 36,
    marginRight: spacing.lg,
  },

  cropInfo: {
    flex: 1,
  },

  cropName: {
    ...typography.subheading,
  },

  cropDescription: {
    ...typography.bodySecondary,
    marginTop: spacing.xs,
  },
});