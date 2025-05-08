import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Image, FlatList, Dimensions } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import axios from 'axios';
import { API_URL, COLORS } from '../../constants/Config';
import { Ionicons } from '@expo/vector-icons';

const TABS = ['Tasks', 'Members', 'Calendar'];

export default function GardenDetailScreen() {
  const { id } = useLocalSearchParams();
  const navigation = useNavigation();
  const [garden, setGarden] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    fetchGarden();
  }, [id]);

  const fetchGarden = async () => {
    setLoading(true);
    try {
      const [gardenRes, tasksRes] = await Promise.all([
        axios.get(`${API_URL}/gardens/${id}/`),
        axios.get(`${API_URL}/tasks/?garden=${id}`),
      ]);
      setGarden(gardenRes.data);
      setTasks(tasksRes.data);
    } catch (error) {
      setGarden(null);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  if (!garden) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Garden not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back to Gardens</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Group tasks by status
  const pendingTasks = tasks.filter(task => task.status === 'Pending');
  const inProgressTasks = tasks.filter(task => task.status === 'In Progress');
  const completedTasks = tasks.filter(task => task.status === 'Completed');

  return (
    <ScrollView style={styles.container}>
      {/* Garden Header */}
      <View style={styles.headerCard}>
        <Image source={{ uri: garden.image }} style={styles.headerImage} />
        <View style={styles.headerContent}>
          <Text style={styles.gardenName}>{garden.name}</Text>
          <View style={styles.chipRow}>
            <View style={styles.chip}><Ionicons name="location-outline" size={16} color={COLORS.primaryDark} /><Text style={styles.chipText}>{garden.location}</Text></View>
            <View style={styles.chip}><Ionicons name="people-outline" size={16} color={COLORS.primaryDark} /><Text style={styles.chipText}>{garden.members} Members</Text></View>
            <View style={styles.chip}><Ionicons name="list-outline" size={16} color={COLORS.primaryDark} /><Text style={styles.chipText}>{garden.tasks} Tasks</Text></View>
          </View>
          <Text style={styles.gardenDesc}>{garden.description}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map((label, idx) => (
          <TouchableOpacity
            key={label}
            style={[styles.tab, tab === idx && styles.tabActive]}
            onPress={() => setTab(idx)}
          >
            <Text style={[styles.tabText, tab === idx && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {/* Tasks Tab */}
        {tab === 0 && (
          <View>
            <Text style={styles.sectionTitle}>Garden Tasks</Text>
            <Text style={styles.statusTitle}>Pending ({pendingTasks.length})</Text>
            <FlatList
              data={pendingTasks}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => <TaskCard task={item} color="#fff9c4" />}
              ListEmptyComponent={<Text style={styles.emptyText}>No pending tasks</Text>}
            />
            <Text style={styles.statusTitle}>In Progress ({inProgressTasks.length})</Text>
            <FlatList
              data={inProgressTasks}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => <TaskCard task={item} color="#e3f2fd" />}
              ListEmptyComponent={<Text style={styles.emptyText}>No tasks in progress</Text>}
            />
            <Text style={styles.statusTitle}>Completed ({completedTasks.length})</Text>
            <FlatList
              data={completedTasks}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => <TaskCard task={item} color="#e8f5e9" />}
              ListEmptyComponent={<Text style={styles.emptyText}>No completed tasks</Text>}
            />
          </View>
        )}
        {/* Members Tab */}
        {tab === 1 && (
          <View>
            <Text style={styles.sectionTitle}>Garden Members</Text>
            {/* TODO: Replace with real members data */}
            <Text style={styles.emptyText}>Members list coming soon.</Text>
          </View>
        )}
        {/* Calendar Tab */}
        {tab === 2 && (
          <View style={{ alignItems: 'center', paddingVertical: 32 }}>
            <Ionicons name="calendar-outline" size={60} color={COLORS.primaryDark} style={{ opacity: 0.6 }} />
            <Text style={styles.sectionTitle}>Garden Calendar</Text>
            <Text style={styles.emptyText}>The calendar feature will be implemented in a future update.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function TaskCard({ task, color }) {
  return (
    <View style={[taskCardStyles.card, { backgroundColor: color }]}> 
      <Text style={taskCardStyles.title}>{task.title}</Text>
      <Text style={taskCardStyles.caption}>Due: {task.deadline}</Text>
      <View style={taskCardStyles.row}>
        <Text style={taskCardStyles.caption}>{task.assignee || 'Unassigned'}</Text>
        <TouchableOpacity>
          <Text style={taskCardStyles.details}>Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText: { color: COLORS.error, fontSize: 18, marginBottom: 16 },
  backButton: { backgroundColor: COLORS.primary, padding: 12, borderRadius: 8 },
  backButtonText: { color: COLORS.white, fontWeight: 'bold' },
  headerCard: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 12, margin: 16, overflow: 'hidden', elevation: 2 },
  headerImage: { width: 120, height: 120, backgroundColor: '#eee' },
  headerContent: { flex: 1, padding: 16, justifyContent: 'center' },
  gardenName: { fontSize: 22, fontWeight: 'bold', color: COLORS.primaryDark, marginBottom: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e9', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4, marginRight: 8, marginBottom: 4 },
  chipText: { marginLeft: 4, color: COLORS.primaryDark, fontSize: 13 },
  gardenDesc: { fontSize: 15, color: COLORS.text, marginBottom: 8 },
  tabsRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e0e0e0', marginHorizontal: 16, marginTop: 8 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabActive: { borderBottomWidth: 3, borderColor: COLORS.primaryDark },
  tabText: { fontSize: 16, color: COLORS.text },
  tabTextActive: { color: COLORS.primaryDark, fontWeight: 'bold' },
  tabContent: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primaryDark, marginBottom: 8 },
  statusTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.primary, marginTop: 16, marginBottom: 4 },
  emptyText: { color: COLORS.text, fontSize: 14, textAlign: 'center', marginVertical: 8 },
});

const taskCardStyles = StyleSheet.create({
  card: { borderRadius: 10, padding: 12, marginBottom: 10, elevation: 1 },
  title: { fontWeight: 'bold', fontSize: 15, color: COLORS.primaryDark },
  caption: { fontSize: 13, color: COLORS.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  details: { color: COLORS.primary, fontWeight: 'bold', fontSize: 13 },
}); 