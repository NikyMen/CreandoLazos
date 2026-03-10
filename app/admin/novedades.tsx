import { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, FlatList, Alert, StyleSheet, ScrollView } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { colors, spacing, radius } from '../../lib/theme';
import { getEvents, addEvent, updateEvent, deleteEventById, type CalendarEvent, compareEventDates, formatTime } from '../../lib/schedule';
import { Card, FAB, Portal, Modal, TextInput as PaperTextInput, Button as PaperButton, IconButton, Divider } from 'react-native-paper';

export default function AdminNovedades() {
  const { isAuthenticated, role } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadNovedades();
  }, []);

  const loadNovedades = async () => {
    const evs = await getEvents();
    // Ordenar por fecha descendente (lo más nuevo arriba) para un foro
    evs.sort((a, b) => compareEventDates(b, a));
    setEvents(evs);
  };

  if (!isAuthenticated) return <Redirect href="/login" />;
  if (role !== 'ADMIN') return <Redirect href="/patient/home" />;

  const resetForm = () => {
    setTitle('');
    setNotes('');
    setEditing(null);
    setModalVisible(false);
  };

  const onSave = async () => {
    if (!title.trim()) {
      Alert.alert('Título requerido', 'Ingresa un título para la novedad');
      return;
    }
    
    // Para novedades de foro, usamos la fecha actual
    const now = new Date();
    const date = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    try {
      if (editing) {
        await updateEvent({ 
          id: editing.id, 
          date: editing.date, // Mantenemos la fecha original al editar? O la actualizamos?
          time: editing.time, 
          title: title.trim(), 
          notes: notes.trim() || undefined 
        });
      } else {
        await addEvent({ 
          date, 
          time, 
          title: title.trim(), 
          notes: notes.trim() || undefined 
        });
      }
      await loadNovedades();
      resetForm();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo publicar');
    }
  };

  const onEdit = (ev: CalendarEvent) => {
    setEditing(ev);
    setTitle(ev.title);
    setNotes(ev.notes || '');
    setModalVisible(true);
  };

  const onDelete = async (id: string) => {
    Alert.alert(
      'Eliminar novedad',
      '¿Estás seguro de que deseas eliminar esta publicación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: async () => {
          await deleteEventById(id);
          setEvents(events.filter((e) => e.id !== id));
        }}
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Foro de Novedades (Admin)</Text>
      
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 80 }}
        renderItem={({ item }) => (
          <Card style={styles.novedadCard} mode="elevated">
            <Card.Title 
              title={item.title} 
              subtitle={`${item.date} ${item.time ? '— ' + formatTime(item.time) : ''}`}
              titleStyle={styles.cardTitle}
              right={(props) => (
                <View style={{ flexDirection: 'row' }}>
                  <IconButton {...props} icon="pencil" onPress={() => onEdit(item)} />
                  <IconButton {...props} icon="delete" iconColor={colors.accent} onPress={() => onDelete(item.id)} />
                </View>
              )}
            />
            <Card.Content>
              {item.notes ? <Text style={styles.cardNotes}>{item.notes}</Text> : null}
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay novedades publicadas aún.</Text>}
      />

      <Portal>
        <Modal visible={modalVisible} onDismiss={resetForm} contentContainerStyle={styles.modalContent}>
          <Text style={styles.modalTitle}>{editing ? 'Editar Novedad' : 'Nueva Novedad'}</Text>
          <PaperTextInput
            label="Título"
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            style={styles.input}
          />
          <PaperTextInput
            label="Contenido / Notas"
            value={notes}
            onChangeText={setNotes}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={[styles.input, { minHeight: 100 }]}
          />
          <View style={styles.modalButtons}>
            <PaperButton onPress={resetForm} style={{ flex: 1 }}>Cancelar</PaperButton>
            <PaperButton mode="contained" onPress={onSave} style={{ flex: 1 }}>{editing ? 'Guardar' : 'Publicar'}</PaperButton>
          </View>
        </Modal>
      </Portal>

      <FAB
        icon="plus"
        label="Nueva Novedad"
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        color="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.secondary,
    padding: spacing.md,
    backgroundColor: '#fff',
  },
  novedadCard: {
    marginBottom: spacing.md,
    backgroundColor: '#fff',
    borderRadius: radius.md,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  cardNotes: {
    fontSize: 16,
    color: colors.text,
    marginTop: 4,
    lineHeight: 22,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: colors.muted,
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: radius.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.secondary,
  },
  input: {
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
});
