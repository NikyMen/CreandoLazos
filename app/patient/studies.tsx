import { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, Alert, Platform } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { colors, spacing } from '../../lib/theme';
import { getStudiesFor, type Study, getRemoteStudies, type RemoteStudy } from '../../lib/studies';
import * as FileSystem from 'expo-file-system';
import { absoluteUrl } from '../../lib/api';

export default function PatientStudies() {
  const { isAuthenticated, role, user } = useAuth();
  const router = useRouter();
  const [studies, setStudies] = useState<Study[]>([]);
  const [remoteStudies, setRemoteStudies] = useState<RemoteStudy[]>([]);
  const [remoteError, setRemoteError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const list = await getStudiesFor(user?.email);
      setStudies(list);
      try {
        const remote = await getRemoteStudies(user?.email);
        setRemoteStudies(remote);
      } catch (e: any) {
        setRemoteError(e?.message || 'No se pudo cargar los estudios del backend');
      }
    })();
  }, []);

  if (!isAuthenticated) return <Redirect href="/login" />;
  if (role !== 'PATIENT') return <Redirect href="/admin/home" />;

  const openStudy = (study: Study) => {
    router.push({ pathname: '/patient/study', params: { id: study.id } });
  };
  const openRemote = (study: RemoteStudy) => {
    router.push({ pathname: '/patient/study', params: { url: study.fileUrl, name: study.name } });
  };

  const sanitize = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const downloadRemote = async (study: RemoteStudy) => {
    try {
      if (Platform.OS === 'web') {
        const a = document.createElement('a');
        a.href = absoluteUrl(study.fileUrl);
        a.download = sanitize(study.name || 'archivo');
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }
      const dir = FileSystem.Paths.document.createDirectory('studies');
      try { dir.create({ intermediates: true, idempotent: true }); } catch {}
      const destFile = dir.createFile(sanitize(study.name || 'archivo.pdf'), study.mimeType || 'application/pdf');
      try { destFile.create({ overwrite: true, intermediates: true }); } catch {}
      await FileSystem.File.downloadFileAsync(absoluteUrl(study.fileUrl), destFile, { idempotent: true });
      Alert.alert('Descarga completa', destFile.uri);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo descargar');
    }
  };

  const downloadLocal = async (study: Study) => {
    try {
      if (Platform.OS === 'web') {
        const a = document.createElement('a');
        a.href = study.dataUrl;
        a.download = sanitize(study.name || 'archivo');
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }
      const dir = FileSystem.Paths.document.createDirectory('studies');
      try { dir.create({ intermediates: true, idempotent: true }); } catch {}
      const ext = study.mimeType === 'application/pdf' ? '.pdf' : '';
      const destFile = dir.createFile(sanitize(study.name || 'archivo') + ext, study.mimeType);
      try { destFile.create({ overwrite: true, intermediates: true }); } catch {}
      const base64 = (study.dataUrl.split(',')[1] || '');
      destFile.write(base64, { encoding: 'base64' });
      Alert.alert('Descarga completa', destFile.uri);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo descargar');
    }
  };

  return (
    <View style={{ flex: 1, padding: spacing.md }}>
      <Text style={{ fontSize: 22, color: colors.accent, marginBottom: spacing.sm }}>Estudios</Text>
      <Text style={{ fontSize: 18, marginBottom: spacing.sm }}>PDF (backend)</Text>
      {remoteError ? (
        <Text style={{ color: colors.accent, marginBottom: spacing.sm }}>{remoteError}</Text>
      ) : null}
      <FlatList
        data={remoteStudies}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={{ color: colors.muted }}>No hay PDFs disponibles.</Text>}
        renderItem={({ item }) => (
          <View style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ fontWeight: '600' }}>{item.name}</Text>
            <Text style={{ color: colors.muted }}>{item.mimeType}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
              <Button title="Ver" onPress={() => openRemote(item)} />
              <Button title="Descargar" onPress={() => downloadRemote(item)} />
            </View>
          </View>
        )}
      />

      <View style={{ height: spacing.md }} />

      <Text style={{ fontSize: 18, marginBottom: spacing.sm }}>Otros (local)</Text>
      <FlatList
        data={studies}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={{ color: colors.muted }}>No hay estudios disponibles.</Text>}
        renderItem={({ item }) => (
          <View style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ fontWeight: '600' }}>{item.name}</Text>
            <Text style={{ color: colors.muted }}>{item.mimeType}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
              <Button title="Ver" onPress={() => openStudy(item)} />
              <Button title="Descargar" onPress={() => downloadLocal(item)} />
            </View>
          </View>
        )}
      />
      <View style={{ height: spacing.md }} />
      <Button title="Volver" color={colors.accent} onPress={() => router.push('/patient/home')} />
    </View>
  );
}