import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { signUpWithEmail } from '../../services/auth/authService';
import type { RootStackParamList } from '../../navigation/AppNavigator';

import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { typography } from '../../styles/typography';
import { commonStyles } from '../../styles/common';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'SignUp'
>;

export default function SignUpScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (
      !name.trim() ||
      !phone.trim() ||
      !email.trim() ||
      !password
    ) {
      Alert.alert(
        'Missing information',
        'Please fill in all fields.',
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Password too short',
        'Password must contain at least 6 characters.',
      );
      return;
    }

    try {
      setLoading(true);

      await signUpWithEmail(
        name.trim(),
        phone.trim(),
        email.trim(),
        password,
      );

      Alert.alert(
        'Account created',
        'Please check your email and verify your account before signing in.',
        [
          {
            text: 'Continue',
            onPress: () =>
              navigation.navigate('Login'),
          },
        ],
      );
    } catch (error: any) {
      Alert.alert(
        'Sign up failed',
        error?.message ?? 'Unable to create account.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={commonStyles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.back}
        >
          <Text style={styles.backText}>
            ← Back
          </Text>
        </Pressable>

        <Text style={typography.title}>
          Create Account
        </Text>

        <Text style={styles.subtitle}>
          Create your KrishiMandi AI account
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>
            Name
          </Text>

          <TextInput
            style={commonStyles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>
            Phone Number
          </Text>

          <TextInput
            style={commonStyles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Your phone number"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>
            Email
          </Text>

          <TextInput
            style={commonStyles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Your email"
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
            placeholder="Create a password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
          />

          <Pressable
            style={[
              commonStyles.primaryButton,
              loading && styles.disabled,
            ]}
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={typography.button}>
              {loading
                ? 'Creating Account...'
                : 'Create Account'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },

  back: {
    marginBottom: spacing.xxl,
  },

  backText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600',
  },

  subtitle: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 15,
  },

  form: {
    marginTop: spacing.xxl,
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
});