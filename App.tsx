import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from './src/screens/DashboardScreen';
import AskAltuScreen from './src/screens/AskAltuScreen';
import StepsDetailScreen from './src/screens/StepsDetailScreen';
import SleepDetailScreen from './src/screens/SleepDetailScreen';
import WorkoutDetailScreen from './src/screens/WorkoutDetailScreen';
import EnergyDetailScreen from './src/screens/EnergyDetailScreen';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  return (
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
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen 
          name="StepsDetail" 
          component={StepsDetailScreen}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="SleepDetail" 
          component={SleepDetailScreen}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="WorkoutDetail" 
          component={WorkoutDetailScreen}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="EnergyDetail" 
          component={EnergyDetailScreen}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
