import { View, Text, Image, Linking, TouchableOpacity, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { Button as PaperButton, IconButton } from 'react-native-paper';
import { useAuth } from '../../lib/auth';
import { Redirect } from 'expo-router';
import { colors, spacing, radius } from '../../lib/theme';
import { useRouter } from 'expo-router';
import { getProfileFor } from '../../lib/profile';

export default function PatientHome() {
  const { logout, isAuthenticated, role, user } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    (async () => {
      const email = user?.email;
      if (!email) { setDisplayName(''); return; }
      try {
        const p = await getProfileFor(email);
        const name = (p?.nombreApellido || '').trim();
        setDisplayName(name || email.split('@')[0]);
      } catch {
        setDisplayName(email.split('@')[0]);
      }
    })();
  }, [user?.email]);

  const openURL = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  if (!isAuthenticated) return <Redirect href="/login" />;
  if (role !== 'PATIENT') return <Redirect href="/admin/home" />;

  return (
    <View style={styles.container}>
      <PaperButton
        style={styles.logoutButton}
        mode="outlined"
        icon="logout"
        onPress={logout}
        contentStyle={{ height: 44 }}
      >
        Cerrar sesión
      </PaperButton>

      <View style={styles.mainContent}>
        <Image source={require('../../assets/icon.png')} style={styles.logo} />
        <Text style={styles.welcomeText}>Hola, {displayName || 'Paciente'}</Text>
        <Text style={styles.subtitle}>Bienvenido a Creando Lazos</Text>
        
        <View style={styles.gridContainer}>
          <PaperButton
            mode="contained"
            icon="bullhorn-outline"
            onPress={() => router.push('/patient/novedades')}
            style={styles.gridButton}
            contentStyle={styles.gridButtonContent}
            labelStyle={styles.gridButtonLabel}
          >
            Novedades
          </PaperButton>
          <PaperButton
            mode="contained"
            icon="file-document-outline"
            onPress={() => router.push('/patient/tracking')}
            style={styles.gridButton}
            contentStyle={styles.gridButtonContent}
            labelStyle={styles.gridButtonLabel}
          >
            Seguimiento
          </PaperButton>
          <PaperButton
            mode="contained"
            icon="clock-outline"
            onPress={() => router.push('/patient/horarios')}
            style={styles.gridButton}
            contentStyle={styles.gridButtonContent}
            labelStyle={styles.gridButtonLabel}
          >
            Horarios
          </PaperButton>
          <PaperButton
            mode="contained"
            icon="account"
            onPress={() => router.push('/patient/profile')}
            style={styles.gridButton}
            contentStyle={styles.gridButtonContent}
            labelStyle={styles.gridButtonLabel}
          >
            Perfil
          </PaperButton>
          <PaperButton
            mode="contained"
            icon="image-multiple"
            onPress={() => router.push('/patient/gallery')}
            style={styles.gridButton}
            contentStyle={styles.gridButtonContent}
            labelStyle={styles.gridButtonLabel}
          >
            Galería
          </PaperButton>
        </View>
      </View>

      {/* Footer con Links */}
      <View style={styles.footer}>
        <IconButton
          icon="web"
          size={32}
          iconColor={colors.primary}
          onPress={() => openURL('https://creandolazos.ar/')}
        />
        
        <IconButton
          icon="instagram"
          size={32}
          iconColor="#E1306C"
          onPress={() => openURL('https://www.instagram.com/creandolazoscentro')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  logoutButton: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    zIndex: 10,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: spacing.sm,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    color: colors.accent,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
    width: '100%',
  },
  gridButton: {
    width: '46%',
    borderRadius: 12,
  },
  gridButtonContent: {
    height: 100,
    justifyContent: 'center',
  },
  gridButtonLabel: {
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border + '50',
  },
  webLink: {
    paddingVertical: 8,
  },
  webLinkText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});

