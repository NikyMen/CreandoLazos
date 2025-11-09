import { Redirect } from 'expo-router';
import { useAuth } from '../lib/auth';

export default function Index() {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Redirect href="/login" />;
  return <Redirect href={role === 'ADMIN' ? '/admin/home' : '/patient/home'} />;
}