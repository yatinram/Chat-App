import React, { useEffect } from 'react';
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import Colors from './src/constants/colors';
import useCallStore from './src/store/useCallStore';
import socketService from './src/services/socketService';
import { SOCKET_EVENTS } from './src/constants/socketEvents';

const App = () => {
  const { setIncomingCall } = useCallStore();

  // Global incoming call listener (handles FCM wakeup scenarios)
  useEffect(() => {
    const handleIncomingCall = (data) => {
      setIncomingCall(data);
    };

    socketService.on(SOCKET_EVENTS.CALL_INCOMING, handleIncomingCall);
    return () => {
      socketService.off(SOCKET_EVENTS.CALL_INCOMING, handleIncomingCall);
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.bgPrimary}
        translucent={false}
      />
      <AppNavigator />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
});

export default App;
