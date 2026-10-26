import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, StatusBar } from 'react-native';
import { ThemeProvider, useColors } from './src/theme';
import { AppProvider, useApp } from './src/context/AppContext';

import DashboardScreen from './src/screens/DashboardScreen';
import TideDetailScreen from './src/screens/TideDetailScreen';
import WeatherDetailScreen from './src/screens/WeatherDetailScreen';
import CurrentsDetailScreen from './src/screens/CurrentsDetailScreen';
import ObservationsDetailScreen from './src/screens/ObservationsDetailScreen';
import SiteDetailScreen from './src/screens/SiteDetailScreen';
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
      <Stack.Screen name="ObservationsDetail" component={ObservationsDetailScreen} />
      <Stack.Screen name="SiteDetail" component={SiteDetailScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ThemedApp />
    </AppProvider>
  );
}

// Applies the theme chosen in Settings (or the phone's own light/dark setting)
function ThemedApp() {
  const { theme } = useApp();
  return (
    <ThemeProvider theme={theme}>
      <AppNavigator />
    </ThemeProvider>
  );
}

// Tells React Navigation the app's colours, so screen edges and transitions match
function navigationTheme(COLORS) {
  const base = COLORS.isLight ? DefaultTheme : DarkTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: COLORS.accent,
      background: COLORS.background,
      card: COLORS.navBar,
      text: COLORS.textPrimary,
      border: COLORS.cardBorder,
    },
  };
}

function AppNavigator() {
  const COLORS = useColors();

  return (
    <NavigationContainer theme={navigationTheme(COLORS)}>
      <StatusBar barStyle={COLORS.isLight ? 'dark-content' : 'light-content'} />
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
  );
}
