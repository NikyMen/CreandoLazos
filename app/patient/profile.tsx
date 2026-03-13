import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, Platform } from 'react-native';
import { Card, Divider, List, Avatar, Surface } from 'react-native-paper';
import { Redirect } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { colors, spacing, radius } from '../../lib/theme';
import { getProfileFor, type ProfileData } from '../../lib/profile';

const InfoRow = ({ label, value, icon }: { label: string; value: string; icon: string }) => (
  <View style={styles.infoRow}>
    <List.Icon icon={icon} color={colors.primary} />
    <View style={styles.infoTextContainer}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || 'No especificado'}</Text>
    </View>
  </View>
);

export default function PatientProfile() {
  const { isAuthenticated, role, user } = useAuth();
  const [profile, setProfile] = useState<ProfileData>({});

  useEffect(() => {
    (async () => {
      const p = await getProfileFor(user?.email);
      setProfile(p);
    })();
  }, [user?.email]);

  if (!isAuthenticated) return <Redirect href="/login" />;
  if (role !== 'PATIENT') return <Redirect href="/admin/home" />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Surface style={styles.headerCard} elevation={2}>
        <Avatar.Icon size={80} icon="account" style={{ backgroundColor: colors.primary }} />
        <Text style={styles.userName}>{profile.nombreApellido || 'Paciente'}</Text>
        <Text style={styles.userEmail}>{profile.correo || user?.email}</Text>
      </Surface>

      <Card style={styles.sectionCard} mode="elevated">
        <Card.Title title="Información Personal" left={(props) => <List.Icon {...props} icon="card-account-details" />} />
        <Card.Content>
          <InfoRow label="CUIL / DNI" value={profile.cuilDni || ''} icon="id-card" />
          <Divider style={styles.divider} />
          <InfoRow label="Obra Social" value={profile.obraSocial || ''} icon="hospital-building" />
          <Divider style={styles.divider} />
          <InfoRow label="Escuela / Institución" value={profile.escuela || ''} icon="school" />
        </Card.Content>
      </Card>

      <Card style={styles.sectionCard} mode="elevated">
        <Card.Title title="Servicio y Diagnóstico" left={(props) => <List.Icon {...props} icon="medical-bag" />} />
        <Card.Content>
          <InfoRow label="Servicio Actual" value={profile.servicio || ''} icon="doctor" />
          <Divider style={styles.divider} />
          <Text style={styles.diagnosisLabel}>Diagnóstico:</Text>
          <Text style={styles.diagnosisValue}>{profile.diagnostico || 'Sin diagnóstico registrado'}</Text>
        </Card.Content>
      </Card>

      <Card style={[styles.sectionCard, styles.cudCard]} mode="elevated">
        <View style={styles.cudHeader}>
          <Avatar.Icon size={40} icon="badge-account-horizontal" style={{ backgroundColor: '#fff' }} color={colors.primary} />
          <Text style={styles.cudTitle}>Certificado Único de Discapacidad (CUD)</Text>
        </View>
        <Card.Content>
          <View style={styles.cudGrid}>
            <View style={styles.cudItem}>
              <Text style={styles.cudLabel}>N° DE CERTIFICADO</Text>
              <Text style={styles.cudValue}>{profile.cudNumero || '----'}</Text>
            </View>
            <View style={styles.cudItem}>
              <Text style={styles.cudLabel}>VENCIMIENTO</Text>
              <Text style={styles.cudValue}>{profile.cudVencimiento || '----'}</Text>
            </View>
          </View>
          <Divider style={[styles.divider, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
          <View style={styles.cudFooter}>
            <Text style={styles.cudAcompText}>
              Acompañante: <Text style={{ fontWeight: '800' }}>{profile.cudAcompanante ? 'SÍ' : 'NO'}</Text>
            </Text>
            <View style={styles.cudBadge}>
              <Text style={styles.cudBadgeText}>VÁLIDO</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  headerCard: {
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.secondary,
    marginTop: spacing.sm,
  },
  userEmail: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  infoTextContainer: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  divider: {
    backgroundColor: '#f0f0f0',
  },
  diagnosisLabel: {
    fontSize: 12,
    color: colors.muted,
    textTransform: 'uppercase',
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  diagnosisValue: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  cudCard: {
    backgroundColor: colors.primary,
  },
  cudHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: 12,
  },
  cudTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  cudGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.sm,
  },
  cudItem: {
    flex: 1,
  },
  cudLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '600',
  },
  cudValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  cudFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  cudAcompText: {
    color: '#fff',
    fontSize: 14,
  },
  cudBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cudBadgeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
});

