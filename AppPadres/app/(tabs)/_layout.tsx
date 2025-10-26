// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function TabsLayout() {
  // ¡No más 'useVinculacionCheck'! 
  // El layout raíz (app/_layout.tsx) ya nos protegió.
  // Si llegamos aquí, el usuario ESTÁ vinculado.
  
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: 'blue' }}>
      <Tabs.Screen
        name="index" // app/(tabs)/index.tsx
        options={{
          title: 'Inicio', // Cambiado de 'Avisos' a 'Inicio'
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore" // app/(tabs)/explore.tsx
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}