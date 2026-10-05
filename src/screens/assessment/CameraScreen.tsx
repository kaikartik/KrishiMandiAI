import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

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

import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import type {
  RootStackParamList,
} from '../../navigation/AppNavigator';

import {
  colors,
} from '../../styles/colors';

import {
  spacing,
} from '../../styles/spacing';

type Props =
  NativeStackScreenProps<
    RootStackParamList,
    'Camera'
  >;

type LayoutRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

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
  } =
    useCameraPermission();

  const photoOutput =
    usePhotoOutput({
      containerFormat: 'jpeg',
      quality: 0.9,
      qualityPrioritization:
        'balanced',
    });

  const [
    capturedPhoto,
    setCapturedPhoto,
  ] =
    useState<string | null>(null);

  const [
    analysisPhoto,
    setAnalysisPhoto,
  ] =
    useState<string | null>(null);

  const [
    isCapturing,
    setIsCapturing,
  ] =
    useState(false);

  const [
    captureError,
    setCaptureError,
  ] =
    useState<string | null>(null);

  const previewRef =
    useRef<any>(null);

  const guideFrameRef =
    useRef<any>(null);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [
    hasPermission,
    requestPermission,
  ]);

  const measureGuideAndPreview =
    (): Promise<{
      preview: LayoutRect;
      guide: LayoutRect;
    }> => {
      return new Promise(
        (
          resolve,
          reject,
        ) => {
          if (
            !previewRef.current ||
            !guideFrameRef.current
          ) {
            reject(
              new Error(
                'Camera guide layout is not available.',
              ),
            );
            return;
          }

          let previewRect:
            LayoutRect | null = null;

          let guideRect:
            LayoutRect | null = null;

          const finish = () => {
            if (
              previewRect &&
              guideRect
            ) {
              resolve({
                preview: previewRect,
                guide: guideRect,
              });
            }
          };

          previewRef.current.measureInWindow(
            (
              x: number,
              y: number,
              width: number,
              height: number,
            ) => {
              previewRect = {
                x,
                y,
                width,
                height,
              };

              finish();
            },
          );

          guideFrameRef.current.measureInWindow(
            (
              x: number,
              y: number,
              width: number,
              height: number,
            ) => {
              guideRect = {
                x,
                y,
                width,
                height,
              };

              finish();
            },
          );
        },
      );
    };

  const handleCapture =
    async () => {
      if (isCapturing) {
        return;
      }

      try {
        setCaptureError(null);
        setIsCapturing(true);

        const {
          preview,
          guide,
        } =
          await measureGuideAndPreview();

        console.log(
          '[Camera] Actual preview window:',
          `x=${preview.x}`,
          `y=${preview.y}`,
          `width=${preview.width}`,
          `height=${preview.height}`,
        );

        console.log(
          '[Camera] Actual guide window:',
          `x=${guide.x}`,
          `y=${guide.y}`,
          `width=${guide.width}`,
          `height=${guide.height}`,
        );

        const guideInPreview = {
          x: guide.x - preview.x,
          y: guide.y - preview.y,
          width: guide.width,
          height: guide.height,
        };

        console.log(
          '[Camera] Guide inside preview:',
          `x=${guideInPreview.x}`,
          `y=${guideInPreview.y}`,
          `width=${guideInPreview.width}`,
          `height=${guideInPreview.height}`,
        );

        const photo =
          await photoOutput.capturePhoto(
            {
              flashMode: 'off',
              enableShutterSound: true,
            },
            {},
          );

        console.log(
          'Photo captured:',
          photo,
        );

        console.log(
          '[Camera] Photo orientation:',
          photo.orientation,
          'mirrored:',
          photo.isMirrored,
          'size:',
          photo.width,
          'x',
          photo.height,
        );

        const image =
          await photo.toImageAsync();

        console.log(
          '[Camera] Oriented image:',
          image.width,
          'x',
          image.height,
        );

        const scale =
          Math.max(
            preview.width / image.width,
            preview.height / image.height,
          );

        const displayedWidth =
          image.width * scale;

        const displayedHeight =
          image.height * scale;

        const offsetX =
          (
            preview.width -
            displayedWidth
          ) / 2;

        const offsetY =
          (
            preview.height -
            displayedHeight
          ) / 2;

        console.log(
          '[Camera] Image display mapping:',
          'scale=',
          scale,
          'displayed=',
          displayedWidth,
          'x',
          displayedHeight,
          'offset=',
          offsetX,
          ',',
          offsetY,
        );

        const sourceLeft =
          Math.max(
            0,
            Math.floor(
              (
                guideInPreview.x -
                offsetX
              ) / scale,
            ),
          );

        const sourceTop =
          Math.max(
            0,
            Math.floor(
              (
                guideInPreview.y -
                offsetY
              ) / scale,
            ),
          );

        const sourceRight =
          Math.min(
            image.width,
            Math.ceil(
              (
                guideInPreview.x +
                guideInPreview.width -
                offsetX
              ) / scale,
            ),
          );

        const sourceBottom =
          Math.min(
            image.height,
            Math.ceil(
              (
                guideInPreview.y +
                guideInPreview.height -
                offsetY
              ) / scale,
            ),
          );

        const cropWidth =
          sourceRight - sourceLeft;

        const cropHeight =
          sourceBottom - sourceTop;

        console.log(
          '[Camera] ROI:',
          `x=${sourceLeft}`,
          `y=${sourceTop}`,
          `width=${cropWidth}`,
          `height=${cropHeight}`,
        );

        if (
          cropWidth <= 10 ||
          cropHeight <= 10
        ) {
          photo.dispose();

          throw new Error(
            'Invalid camera analysis region.',
          );
        }

        const cropped =
          await image.cropAsync(
            sourceLeft,
            sourceTop,
            sourceRight,
            sourceBottom,
          );

        console.log(
          '[Camera] Cropped image:',
          cropped.width,
          'x',
          cropped.height,
        );

        const croppedPath =
          await cropped.saveToTemporaryFileAsync(
            'jpg',
            95,
          );

        console.log(
          '[Camera] Analysis image:',
          croppedPath,
        );

        const capturedPhotoPath =
          await photo.saveToTemporaryFileAsync();

        console.log(
          '[Camera] Captured photo:',
          capturedPhotoPath,
        );

        setCapturedPhoto(
          `file://${capturedPhotoPath}`,
        );

        setAnalysisPhoto(
          `file://${croppedPath}`,
        );

        photo.dispose();
      } catch (error) {
        console.error(
          '[Camera] Failed to capture/process photo:',
          error,
        );

        setCaptureError(
          'Unable to prepare the photo. Please try again.',
        );
      } finally {
        setIsCapturing(false);
      }
    };

  const handleRetake =
    () => {
      setCapturedPhoto(null);
      setAnalysisPhoto(null);
      setCaptureError(null);
    };

  const handleUsePhoto =
    () => {
      if (!analysisPhoto) {
        return;
      }

      console.log(
        '[Camera] Photo ready for local ML:',
        analysisPhoto,
      );

      navigation.navigate(
        'Processing',
        {
          imageUri: analysisPhoto,
          cropId,
          cropName,
        },
      );
    };

  if (!hasPermission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>
          Camera permission is required.
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
        <Text style={styles.message}>
          Camera unavailable.
        </Text>
      </View>
    );
  }

  if (capturedPhoto) {
    return (
      <View style={styles.container}>
        <Image
          source={{
            uri: capturedPhoto,
          }}
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
        />

        <View
          style={styles.previewOverlay}
          pointerEvents="box-none"
        >
          <View style={styles.previewTop}>
            <Text style={styles.previewTitle}>
              Captured sample
            </Text>

            <Text style={styles.previewSubtitle}>
              Original camera photo
            </Text>
          </View>

          {analysisPhoto && (
            <View style={styles.analysisPreview}>
              <Text style={styles.analysisLabel}>
                ACTUAL ANALYSIS CROP
              </Text>

              <View style={styles.analysisImageFrame}>
                <Image
                  source={{
                    uri: analysisPhoto,
                  }}
                  style={styles.analysisImage}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.analysisHint}>
                This exact image will be sent
                to the offline ML model.
              </Text>
            </View>
          )}

          <View style={styles.previewBottom}>
            {captureError && (
              <Text style={styles.errorText}>
                {captureError}
              </Text>
            )}

            <View style={styles.actionRow}>
              <Pressable
                style={styles.secondaryButton}
                onPress={handleRetake}
              >
                <Text style={styles.secondaryButtonText}>
                  Retake
                </Text>
              </Pressable>

              <Pressable
                style={styles.primaryButton}
                onPress={handleUsePhoto}
                disabled={!analysisPhoto}
              >
                <Text style={styles.primaryButtonText}>
                  Analyze Sample
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View
      ref={previewRef}
      style={styles.container}
    >
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        outputs={[photoOutput]}
      />

      <View
        style={styles.overlay}
        pointerEvents="box-none"
      >
        <View style={styles.topBar}>
          <Text style={styles.title}>
            {cropName}
          </Text>

          <Text style={styles.subtitle}>
            Offline quality assessment
          </Text>
        </View>

        <View style={styles.guideArea}>
          <View
            ref={guideFrameRef}
            style={styles.guideFrame}
          />

          <Text style={styles.guideText}>
            Spread grains in a
            single layer
          </Text>

          <Text style={styles.guideSubtext}>
            Keep the sample inside
            the frame
          </Text>
        </View>

        <View style={styles.bottomArea}>
          {captureError && (
            <Text style={styles.errorText}>
              {captureError}
            </Text>
          )}

          <Pressable
            style={styles.captureButton}
            onPress={handleCapture}
            disabled={isCapturing}
          >
            <View style={styles.captureInner} />
          </Pressable>

          <Text style={styles.captureHint}>
            {isCapturing
              ? 'Preparing sample...'
              : 'Tap to capture'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000000',
    },

    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
      backgroundColor: colors.background,
    },

    message: {
      color: colors.text,
      fontSize: 16,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },

    button: {
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: 14,
      backgroundColor: colors.primary,
    },

    buttonText: {
      color: colors.white,
      fontWeight: '700',
    },

    overlay: {
      flex: 1,
      justifyContent: 'space-between',
    },

    topBar: {
      paddingTop: spacing.xl,
      paddingHorizontal: spacing.lg,
    },

    title: {
      color: colors.white,
      fontSize: 22,
      fontWeight: '800',
    },

    subtitle: {
      color: colors.white,
      opacity: 0.8,
      marginTop: 4,
      fontSize: 13,
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
      fontSize: 15,
      fontWeight: '700',
      marginTop: spacing.md,
    },

    guideSubtext: {
      color: colors.white,
      opacity: 0.8,
      fontSize: 12,
      marginTop: 4,
    },

    bottomArea: {
      alignItems: 'center',
      paddingBottom: spacing.xl,
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

    captureInner: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.white,
    },

    captureHint: {
      color: colors.white,
      marginTop: spacing.sm,
      fontSize: 13,
    },

    previewOverlay: {
      flex: 1,
      justifyContent: 'space-between',
      padding: spacing.lg,
    },

    previewTop: {
      paddingTop: spacing.xl,
    },

    previewTitle: {
      color: colors.white,
      fontSize: 22,
      fontWeight: '800',
    },

    previewSubtitle: {
      color: colors.white,
      opacity: 0.85,
      marginTop: 6,
    },

    analysisPreview: {
      alignItems: 'center',
      width: '100%',
    },

    analysisLabel: {
      color: colors.white,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 1,
      marginBottom: spacing.sm,
    },

    analysisImageFrame: {
      width: '88%',
      aspectRatio: 1.25,
      borderWidth: 2,
      borderColor: colors.primary,
      borderRadius: 14,
      overflow: 'hidden',
      backgroundColor: 'rgba(0,0,0,0.7)',
    },

    analysisImage: {
      width: '100%',
      height: '100%',
    },

    analysisHint: {
      color: colors.white,
      opacity: 0.8,
      fontSize: 11,
      textAlign: 'center',
      marginTop: spacing.sm,
    },

    previewBottom: {
      alignItems: 'center',
    },

    actionRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },

    primaryButton: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: 14,
      backgroundColor: colors.primary,
    },

    primaryButtonText: {
      color: colors.white,
      fontWeight: '800',
    },

    secondaryButton: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: 14,
      backgroundColor: 'rgba(0,0,0,0.65)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.5)',
    },

    secondaryButtonText: {
      color: colors.white,
      fontWeight: '700',
    },

    errorText: {
      color: '#FFB4B4',
      textAlign: 'center',
      marginBottom: spacing.md,
    },
  });