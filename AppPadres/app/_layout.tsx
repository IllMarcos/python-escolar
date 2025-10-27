// app/_layout.tsx
import React, { useState, useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../firebaseConfig'; 
import { registerForPushNotificationsAsync } from '../services/notificationService'; 
import { ActivityIndicator, View } from 'react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { StatusBar } from 'expo-status-bar';

const useProtectedRoute = (
  user: User | null,
  isLinked: boolean | undefined,
  initialLoadComplete: boolean
) => {
  const segments = useSegments();

  useEffect(() => {
    // NO navegamos hasta que la carga inicial esté completa
    if (!initialLoadComplete) return;

    const inAppRoute = segments[0] === '(tabs)';
    const inAuthRoute = ['login', 'registro'].includes(segments[0] || '');
    const inLinkRoute = segments[0] === 'codigo';

    if (!user && !inAuthRoute) {
      router.replace('/login');
    } else if (user && isLinked === true && !inAppRoute) {
      router.replace('/');
    } else if (user && isLinked === false && !inLinkRoute) {
      router.replace('/codigo');
    } else if (user && inAuthRoute) {
      router.replace(isLinked ? '/' : '/codigo');
    }

  }, [user, isLinked, initialLoadComplete, segments]);
};


export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [isLinked, setIsLinked] = useState<boolean | undefined>(undefined);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // --- ÚNICO HOOK COMBINADO ---
  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (authenticatedUser) => {
      setUser(authenticatedUser);

      // Limpiamos el listener anterior si existía
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (authenticatedUser) {
        // Registro de push token en segundo plano
        registerForPushNotificationsAsync(authenticatedUser.uid).catch(error => {
          console.error("Error al registrar token:", error);
        });

        // Configuramos el listener de Firestore
        const docRef = doc(db, 'padres', authenticatedUser.uid);
        
        unsubscribeSnapshot = onSnapshot(
          docRef,
          (docSnap) => {
            const data = docSnap.data();
            
            if (docSnap.exists() && data && data.alumnoVinculado) {
              console.log('✅ Usuario vinculado');
              setIsLinked(true);
            } else {
              console.log('❌ Usuario NO vinculado');
              setIsLinked(false);
            }

            // Marcamos que la carga inicial está completa
            setInitialLoadComplete(true);
          },
          (error) => {
            console.error("Error al escuchar documento:", error);
            setIsLinked(false);
            setInitialLoadComplete(true);
          }
        );

      } else {
        // Sin usuario autenticado
        setIsLinked(false);
        setInitialLoadComplete(true);
      }
    });

    // Cleanup
    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  // Hook de protección de rutas
  useProtectedRoute(user, isLinked, initialLoadComplete);

  // CRÍTICO: No renderizamos el Stack hasta saber el estado completo
  if (!initialLoadComplete) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0A' }}>
        <ActivityIndicator size="large" color="#F5F5F0" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" backgroundColor="transparent" translucent />
      <Stack 
        screenOptions={{ 
          headerShown: false,
          contentStyle: { backgroundColor: '#0A0A0A' },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="registro" />
        <Stack.Screen name="codigo" />
        <Stack.Screen name="(tabs)" /> 
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}