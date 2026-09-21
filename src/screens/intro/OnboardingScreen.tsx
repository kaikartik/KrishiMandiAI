import React, {
  useRef,
  useState,
} from 'react';

import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaView,
} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../navigation/AppNavigator';

import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<
  RootStackParamList,
  'Onboarding'
>;

const slides = [
  {
    number: '01',
    title: 'Know your grain quality',
    description:
      'Capture a clear sample of your grain and let AI analyze visible quality characteristics.',
    icon: '🌾',
  },
  {
    number: '02',
    title: 'AI-powered assessment',
    description:
      'Detect healthy and defective grains to generate a transparent preliminary quality assessment.',
    icon: '✦',
  },
  {
    number: '03',
    title: 'Understand your price',
    description:
      'Combine quality results with a reference market price to estimate the value of your grain.',
    icon: '₹',
  },
];

export default function OnboardingScreen({
  navigation,
}: Props) {
  const scrollRef =
  useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const isLastSlide =
    currentIndex === slides.length - 1;

  function handleScroll(
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) {
    const offsetX =
      event.nativeEvent.contentOffset.x;

    const index = Math.round(offsetX / width);

    if (
      index >= 0 &&
      index < slides.length &&
      index !== currentIndex
    ) {
      setCurrentIndex(index);
    }
  }

  async function finishOnboarding() {
    await AsyncStorage.setItem(
      'hasSeenOnboarding',
      'true',
    );

    navigation.replace('Login');
  }

  function handleNext() {
    if (isLastSlide) {
      finishOnboarding();
      return;
    }

    const nextIndex = currentIndex + 1;

    scrollRef.current?.scrollTo({
      x: nextIndex * width,
      animated: true,
    });

    setCurrentIndex(nextIndex);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.brand}>
          KrishiMandi AI
        </Text>

        {!isLastSlide && (
          <Pressable
            onPress={finishOnboarding}
            hitSlop={12}
          >
            <Text style={styles.skip}>
              Skip
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {slides.map((slide) => (
          <View
            key={slide.number}
            style={styles.slide}
          >
            <View style={styles.illustration}>
              <View style={styles.illustrationCircle}>
                <Text style={styles.icon}>
                  {slide.icon}
                </Text>
              </View>

              <View style={styles.numberBadge}>
                <Text style={styles.numberText}>
                  {slide.number}
                </Text>
              </View>
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.title}>
                {slide.title}
              </Text>

              <Text style={styles.description}>
                {slide.description}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottom}>
        <View style={styles.pagination}>
          {slides.map((slide, index) => (
            <View
              key={slide.number}
              style={[
                styles.dot,
                index === currentIndex &&
                  styles.activeDot,
              ]}
            />
          ))}
        </View>

        <Pressable
          style={styles.button}
          onPress={handleNext}
        >
          <Text style={styles.buttonText}>
            {isLastSlide
              ? 'Get Started'
              : 'Continue'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  topBar: {
    height: 64,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  brand: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryDark,
  },

  skip: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  slide: {
    width,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },

  illustration: {
    height: 320,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  illustrationCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  icon: {
    fontSize: 68,
  },

  numberBadge: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },

  numberText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },

  textContainer: {
    paddingTop: spacing.xxxl,
  },

  title: {
    fontSize: 28,
    lineHeight: 35,
    fontWeight: '800',
    color: colors.text,
  },

  description: {
    marginTop: spacing.md,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
  },

  bottom: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    paddingTop: spacing.lg,
  },

  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    gap: 6,
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.border,
  },

  activeDot: {
    width: 24,
    backgroundColor: colors.primary,
  },

  button: {
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});