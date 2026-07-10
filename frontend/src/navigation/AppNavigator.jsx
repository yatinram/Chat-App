import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import useAuthStore from '../store/useAuthStore';
import LoginScreen from '../screens/auth/LoginScreen';
import MainNavigator from './MainNavigator';
import SplashScreen from '../screens/SplashScreen';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, initAuth } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const init = async () => {
      await initAuth();
      setIsInitializing(false);
    };
    init();
  }, []);

  // Show splash screen for 15 seconds on cold start
  if (showSplash) {
    return (
      <SplashScreen
        onDone={() => setShowSplash(false)}
      />
    );
  }

  if (isInitializing) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
