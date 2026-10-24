import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';
import { COLORS } from './src/utils/constants';
import { AppProvider } from './src/context/AppContext';

import DashboardScreen from './src/screens/DashboardScreen';
import TideDetailScreen from './src/screens/TideDetailScreen';
import WeatherDetailScreen from './src/screens/WeatherDetailScreen';
import CurrentsDetailScreen from './src/screens/CurrentsDetailScreen';
import LocationsScreen from './src/screens/LocationsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Home stack: Dashboard + all drill-down detail screens
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="TideDetail" component={TideDetailScreen} />
      <Stack.Screen name="WeatherDetail" component={WeatherDetailScreen} />
      <Stack.Screen name="CurrentsDetail" component={CurrentsDetailScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AppProvider>
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: { backgroundColor: COLORS.navBar, borderTopColor: COLORS.cardBorder },
          tabBarActiveTintColor: COLORS.accent,
          tabBarInactiveTintColor: COLORS.textMuted,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeStack}
          options={{ tabBarLabel: 'Home', tabBarIcon: ({ color }) => <Text style={{ color }}>🏠</Text> }}
        />
        <Tab.Screen
          name="Locations"
          component={LocationsScreen}
          options={{ tabBarLabel: 'Locations', tabBarIcon: ({ color }) => <Text style={{ color }}>📍</Text> }}
        />
      </Tab.Navigator>
    </NavigationContainer>
    </AppProvider>
  );
}
