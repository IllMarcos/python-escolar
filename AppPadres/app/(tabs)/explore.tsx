// app/(tabs)/explore.tsx
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebaseConfig'; // Ajusta la ruta

export default function ProfileScreen() {

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // El layout raíz (app/_layout.tsx) detectará el cambio
      // y redirigirá a /login automáticamente.
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil</Text>
      <Text style={styles.email}>{auth.currentUser?.email}</Text>
      <Button title="Cerrar Sesión" onPress={handleLogout} color="red" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  email: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 30,
  },
});