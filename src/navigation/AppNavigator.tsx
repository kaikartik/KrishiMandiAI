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

import HomeScreen from '../screens/home/HomeScreen';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  SignUp: undefined;
  Home: undefined;
  CropSelect: undefined;
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