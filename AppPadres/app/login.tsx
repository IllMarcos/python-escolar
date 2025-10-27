// app/login.tsx
import React, { useState } from 'react';
import { 
    View, 
    TextInput, 
    StyleSheet, 
    Text, 
    Alert, 
    TouchableOpacity,
    Dimensions,
    ScrollView
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { Link } from 'expo-router';

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleLogin = async () => {
    if (email === '' || password === '') {
        Alert.alert('Campos vacíos', 'Por favor ingresa tu email y contraseña.');
        return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      Alert.alert('Error de Login', 'Email o contraseña incorrectos.');
      console.log(error.message);
    }
    setLoading(false);
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>AP</Text>
              </View>
            </View>
            <Text style={styles.title}>Bienvenido</Text>
            <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
          </View>
          
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Correo electrónico</Text>
              <TextInput
                style={[
                  styles.input,
                  emailFocused && styles.inputFocused
                ]}
                placeholder="tu@email.com"
                placeholderTextColor="#666666"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={[
                  styles.input,
                  passwordFocused && styles.inputFocused
                ]}
                placeholder="••••••••"
                placeholderTextColor="#666666"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                secureTextEntry
              />
            </View>
            
            <TouchableOpacity 
              style={[
                styles.loginButton,
                loading && styles.loginButtonDisabled
              ]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>
                {loading ? "Iniciando sesión..." : "Iniciar sesión"}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o</Text>
              <View style={styles.dividerLine} />
            </View>
            
            <Link href="/registro" asChild>
              <TouchableOpacity 
                style={styles.registerButton}
                activeOpacity={0.7}
              >
                <Text style={styles.registerButtonText}>
                  Crear una cuenta nueva
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              App de Padres © 2025
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  scrollContainer: {
    flexGrow: 1,
    minHeight: height,
  },
  container: { 
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: width > 768 ? '20%' : 24,
    paddingVertical: height > 800 ? 60 : 40,
    backgroundColor: '#0A0A0A',
    minHeight: height,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: height > 800 ? 48 : 32,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconCircle: {
    width: width > 768 ? 90 : 72,
    height: width > 768 ? 90 : 72,
    borderRadius: width > 768 ? 45 : 36,
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: width > 768 ? 36 : 28,
    fontWeight: '700',
    color: '#F5F5F0',
    letterSpacing: 1,
  },
  title: { 
    fontSize: width > 768 ? 38 : 32,
    fontWeight: '700',
    color: '#F5F5F0',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: width > 768 ? 18 : 16,
    color: '#808080',
    fontWeight: '400',
  },
  formContainer: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  inputContainer: {
    marginBottom: 24,
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
    fontSize: 16,
    color: '#F5F5F0',
    fontWeight: '400',
  },
  inputFocused: {
    borderColor: '#4A4A4A',
    backgroundColor: '#1F1F1F',
  },
  loginButton: {
    height: 56,
    backgroundColor: '#F5F5F0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#F5F5F0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0A0A0A',
    letterSpacing: 0.3,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2A2A2A',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  registerButton: {
    height: 56,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F5F5F0',
    letterSpacing: 0.2,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 13,
    color: '#4A4A4A',
    fontWeight: '400',
  },
});

export default LoginScreen;