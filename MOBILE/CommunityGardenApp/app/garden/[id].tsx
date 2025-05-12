// File: app/garden/[id].tsx

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Image, FlatList, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL, COLORS } from '../../constants/Config';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { Picker } from '@react-native-picker/picker';
import { Calendar } from 'react-native-calendars';
const TABS = ['Tasks', 'Members', 'Calendar'];

export default function GardenDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { token, user } = useAuth();

  const [garden, setGarden] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState(null);
  const [tab, setTab] = useState(0);
  const navigation = useNavigation();



  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Garden Detail' });
  }, []);

  useEffect(() => {
    fetchGarden();
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      fetchMembershipStatus();
      fetchMembers();
      fetchTasks();
    }, [])
  );

  const fetchGarden = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/gardens/${id}/`);
      setGarden(response.data);
    } catch (error) {
      console.error('Error fetching garden:', error);
      Alert.alert('Error', 'Could not load garden.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const fetchMembershipStatus = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/memberships/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const existing = res.data.find(m => m.garden === parseInt(id) && m.username === user?.username);
      if (existing) setMembershipStatus(existing.status);
    } catch (err) {
      console.error('Membership status fetch error:', err);
    }
  };

  const fetchMembers = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/memberships/`, {
        headers: { Authorization: `Token ${token}` },
      });
      
      const filtered = res.data.filter(m => m.garden === parseInt(id));

      setMembers(filtered);
    } catch (err) {
      console.error('Error fetching members:', err);
    }
  };
  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API_URL}/tasks/?garden=${id}`, {
        headers: { Authorization: `Token ${token}` },
      });
      setTasks(res.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };
  const handleJoin = async () => {
    try {

      await axios.post(
        `${API_URL}/memberships/`,
        {
          garden: id,
          role: 'WORKER',
          status: 'PENDING',
        },
        {
          headers: { Authorization: `Token ${token}` },
        }
      );
  
      alert('Join request sent!');
      fetchMembershipStatus();
      fetchMembers();
      fetchTasks(); // optional
    } catch (err) {
      // console.error('Join error:', err.response?.data || err.message || err);
      alert('Could not send join request');
    }
  };

  
  const pendingTasks = tasks.filter(task => task.status === 'PENDING'|| (task.status === 'DECLINED' && task.assigned_to !== user.id) );
  const inProgressTasks = tasks.filter(task => task.status === 'IN_PROGRESS');
  const completedTasks = tasks.filter(task => task.status === 'COMPLETED');
  const calendarTasks = [...pendingTasks, ...inProgressTasks, ...completedTasks];
  const markedDates = {};
  const getDotColor = (task) => {
    if (task.status === 'COMPLETED') return 'red';
    if (task.status === 'IN_PROGRESS') return 'blue';
    if (task.status === 'PENDING') return 'green'; // not assigned yet
    return 'orange'; // fallback for other pending/declined cases
  };

  calendarTasks.forEach(task => {
    const date = task.due_date.split('T')[0];
    markedDates[date] = {
      marked: true,
      dotColor: getDotColor(task),
    };
  });

  if (loading || !garden) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color={COLORS.primary} />;
  }
  const userIsManager = members.some(m => m.username === user?.username && m.role === 'MANAGER' && m.status === 'ACCEPTED');
  
  const handleMembershipAccept = async (membershipId) => {
    try {
      await axios.post(
        `${API_URL}/memberships/${membershipId}/accept/`,
        {},
        { headers: { Authorization: `Token ${token}` } }
      );
      // Re-fetch the updated members list
      fetchMembers();
    } catch (err) {
      console.error('Failed to accept member:', err?.response?.data || err);
      Alert.alert('Error', 'Could not accept membership.');
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <Image source={{ uri: garden.image }} style={styles.headerImage} />
        <View style={styles.headerContent}>
          <Text style={styles.gardenName}>{garden.name}</Text>
          <View style={styles.chipRow}>
            <View style={styles.chip}><Ionicons name="location-outline" size={16} color={COLORS.primaryDark} /><Text style={styles.chipText}>{garden.location}</Text></View>
            <View style={styles.chip}><Ionicons name="people-outline" size={16} color={COLORS.primaryDark} /><Text style={styles.chipText}>{members.filter(m => m.status === 'ACCEPTED').length} Members</Text></View>
            <View style={styles.chip}><Ionicons name="list-outline" size={16} color={COLORS.primaryDark} /><Text style={styles.chipText}>{tasks.length} Tasks</Text></View>
          </View>
          <Text style={styles.gardenDesc}>{garden.description}</Text>
          {membershipStatus && <Text style={styles.status}>Membership Status: {membershipStatus}</Text>}
          {garden.is_public && !membershipStatus && (
            <TouchableOpacity style={styles.button} onPress={handleJoin} disabled={joining}>
              <Text style={styles.buttonText}>{joining ? 'Sending Request...' : 'Join Garden'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

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

      <View style={styles.tabContent}>
        {tab === 0 && (
          <View>
            <Text style={styles.sectionTitle}>Garden Tasks</Text>
            {membershipStatus === 'ACCEPTED' && userIsManager && (
            <TouchableOpacity
                onPress={() => router.push({ pathname: '/tasks/create-task', params: { gardenId: id.toString() } })}
                style={{ backgroundColor: COLORS.primary, padding: 10, borderRadius: 8, marginBottom: 16 }}
            >
                <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>+ Create Task</Text>
            </TouchableOpacity>
            )}
            <Text style={styles.statusTitle}>Pending ({pendingTasks.length})</Text>
            <FlatList data={pendingTasks} keyExtractor={item => item.id.toString()} renderItem={({ item }) => <TaskCard task={item} color="#fff9c4" />} />
            <Text style={styles.statusTitle}>In Progress ({inProgressTasks.length})</Text>
            <FlatList data={inProgressTasks} keyExtractor={item => item.id.toString()} renderItem={({ item }) => <TaskCard task={item} color="#e3f2fd" />} />
            <Text style={styles.statusTitle}>Completed ({completedTasks.length})</Text>
            <FlatList data={completedTasks} keyExtractor={item => item.id.toString()} renderItem={({ item }) => <TaskCard task={item} color="#e8f5e9" />} />
          </View>
        )}
        {tab === 1 && (
        <View>
            <Text style={styles.sectionTitle}>Garden Members</Text>
            <FlatList
            data={members}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
                <View style={taskCardStyles.card}>
                <Text style={taskCardStyles.title}>Username: {item.username}</Text>
                <Text>Role: {item.role}</Text>
                <Text>Status: {item.status}</Text>

                {/* Show buttons only if current user is manager AND item is pending */}
                {userIsManager && item.status === 'PENDING' && (
                    <View style={{ flexDirection: 'row', marginTop: 8, gap: 10 }}>
                    <TouchableOpacity
                        onPress={() => handleMembershipAccept(item.id, 'ACCEPTED')}
                        style={{ backgroundColor: 'green', padding: 6, borderRadius: 4 }}
                    >
                        <Text style={{ color: 'white' }}>Accept</Text>
                    </TouchableOpacity>
                    </View>
                )}
                </View>
            )}
            />
        </View>
        )}
        {tab === 2 && (
          <View style={{ padding: 20 }}>
            <Calendar
              markedDates={markedDates}
              markingType={'dot'}
              onDayPress={(day) => {
                console.log('Selected day:', day.dateString);
                // Optional: show a modal or filtered task list here
              }}
              theme={{
                calendarBackground: '#fff',
                todayTextColor: COLORS.primary,
                arrowColor: COLORS.primaryDark,
                dotColor: COLORS.primaryDark,
              }}
            />
          </View>
        )}
      </View>
    </View>
  );
}

function TaskCard({ task, color }) {
    const router = useRouter();  // ← add this line inside TaskCard
  
    return (
      <View style={[taskCardStyles.card, { backgroundColor: color }]}>
        <Text style={taskCardStyles.title}>{task.title}</Text>
        <Text style={taskCardStyles.caption}>Due: {task.due_date?.split('T')[0]}</Text>
        <View style={taskCardStyles.row}>
          <Text style={taskCardStyles.caption}>{task.assigned_to_username || 'Unassigned'}</Text>
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/tasks/task-detail', params: { taskId: task.id.toString() } })}
          >
            <Text style={taskCardStyles.details}>Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerCard: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 12, margin: 16, overflow: 'hidden', elevation: 2 },
  headerImage: { width: 120, height: 120, backgroundColor: '#eee' },
  headerContent: { flex: 1, padding: 16 },
  gardenName: { fontSize: 22, fontWeight: 'bold', color: COLORS.primaryDark },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e9', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4, marginRight: 8 },
  chipText: { marginLeft: 4, color: COLORS.primaryDark, fontSize: 13 },
  gardenDesc: { fontSize: 15, color: COLORS.text, marginVertical: 6 },
  status: { color: COLORS.primaryDark, fontSize: 14, marginBottom: 8 },
  button: { backgroundColor: COLORS.primary, padding: 10, borderRadius: 8, marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  tabsRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e0e0e0', marginHorizontal: 16, marginTop: 8 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabActive: { borderBottomWidth: 3, borderColor: COLORS.primaryDark },
  tabText: { fontSize: 16, color: COLORS.text },
  tabTextActive: { color: COLORS.primaryDark, fontWeight: 'bold' },
  tabContent: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primaryDark, marginBottom: 8 },
  statusTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.primary, marginTop: 16, marginBottom: 4 },
  emptyText: { color: COLORS.text, fontSize: 14, textAlign: 'center', marginVertical: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText: { color: COLORS.error, fontSize: 18, marginBottom: 16 },
  backButton: { backgroundColor: COLORS.primary, padding: 12, borderRadius: 8 },
  backButtonText: { color: COLORS.white, fontWeight: 'bold' },
});

const taskCardStyles = StyleSheet.create({
  card: { borderRadius: 10, padding: 12, marginBottom: 10, elevation: 1 },
  title: { fontWeight: 'bold', fontSize: 15, color: COLORS.primaryDark },
  caption: { fontSize: 13, color: COLORS.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  details: { color: COLORS.primary, fontWeight: 'bold', fontSize: 13 },
});
