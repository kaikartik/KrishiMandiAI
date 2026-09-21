import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { signInWithEmail } from '../../services/auth/authService';
import type { RootStackParamList } from '../../navigation/AppNavigator';

import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { typography } from '../../styles/typography';
import { commonStyles } from '../../styles/common';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'Login'
>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert(
        'Missing information',
        'Please enter your email and password.',
      );
      return;
    }

    try {
      setLoading(true);

      await signInWithEmail(
        email.trim(),
        password,
      );

      // AuthContext automatically detects
      // the session and switches to the app.
    } catch (error: any) {
      Alert.alert(
        'Login failed',
        error?.message ?? 'Unable to sign in.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={commonStyles.screen}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <View style={styles.container}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>K</Text>
            </View>

            <Text style={typography.title}>
              KrishiMandi AI
            </Text>

            <Text style={styles.subtitle}>
              Automated grain quality assessment
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>
              Email
            </Text>

            <TextInput
              style={commonStyles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>
              Password
            </Text>

            <TextInput
              style={commonStyles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
            />

            <Pressable
              style={[
                commonStyles.primaryButton,
                loading && styles.disabled,
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={typography.button}>
                {loading
                  ? 'Signing in...'
                  : 'Sign In'}
              </Text>
            </Pressable>

            <Pressable
              style={styles.signupButton}
              onPress={() =>
                navigation.navigate('SignUp')
              }
            >
              <Text style={styles.signupText}>
                Don't have an account?{' '}
                <Text style={styles.signupBold}>
                  Create Account
                </Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },

  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },

  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },

  logoText: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.white,
  },

  subtitle: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  form: {
    gap: spacing.md,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.sm,
  },

  disabled: {
    opacity: 0.6,
  },

  signupButton: {
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.md,
  },

  signupText: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  signupBold: {
    color: colors.primary,
    fontWeight: '700',
  },
});