// app/(tabs)/index.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { collection, query, where, getDoc, onSnapshot, doc, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig'; // Ajusta la ruta
import FontAwesome from '@expo/vector-icons/FontAwesome';

// ----- INTERFACES DE DATOS (TypeScript) -----
interface Alumno {
  id: string;
  nombreCompleto: string;
  grupoId: string;
  grupoNombre: string;
}
interface Asistencia {
  id: string;
  tipo: 'entrada' | 'salida';
  timestamp: Timestamp;
}
interface Aviso {
  id: string;
  titulo: string;
  mensaje: string;
}

// ----- FUNCIÓN HELPER PARA FORMATEAR HORA -----
const formatTime = (timestamp: Timestamp | null): string => {
  if (!timestamp) return 'N/A';
  return new Date(timestamp.toMillis()).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });
};


export default function HomeScreen() {
  // ----- ESTADOS -----
  const [loading, setLoading] = useState(true); // Para la carga inicial del alumno
  const [refreshing, setRefreshing] = useState(false); // Para el "pull-to-refresh"
  
  const [padreNombre, setPadreNombre] = useState<string>(''); // <-- ¡NUEVO! Para el saludo
  const [alumno, setAlumno] = useState<Alumno | null>(null);
  const [ultimaAsistencia, setUltimaAsistencia] = useState<Asistencia | null>(null);
  const [asistenciasHoy, setAsistenciasHoy] = useState<Asistencia[]>([]);
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  const user = auth.currentUser;

  // ----- FUNCIÓN PRINCIPAL DE CARGA DE DATOS -----
  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // 1. OBTENER DATOS DEL PADRE Y ALUMNO (Esto solo se hace una vez)
      const padreRef = doc(db, 'padres', user.uid);
      const padreSnap = await getDoc(padreRef);
      if (!padreSnap.exists()) throw new Error('No se encontró el documento del padre.');

      // --- ¡CORRECCIÓN! Obtenemos el nombre del padre ---
      const padreData = padreSnap.data();
      setPadreNombre(padreData.nombre || ''); // Guardamos el nombre del tutor
      // ------------------------------------------------
      
      const alumnoId = padreData.alumnoVinculado;
      if (!alumnoId) throw new Error('Padre no vinculado.');

      const alumnoRef = doc(db, 'alumnos', alumnoId);
      const alumnoSnap = await getDoc(alumnoRef);
      if (!alumnoSnap.exists()) throw new Error('No se encontró el alumno.');
      
      const alumnoData = alumnoSnap.data() as Alumno;
      alumnoData.id = alumnoSnap.id;
      setAlumno(alumnoData);
      
      // Una vez que tenemos al alumno, terminamos la carga inicial
      setLoading(false);

    } catch (error) {
      console.error("Error cargando datos estáticos:", error);
      setLoading(false); // Dejar de cargar incluso si hay error
    }
  };

  // ----- EFECTO 1: Carga los datos estáticos (Alumno) al montar -----
  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  // ----- EFECTO 2: Escucha datos en tiempo real (Asistencias y Avisos) -----
  // Se activa solo cuando ya tenemos los datos del alumno
  useEffect(() => {
    if (!alumno) return;

    // --- 2A. Listener para Asistencias de HOY ---
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const hoyTimestamp = Timestamp.fromDate(hoy);

    const asistenciasQuery = query(
      collection(db, 'asistencias'),
      where('alumnoId', '==', alumno.id),
      where('timestamp', '>=', hoyTimestamp),
      orderBy('timestamp', 'desc')
    );

    const unsubAsistencias = onSnapshot(asistenciasQuery, (snapshot) => {
      const asistenciasList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Asistencia));
      setAsistenciasHoy(asistenciasList);
      
      // Actualiza el "Estado" con el primer registro (el más nuevo)
      setUltimaAsistencia(asistenciasList[0] || null);
    });

    // --- 2B. Listener para Avisos (Globales y del Grupo) ---
    const avisosQuery = query(
      collection(db, 'avisos'),
      // Buscamos avisos donde el destino sea null (todos) O el ID del grupo
      where('destinoId', 'in', [null, alumno.grupoId]),
      orderBy('timestamp', 'desc'),
      limit(5) // Solo los 5 más recientes
    );

    const unsubAvisos = onSnapshot(avisosQuery, (snapshot) => {
      const avisosList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Aviso));
      setAvisos(avisosList);
    });

    // Limpia los listeners al desmontar
    return () => {
      unsubAsistencias();
      unsubAvisos();
    };

  }, [alumno]); // Se re-ejecuta si el alumno cambia

  // ----- HANDLER PARA "PULL TO REFRESH" -----
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData(); // Re-carga los datos estáticos
    // Los listeners de tiempo real se actualizarán solos si el alumnoId cambia
    setRefreshing(false);
  }, [user]);

  // ----- RENDERIZADO -----

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#007AFF" /></View>;
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* ----- ¡CORRECCIÓN! Usamos el nombre del padre ----- */}
      <Text style={styles.title}>Bienvenido, {padreNombre ? padreNombre.split(' ')[0] : ''}</Text>
      
      {/* ----- 1. PANEL DE ESTADO ----- */}
      <View style={styles.statusCard}>
        <View>
          <Text style={styles.statusTitle}>{alumno?.nombreCompleto}</Text>
          <Text style={styles.statusSubtitle}>{alumno?.grupoNombre}</Text>
        </View>
        <View style={styles.statusInfo}>
          {ultimaAsistencia ? (
            <>
              <Text style={[styles.statusTime, ultimaAsistencia.tipo === 'entrada' ? styles.statusEntrada : styles.statusSalida]}>
                {formatTime(ultimaAsistencia.timestamp)}
              </Text>
              <Text style={styles.statusLabel}>
                Última {ultimaAsistencia.tipo === 'entrada' ? 'Entrada' : 'Salida'}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.statusTime}>--:--</Text>
              <Text style={styles.statusLabel}>Sin registros hoy</Text>
            </>
          )}
        </View>
      </View>

      {/* ----- 2. ASISTENCIAS DE HOY ----- */}
      <Text style={styles.sectionTitle}>Asistencias de Hoy</Text>
      <FlatList
        data={asistenciasHoy}
        keyExtractor={(item) => item.id}
        // --- ¡AQUÍ ESTABA EL ERROR DE SINTAXIS! ---
        // (Se quitó la comilla simple ' extra)
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <FontAwesome 
              name={item.tipo === 'entrada' ? "check-circle" : "arrow-circle-left"} 
              size={24} 
              color={item.tipo === 'entrada' ? '#28a745' : '#dc3545'} 
            />
            <Text style={styles.listText}>
              {item.tipo === 'entrada' ? 'Entrada' : 'Salida'} registrada
            </Text>
            <Text style={styles.listTime}>{formatTime(item.timestamp)}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay registros de asistencia hoy.</Text>}
        scrollEnabled={false} // Para que no interfiera con el ScrollView principal
      />

      {/* ----- 3. AVISOS RECIENTES ----- */}
      <Text style={styles.sectionTitle}>Avisos Recientes</Text>
      <FlatList
        data={avisos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.avisoCard}>
            <Text style={styles.avisoTitle}>{item.titulo}</Text>
            <Text>{item.mensaje}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay avisos recientes.</Text>}
        scrollEnabled={false}
      />
    </ScrollView>
  );
}

// ----- NUEVOS ESTILOS -----
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#f4f7f6' 
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f7f6'
  },
  title: { 
    fontSize: 26, 
    fontWeight: 'bold', 
    marginBottom: 20,
    color: '#333'
  },
  // Panel de Estado
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusInfo: {
    alignItems: 'flex-end',
  },
  statusTime: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusEntrada: {
    color: '#28a745', // Verde
  },
  statusSalida: {
    color: '#dc3545', // Rojo
  },
  // Títulos de Sección
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    marginTop: 10,
  },
  // Lista de Asistencia
  listItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  listText: {
    fontSize: 16,
    marginLeft: 15,
    flex: 1,
    color: '#333',
  },
  listTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  // Lista de Avisos
  avisoCard: { 
    backgroundColor: '#ffffff', 
    padding: 15, 
    borderRadius: 8, 
    marginBottom: 10, 
    borderWidth: 1, 
    borderColor: '#eee' 
  },
  avisoTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginBottom: 5,
    color: '#333'
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    paddingVertical: 10,
  }
});