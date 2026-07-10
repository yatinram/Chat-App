import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChatScreen from '../../screens/chat/ChatScreen';
import SearchScreen from '../../screens/chat/SearchScreen';
import IncomingCallScreen from '../../screens/calls/IncomingCallScreen';
import ActiveCallScreen from '../../screens/calls/ActiveCallScreen';

const Stack = createNativeStackNavigator();

const ChatStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen
        name="IncomingCall"
        component={IncomingCallScreen}
        options={{ presentation: 'fullScreenModal' }}
      />
      <Stack.Screen
        name="ActiveCall"
        component={ActiveCallScreen}
        options={{ presentation: 'fullScreenModal' }}
      />
    </Stack.Navigator>
  );
};

export default ChatStack;
