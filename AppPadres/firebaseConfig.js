// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Pega tu configuración de Firebase aquí
const firebaseConfig = {
apiKey: "AIzaSyD0ix66ppFXSf7u0Y68LSgKFZgibLaGDps",
authDomain: "python-escolar.firebaseapp.com",
projectId: "python-escolar",
storageBucket: "python-escolar.firebasestorage.app",
messagingSenderId: "182241356835",
appId: "1:182241356835:web:789db81f76e5e08d679596",
measurementId: "G-ZTJQXN0KE2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };