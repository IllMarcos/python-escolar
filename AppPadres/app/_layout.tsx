// app/_layout.tsx
import React, { useState, useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // <-- Asegúrate que la ruta sea correcta
import { registerForPushNotificationsAsync } from '../services/notificationService'; // <-- Asegúrate que la ruta sea correcta
import { ActivityIndicator, View } from 'react-native';

// Hook personalizado para manejar la lógica de redirección
const useProtectedRoute = (user: User | null, loading: boolean) => {
  const segments = useSegments();

  useEffect(() => {
    if (loading) return; // No hacer nada mientras carga

    // Revisa si estamos en una ruta de autenticación (ej. /login)
    const inAuthRoute = ['login', 'registro'].includes(segments[0] || '');

    if (!user && !inAuthRoute) {
      // 1. Si NO hay usuario Y NO está en una ruta de auth -> A /login
      router.replace('/login');
    
    } else if (user && (inAuthRoute || segments.length < 1)) {

      // 2. Si SÍ hay usuario Y está en ruta de auth O en la raíz -> A la app
      // Esta es la línea correcta (compara un número con un número)
      router.replace('/'); // '/' es la ruta base de (tabs)/index.tsx
    }
    // 3. Si SÍ hay usuario y SÍ está en la app -> no hace nada (se queda)
    // 4. Si NO hay usuario y SÍ está en ruta de auth -> no hace nada (se queda)

  }, [user, loading, segments]);
};

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listener de Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, async (authenticatedUser) => {
      setUser(authenticatedUser);
      setLoading(false);

      if (authenticatedUser) {
        // ¡Usuario logueado! Registramos su token FCM
        console.log('Usuario autenticado:', authenticatedUser.uid);
        await registerForPushNotificationsAsync(authenticatedUser.uid);
      }
    });

    // Limpia el listener
    return () => unsubscribe();
  }, []);

  // Hook de protección de rutas
  useProtectedRoute(user, loading);

  if (loading) {
    // Muestra un loader mientras Firebase Auth revisa
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Renderiza el Stack principal
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Pantallas fuera de las pestañas */}
      <Stack.Screen name="login" />
      <Stack.Screen name="registro" />
      <Stack.Screen name="codigo" />
      
      {/* Layout principal de la app (las pestañas) */}
      <Stack.Screen name="(tabs)" /> 
      
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}