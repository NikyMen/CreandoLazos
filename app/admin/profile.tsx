import { useEffect, useState } from 'react';
import { View, Text, Alert, ScrollView, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { TextInput as PaperTextInput, Button as PaperButton, Snackbar, Modal, Portal, List, Divider, Switch } from 'react-native-paper';
import { Redirect } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { colors, spacing, radius } from '../../lib/theme';
import { getProfileFor, setProfileFor, updateRemoteProfile, getRemoteProfile, listProfileEmails, type ProfileData } from '../../lib/profile';
import { api } from '../../lib/api';

export default function AdminProfile() {
  const { isAuthenticated, role } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [profile, setProfile] = useState<ProfileData>({});
  const [newPatientEmail, setNewPatientEmail] = useState('');
  const [newPatientPassword, setNewPatientPassword] = useState('');
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientDni, setNewPatientDni] = useState('');
  const [newPatientObraSocial, setNewPatientObraSocial] = useState('');
  const [newPatientEscuela, setNewPatientEscuela] = useState('');
  const [newPatientDiagnostico, setNewPatientDiagnostico] = useState('');
  const [newPatientServicio, setNewPatientServicio] = useState('');
  const [newPatientCudNumero, setNewPatientCudNumero] = useState('');
  const [newPatientCudVencimiento, setNewPatientCudVencimiento] = useState('');
  const [newPatientCudAcompanante, setNewPatientCudAcompanante] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Results state
  const [searchResults, setSearchResults] = useState<{ email: string; nombreApellido?: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [allPatients, setAllPatients] = useState<{ email: string; nombreApellido?: string }[]>([]);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // Snackbar state
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    setProfile({});
    setCanEdit(false);
    loadAllPatients();
  }, []);

  const loadAllPatients = async () => {
    setIsSearching(true);
    setLastError(null);
    try {
      // Usamos el endpoint más probable para listar
      let data: any[] = [];
      try {
        const res = await api.get('/profiles');
        if (res.data) {
          const possibleArray = Array.isArray(res.data) 
            ? res.data 
            : (res.data.profiles || res.data.users || res.data.data || res.data.patients);
          
          if (Array.isArray(possibleArray)) {
            data = possibleArray;
          }
        }
      } catch (e: any) {
        // Fallback silencioso a /users
        try {
          const resUsers = await api.get('/users');
          const results = Array.isArray(resUsers.data) ? resUsers.data : (resUsers.data.users || resUsers.data.data);
          if (Array.isArray(results)) data = results;
        } catch (e2) {}
      }

      if (data.length > 0) {
        const mapped = data.map((p: any) => ({
          email: p.email || p.correo || p.user?.email || (typeof p === 'string' ? p : ''),
          nombreApellido: p.nombreApellido || p.nombre_apellido || p.nombre || p.name || ''
        })).filter(p => p.email);
        
        setAllPatients(mapped);
      } else {
        setAllPatients([]);
      }
    } catch (err: any) {
      console.log('Error general en loadAllPatients:', err);
    } finally {
      setIsSearching(false);
    }
  };

  if (!isAuthenticated) return <Redirect href="/login" />;
  if (role !== 'ADMIN') return <Redirect href="/patient/home" />;

  const showFeedback = (message: string, error = false) => {
    setSnackbarMessage(message);
    setIsError(error);
    setSnackbarVisible(true);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setSearchResults([]);
      return;
    }
    const lower = text.toLowerCase();
    const filtered = allPatients.filter(p => 
      p.email.toLowerCase().includes(lower) || 
      (p.nombreApellido || '').toLowerCase().includes(lower)
    );
    setSearchResults(filtered);
  };

  const loadProfile = async (email: string) => {
    try {
      const p = await getProfileFor(email);
      setProfile(p);
      setCanEdit(true);
    } catch (e: any) {
      showFeedback('No se pudo cargar el perfil', true);
    }
  };

  const saveProfile = async () => {
    try {
      const targetEmail = profile.correo || searchQuery.trim();
      if (!targetEmail) throw new Error('Correo requerido');
      await updateRemoteProfile(targetEmail, profile);
      await setProfileFor(targetEmail, profile);
      showFeedback('Paciente actualizado correctamente');
      loadAllPatients();
      setCanEdit(false);
    } catch (e: any) {
      showFeedback(e?.message || 'No se pudo guardar', true);
    }
  };

  const createPatient = async () => {
    try {
      const em = newPatientEmail.trim();
      const pw = newPatientPassword.trim();
      const name = newPatientName.trim();

      if (!em || !/[^@\s]+@[^@\s]+\.[^@\s]+/.test(em)) throw new Error('Correo inválido');
      if (pw.length < 6) throw new Error('Contraseña mínima 6 caracteres');
      if (!name) throw new Error('El nombre es requerido para el perfil');

      setIsCreating(true);

      const emailExists = allPatients.some(p => p.email.toLowerCase() === em.toLowerCase());
      if (emailExists) {
        throw new Error('El email ya existe');
      }

      await api.post('/auth/register', { email: em, password: pw, role: 'PATIENT' });

      const initialProfile: ProfileData = {
        correo: em,
        nombreApellido: name,
        cuilDni: newPatientDni.trim(),
        obraSocial: newPatientObraSocial.trim(),
        escuela: newPatientEscuela.trim(),
        diagnostico: newPatientDiagnostico.trim(),
        servicio: newPatientServicio.trim(),
        cudNumero: newPatientCudNumero.trim(),
        cudVencimiento: newPatientCudVencimiento.trim(),
        cudAcompanante: newPatientCudAcompanante,
      };
      
      try {
        await updateRemoteProfile(em, initialProfile);
      } catch (e: any) {
        if (e.response?.status !== 404) {
          throw e;
        }
        console.log('Ignorando error 404 esperado al crear perfil remoto.');
      }

      await setProfileFor(em, initialProfile);
  
      setNewPatientEmail('');
      setNewPatientPassword('');
      setNewPatientName('');
      setNewPatientDni('');
      setNewPatientObraSocial('');
      setNewPatientEscuela('');
      setNewPatientDiagnostico('');
      setNewPatientServicio('');
      setNewPatientCudNumero('');
      setNewPatientCudVencimiento('');
      setNewPatientCudAcompanante(false);

      showFeedback('Se creó exitosamente el usuario');
      loadAllPatients(); 
    } catch (e: any) {
      const errorResponse = e?.response?.data;
      const errorMessage = errorResponse?.error || errorResponse?.message || e.message || 'No se pudo crear el usuario';
      
      if (errorMessage.toLowerCase().includes('already exists') || errorMessage.toLowerCase().includes('ya existe') || errorMessage === 'El email ya existe') {
        showFeedback('El email ya existe', true);
      } else {
        showFeedback(`Error: ${errorMessage}`, true);
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md }}>
        <Text style={{ fontSize: 22, color: colors.secondary, marginBottom: spacing.sm, fontWeight: 'bold' }}>Gestionar Pacientes</Text>
        
        <View style={{ backgroundColor: '#fff', padding: spacing.md, borderRadius: radius.md, elevation: 2, marginBottom: spacing.lg }}>
          <Text style={{ fontSize: 16, marginBottom: spacing.sm, fontWeight: '600' }}>Buscar Paciente</Text>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <PaperButton 
              mode="contained" 
              icon="magnify" 
              onPress={() => {
                setSearchModalVisible(true);
                setSearchQuery('');
                setSearchResults([]);
                loadAllPatients(); // Refrescar la lista al abrir
              }}
              style={{ flex: 1 }}
            >
              Abrir Buscador de Pacientes
            </PaperButton>
          </View>
        </View>

        {/* Modal de Búsqueda (Pop-up) */}
        <Portal>
          <Modal
            visible={searchModalVisible}
            onDismiss={() => {
              setSearchModalVisible(false);
              setCanEdit(false); // Resetear estado de edición al cerrar
            }}
            contentContainerStyle={{ 
              backgroundColor: 'white', 
              padding: 20, 
              margin: 20, 
              borderRadius: radius.md,
              maxHeight: '90%' // Un poco más alto para el formulario
            }}
          >
            {canEdit ? (
              <ScrollView style={{ maxHeight: 600 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                  <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Editar Paciente</Text>
                  <PaperButton compact onPress={() => setCanEdit(false)}>Atrás</PaperButton>
                </View>
                
                <Text>Nombre y apellido</Text>
                <PaperTextInput
                  value={profile.nombreApellido || ''}
                  onChangeText={(v) => setProfile((p) => ({ ...p, nombreApellido: v }))}
                  mode="outlined"
                  style={{ marginBottom: spacing.sm }}
                />
                <Text>CUIL/DNI</Text>
                <PaperTextInput
                  value={profile.cuilDni || ''}
                  onChangeText={(v) => setProfile((p) => ({ ...p, cuilDni: v }))}
                  mode="outlined"
                  style={{ marginBottom: spacing.sm }}
                />
                <Text>Obra social</Text>
                <PaperTextInput
                  value={profile.obraSocial || ''}
                  onChangeText={(v) => setProfile((p) => ({ ...p, obraSocial: v }))}
                  mode="outlined"
                  style={{ marginBottom: spacing.sm }}
                />
                <Text>Correo</Text>
                <PaperTextInput
                  value={profile.correo || ''}
                  editable={false} // Evitar cambiar el email que es la clave
                  mode="outlined"
                  style={{ marginBottom: spacing.sm, backgroundColor: '#f0f0f0' }}
                />
                <Text>Escuela</Text>
                <PaperTextInput
                  value={profile.escuela || ''}
                  onChangeText={(v) => setProfile((p) => ({ ...p, escuela: v }))}
                  mode="outlined"
                  style={{ marginBottom: spacing.sm }}
                />
                <Text>Diagnóstico</Text>
                <PaperTextInput
                  value={profile.diagnostico || ''}
                  onChangeText={(v) => setProfile((p) => ({ ...p, diagnostico: v }))}
                  multiline={true}
                  mode="outlined"
                  style={{ minHeight: 80, marginBottom: spacing.md }}
                />

                <Divider style={{ marginVertical: spacing.md }} />
                <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: spacing.sm }}>Información de Servicio y CUD</Text>

                <Text>Servicio</Text>
                <PaperTextInput
                  value={profile.servicio || ''}
                  onChangeText={(v) => setProfile((p) => ({ ...p, servicio: v }))}
                  mode="outlined"
                  placeholder="Ej: Fonoaudiología, Psicopedagogía"
                  style={{ marginBottom: spacing.sm }}
                />

                <Text>CUD Número</Text>
                <PaperTextInput
                  value={profile.cudNumero || ''}
                  onChangeText={(v) => setProfile((p) => ({ ...p, cudNumero: v }))}
                  mode="outlined"
                  style={{ marginBottom: spacing.sm }}
                />

                <Text>CUD Vencimiento (MM/AAAA)</Text>
                <PaperTextInput
                  value={profile.cudVencimiento || ''}
                  onChangeText={(v) => setProfile((p) => ({ ...p, cudVencimiento: v }))}
                  mode="outlined"
                  placeholder="05/2033"
                  style={{ marginBottom: spacing.sm }}
                />

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
                  <Text>¿Requiere Acompañante?</Text>
                  <Switch
                    value={profile.cudAcompanante || false}
                    onValueChange={(v) => setProfile((p) => ({ ...p, cudAcompanante: v }))}
                    color={colors.primary}
                  />
                </View>

                <PaperButton 
                  mode="contained" 
                  icon="content-save" 
                  onPress={saveProfile}
                  style={{ marginBottom: spacing.md }}
                >
                  Guardar Cambios
                </PaperButton>
              </ScrollView>
            ) : (
              <>
                <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>Buscador de Pacientes</Text>
                <Text style={{ fontSize: 12, color: '#999', marginBottom: spacing.md }}>
                  Total cargados: {allPatients.length}
                </Text>

                {lastError && (
                  <View style={{ backgroundColor: '#fee', padding: 8, borderRadius: 4, marginBottom: spacing.md }}>
                    <Text style={{ color: '#c00', fontSize: 11 }}>Error API: {lastError}</Text>
                  </View>
                )}
                
                <PaperTextInput
                  placeholder="Escribe para filtrar o busca por email..."
                  value={searchQuery}
                  onChangeText={handleSearch}
                  mode="outlined"
                  autoFocus={true}
                  left={<PaperTextInput.Icon icon="magnify" />}
                  right={searchQuery ? <PaperTextInput.Icon icon="close" onPress={() => { setSearchQuery(''); setSearchResults([]); }} /> : null}
                  style={{ marginBottom: spacing.md }}
                />

                <View style={{ maxHeight: 300 }}>
                  {isSearching ? (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                      <Text>Buscando...</Text>
                    </View>
                  ) : (
                    <FlatList
                      data={searchQuery.trim() ? searchResults : allPatients}
                      keyExtractor={(item, index) => item.email || index.toString()}
                      ItemSeparatorComponent={() => <Divider />}
                      ListEmptyComponent={() => (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                          <Text style={{ color: '#666' }}>
                            {searchQuery.trim() 
                              ? 'No se encontraron resultados' 
                              : 'No hay pacientes registrados en la base de datos'}
                          </Text>
                        </View>
                      )}
                      renderItem={({ item }) => (
                        <List.Item
                          title={item.nombreApellido || 'Sin nombre'}
                          description={item.email || 'Sin email'}
                          onPress={() => loadProfile(item.email)}
                          left={props => <List.Icon {...props} icon="account-search" color={colors.primary} />}
                        />
                      )}
                    />
                  )}
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.md }}>
                  <PaperButton 
                    mode="outlined" 
                    onPress={() => setSearchModalVisible(false)}
                  >
                    Cerrar
                  </PaperButton>
                </View>
              </>
            )}
          </Modal>
        </Portal>

        {/* Formulario de creación de pacientes */}
        <View style={{ backgroundColor: '#f0f4ff', padding: spacing.md, borderRadius: radius.md, borderLeftWidth: 4, borderLeftColor: colors.primary, marginBottom: spacing.xl }}>
          <Text style={{ fontSize: 20, marginBottom: spacing.md, color: colors.primary, fontWeight: 'bold' }}>Crear nuevo perfil de paciente</Text>

          <Text style={{ fontWeight: '600', marginBottom: 4 }}>Información de Cuenta</Text>
          <PaperTextInput
            placeholder="Nombre completo"
            value={newPatientName}
            onChangeText={setNewPatientName}
            mode="outlined"
            style={{ marginBottom: spacing.sm }}
            left={<PaperTextInput.Icon icon="account" />}
          />

          <PaperTextInput
            placeholder="Email (usuario)"
            value={newPatientEmail}
            onChangeText={setNewPatientEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            mode="outlined"
            style={{ marginBottom: spacing.sm }}
            left={<PaperTextInput.Icon icon="email" />}
          />

          <PaperTextInput
            placeholder="Contraseña inicial"
            value={newPatientPassword}
            onChangeText={setNewPatientPassword}
            secureTextEntry={true}
            mode="outlined"
            style={{ marginBottom: spacing.md }}
            left={<PaperTextInput.Icon icon="lock" />}
          />

          <Divider style={{ marginVertical: spacing.md }} />
          <Text style={{ fontWeight: '600', marginBottom: 4 }}>Datos Personales</Text>

          <PaperTextInput
            placeholder="CUIL / DNI"
            value={newPatientDni}
            onChangeText={setNewPatientDni}
            mode="outlined"
            style={{ marginBottom: spacing.sm }}
            left={<PaperTextInput.Icon icon="id-card" />}
          />

          <PaperTextInput
            placeholder="Obra Social"
            value={newPatientObraSocial}
            onChangeText={setNewPatientObraSocial}
            mode="outlined"
            style={{ marginBottom: spacing.sm }}
            left={<PaperTextInput.Icon icon="hospital-building" />}
          />

          <PaperTextInput
            placeholder="Escuela"
            value={newPatientEscuela}
            onChangeText={setNewPatientEscuela}
            mode="outlined"
            style={{ marginBottom: spacing.sm }}
            left={<PaperTextInput.Icon icon="school" />}
          />

          <PaperTextInput
            placeholder="Diagnóstico"
            value={newPatientDiagnostico}
            onChangeText={setNewPatientDiagnostico}
            multiline={true}
            mode="outlined"
            style={{ minHeight: 80, marginBottom: spacing.sm }}
            left={<PaperTextInput.Icon icon="medical-bag" />}
          />

          <Divider style={{ marginVertical: spacing.md }} />
          <Text style={{ fontWeight: '600', marginBottom: 4 }}>Servicio y CUD</Text>

          <PaperTextInput
            placeholder="Servicio (Ej: Fonoaudiología)"
            value={newPatientServicio}
            onChangeText={setNewPatientServicio}
            mode="outlined"
            style={{ marginBottom: spacing.sm }}
            left={<PaperTextInput.Icon icon="doctor" />}
          />

          <PaperTextInput
            placeholder="CUD Número"
            value={newPatientCudNumero}
            onChangeText={setNewPatientCudNumero}
            mode="outlined"
            style={{ marginBottom: spacing.sm }}
            left={<PaperTextInput.Icon icon="badge-account-horizontal" />}
          />

          <PaperTextInput
            placeholder="CUD Vencimiento (MM/AAAA)"
            value={newPatientCudVencimiento}
            onChangeText={setNewPatientCudVencimiento}
            mode="outlined"
            style={{ marginBottom: spacing.md }}
            left={<PaperTextInput.Icon icon="calendar" />}
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg, paddingRight: 8 }}>
            <Text>¿Requiere Acompañante?</Text>
            <Switch
              value={newPatientCudAcompanante}
              onValueChange={setNewPatientCudAcompanante}
              color={colors.primary}
            />
          </View>

          <PaperButton
            mode="contained"
            icon="account-plus"
            onPress={createPatient}
            loading={isCreating}
            disabled={isCreating}
            style={{ backgroundColor: colors.primary, paddingVertical: 4 }}
          >
            Crear Usuario y Perfil Completo
          </PaperButton>
        </View>
        <View style={{ height: spacing.xl }} />
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
        style={{ backgroundColor: isError ? colors.error : colors.success }}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}


