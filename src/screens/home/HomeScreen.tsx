import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../navigation/AppNavigator';

import { useAuth } from '../../context/AuthContext';
import { signOut } from '../../services/auth/authService';

import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { typography } from '../../styles/typography';
import { commonStyles } from '../../styles/common';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'Home'
>;

export default function HomeScreen({ navigation }: Props) {
  const { session } = useAuth();

  const name =
    session?.user?.user_metadata?.name ||
    'Farmer';

  return (
    <SafeAreaView style={commonStyles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Welcome back
            </Text>

            <Text style={typography.heading}>
              {name}
            </Text>
          </View>

          <Pressable
            onPress={() => signOut()}
            style={styles.logout}
          >
            <Text style={styles.logoutText}>
              Logout
            </Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>
            Assess your grain quality
          </Text>

          <Text style={styles.heroText}>
            Use AI-powered image analysis to get
            a preliminary quality assessment and
            estimated price.
          </Text>

          <Pressable
            style={styles.assessButton}
            onPress={() =>
              navigation.navigate('CropSelect')
            }
          >
            <Text style={styles.assessButtonText}>
              Start Assessment
            </Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>
          How it works
        </Text>

        <View style={styles.steps}>
          <Step
            number="1"
            title="Capture"
            text="Take a clear photo of your grain sample."
          />

          <Step
            number="2"
            title="Analyze"
            text="AI detects and classifies visible grains."
          />

          <Step
            number="3"
            title="Get Result"
            text="View quality grade and estimated price."
          />
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerTitle}>
            AI-assisted assessment
          </Text>

          <Text style={styles.disclaimerText}>
            Results are preliminary estimates based
            on the representative sample provided.
            They are not laboratory certification.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Step({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>
          {number}
        </Text>
      </View>

      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>
          {title}
        </Text>

        <Text style={styles.stepText}>
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
  },

  greeting: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },

  logout: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },

  logoutText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '600',
  },

  hero: {
    backgroundColor: colors.primaryDark,
    borderRadius: 20,
    padding: spacing.xl,
    marginBottom: spacing.xxxl,
  },

  heroTitle: {
    color: colors.white,
    fontSize: 25,
    fontWeight: '700',
    lineHeight: 32,
  },

  heroText: {
    color: '#D8E8DF',
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.md,
  },

  assessButton: {
    backgroundColor: colors.white,
    minHeight: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },

  assessButtonText: {
    color: colors.primaryDark,
    fontSize: 16,
    fontWeight: '700',
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },

  steps: {
    gap: spacing.md,
  },

  step: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },

  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  stepNumberText: {
    color: colors.primaryDark,
    fontSize: 17,
    fontWeight: '700',
  },

  stepContent: {
    flex: 1,
  },

  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },

  stepText: {
    marginTop: spacing.xs,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },

  disclaimer: {
    marginTop: spacing.xxxl,
    padding: spacing.lg,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
  },

  disclaimerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
  },

  disclaimerText: {
    marginTop: spacing.xs,
    fontSize: 12,
    lineHeight: 18,
    color: colors.primaryDark,
  },
});