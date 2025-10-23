// app/login.tsx
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
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // <- Revisa que esta ruta sea correcta
import { Link } from 'expo-router';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (email === '' || password === '') {
        Alert.alert('Campos vacíos', 'Por favor ingresa tu email y contraseña.');
        return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // La redirección la maneja app/_layout.tsx
    } catch (error: any) {
      Alert.alert('Error de Login', 'Email o contraseña incorrectos.');
      console.log(error.message);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>App de Padres</Text>
      
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
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <Button 
        title={loading ? "Iniciando..." : "Iniciar Sesión"} 
        onPress={handleLogin} 
        disabled={loading} 
      />
      
      <Link href="/registro" asChild>
        <TouchableOpacity style={styles.linkContainer}>
           <Text style={styles.link}>¿No tienes cuenta? Regístrate</Text>
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

export default LoginScreen;