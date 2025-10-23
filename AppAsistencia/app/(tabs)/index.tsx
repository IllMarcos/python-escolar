// app/(tabs)/index.tsx
import React, { useState } from 'react';
import { 
  Text, 
  View, 
  StyleSheet, 
  Button, 
  Alert, 
  ActivityIndicator, 
  TouchableOpacity 
} from 'react-native';
// Usamos la API moderna de expo-camera
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';

// --- ¡IMPORTANTE! ---
// 1. Encuentra tu IP (ipconfig/ifconfig)
// 2. Asegúrate que tu PC (con Flask) y tu teléfono (con Expo Go)
//    estén en la MISMA red Wi-Fi.
const IP_SERVIDOR_FLASK = "192.168.0.42"; // <-- CAMBIA ESTO POR TU IP
const URL_SERVIDOR = `http://${IP_SERVIDOR_FLASK}:5000`;
// --------------------


export default function ScannerTab() {
  // Hook de permisos
  const [permission, requestPermission] = useCameraPermissions();
  
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  // Función que se llama al escanear un QR
  const handleBarCodeScanned = (scanningResult: BarcodeScanningResult) => {
    if (loading) return; 

    setScanned(true); 
    const alumnoId = scanningResult.data;
    console.log(`QR escaneado! Data: ${alumnoId}`);
    
    sendAsistencia(alumnoId);
  };

  // Función para enviar el ID al servidor Flask
  const sendAsistencia = async (alumnoId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${URL_SERVIDOR}/registrar-asistencia`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alumnoId: alumnoId,
          tipo: 'entrada' 
        }),
      });

      const jsonResponse = await response.json();

      if (response.ok) {
        Alert.alert(
          '¡Éxito!',
          `Asistencia registrada. Notificación enviada (ID: ${jsonResponse.message_id})`
        );
      } else {
        Alert.alert('Error del Servidor', jsonResponse.error || 'Error desconocido');
      }

    } catch (error: any) {
      console.error('Error de red:', error);
      Alert.alert(
        'Error de Conexión',
        'No se pudo conectar al servidor Flask. ¿Está corriendo y la IP es correcta?'
      );
    }
    
    setLoading(false);
  };

  // --- Renderizado de la UI ---

  if (!permission) {
    // Los permisos aún están cargando
    return <View style={styles.loadingContainer}><ActivityIndicator /></View>;
  }

  if (!permission.granted) {
    // Los permisos no han sido concedidos
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.text}>Necesitamos tu permiso para usar la cámara</Text>
        <Button onPress={requestPermission} title="Conceder Permiso" />
      </View>
    );
  }

  // ¡Permiso concedido! Mostramos la cámara.
  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'], // Solo queremos escanear QR
        }}
      />
      
      <View style={styles.overlay}>
        <View style={styles.targetingBox}>
          <Text style={styles.overlayText}>Escanea el código QR del alumno</Text>
        </View>
      </View>

      {/* Muestra un loader mientras envía la petición */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Enviando notificación...</Text>
        </View>
      )}

      {/* Muestra el botón para escanear de nuevo */}
      {scanned && !loading && (
        <TouchableOpacity 
          style={styles.scanAgainButton} 
          onPress={() => setScanned(false)}
        >
          <Text style={styles.scanAgainText}>Escanear de Nuevo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    textAlign: 'center',
    fontSize: 18,
    marginBottom: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetingBox: {
    width: 300,
    height: 300,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'flex-end',
  },
  overlayText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 10,
  },
  scanAgainButton: {
    position: 'absolute',
    bottom: 50,
    left: '20%',
    right: '20%',
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
  },
  scanAgainText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});