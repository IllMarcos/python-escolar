// app/(tabs)/_layout.tsx
import React, { useEffect, useState } from 'react';
import { Tabs, router } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig'; // Ajusta la ruta (subimos un nivel)
import { ActivityIndicator, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome'; // Iconos de ejemplo

// Hook para verificar si el alumno está vinculado
const useVinculacionCheck = () => {
  const [isVinculado, setVinculado] = useState(false);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      // Si por alguna razón no hay usuario, no hacer nada (el layout raíz lo echará)
      setLoading(false);
      return;
    }

    // Escuchamos el documento del padre EN TIEMPO REAL
    const userDocRef = doc(db, 'padres', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.alumnoVinculado) {
          // ¡Sí tiene alumno!
          setVinculado(true);
        } else {
          // No tiene alumno, lo mandamos a la pantalla de código
          setVinculado(false);
          router.replace('/codigo');
        }
      } else {
        // Error, no existe el doc del padre (no debería pasar si el registro fue bien)
        console.log("No se encontró el documento del padre.");
      }
      setLoading(false);
    });

    return () => unsubscribe(); // Limpia el listener
  }, [user]);

  return { loading, isVinculado };
};

export default function TabsLayout() {
  const { loading, isVinculado } = useVinculacionCheck();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isVinculado) {
    // Si no está vinculado, el hook ya lo redirigió.
    // Mostramos null o un loader mientras ocurre la redirección.
    return null;
  }

  // ¡Usuario logueado Y vinculado! Mostramos las pestañas.
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: 'blue' }}>
      <Tabs.Screen
        name="index" // app/(tabs)/index.tsx
        options={{
          title: 'Avisos',
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