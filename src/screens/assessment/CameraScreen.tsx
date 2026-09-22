import React, { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  usePhotoOutput,
} from 'react-native-vision-camera';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../navigation/AppNavigator';

import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'Camera'
>;

export default function CameraScreen({
  navigation,
  route,
}: Props) {
  const {
    cropId,
    cropName,
  } = route.params;

  const device =
    useCameraDevice('back');

  const {
    hasPermission,
    requestPermission,
  } = useCameraPermission();

  const photoOutput =
    usePhotoOutput({
      containerFormat: 'jpeg',
      quality: 0.9,
      qualityPrioritization: 'balanced',
    });

  const [
    capturedPhoto,
    setCapturedPhoto,
  ] = useState<string | null>(null);

  const [
    isCapturing,
    setIsCapturing,
  ] = useState(false);

  const [
    captureError,
    setCaptureError,
  ] = useState<string | null>(null);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [
    hasPermission,
    requestPermission,
  ]);

  const handleCapture = async () => {
    if (isCapturing) {
      return;
    }

    try {
      setCaptureError(null);
      setIsCapturing(true);

      const photoFile =
        await photoOutput.capturePhotoToFile(
          {
            flashMode: 'off',
            enableShutterSound: true,
          },
          {},
        );

      console.log(
        'Photo captured:',
        photoFile.filePath,
      );

      const photoUri =
        `file://${photoFile.filePath}`;

      setCapturedPhoto(photoUri);
    } catch (error) {
      console.error(
        'Failed to capture photo:',
        error,
      );

      setCaptureError(
        'Unable to capture the photo. Please try again.',
      );
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setCaptureError(null);
  };

  const handleUsePhoto = () => {
    if (!capturedPhoto) {
      return;
    }

    console.log(
      'Photo ready for AI processing:',
      capturedPhoto,
    );

    navigation.navigate('Processing', {
      imageUri: capturedPhoto,
      cropId,
      cropName,
    });
  };

  if (!hasPermission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>
          Camera Permission Required
        </Text>

        <Text style={styles.description}>
          KrishiMandi AI needs access to your camera
          to capture the grain sample.
        </Text>

        <Pressable
          style={styles.button}
          onPress={requestPermission}
        >
          <Text style={styles.buttonText}>
            Allow Camera
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>
          Camera Unavailable
        </Text>

        <Text style={styles.description}>
          No compatible camera was found on this device.
        </Text>
      </View>
    );
  }

  if (capturedPhoto) {
    return (
      <View style={styles.container}>
        <Image
          source={{ uri: capturedPhoto }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />

        <View style={styles.previewOverlay}>
          <View style={styles.previewTopBar}>
            <Pressable
              style={styles.backButton}
              onPress={handleRetake}
            >
              <Text style={styles.backText}>
                ‹
              </Text>
            </Pressable>

            <Text style={styles.headerTitle}>
              Review Grain Sample
            </Text>

            <View style={styles.placeholder} />
          </View>

          <View style={styles.previewBottomArea}>
            <Text style={styles.previewText}>
              Sample captured successfully
            </Text>

            <View style={styles.previewActions}>
              <Pressable
                style={styles.retakeButton}
                onPress={handleRetake}
              >
                <Text style={styles.retakeButtonText}>
                  Retake
                </Text>
              </Pressable>

              <Pressable
                style={styles.usePhotoButton}
                onPress={handleUsePhoto}
              >
                <Text style={styles.usePhotoButtonText}>
                  Use Photo
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        outputs={[photoOutput]}
      />

      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <Pressable
            style={styles.backButton}
            onPress={() =>
              navigation.goBack()
            }
          >
            <Text style={styles.backText}>
              ‹
            </Text>
          </Pressable>

          <Text style={styles.headerTitle}>
            Capture Grain Sample
          </Text>

          <View style={styles.placeholder} />
        </View>

        <View style={styles.guideArea}>
          <View style={styles.guideFrame} />

          <Text style={styles.guideText}>
            Spread grains in a single layer
          </Text>

          <Text style={styles.guideSubtext}>
            Keep the sample inside the frame
          </Text>
        </View>

        <View style={styles.bottomArea}>
          {captureError ? (
            <Text style={styles.errorText}>
              {captureError}
            </Text>
          ) : (
            <Text style={styles.statusText}>
              {isCapturing
                ? 'Capturing...'
                : 'Camera ready'}
            </Text>
          )}

          <Pressable
            style={[
              styles.captureButton,
              isCapturing &&
                styles.captureButtonDisabled,
            ]}
            onPress={handleCapture}
            disabled={isCapturing}
          >
            <View style={styles.captureInner} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },

  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },

  topBar: {
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backText: {
    color: colors.white,
    fontSize: 34,
    fontWeight: '300',
    lineHeight: 38,
  },

  headerTitle: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '600',
  },

  placeholder: {
    width: 44,
  },

  guideArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  guideFrame: {
    width: '82%',
    aspectRatio: 1.25,
    borderWidth: 2,
    borderColor: colors.white,
    borderRadius: 18,
  },

  guideText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginTop: spacing.lg,
  },

  guideSubtext: {
    color: '#E5E5E5',
    fontSize: 13,
    marginTop: spacing.xs,
  },

  bottomArea: {
    alignItems: 'center',
    paddingBottom: spacing.xxxl,
  },

  statusText: {
    color: colors.white,
    fontSize: 13,
    marginBottom: spacing.md,
  },

  errorText: {
    color: '#FFB4AB',
    fontSize: 13,
    marginBottom: spacing.md,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },

  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  captureButtonDisabled: {
    opacity: 0.45,
  },

  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.white,
  },

  previewOverlay: {
    flex: 1,
    justifyContent: 'space-between',
  },

  previewTopBar: {
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  previewBottomArea: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },

  previewText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },

  previewActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  retakeButton: {
    minWidth: 130,
    minHeight: 52,
    paddingHorizontal: spacing.xl,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  retakeButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },

  usePhotoButton: {
    minWidth: 130,
    minHeight: 52,
    paddingHorizontal: spacing.xl,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  usePhotoButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },

  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },

  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },

  description: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 21,
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