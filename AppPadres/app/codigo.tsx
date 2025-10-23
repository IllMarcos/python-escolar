// app/codigo.tsx
import React, { useState } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    Button, 
    StyleSheet, 
    Alert, 
    ActivityIndicator,
    TouchableOpacity
} from 'react-native';
import { db, auth } from '../firebaseConfig'; // <- Revisa que esta ruta sea correcta
import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';

const CodigoScreen = () => {
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Botón para cerrar sesión por si el usuario necesita cambiar de cuenta
  const handleLogout = async () => {
     try {
        await signOut(auth);
        // El layout raíz (app/_layout.tsx) detectará el cambio
        // y redirigirá a /login automáticamente.
     } catch (error) {
        Alert.alert("Error", "No se pudo cerrar sesión.");
     }
  };

  const handleVincular = async () => {
    if (codigo.trim().length !== 6) {
      Alert.alert('Error', 'El código debe tener 6 caracteres.');
      return;
    }
    setLoading(true);

    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("Usuario no autenticado");

      // 1. Buscar el código en Firestore
      const codigosRef = collection(db, 'codigosInvitacion');
      const q = query(
        codigosRef,
        where('codigo', '==', codigo.trim().toUpperCase()),
        where('usado', '==', false) // Solo códigos no usados
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // No se encontró el código o ya fue usado
        Alert.alert('Error', 'Código inválido o ya utilizado.');
        setLoading(false);
        return;
      }

      // 2. Si se encontró, obtener los datos
      const codigoDoc = querySnapshot.docs[0];
      const { alumnoId } = codigoDoc.data();

      // 3. Usamos un "Batch Write" para una transacción (todo o nada)
      const batch = writeBatch(db);

      // 3a. Actualiza el documento del padre con el ID del alumno
      const padreRef = doc(db, 'padres', userId);
      batch.update(padreRef, { alumnoVinculado: alumnoId });

      // 3b. Actualiza (desactiva) el código
      const codigoRef = doc(db, 'codigosInvitacion', codigoDoc.id);
      batch.update(codigoRef, {
        usado: true,
        padreId: userId, // Guardamos quién lo usó
        fechaUso: serverTimestamp(), // Marca de tiempo del servidor
      });

      // 4. Ejecuta la transacción
      await batch.commit();

      Alert.alert(
        '¡Éxito!',
        'Alumno vinculado correctamente.'
      );
      
      // 5. El layout (tabs) detectará el cambio en el documento del padre
      // y automáticamente mostrará las pestañas.
      // Podemos forzar la navegación por si acaso.
      router.replace('/');

    } catch (error: any) {
      console.error('Error al vincular código:', error);
      Alert.alert('Error', 'Ocurrió un problema al vincular el alumno.');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vincular Alumno</Text>
      <Text style={styles.subtitle}>
        Ingresa el código de invitación de 6 dígitos que te proporcionó la escuela.
      </Text>
      
      <TextInput
        style={styles.input}
        placeholder="ABC123"
        value={codigo}
        onChangeText={setCodigo}
        autoCapitalize="characters"
        maxLength={6}
      />
      
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <Button title="Vincular Alumno" onPress={handleVincular} />
      )}
      
      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
           <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 20, 
    backgroundColor: '#fff' 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 10 
  },
  subtitle: { 
    fontSize: 16, 
    textAlign: 'center', 
    marginBottom: 30, 
    color: '#555' 
  },
  input: {
    height: 50,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    padding: 10,
    borderRadius: 5,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 3,
  },
  logoutButton: {
    marginTop: 40,
    alignSelf: 'center',
  },
  logoutText: {
    color: 'red',
    fontSize: 16,
  }
});

export default CodigoScreen;