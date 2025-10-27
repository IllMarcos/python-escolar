// app/(tabs)/index.tsx
import React, { useState } from 'react';
import { 
  Text, 
  View, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity,
  Pressable, // Para el botón de cancelar
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

// --- ¡IMPORTANTE! ---
// (Tu configuración de IP no se toca)
const IP_SERVIDOR_FLASK = "192.168.0.42"; 
const URL_SERVIDOR = `http://${IP_SERVIDOR_FLASK}:5000`;
// --------------------

// --- Definimos el tipo de asistencia ---
type TipoAsistencia = 'entrada' | 'salida';

export default function ScannerTab() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // --- NUEVO ESTADO: Para saber qué tipo de registro hacer ---
  const [tipoAsistencia, setTipoAsistencia] = useState<TipoAsistencia | null>(null);
  
  // --- NUEVO ESTADO: Para mostrar feedback sin usar Alert ---
  const [feedback, setFeedback] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // Función que se llama al escanear un QR
  const handleBarCodeScanned = (scanningResult: BarcodeScanningResult) => {
    // Solo procesa si no estamos cargando y el tipo está definido
    if (loading || !tipoAsistencia) return; 

    setScanned(true);
    const alumnoId = scanningResult.data;
    console.log(`QR escaneado! Alumno: ${alumnoId}, Tipo: ${tipoAsistencia}`);
    
    sendAsistencia(alumnoId, tipoAsistencia);
  };

  // Función para enviar el ID al servidor Flask
  // --- ACTUALIZADA: Ahora recibe el 'tipo' ---
  const sendAsistencia = async (alumnoId: string, tipo: TipoAsistencia) => {
    setLoading(true);
    setFeedback(null); // Limpiamos feedback anterior
    try {
      const response = await fetch(`${URL_SERVIDOR}/registrar-asistencia`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // --- CAMBIO: Usamos el 'tipo' del estado ---
        body: JSON.stringify({
          alumnoId: alumnoId,
          tipo: tipo 
        }),
      });

      const jsonResponse = await response.json();

      if (response.ok) {
        showFeedback(
          `¡Éxito! ${tipo === 'entrada' ? 'Entrada' : 'Salida'} registrada.`, 
          'success'
        );
      } else {
        showFeedback(jsonResponse.error || 'Error desconocido', 'error');
      }

    } catch (error: any) {
      console.error('Error de red:', error);
      showFeedback('Error de Conexión. Revisa la IP y el servidor.', 'error');
    }
    
    setLoading(false);
  };

  // --- NUEVA FUNCIÓN: Para mostrar un mensaje de feedback ---
  const showFeedback = (message: string, type: 'success' | 'error') => {
    setFeedback({ message, type });
    // Oculta el feedback después de 3 segundos
    setTimeout(() => {
      setFeedback(null);
      // Si fue exitoso, resetea el escáner
      if (type === 'success') {
        resetScanner();
      }
    }, 3000);
  };

  // --- NUEVA FUNCIÓN: Para volver a la pantalla de selección ---
  const resetScanner = () => {
    setScanned(false);
    setTipoAsistencia(null);
    setFeedback(null);
  };

  // --- Renderizado de permisos (Sin cambios) ---
  if (!permission) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#F5F5F0" /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.wrapper, styles.centered, { paddingHorizontal: 20 }]}>
        <Feather name="alert-triangle" size={48} color="#FF9500" />
        <Text style={styles.permissionText}>Permiso de Cámara Requerido</Text>
        <Text style={styles.permissionSubtext}>
          Necesitamos tu permiso para usar la cámara y escanear los códigos QR.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Conceder Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- RENDERIZADO PRINCIPAL ---
  return (
    <View style={styles.wrapper}>
      {/* ----- 1. SI NO SE HA ELEGIDO MODO, MOSTRAR BOTONES ----- */}
      {!tipoAsistencia ? (
        <View style={styles.modeSelectionContainer}>
          {/* Header personalizado */}
          <View style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}>
            <Text style={styles.headerTitle}>Registrar Asistencia</Text>
          </View>

          <View style={styles.selectionContent}>
            <Feather name="users" size={48} color="#808080" />
            <Text style={styles.selectionTitle}>Selecciona el Tipo de Registro</Text>
            
            {/* Botón de Entrada */}
            <TouchableOpacity 
              style={[styles.modeButton, styles.entradaButton]}
              onPress={() => setTipoAsistencia('entrada')}
            >
              <Feather name="log-in" size={24} color="#34C759" />
              <Text style={[styles.modeButtonText, { color: '#34C759' }]}>
                Registrar Entrada
              </Text>
            </TouchableOpacity>

            {/* Botón de Salida */}
            <TouchableOpacity 
              style={[styles.modeButton, styles.salidaButton]}
              onPress={() => setTipoAsistencia('salida')}
            >
              <Feather name="log-out" size={24} color="#FF9500" />
              <Text style={[styles.modeButtonText, { color: '#FF9500' }]}>
                Registrar Salida
              </Text>
            </TouchableOpacity>
          </View>
        </View>

      ) : (
        
        /* ----- 2. SI SE ELIGIÓ MODO, MOSTRAR ESCÁNER ----- */
        <View style={styles.scannerContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          />
          
          <View style={styles.overlay}>
            <View style={styles.targetingBox} />
            <Text style={styles.overlayText}>
              Escaneando para {tipoAsistencia === 'entrada' ? 'ENTRADA' : 'SALIDA'}
            </Text>
          </View>

          {/* Botón para Cancelar y volver */}
          <Pressable 
            style={[styles.cancelButton, { top: insets.top + 10 }]} 
            onPress={resetScanner}
          >
            <Feather name="x" size={24} color="#F5F5F0" />
          </Pressable>
        </View>
      )}

      {/* ----- 3. OVERLAYS GLOBALES (Loading y Feedback) ----- */}
      
      {/* Overlay de Carga */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#F5F5F0" />
          <Text style={styles.loadingText}>Registrando...</Text>
        </View>
      )}

      {/* Overlay de Feedback (sin usar Alert) */}
      {feedback && (
        <View style={[
          styles.feedbackOverlay, 
          { backgroundColor: feedback.type === 'success' ? '#34C759' : '#FF3B30' }
        ]}>
          <Feather 
            name={feedback.type === 'success' ? 'check-circle' : 'alert-circle'} 
            size={24} 
            color="#F5F5F0" 
          />
          <Text style={styles.feedbackText}>{feedback.message}</Text>
        </View>
      )}

    </View>
  );
}

// --- Estilos (Tema Oscuro) ---
const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // --- Estilos de Permiso ---
  permissionText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F5F5F0',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionSubtext: {
    fontSize: 16,
    color: '#808080',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: '#F5F5F0',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#0A0A0A',
    fontSize: 16,
    fontWeight: '700',
  },
  // --- Estilos de Selección de Modo ---
  modeSelectionContainer: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 25,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32, 
    fontWeight: '700', 
    color: '#F5F5F0',
  },
  selectionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  selectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#F5F5F0',
    marginTop: 16,
    marginBottom: 32,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  entradaButton: {
    backgroundColor: '#34C7591A',
    borderColor: '#34C759',
  },
  salidaButton: {
    backgroundColor: '#FF95001A',
    borderColor: '#FF9500',
  },
  modeButtonText: {
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 12,
  },
  // --- Estilos del Escáner ---
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetingBox: {
    width: 280,
    height: 280,
    borderWidth: 2,
    borderColor: '#F5F5F0',
    borderRadius: 20,
    opacity: 0.5,
  },
  overlayText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F5F5F0',
    textAlign: 'center',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    position: 'absolute',
    bottom: '20%',
  },
  cancelButton: {
    position: 'absolute',
    left: 20,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  // --- Estilos de Overlays ---
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  loadingText: {
    color: '#F5F5F0',
    fontSize: 18,
    marginTop: 10,
  },
  feedbackOverlay: {
    position: 'absolute',
    bottom: '15%',
    left: '10%',
    right: '10%',
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // Sombras
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  feedbackText: {
    color: '#F5F5F0',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    flexShrink: 1, // Para que el texto se ajuste
  },
});