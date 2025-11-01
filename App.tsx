import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from './src/screens/DashboardScreen';
import AskAltuScreen from './src/screens/AskAltuScreen';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ color, size }) => {
            const name = route.name === 'Dashboard' ? 'stats-chart' : 'chatbubble-ellipses';
            // Fallback if Ionicons not available in env
            return (Ionicons as any)?.name ? (
              // @ts-ignore
              <Ionicons name={name as any} size={size} color={color} />
            ) : (
              <View style={{ width: size, height: size, backgroundColor: color, borderRadius: size / 2 }} />
            );
          },
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Ask Altu" component={AskAltuScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
