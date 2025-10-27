// app/(tabs)/explore.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { auth, db } from '../../firebaseConfig'; // Asegúrate que la ruta es correcta
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

// Interfaces simplificadas (solo necesitamos nombres)
interface Alumno {
  nombreCompleto: string;
}
interface Padre {
  nombre: string;
  email: string;
}

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [padre, setPadre] = useState<Padre | null>(null);
  const [alumno, setAlumno] = useState<Alumno | null>(null);

  // Carga de datos
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        fetchData(user.uid);
      } else {
        setLoading(false); // No hay usuario
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchData = async (userId: string) => {
    setLoading(true);
    try {
      // 1. Obtener datos del Padre
      const padreRef = doc(db, 'padres', userId);
      const padreSnap = await getDoc(padreRef);

      if (!padreSnap.exists()) {
        throw new Error('No se encontró el documento del padre.');
      }
      
      const padreData = padreSnap.data() as Padre;
      setPadre(padreData);

      // 2. Obtener datos del Alumno vinculado
      const alumnoId = padreSnap.data().alumnoVinculado;
      if (alumnoId) {
        const alumnoRef = doc(db, 'alumnos', alumnoId);
        const alumnoSnap = await getDoc(alumnoRef);
        if (alumnoSnap.exists()) {
          setAlumno(alumnoSnap.data() as Alumno);
        }
      }
    } catch (error) {
      console.error("Error cargando datos del perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.wrapper, styles.centered]}>
        <ActivityIndicator size="large" color="#F5F5F0" />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView 
        contentContainerStyle={[
          styles.container,
          { paddingBottom: insets.bottom + 20 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ----- 1. HEADER PERSONALIZADO ----- */}
        <View style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}>
          <Text style={styles.headerTitle}>Perfil y Ajustes</Text>
        </View>

        {/* ----- 2. SECCIÓN DE CUENTA (PADRE) ----- */}
        <Text style={styles.sectionTitle}>Tu Cuenta</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Feather name="user" size={18} color="#808080" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Nombre</Text>
              <Text style={styles.infoValue}>{padre?.nombre || 'No disponible'}</Text>
            </View>
          </View>
          <View style={styles.separator} />
          <View style={styles.infoRow}>
            <Feather name="mail" size={18} color="#808080" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Correo</Text>
              <Text style={styles.infoValue}>{padre?.email || 'No disponible'}</Text>
            </View>
          </View>
        </View>

        {/* ----- 3. SECCIÓN DE ALUMNO ----- */}
        <Text style={styles.sectionTitle}>Alumno Vinculado</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Feather name="shield" size={18} color="#808080" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Estudiante</Text>
              <Text style={styles.infoValue}>{alumno?.nombreCompleto || 'No vinculado'}</Text>
            </View>
          </View>
        </View>

        {/* ----- 4. SECCIÓN DE AJUSTES (ACCIONES) ----- */}
        <Text style={styles.sectionTitle}>Ajustes de la App</Text>
        <View style={styles.actionCard}>
          {/* Botón de Notificaciones */}
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
            <View style={styles.actionLeft}>
              <Feather name="bell" size={20} color="#F5F5F0" style={styles.actionIcon} />
              <Text style={styles.actionText}>Notificaciones</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#808080" />
          </TouchableOpacity>

          <View style={styles.separator} />

          {/* Botón de Cambiar Contraseña */}
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
            <View style={styles.actionLeft}>
              <Feather name="lock" size={20} color="#F5F5F0" style={styles.actionIcon} />
              <Text style={styles.actionText}>Cambiar Contraseña</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#808080" />
          </TouchableOpacity>
          
          <View style={styles.separator} />

          {/* Botón de Soporte */}
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
            <View style={styles.actionLeft}>
              <Feather name="help-circle" size={20} color="#F5F5F0" style={styles.actionIcon} />
              <Text style={styles.actionText}>Soporte</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#808080" />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

// Estilos consistentes con index.tsx
const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: { 
    paddingHorizontal: 20, 
  },
  // --- Header Personalizado ---
  headerContainer: {
    paddingHorizontal: 5,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32, 
    fontWeight: '700', 
    color: '#F5F5F0',
  },
  // --- Título de Sección ---
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F5F5F0',
    marginBottom: 16,
    marginTop: 10,
  },
  // --- Tarjeta de Información (Datos) ---
  infoCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIcon: {
    marginRight: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#808080',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 17,
    fontWeight: '500',
    color: '#F5F5F0',
  },
  separator: {
    height: 1,
    backgroundColor: '#2A2A2A',
    marginHorizontal: 0, // Ajustado para que ocupe todo el ancho de la tarjeta
  },
  // --- Tarjeta de Acciones (Botones) ---
  actionCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    overflow: 'hidden', // Para que los bordes redondeados corten los botones
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    marginRight: 16,
  },
  actionText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#F5F5F0',
  },
});