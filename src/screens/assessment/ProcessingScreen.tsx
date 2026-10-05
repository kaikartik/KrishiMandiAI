import React, {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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

import {
  analyzeLocalImage,
} from '../../services/localMlService';

type Props =
  NativeStackScreenProps<
    RootStackParamList,
    'Processing'
  >;

export default function ProcessingScreen({
  route,
  navigation,
}: Props) {
  const {
    imageUri,
    cropName,
  } = route.params;

  const MIN_GRAIN_CONFIDENCE = 0.5;
  const MIN_GRAIN_DETECTIONS = 3;

  const [
    status,
    setStatus,
  ] = useState(
    'Preparing your sample...',
  );

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    const processSample =
      async () => {
        try {
          setStatus(
            'Running offline analysis...',
          );

          const detections =
            await analyzeLocalImage(
              imageUri,
            );

          console.log(
            '[Processing] Confidence distribution:',
            {
              gte_0_7: detections.filter(
                (detection) => detection.confidence >= 0.7,
              ).length,

              gte_0_6: detections.filter(
                (detection) => detection.confidence >= 0.6,
              ).length,

              gte_0_5: detections.filter(
                (detection) => detection.confidence >= 0.5,
              ).length,

              gte_0_4: detections.filter(
                (detection) => detection.confidence >= 0.4,
              ).length,

              gte_0_3: detections.filter(
                (detection) => detection.confidence >= 0.3,
              ).length,
            },
          );

          if (cancelled) {
            return;
          }

          console.log(
            '[Processing] Local detections:',
            detections,
          );

          /*
           * Only reasonably confident detections
           * are allowed to count toward the sample.
           */
          const grainDetections =
            detections.filter(
              (detection) =>
                detection.className !==
                  'Organic Foreign Matters' &&
                detection.confidence >=
                  MIN_GRAIN_CONFIDENCE,
            );

          const foreignDetections =
            detections.filter(
              (detection) =>
                detection.className ===
                  'Organic Foreign Matters' &&
                detection.confidence >=
                  MIN_GRAIN_CONFIDENCE,
            );

          console.log(
            '[Processing] Valid grain detections:',
            grainDetections.length,
          );

          console.log(
            '[Processing] Valid foreign detections:',
            foreignDetections.length,
          );

          /*
           * A usable rice sample must contain
           * multiple confident grain detections.
           */
          if (
            grainDetections.length <
            MIN_GRAIN_DETECTIONS
          ) {
            Alert.alert(
              'No rice sample found',
              'No rice grains were detected in this sample. Please retake the photo with the grains clearly visible inside the guide.',
              [
                {
                  text: 'Retake',
                  onPress: () => {
                    if (!cancelled) {
                      navigation.goBack();
                    }
                  },
                },
              ],
              {
                cancelable: false,
              },
            );

            return;
          }

          let clean = 0;
          let damaged = 0;
          let broken = 0;
          let chalky = 0;
          let discolored = 0;
          let immature = 0;

          for (
            const detection of
              grainDetections
          ) {
            switch (
              detection.className
            ) {
              case 'Clean':
                clean += 1;
                break;

              case 'Damaged':
                damaged += 1;
                break;

              case 'Broken':
                broken += 1;
                break;

              case 'Chalky':
                chalky += 1;
                break;

              case 'Discolored':
                discolored += 1;
                break;

              case 'Immature':
                immature += 1;
                break;

              default:
                break;
            }
          }

          const grainCount =
            grainDetections.length;

          const foreignCount =
            foreignDetections.length;

          console.log(
            '[Processing] Class breakdown:',
            {
              clean,
              damaged,
              broken,
              chalky,
              discolored,
              immature,
              foreign: foreignCount,
            },
          ); 

          const percentage = (
            count: number,
            denominator: number,
          ) =>
            denominator > 0
              ? Number(
                  (
                    (count /
                      denominator) *
                    100
                  ).toFixed(1),
                )
              : 0;

          const cleanPercentage =
            percentage(
              clean,
              grainCount,
            );

          const damagedPercentage =
            percentage(
              damaged,
              grainCount,
            );

          const brokenPercentage =
            percentage(
              broken,
              grainCount,
            );

          const chalkyPercentage =
            percentage(
              chalky,
              grainCount,
            );

          const discoloredPercentage =
            percentage(
              discolored,
              grainCount,
            );

          const immaturePercentage =
            percentage(
              immature,
              grainCount,
            );

          /*
           * Foreign material is reported relative
           * to detected grains rather than being
           * incorrectly included in the grain
           * denominator.
           */
          const foreignPercentage =
            percentage(
              foreignCount,
              grainCount,
            );

          /*
           * This is detection-area coverage,
           * not pixel-perfect segmentation.
           *
           * The current YOLO model is a detection
           * model, so bounding-box area is the
           * honest metric available here.
           */
          const detectionArea =
            grainDetections.reduce(
              (
                totalArea,
                detection,
              ) => {
                const width =
                  Math.max(
                    0,
                    detection.x2 -
                      detection.x1,
                  );

                const height =
                  Math.max(
                    0,
                    detection.y2 -
                      detection.y1,
                  );

                return (
                  totalArea +
                  width * height
                );
              },
              0,
            );

          const imageArea =
            640 * 640;

          const grainCoverage =
            Math.min(
              100,
              (
                detectionArea /
                imageArea
              ) * 100,
            );

          /*
           * Defect burden is based on the
           * detected grain population.
           */
          const defectPercentage =
            percentage(
              damaged +
                broken +
                chalky +
                discolored +
                immature,
              grainCount,
            );

          /*
           * Quality score is deliberately
           * deterministic and offline.
           *
           * This is a prototype scoring formula,
           * not a certified agricultural grading
           * standard.
           */
          const qualityScore =
            Math.max(
              0,
              Math.min(
                100,
                Number(
                  (
                    100 -
                    defectPercentage *
                      0.9 -
                    foreignPercentage *
                      1.2
                  ).toFixed(1),
                ),
              ),
            );

          let qualityGrade =
            'Defective';

          if (
            qualityScore >= 80
          ) {
            qualityGrade =
              'Premium';
          } else if (
            qualityScore >= 60
          ) {
            qualityGrade =
              'Standard';
          }

          const result = {
            grain_coverage:
              Number(
                grainCoverage.toFixed(
                  1,
                ),
              ),

            damaged_grains:
              damagedPercentage,

            broken_grains:
              brokenPercentage,

            foreign_material:
              Number(
                foreignPercentage.toFixed(
                  1,
                ),
              ),

            quality_score:
              qualityScore,

            quality_grade:
              qualityGrade,

            analysis_engine:
              'local_onnx',
          };

          console.log(
            '[Processing] Grain count:',
            grainCount,
          );

          console.log(
            '[Processing] Foreign count:',
            foreignCount,
          );

          console.log(
            '[Processing] Grain coverage:',
            result.grain_coverage,
          );

          console.log(
            '[Processing] Local result:',
            result,
          );

          setStatus(
            'Analysis complete',
          );

          navigation.replace(
            'Result',
            {
              result,
            },
          );
        } catch (err) {
          if (cancelled) {
            return;
          }

          console.error(
            '[Processing] Local analysis failed:',
            err,
          );

          setError(
            err instanceof Error
              ? err.message
              : 'Unable to process the sample offline.',
          );
        }
      };

    processSample();

    return () => {
      cancelled = true;
    };
  }, [
    imageUri,
    navigation,
    cropName,
  ]);

  if (error) {
    return (
      <View
        style={styles.centered}
      >
        <View
          style={
            styles.imageContainer
          }
        >
          <Image
            source={{
              uri: imageUri,
            }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>

        <View
          style={styles.errorContent}
        >
          <Text
            style={styles.errorTitle}
          >
            Offline analysis failed
          </Text>

          <Text
            style={styles.errorText}
          >
            {error}
          </Text>

          <Pressable
            style={styles.button}
            onPress={() =>
              navigation.goBack()
            }
          >
            <Text
              style={
                styles.buttonText
              }
            >
              Go Back
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View
      style={styles.container}
    >
      <View
        style={
          styles.imageContainer
        }
      >
        <Image
          source={{
            uri: imageUri,
          }}
          style={styles.image}
          resizeMode="cover"
        />
      </View>

      <View
        style={styles.content}
      >
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />

        <Text
          style={styles.title}
        >
          {status}
        </Text>

        <Text
          style={styles.description}
        >
          Your{' '}
          {cropName.toLowerCase()}{' '}
          sample is being analyzed
          directly on this device.
        </Text>

        <View
          style={
            styles.progressTrack
          }
        >
          <View
            style={
              styles.progressFill
            }
          />
        </View>
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        colors.background,
    },

    centered: {
      flex: 1,
      backgroundColor:
        colors.background,
    },

    imageContainer: {
      width: '100%',
      height: '52%',
      backgroundColor:
        '#000000',
      overflow: 'hidden',
    },

    image: {
      width: '100%',
      height: '100%',
    },

    content: {
      flex: 1,
      alignItems:
        'center',
      justifyContent:
        'center',
      paddingHorizontal:
        spacing.xl,
    },

    errorContent: {
      flex: 1,
      alignItems:
        'center',
      justifyContent:
        'center',
      paddingHorizontal:
        spacing.xl,
    },

    title: {
      color: colors.text,
      fontSize: 23,
      fontWeight: '700',
      marginTop:
        spacing.xl,
      textAlign: 'center',
    },

    description: {
      color:
        colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      marginTop:
        spacing.md,
      textAlign: 'center',
      maxWidth: 340,
    },

    progressTrack: {
      width: '70%',
      height: 5,
      borderRadius: 3,
      backgroundColor:
        '#E5E5E5',
      marginTop:
        spacing.xl,
      overflow: 'hidden',
    },

    progressFill: {
      width: '65%',
      height: '100%',
      backgroundColor:
        colors.primary,
      borderRadius: 3,
    },

    errorTitle: {
      color: colors.text,
      fontSize: 24,
      fontWeight: '700',
      textAlign: 'center',
    },

    errorText: {
      color:
        colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      textAlign: 'center',
      marginTop:
        spacing.md,
      marginBottom:
        spacing.xl,
    },

    button: {
      minHeight: 52,
      paddingHorizontal:
        spacing.xl,
      borderRadius: 12,
      backgroundColor:
        colors.primary,
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    buttonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: '600',
    },
  });