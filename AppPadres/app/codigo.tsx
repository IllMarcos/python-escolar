// app/codigo.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  Keyboard,
  Platform, // <- Ya no necesitamos KeyboardAvoidingView ni ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '../firebaseConfig'; // <- Revisa que esta ruta sea correcta
import {
  doc,
  updateDoc,
  query,
  collection,
  where,
  getDocs,
} from 'firebase/firestore';
import { Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CODE_LENGTH = 6; // <--- CAMBIO: 8 a 6

const CodigoScreen = () => {
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleTextChange = (text: string) => {
    setError(null);
    const sanitizedText = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setCode(sanitizedText);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      Alert.alert('Error', 'No se pudo cerrar la sesión.');
    }
  };

  const handleSubmit = async () => {
    if (code.length !== CODE_LENGTH) {
      setError(`El código debe tener ${CODE_LENGTH} caracteres.`); // <-- Ya es dinámico
      return;
    }
    
    Keyboard.dismiss();
    setLoading(true);
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No hay un usuario autenticado.');
      }

      const q = query(collection(db, 'alumnos'), where('codigo', '==', code));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('Código no válido o no encontrado.');
      }

      const alumnoDoc = querySnapshot.docs[0];
      const alumnoData = alumnoDoc.data();

      if (alumnoData.padreId) {
        throw new Error('Este alumno ya está vinculado a otra cuenta.');
      }

      const alumnoId = alumnoDoc.id;

      await updateDoc(doc(db, 'alumnos', alumnoId), {
        padreId: user.uid,
      });

      await updateDoc(doc(db, 'padres', user.uid), {
        alumnoVinculo: alumnoId, // O 'alumnoVinculado', revisa tu modelo de datos
      });

    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    // CAMBIO: Eliminamos KAV y ScrollView.
    // El wrapper ahora es el contenedor principal.
    <View style={styles.wrapper}>
      {/* Este 'container' usa flex: 1 y justifyContent: 'center' 
        para centrar el contenido verticalmente de forma estática. 
      */}
      <View style={[
        styles.container,
        { 
          paddingTop: insets.top + 20, 
          paddingBottom: insets.bottom + 20 
        }
      ]}>
        {/* 'content' limita el ancho y centra horizontalmente */}
        <View style={styles.content}>
          
          <View style={styles.headerContainer}>
            <View style={styles.iconWrapper}>
              <Feather name="key" size={36} color="#F5F5F0" />
            </View>
            <Text style={styles.title}>Vincular Alumno</Text>
            <Text style={styles.subtitle}>
              {/* CAMBIO: Texto actualizado a 6 */}
              Ingresa el código de {CODE_LENGTH} caracteres proporcionado por la escuela.
            </Text>
          </View>

          <View style={styles.inputSection}>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Código de Vinculación</Text>
              <TextInput
                style={[
                  styles.input,
                  isFocused && styles.inputFocused,
                  Boolean(error) && styles.inputError
                ]}
                // CAMBIO: Placeholder actualizado a 6
                placeholder="Escribe el código de 6 caracteres"
                placeholderTextColor="#666666"
                value={code}
                onChangeText={handleTextChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                maxLength={CODE_LENGTH} // <-- Ya es 6
                autoCapitalize="characters"
                autoCorrect={false}
                keyboardType="default"
                autoFocus={true}
              />
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[
                styles.submitButton,
                (loading || code.length !== CODE_LENGTH) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading || code.length !== CODE_LENGTH}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#0A0A0A" />
              ) : (
                <Text style={styles.submitButtonText}>Vincular Cuenta</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout} 
              disabled={loading} 
              activeOpacity={0.7}
            >
              <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>
          
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  // CAMBIO: Este es el nuevo contenedor principal estático
  container: {
    flex: 1, // Ocupa toda la pantalla
    justifyContent: 'center', // Centra verticalmente
    alignItems: 'center', // Centra horizontalmente
  },
  // CAMBIO: Este contenedor limita el ancho
  content: {
    width: '100%',
    maxWidth: 500,
    paddingHorizontal: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: width > 768 ? 36 : 28,
    fontWeight: '700',
    color: '#F5F5F0',
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: width > 768 ? 18 : 16,
    color: '#808080',
    fontWeight: '400',
    textAlign: 'center',
    maxWidth: 350,
    lineHeight: 24,
  },
  inputSection: {
    alignItems: 'center',
    width: '100%',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B3B3B3',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  input: {
    height: 56,
    backgroundColor: '#1A1A1A',
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 18, // Un poco más grande
    color: '#F5F5F0',
    fontWeight: '400',
    textAlign: 'center',
    letterSpacing: 3, // Espaciado para que parezca código
  },
  inputFocused: {
    borderColor: '#4A4A4A',
    backgroundColor: '#1F1F1F',
  },
  inputError: {
    borderColor: '#FF453A',
  },
  errorText: {
    color: '#FF453A',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
    minHeight: 20,
  },
  submitButton: {
    height: 56,
    width: '100%',
    backgroundColor: '#F5F5F0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#F5F5F0',
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0A0A0A',
    letterSpacing: 0.3,
  },
  logoutButton: {
    marginTop: 24,
    padding: 10,
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#808080',
    fontWeight: '500',
  },
});

export default CodigoScreen;