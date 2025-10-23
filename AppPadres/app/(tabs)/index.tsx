// app/(tabs)/index.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; // Ajusta la ruta

// (Reutilizamos la lógica de HomeScreen.js)
export default function HomeScreen() {
  const [avisos, setAvisos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // (Pega la lógica de cargarAvisos de la respuesta anterior)
    const cargarAvisos = async () => {
      setLoading(true);
      
      // Filtramos solo avisos "para todos" por ahora
      const avisosQuery = query(
        collection(db, 'avisos'),
        where('destinoTipo', '==', 'todos')
      );
      
      const querySnapshot = await getDocs(avisosQuery);
      const avisosList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAvisos(avisosList);
      setLoading(false);
    };

    cargarAvisos();
  }, []);


  if (loading) {
    return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Avisos de la Escuela</Text>
      <FlatList
        data={avisos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.avisoCard}>
            <Text style={styles.avisoTitle}>{item.titulo}</Text>
            <Text>{item.mensaje}</Text>
          </View>
        )}
        ListEmptyComponent={<Text>No hay avisos por el momento.</Text>}
      />
      {/* Aquí irá la lista de asistencias */}
    </View>
  );
}

// (Pega los estilos de HomeScreen)
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 30 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  avisoCard: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 5, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  avisoTitle: { fontSize: 16, fontWeight: 'bold' },
});