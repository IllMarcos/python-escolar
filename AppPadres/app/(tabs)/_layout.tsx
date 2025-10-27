// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
// FIX: Eliminadas 'Alert', 'TouchableOpacity' y 'auth'
import { View, StyleSheet } from 'react-native'; 
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- Componente de Ícono de Tab (Sin cambios) ---
function TabBarIcon(props: {
  name: React.ComponentProps<typeof Feather>['name'];
  color: string;
  focused: boolean;
}) {
  return (
    <View style={styles.tabIconContainer}>
      <Feather 
        size={26} 
        style={{ marginBottom: -3 }} 
        {...props} 
      />
      {props.focused && <View style={styles.tabIndicator} />}
    </View>
  );
}

// --- Layout Principal de Pestañas ---
export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false, 
        tabBarActiveTintColor: '#F5F5F0',
        tabBarInactiveTintColor: '#4A4A4A',
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#0A0A0A',
          borderTopWidth: 1,
          borderTopColor: '#2A2A2A',
          height: 65 + insets.bottom,
          paddingTop: 10,
          paddingBottom: insets.bottom + 5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="user" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 5,
  },
  tabIndicator: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#F5F5F0',
    marginTop: 8,
  },
});