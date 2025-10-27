// app/(tabs)/index.tsx
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  ScrollView, 
  RefreshControl,
  TouchableOpacity,
  // Alert, // <-- Ya no usamos Alert
} from 'react-native';
import { collection, query, where, getDoc, onSnapshot, doc, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomAlert from '../../components/CustomAlert'; // <-- 1. IMPORTAR

// ... (Interfaces y Funciones Helper no cambian) ...
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
const formatTime = (timestamp: Timestamp | null): string => {
  if (!timestamp) return 'N/A';
  return new Date(timestamp.toMillis()).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};
const formatDate = (timestamp: Timestamp | null): string => {
  if (!timestamp) return 'N/A';
  return new Date(timestamp.toMillis()).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
  });
};
const getInitials = (name: string) => {
  if (!name) return '...';
  const names = name.split(' ');
  let initials = names[0].substring(0, 1).toUpperCase();
  if (names.length > 1) {
    initials += names[names.length - 1].substring(0, 1).toUpperCase();
  }
  return initials;
};
type AlumnoStatus = {
  text: string;
  color: string;
  icon: React.ComponentProps<typeof Feather>['name'];
};
// ... (Fin de helpers) ...


// --- 2. MODIFICAR LOGOUTBUTTON ---
// Ahora acepta una prop 'onPress'
const LogoutButton = ({ onPress }: { onPress: () => void }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.logoutButton}>
      <Feather name="log-out" size={24} color="#808080" />
    </TouchableOpacity>
  );
};


export default function HomeScreen() {
  const insets = useSafeAreaInsets(); 

  // --- 3. AÑADIR ESTADO PARA EL MODAL ---
  const [isAlertVisible, setIsAlertVisible] = useState(false);

  // --- Lógica de datos (SIN CAMBIOS) ---
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [padreNombre, setPadreNombre] = useState<string>('');
  const [alumno, setAlumno] = useState<Alumno | null>(null);
  const [ultimaAsistencia, setUltimaAsistencia] = useState<Asistencia | null>(null);
  const [asistenciasHoy, setAsistenciasHoy] = useState<Asistencia[]>([]);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const user = auth.currentUser;
  const fetchDashboardData = React.useCallback(async () => {
    if (!user) return;
    try {
      const padreRef = doc(db, 'padres', user.uid);
      const padreSnap = await getDoc(padreRef);
      if (!padreSnap.exists()) throw new Error('No se encontró el documento del padre.');
      const padreData = padreSnap.data();
      setPadreNombre(padreData.nombre || '');
      const alumnoId = padreData.alumnoVinculado;
      if (!alumnoId) throw new Error('Padre no vinculado.');
      const alumnoRef = doc(db, 'alumnos', alumnoId);
      const alumnoSnap = await getDoc(alumnoRef);
      if (!alumnoSnap.exists()) throw new Error('No se encontró el alumno.');
      const alumnoData = alumnoSnap.data() as Alumno;
      alumnoData.id = alumnoSnap.id;
      setAlumno(alumnoData);
      setLoading(false);
    } catch (error) {
      console.error("Error cargando datos estáticos:", error);
      setLoading(false);
    }
  }, [user]);
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);
  useEffect(() => {
    if (!alumno) return;
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
      setUltimaAsistencia(asistenciasList[0] || null);
    });
    const avisosQuery = query(
      collection(db, 'avisos'),
      where('destinoId', 'in', [null, alumno.grupoId]),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
    const unsubAvisos = onSnapshot(avisosQuery, (snapshot) => {
      const avisosList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Aviso));
      setAvisos(avisosList);
    });
    return () => {
      unsubAsistencias();
      unsubAvisos();
    };
  }, [alumno]);
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, [fetchDashboardData]);
  // --- FIN DE LÓGICA DE DATOS ---

  // --- 4. AÑADIR HANDLERS PARA EL MODAL ---
  const confirmLogout = async () => {
    setIsAlertVisible(false);
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const getAlumnoStatus = (): AlumnoStatus => {
    if (!ultimaAsistencia) {
      return { text: 'Sin registros hoy', color: '#4A4A4A', icon: 'slash' };
    }
    if (ultimaAsistencia.tipo === 'entrada') {
      return { text: 'En la escuela', color: '#34C759', icon: 'check-circle' };
    } else {
      return { text: 'Fuera de la escuela', color: '#FF9500', icon: 'x-circle' };
    }
  };
  const status = getAlumnoStatus();

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#F5F5F0" /></View>;
  }

  return (
    // Usamos un View como wrapper para que el Modal se renderice sobre él
    <View style={styles.wrapper}>
      <ScrollView 
        contentContainerStyle={[
          styles.container,
          { paddingBottom: insets.bottom + 20 }
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F5F5F0" />}
        showsVerticalScrollIndicator={false}
      >
        {/* ----- 1. HEADER PERSONALIZADO ----- */}
        <View style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}>
          <View>
            <Text style={styles.title}>Bienvenido,</Text>
            <Text style={styles.subtitle}>
              {padreNombre ? padreNombre.split(' ')[0] : 'Tutor'}
            </Text>
          </View>
          {/* 5. CONECTAR EL BOTÓN AL HANDLER */}
          <LogoutButton onPress={() => setIsAlertVisible(true)} />
        </View>
        
        {/* ... (El resto de la UI: Tarjeta, Listas, etc. no cambia) ... */}
        {alumno && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(alumno.nombreCompleto)}</Text>
              </View>
              <View style={styles.infoContainer}>
                <Text style={styles.nombre}>{alumno.nombreCompleto}</Text>
                <Text style={styles.gradoGrupo}>{alumno.grupoNombre}</Text>
              </View>
            </View>
            <View style={styles.cardBody}>
              <Feather name={status.icon} size={48} color={status.color} />
              <Text style={[styles.statusTextLarge, { color: status.color }]}>
                {status.text}
              </Text>
            </View>
            <View style={styles.cardFooter}>
              <Feather name="clock" size={14} color="#808080" />
              <Text style={styles.statusTime}>
                Última act. {formatTime(ultimaAsistencia?.timestamp || null)}
              </Text>
            </View>
          </View>
        )}
        <Text style={styles.sectionTitle}>Asistencias de Hoy</Text>
        <FlatList
          data={asistenciasHoy}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isEntrada = item.tipo === 'entrada';
            return (
              <View style={styles.listItem}>
                <View style={[
                  styles.listIconContainer, 
                  { backgroundColor: isEntrada ? '#34C75920' : '#FF950020' }
                ]}>
                  <Feather 
                    name={isEntrada ? 'log-in' : 'log-out'} 
                    size={22} 
                    color={isEntrada ? '#34C759' : '#FF9500'}
                  />
                </View>
                <View style={styles.listTextContainer}>
                  <Text style={styles.listType}>{isEntrada ? 'Entrada' : 'Salida'}</Text>
                  <Text style={styles.listDate}>
                    {formatDate(item.timestamp)}
                  </Text>
                </View>
                <Text style={styles.listTime}>{formatTime(item.timestamp)}</Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyListContainer}>
              <Feather name="archive" size={30} color="#4A4A4A" />
              <Text style={styles.emptyText}>No hay registros de asistencia hoy.</Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          scrollEnabled={false}
        />
        <Text style={styles.sectionTitle}>Avisos Recientes</Text>
        <FlatList
          data={avisos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.avisoCard}>
              <View style={styles.avisoHeader}>
                <Feather name="bell" size={16} color="#B3B3B3" />
                <Text style={styles.avisoTitle}>{item.titulo}</Text>
              </View>
              <Text style={styles.avisoMessage}>{item.mensaje}</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyListContainer}>
              <Feather name="bell-off" size={30} color="#4A4A4A" />
              <Text style={styles.emptyText}>No hay avisos recientes.</Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          scrollEnabled={false}
        />
      </ScrollView>

      {/* --- 6. AÑADIR EL COMPONENTE AL RENDER --- */}
      <CustomAlert
        visible={isAlertVisible}
        title="Cerrar Sesión"
        message="¿Estás seguro de que quieres cerrar sesión?"
        cancelText="Cancelar"
        confirmText="Sí, Salir"
        onClose={() => setIsAlertVisible(false)}
        onConfirm={confirmLogout}
      />
    </View>
  );
}

// ... (Los estilos de index.tsx no cambian) ...
const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  container: { 
    paddingHorizontal: 20, 
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A'
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 5,
    marginBottom: 16,
  },
  title: { 
    fontSize: 26, 
    fontWeight: '500', 
    color: '#808080',
  },
  subtitle: {
    fontSize: 32, 
    fontWeight: '700', 
    color: '#F5F5F0',
  },
  logoutButton: {
    padding: 10,
    marginTop: 10,
  },
  card: {
    backgroundColor: '#1A1A1A', 
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4A4A4A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#808080',
  },
  avatarText: {
    color: '#F5F5F0',
    fontSize: 24,
    fontWeight: '700',
  },
  infoContainer: {
    flex: 1,
  },
  nombre: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F5F5F0',
    marginBottom: 4,
  },
  gradoGrupo: {
    fontSize: 16,
    color: '#808080',
    fontWeight: '500',
  },
  cardBody: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  statusTextLarge: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    paddingTop: 16,
  },
  statusTime: {
    fontSize: 14,
    fontWeight: '500',
    color: '#808080',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F5F5F0',
    marginBottom: 20,
    marginTop: 10,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
  },
  listIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  listTextContainer: {
    flex: 1,
  },
  listType: {
    fontSize: 17,
    fontWeight: '600',
    color: '#F5F5F0',
    marginBottom: 4,
  },
  listDate: {
    fontSize: 14,
    color: '#808080',
  },
  listTime: {
    fontSize: 15,
    fontWeight: '500',
    color: '#F5F5F0',
  },
  separator: {
    height: 12,
  },
  avisoCard: { 
    backgroundColor: '#1A1A1A',
    padding: 16, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#2A2A2A' 
  },
  avisoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avisoTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#F5F5F0',
    marginLeft: 8,
  },
  avisoMessage: {
    fontSize: 14,
    color: '#B3B3B3',
    lineHeight: 20,
  },
  emptyListContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#808080',
    marginTop: 12,
  }
});