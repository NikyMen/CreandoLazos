import React from 'react';
import { Platform, View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getStudies } from '../../lib/studies';
import { colors } from '../../lib/theme';

export default function PatientStudyViewer() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const urlParam = Array.isArray(params.url) ? params.url[0] : params.url;
  const nameParam = Array.isArray(params.name) ? params.name[0] : params.name;

  const studies = getStudies();
  const study = id ? (Array.isArray(studies) ? studies.find((s) => s.id === id) : undefined) : undefined;

  if (!urlParam && (!id || !study)) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ color: colors.text, fontSize: 16 }}>Estudio no encontrado.</Text>
        <Text style={{ color: colors.secondary, marginTop: 8 }} onPress={() => router.back()}>
          Volver
        </Text>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1 }}>
        <iframe
          src={urlParam || study?.dataUrl}
          style={{ width: '100%', height: '100vh', border: 'none' }}
          title={`Estudio ${nameParam || study?.name || ''}`}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ color: colors.text, fontSize: 16, marginBottom: 12 }}>
        Visualización nativa pendiente.
      </Text>
      <Text style={{ color: colors.secondary }}>
        Próximo paso: integrar visor con WebView para PDF/Office.
      </Text>
    </View>
  );
}