import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { db } from '../firebaseConfig'; // Asegúrate que la ruta sea correcta
import { doc, setDoc } from 'firebase/firestore';

// Configuración de cómo debe actuar la notificación cuando la app está abierta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true, // 👈 requerido en iOS
    shouldShowList: true,
  }),
});

/**
 * Registra el dispositivo para notificaciones push.
 * Obtiene el token NATIVO (FCM/APNs) y lo guarda en el perfil
 * del padre en Firestore.
 */
export const registerForPushNotificationsAsync = async (userId: string): Promise<string | undefined> => {
  let token: string | undefined;

  // --- 1. Pedir permisos ---
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    alert('¡Error! No se pudo obtener el permiso para notificaciones push.');
    return; // Devuelve undefined
  }

  // --- 2. Obtener el Token NATIVO ---
  try {
    // ¡¡ESTE ES EL CAMBIO CRÍTICO!!
    // Pedimos el token NATIVO del dispositivo (FCM en Android, APNs en iOS).
    // Tu servidor de Python (firebase-admin) está hecho para usar ESTE token.
    const nativePushToken = await Notifications.getDevicePushTokenAsync();
    
    token = nativePushToken.data; // Extraemos el token (string)
    
    // Este token se verá como "fEy...Gk4" (largo),
    // NO como "ExponentPushToken[...]"
    console.log('Token NATIVO (FCM/APNs) obtenido:', token); 

  } catch (e: any) { 
    console.error('Error obteniendo el token NATIVO:', e.message);
    alert('Error al obtener el token nativo. Asegúrate de tener google-services.json configurado.');
    return; // No podemos continuar si falla
  }

  // --- 3. Guardar el Token en Firestore ---
  if (token && userId) {
    try {
      const userDocRef = doc(db, 'padres', userId);
      
      // Guardamos el token NATIVO en el campo 'tokenFCM'
      await setDoc(userDocRef, { tokenFCM: token }, { merge: true });
      
      console.log('Token NATIVO guardado en Firestore para el usuario:', userId);
    } catch (error: any) {
      console.error('Error guardando token en Firestore:', error.message);
    }
  }

  // --- 4. Configurar Canal de Android (Requerido) ---
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
};