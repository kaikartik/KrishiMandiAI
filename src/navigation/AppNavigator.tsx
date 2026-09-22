import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  NavigationContainer,
} from '@react-navigation/native';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';

import SplashScreen from '../screens/intro/SplashScreen';
import OnboardingScreen from '../screens/intro/OnboardingScreen';

import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';

import CropSelectScreen from '../screens/assessment/CropSelectScreen';
import AssessmentTypeScreen from '../screens/assessment/AssessmentTypeScreen';
import SamplePrepScreen from '../screens/assessment/SamplePrepScreen';
import CameraScreen from '../screens/assessment/CameraScreen';
import ProcessingScreen from '../screens/assessment/ProcessingScreen';
import ResultScreen from '../screens/assessment/ResultScreen';

import HomeScreen from '../screens/home/HomeScreen';

export type RootStackParamList = {
  Splash: undefined;

  Onboarding: undefined;

  Login: undefined;

  SignUp: undefined;

  Home: undefined;

  CropSelect: undefined;

  AssessmentType: {
    cropId: string;
    cropName: string;
  };

  SamplePrep: {
    cropId: string;
    cropName: string;
  };

  Camera: {
    cropId: string;
    cropName: string;
  };

  Processing: {
    imageUri: string;
    cropId: string;
    cropName: string;
  };

  Result: {
    assessmentId: string;
  };
};

const Stack =
  createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const {
    session,
    loading: authLoading,
  } = useAuth();

  const [
    introLoading,
    setIntroLoading,
  ] = useState(true);

  const [
    hasSeenOnboarding,
    setHasSeenOnboarding,
  ] = useState(false);

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const value =
          await AsyncStorage.getItem(
            'hasSeenOnboarding',
          );

        setHasSeenOnboarding(
          value === 'true',
        );
      } catch {
        setHasSeenOnboarding(false);
      } finally {
        setIntroLoading(false);
      }
    }

    checkOnboarding();
  }, []);

  if (authLoading || introLoading) {
    return null;
  }

  return (
    <NavigationContainer>
      {session ? (
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
          />

          <Stack.Screen
            name="CropSelect"
            component={CropSelectScreen}
          />

          <Stack.Screen
            name="AssessmentType"
            component={AssessmentTypeScreen}
          />

          <Stack.Screen
            name="SamplePrep"
            component={SamplePrepScreen}
          />

          <Stack.Screen
            name="Camera"
            component={CameraScreen}
          />

          <Stack.Screen
            name="Processing"
            component={ProcessingScreen}
          />

          <Stack.Screen
            name="Result"
            component={ResultScreen}
          />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator
          initialRouteName={
            hasSeenOnboarding
              ? 'Login'
              : 'Splash'
          }
          screenOptions={{
            headerShown: false,
            animation: 'fade',
          }}
        >
          <Stack.Screen
            name="Splash"
            component={SplashScreen}
          />

          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
          />

          <Stack.Screen
            name="Login"
            component={LoginScreen}
          />

          <Stack.Screen
            name="SignUp"
            component={SignUpScreen}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}