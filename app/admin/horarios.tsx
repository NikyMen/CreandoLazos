import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Alert, FlatList } from 'react-native';
import { TextInput as PaperTextInput, Button as PaperButton, Divider, Portal, Modal, List } from 'react-native-paper';
import { Redirect } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { colors, spacing, radius } from '../../lib/theme';
import { dias, timeSlots, getHorariosFor, setHorarioCellFor, setHorarioNoteFor, setHorariosFor, keyFor, type Dia } from '../../lib/horarios';
import { listProfileEmails } from '../../lib/profile';
import { api } from '../../lib/api';

export default function AdminHorarios() {
  const { isAuthenticated, role } = useAuth();
  const [note, setNote] = useState('');
  const [cells, setCells] = useState<Record<string, string>>({});
  const [email, setEmail] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [knownEmails, setKnownEmails] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ email: string; nombreApellido?: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const allPatientsData = useMemo(() => {
    return knownEmails.map(em => ({ email: em, nombreApellido: '' }));
  }, [knownEmails]);

  useEffect(() => {
    (async () => {
      try {
        const localList = await listProfileEmails();
        setKnownEmails(localList);
        
        // Cargar algunos pacientes inicialmente para que el buscador tenga algo
        const res = await api.get('/profiles');
        const data = Array.isArray(res.data) ? res.data : (res.data.profiles || res.data.users || res.data.data || res.data.patients);
        if (Array.isArray(data)) {
          const apiEmails = data.map((p: any) => p.email || p.correo || (typeof p === 'string' ? p : '')).filter(Boolean);
          setKnownEmails(prev => [...new Set([...prev, ...apiEmails])].sort());
        }
      } catch (e) {}
    })();
  }, []);

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setSearchResults([]);
      return;
    }

    const query = text.trim();
    setIsSearching(true);
    
    try {
      const searchParams = [{ query: query }, { email: query }, { search: query }];
      let data: any[] = [];
      const endpoints = ['/profiles', '/profiles/list', '/users', '/patients'];
      
      for (const endpoint of endpoints) {
        for (const params of searchParams) {
          try {
            const res = await api.get(endpoint, { params });
            if (res.data) {
              const results = Array.isArray(res.data) ? res.data : (res.data.profiles || res.data.users || res.data.patients || res.data.data);
              if (Array.isArray(results) && results.length > 0) {
                data = results;
                break;
              } else if (res.data.email || res.data.correo) {
                data = [res.data];
                break;
              }
            }
          } catch (e) {}
        }
        if (data.length > 0) break;
      }

      if (data.length > 0) {
        const mapped = data.map((p: any) => ({
          email: p.email || p.correo || p.user?.email || (typeof p === 'string' ? p : ''),
          nombreApellido: p.nombreApellido || p.nombre_apellido || p.nombre || p.name || ''
        })).filter(p => p.email);
        setSearchResults(mapped);
      } else {
        // Fallback local
        const lowerQuery = query.toLowerCase();
        const filtered = knownEmails
          .filter(em => em.toLowerCase().includes(lowerQuery))
          .map(em => ({ email: em }));
        setSearchResults(filtered);
      }
    } catch (err) {
      console.log('Error searching:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const loadHorario = async (targetEmail: string) => {
    const em = targetEmail.trim();
    if (!em) return;
    
    setIsLoading(true);
    setSearchModalVisible(false);
    try {
      const data = await getHorariosFor(em);
      setSelectedEmail(em);
      setEmail(em);
      setKnownEmails((prev) => (prev.includes(em) ? prev : [...prev, em].sort()));
      setNote(data.note || '');
      setCells(data.cells || {});
    } catch (e: any) {
      Alert.alert('Error', 'No se pudo cargar el horario');
    } finally {
      setIsLoading(false);
    }
  };

  const slots = timeSlots(8, 18);

  if (!isAuthenticated) return <Redirect href="/login" />;
  if (role !== 'ADMIN') return <Redirect href="/patient/home" />;

  const onChangeCell = (day: Dia, time: string, value: string) => {
    const k = keyFor(day, time);
    setCells((prev) => ({ ...prev, [k]: value }));
  };

  const onBlurCell = async (day: Dia, time: string) => {
    if (!selectedEmail) return;
    const k = keyFor(day, time);
    const v = cells[k] || '';
    await setHorarioCellFor(selectedEmail, day, time, v);
  };

  const onBlurNote = async () => {
    if (!selectedEmail) return;
    await setHorarioNoteFor(selectedEmail, note);
  };

  return (
    <View style={{ flex: 1, padding: spacing.md }}>
      <Text style={{ fontSize: 22, color: colors.secondary, marginBottom: spacing.sm, fontWeight: 'bold' }}>Horarios</Text>
      
      <View style={{ backgroundColor: '#fff', padding: spacing.md, borderRadius: radius.md, elevation: 2, marginBottom: spacing.md }}>
        <Text style={{ fontSize: 16, marginBottom: spacing.sm, fontWeight: '600' }}>Buscar Paciente</Text>
        <PaperButton 
          mode="contained" 
          icon="account-search" 
          onPress={() => {
            setSearchModalVisible(true);
            setSearchQuery('');
            setSearchResults([]);
          }}
          loading={isLoading}
        >
          Seleccionar Paciente
        </PaperButton>
      </View>

      <Portal>
        <Modal
          visible={searchModalVisible}
          onDismiss={() => setSearchModalVisible(false)}
          contentContainerStyle={{ 
            backgroundColor: 'white', 
            padding: 20, 
            margin: 20, 
            borderRadius: radius.md,
            maxHeight: '80%'
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: spacing.md }}>Buscador de Pacientes</Text>
          
          <PaperTextInput
            placeholder="Escribe nombre o email..."
            value={searchQuery}
            onChangeText={handleSearch}
            mode="outlined"
            autoFocus={true}
            left={<PaperTextInput.Icon icon="magnify" />}
            style={{ marginBottom: spacing.md }}
          />

          <View style={{ maxHeight: 300 }}>
            {isSearching ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text>Buscando...</Text>
              </View>
            ) : (
              <FlatList
                data={searchResults.length > 0 ? searchResults : allPatientsData}
                keyExtractor={(item, index) => item.email || index.toString()}
                ItemSeparatorComponent={() => <Divider />}
                ListEmptyComponent={() => (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#666' }}>No se encontraron pacientes</Text>
                  </View>
                )}
                renderItem={({ item }) => (
                  <List.Item
                    title={item.nombreApellido || item.email}
                    description={item.nombreApellido ? item.email : ''}
                    onPress={() => loadHorario(item.email)}
                    left={props => <List.Icon {...props} icon="account" color={colors.primary} />}
                  />
                )}
              />
            )}
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.md }}>
            <PaperButton mode="outlined" onPress={() => setSearchModalVisible(false)}>Cerrar</PaperButton>
          </View>
        </Modal>
      </Portal>

      {selectedEmail ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: 8 }}>
            <Text style={{ color: colors.muted, flex: 1 }}>Paciente: <Text style={{ fontWeight: 'bold', color: colors.text }}>{selectedEmail}</Text></Text>
            <PaperButton compact mode="text" onPress={() => setSelectedEmail(null)}>Cambiar</PaperButton>
          </View>
          <PaperTextInput
            placeholder="Notas generales"
            value={note}
            onChangeText={setNote}
            onBlur={onBlurNote}
            multiline={true}
            mode="outlined"
            style={{ marginBottom: spacing.md, minHeight: 80 }}
          />
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: spacing.md }}>
            <PaperButton 
              mode="contained" 
              icon="content-save" 
              loading={isLoading}
              disabled={isLoading}
              onPress={async () => {
                setIsLoading(true);
                try {
                  await setHorariosFor(selectedEmail, { note, cells });
                  Alert.alert('Guardado', 'Horarios y nota guardados');
                } catch (e: any) {
                  Alert.alert('Error', e?.message || 'No se pudo guardar');
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              Guardar Todo
            </PaperButton>
          </View>
          <ScrollView horizontal={true} style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8 }}>
            <View style={{ minWidth: 900 }}>
              <View style={{ flexDirection: 'row', backgroundColor: colors.light, borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
                <View style={{ width: 120, padding: 12, borderRightWidth: 1, borderRightColor: colors.border }}>
                  <Text style={{ color: colors.secondary, fontWeight: 'bold', textAlign: 'center' }}>Hora</Text>
                </View>
                {dias.map((d) => (
                  <View key={d} style={{ flex: 1, padding: 12, borderRightWidth: 1, borderRightColor: colors.border }}>
                    <Text style={{ color: colors.secondary, fontWeight: 'bold', textAlign: 'center' }}>{d}</Text>
                  </View>
                ))}
              </View>
              <Divider />
              <ScrollView style={{ flex: 1 }}>
                {slots.map((t, idx) => (
                  <View key={t} style={{ flexDirection: 'row', backgroundColor: idx % 2 === 0 ? '#fff' : colors.background }}>
                    <View style={{ width: 120, paddingVertical: 8, paddingHorizontal: 12, borderRightWidth: 1, borderRightColor: colors.border, justifyContent: 'center' }}>
                      <Text style={{ fontWeight: '600', color: colors.primary, textAlign: 'center' }}>{t}</Text>
                    </View>
                    {dias.map((d) => {
                      const k = keyFor(d, t);
                      const val = cells[k] || '';
                      return (
                        <View key={k} style={{ flex: 1, padding: 6, borderRightWidth: 1, borderRightColor: colors.border }}>
                          <PaperTextInput
                            value={val}
                            onChangeText={(v) => onChangeCell(d, t, v)}
                            onBlur={() => onBlurCell(d, t)}
                            mode="flat"
                            placeholder=""
                            style={{ backgroundColor: 'transparent', height: 40 }}
                            contentStyle={{ paddingHorizontal: 4, fontSize: 14 }}
                            dense
                          />
                        </View>
                      );
                    })}
                  </View>
                ))}
              </ScrollView>
            </View>
          </ScrollView>
        </>
      ) : (
        <Text style={{ marginTop: spacing.sm, color: colors.muted }}>Seleccioná un paciente para ver los horarios.</Text>
      )}
    </View>
  );
}
