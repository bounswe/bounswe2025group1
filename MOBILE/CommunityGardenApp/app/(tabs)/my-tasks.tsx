import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { API_URL, COLORS } from '../../constants/Config';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
export default function MyTasksScreen() {
  const { token, user } = useAuth();
  const [groupedTasks, setGroupedTasks] = useState([]);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const fetchTasksByGarden = async () => {
        try {
          const profileRes = await axios.get(`${API_URL}/profile/`, {
            headers: { Authorization: `Token ${token}` },
          });
  
          const memberRes = await axios.get(`${API_URL}/memberships/`, {
            headers: { Authorization: `Token ${token}` },
          });
  
          const acceptedGardenIds = memberRes.data
            .filter(m => m.status === 'ACCEPTED' && m.username === profileRes.data.username)
            .map(m => m.garden);
  
          const tasksByGarden = [];
  
          for (const garden of acceptedGardenIds) {
            try {
              const taskRes = await axios.get(`${API_URL}/tasks/?garden=${garden}`, {
                headers: { Authorization: `Token ${token}` },
              });
  
              const acceptedTasks = taskRes.data.filter(
                task =>
                  task.assigned_to === profileRes.data.id &&
                  task.status === 'IN_PROGRESS'
              );
  
              if (acceptedTasks.length > 0) {
                tasksByGarden.push({
                  gardenId: garden,
                  gardenName: acceptedTasks[0].garden_name,
                  tasks: acceptedTasks,
                });
              }
            } catch (error) {
              console.warn(`Failed to fetch tasks for garden ${garden}:`, error);
            }
          }
  
          setGroupedTasks(tasksByGarden);
        } catch (err) {
          console.error('Error fetching user tasks:', err);
        }
      };
  
      fetchTasksByGarden();
    }, [token])
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>My Tasks</Text>
      <ScrollView>
        {groupedTasks.map(group => (
          <View key={group.gardenId} style={styles.gardenSection}>
            <Text style={styles.gardenHeader}>{group.gardenName}</Text>
            {group.tasks.map(task => (
              <TouchableOpacity
                key={task.id}
                style={styles.card}
                onPress={() => router.push(`/tasks/task-detail?taskId=${task.id}`)}
              >
                <Text style={styles.title}>{task.title}</Text>
                <Text style={styles.status}>Status: {task.status}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        {groupedTasks.length === 0 && (
          <Text style={{ marginTop: 20, textAlign: 'center', color: COLORS.text }}>
            You don't have any assigned tasks.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, backgroundColor: COLORS.background },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  gardenSection: { marginBottom: 24 },
  gardenHeader: { fontSize: 18, fontWeight: 'bold', color: COLORS.primaryDark, marginBottom: 8 },
  card: {
    backgroundColor: '#f0f4f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  title: { fontSize: 16, fontWeight: 'bold' },
  status: { fontSize: 14, color: COLORS.primaryDark },
});