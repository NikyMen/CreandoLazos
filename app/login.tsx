import { useEffect, useState } from 'react';
import { View, Text, TextInput, Platform, Image, Pressable } from 'react-native';
import { useAuth } from '../lib/auth';
import { useRouter } from 'expo-router';
import { colors, spacing, radius } from '../lib/theme';

export default function LoginScreen() {
  const { login, isAuthenticated, role } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (e: any) {
      setError(e?.message || 'Error de inicio de sesión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && role) {
      router.replace(role === 'ADMIN' ? '/admin/home' : '/patient/home');
    }
  }, [isAuthenticated, role, router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.md }}>
      <Image source={require('../assets/icon.png')} style={{ width: 120, height: 120, marginBottom: spacing.md }} />
      <Text style={{ fontSize: 26, marginBottom: spacing.sm, color: colors.secondary }}>Creando Lazos</Text>
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, borderColor: colors.border, width: 300, marginBottom: spacing.sm, padding: spacing.sm, borderRadius: radius.sm, backgroundColor: '#fff' }}
      />
      <TextInput
        placeholder="Contraseña"
        secureTextEntry={true}
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, borderColor: colors.border, width: 300, marginBottom: spacing.sm, padding: spacing.sm, borderRadius: radius.sm, backgroundColor: '#fff' }}
      />
      {error ? <Text style={{ color: colors.accent, marginBottom: spacing.sm }}>{error}</Text> : null}
      <Pressable onPress={onSubmit} disabled={loading} style={{
        backgroundColor: colors.primary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: radius.md,
        opacity: loading ? 0.6 : 1,
      }}>
        <Text style={{ color: '#fff', fontSize: 16 }}>{loading ? 'Ingresando...' : 'Ingresar'}</Text>
      </Pressable>
      <Text style={{ marginTop: spacing.sm, color: colors.muted }}>Plataforma: {Platform.OS}</Text>
      {isAuthenticated ? <Text style={{ marginTop: 8 }}>Sesión activa: {role}</Text> : null}
    </View>
  );
}