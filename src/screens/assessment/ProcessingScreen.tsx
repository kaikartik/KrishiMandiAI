import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../navigation/AppNavigator';

import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';

import {
  processGrainAssessment,
} from '../../services/supabase/assessmentService';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'Processing'
>;

export default function ProcessingScreen({
  route,
  navigation,
}: Props) {
  const {
    imageUri,
    cropId,
    cropName,
  } = route.params;

  const [
    status,
    setStatus,
  ] = useState(
    'Uploading your sample...',
  );

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const processSample = async () => {
      try {
        setStatus(
          'Uploading your sample...',
        );

        const result =
          await processGrainAssessment(
            imageUri,
            cropId,
          );

        if (cancelled) {
          return;
        }

        console.log(
          `${cropName} assessment complete:`,
          result.assessmentId,
        );

        setStatus(
          'Analysis complete',
        );

        navigation.replace('Result', {
          assessmentId:
            result.assessmentId,
        });
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          'Grain assessment failed:',
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to process the sample.',
        );
      }
    };

    processSample();

    return () => {
      cancelled = true;
    };
  }, [
    imageUri,
    cropId,
    cropName,
    navigation,
  ]);

  if (error) {
    return (
      <View style={styles.centered}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>

        <View style={styles.errorContent}>
          <Text style={styles.errorTitle}>
            Analysis failed
          </Text>

          <Text style={styles.errorText}>
            {error}
          </Text>

          <Pressable
            style={styles.button}
            onPress={() =>
              navigation.goBack()
            }
          >
            <Text style={styles.buttonText}>
              Go Back
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="cover"
        />
      </View>

      <View style={styles.content}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />

        <Text style={styles.title}>
          {status}
        </Text>

        <Text style={styles.description}>
          Your {cropName.toLowerCase()} sample is being
          prepared for analysis.
        </Text>

        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  centered: {
    flex: 1,
    backgroundColor: colors.background,
  },

  imageContainer: {
    width: '100%',
    height: '52%',
    backgroundColor: '#000000',
    overflow: 'hidden',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },

  errorContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },

  title: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '700',
    marginTop: spacing.xl,
    textAlign: 'center',
  },

  description: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.md,
    textAlign: 'center',
    maxWidth: 340,
  },

  progressTrack: {
    width: '70%',
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E5E5E5',
    marginTop: spacing.xl,
    overflow: 'hidden',
  },

  progressFill: {
    width: '65%',
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },

  errorTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },

  errorText: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },

  button: {
    minHeight: 52,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});