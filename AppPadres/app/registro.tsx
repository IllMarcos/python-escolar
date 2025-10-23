// app/registro.tsx
import React, { useState } from 'react';
import { 
    View, 
    TextInput, 
    Button, 
    StyleSheet, 
    Text, 
    Alert, 
    TouchableOpacity 
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebaseConfig'; // <- Revisa que esta ruta sea correcta
import { doc, setDoc } from 'firebase/firestore';
import { Link } from 'expo-router';

const RegistroScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!nombre || !email || !password) {
      Alert.alert('Campos requeridos', 'Por favor completa todos los campos.');
      return;
    }
    
    setLoading(true);
    try {
      // 1. Crea el usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Crea un documento en Firestore
      await setDoc(doc(db, 'padres', user.uid), {
        nombre: nombre,
        email: user.email,
        alumnoVinculado: null, // Importante: Aún no tienen alumno
      });

      // La redirección la maneja app/_layout.tsx
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Error', 'Este correo electrónico ya está en uso.');
      } else if (error.code === 'auth/weak-password') {
        Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
      } else {
        Alert.alert('Error de Registro', error.message);
      }
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear Cuenta</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Nombre Completo"
        value={nombre}
        onChangeText={setNombre}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Contraseña (mín. 6 caracteres)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <Button 
        title={loading ? "Registrando..." : "Registrarse"} 
        onPress={handleRegister} 
        disabled={loading}
      />
      
      <Link href="/login" asChild>
        <TouchableOpacity style={styles.linkContainer}>
           <Text style={styles.link}>¿Ya tienes cuenta? Inicia Sesión</Text>
        </TouchableOpacity>
      </Link>
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
    fontSize: 26, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 30 
  },
  input: {
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
    padding: 10,
    borderRadius: 5,
    fontSize: 16
  },
  linkContainer: {
    marginTop: 20,
  },
  link: {
    textAlign: 'center',
    color: '#007AFF',
    fontSize: 16
  }
});

export default RegistroScreen;