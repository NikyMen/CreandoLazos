import { View, Text, Button } from 'react-native';
import { useAuth } from '../../lib/auth';
import { Redirect } from 'expo-router';
import { colors } from '../../lib/theme';

export default function AdminHome() {
  const { logout, isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Redirect href="/login" />;
  if (role !== 'ADMIN') return <Redirect href="/patient/home" />;
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 20, marginBottom: 12, color: colors.secondary }}>Panel Administrador</Text>
      <Text>Desde aquí gestionarás horarios, estudios, informes y noticias.</Text>
      <Button title="Cerrar sesión" onPress={logout} />
    </View>
  );
}