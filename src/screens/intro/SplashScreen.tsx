import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../navigation/AppNavigator';

import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'Splash'
>;

export default function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 1800);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>K</Text>
        </View>

        <Text style={styles.title}>
          KrishiMandi AI
        </Text>

        <Text style={styles.subtitle}>
          Automated Grain Quality Assessment
        </Text>
      </View>

      <View style={styles.bottom}>
        <Text style={styles.powered}>
          AI-powered • Farmer-focused
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryDark,
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },

  logo: {
    width: 92,
    height: 92,
    borderRadius: 26,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },

  logoText: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.primaryDark,
  },

  title: {
    color: colors.white,
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
  },

  subtitle: {
    color: colors.primaryLight,
    fontSize: 14,
    marginTop: spacing.sm,
    textAlign: 'center',
  },

  bottom: {
    alignItems: 'center',
    paddingBottom: spacing.xxl,
  },

  powered: {
    color: '#B8D5C5',
    fontSize: 12,
  },
});