// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons'; // <-- Cambiamos a Feather
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // <-- Para responsividad

// Componente de ícono
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

export default function TabLayout() {
  const insets = useSafeAreaInsets(); // Para el padding de la barra de Android/iOS

  return (
    <Tabs
      screenOptions={{
        // --- Estilos del Header ---
        headerShown: false, // Haremos un header personalizado en la pantalla

        // --- Estilos de la Tab Bar ---
        tabBarActiveTintColor: '#F5F5F0', // Blanco
        tabBarInactiveTintColor: '#4A4A4A', // Gris
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#0A0A0A', // Fondo oscuro
          borderTopWidth: 1,
          borderTopColor: '#2A2A2A',
          // --- Altura y Padding Responsivo ---
          height: 65 + insets.bottom,
          paddingTop: 10,
          paddingBottom: insets.bottom + 5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Escanear',
          tabBarIcon: ({ color, focused }) => (
            // Icono de cámara
            <TabBarIcon name="camera" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Opciones',
          tabBarIcon: ({ color, focused }) => (
            // Icono de ajustes
            <TabBarIcon name="settings" color={color} focused={focused} />
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