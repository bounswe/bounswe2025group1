// File: app/tasks/task-detail.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { API_URL, COLORS } from '../../constants/Config';
import { useAuth } from '../../contexts/AuthContext';
import { Picker } from '@react-native-picker/picker';

export default function TaskDetailScreen() {
  const { taskId } = useLocalSearchParams();
  const { token, user } = useAuth();
  const [task, setTask] = useState(null);
  const [members, setMembers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [isManager, setIsManager] = useState(false);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    try {
      const res = await axios.get(`${API_URL}/tasks/${taskId}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setTask(res.data);
      

      // Fetch garden members
      const memberRes = await axios.get(`${API_URL}/memberships/?garden=${res.data.garden}`, {
        headers: { Authorization: `Token ${token}` },
      });
      const gardenId = res.data.garden;
      const accepted = memberRes.data.filter(m => m.status === 'ACCEPTED' && m.garden === gardenId);
      setMembers(accepted.filter(m => m.role === 'WORKER'));
      setIsManager(accepted.some(m => m.username === user.username && m.role === 'MANAGER'&& m.status ==='ACCEPTED'));
      setIsMember(accepted.some(m => m.username === user.username));
      
      
      
  

    } catch (err) {
      console.error('Error fetching task:', err);
    }
  };

  const handleAssign = async () => {

    if (!selectedWorker) {
      Alert.alert('Error', 'Please select a worker.');
      return;
    }

    try {
      
      await axios.post(`${API_URL}/tasks/${task.id}/assign/`, {
        user_id: selectedWorker,
        
      }, {
        headers: { Authorization: `Token ${token}` },
      });
      
      Alert.alert('Success', 'Task assigned.');
      fetchTask(); // Refresh the task data
    } catch (err) {
      console.error('Assign error:', err?.response?.data || err.message);
      Alert.alert('Error', 'Failed to assign task.');
    }
  };

  const handleAction = async (action) => {
    try {
      await axios.post(`${API_URL}/tasks/${task.id}/${action}/`, {}, {
        headers: { Authorization: `Token ${token}` },
      });
      Alert.alert('Success', `Task ${action}ed.`);
      fetchTask(); // Refresh
    } catch (err) {
      Alert.alert('Error', `Failed to ${action} task.`);
    }
  };
  const handleComplete = async () => {
    try {
     
      await axios.post(`${API_URL}/tasks/${task.id}/complete/`, {}, {
        headers: { Authorization: `Token ${token}` },
      });
      Alert.alert('Success', 'Task marked as completed.');
      fetchTask(); // refresh the data
    } catch (err) {
      console.error('Complete error:', err?.response?.data || err.message);
      Alert.alert('Error', 'Could not complete the task.');
    }
  };

  const handleSelfAssign = async () => {
    try {
      await axios.post(
        `${API_URL}/tasks/${task.id}/self-assign/`,
        {},
        { headers: { Authorization: `Token ${token}` } }
      );
      Alert.alert("Success", "You have been assigned to this task.");
      // Optionally: refresh task state or navigate back
      fetchTask(); 
    } catch (err) {
      console.error(err?.response?.data || err);
      Alert.alert("Error", "Could not assign task to yourself.");
    }
  };

  if (!task) {
    return <Text style={styles.loading}>Loading task...</Text>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{task.title}</Text>
      <Text style={styles.label}>Description:</Text>
      <Text style={styles.value}>{task.description || 'No description'}</Text>

      <Text style={styles.label}>Status:</Text>
      <Text style={styles.value}>{task.status}</Text>

      <Text style={styles.label}>Due Date:</Text>
      <Text style={styles.value}>{task.due_date?.split('T')[0]}</Text>

      <Text style={styles.label}>Assigned To:</Text>
      <Text style={styles.value}>{task.assigned_to_username || 'Unassigned'}</Text>

      <Text style={styles.label}>Assigned By:</Text>
      <Text style={styles.value}>{task.assigned_by_username}</Text>

      <Text style={styles.label}>Garden:</Text>
      <Text style={styles.value}>{task.garden_name}</Text>

      {task.custom_type_name && (
        <>
          <Text style={styles.label}>Task Type:</Text>
          <Text style={styles.value}>{task.custom_type_name}</Text>
        </>
      )}

      <Text style={styles.label}>Created At:</Text>
      <Text style={styles.value}>{task.created_at?.split('T')[0]}</Text>

      <Text style={styles.label}>Updated At:</Text>
      <Text style={styles.value}>{task.updated_at?.split('T')[0]}</Text>

      {/* Assignment by Manager */}
      {(isManager && (!task.assigned_to_username || task.status === 'DECLINED')) &&(
        <>
          <Text style={styles.label}>Assign to Worker:</Text>
          
          <Picker
            selectedValue={selectedWorker}
            onValueChange={setSelectedWorker}
            style={styles.picker}
          >
            <Picker.Item label="Select a worker" value="" />
            {members.map(member => (
              <Picker.Item key={member.id} label={`User ${member.username}`} value={member.user_id.toString()} />
            ))}
            
          </Picker>
          <TouchableOpacity style={styles.assignBtn} onPress={handleAssign}>
            <Text style={styles.assignText}>Assign Task</Text>
          </TouchableOpacity>
        </>
      )}
      
      {task.assigned_to === user.id && task.status === 'IN_PROGRESS' && (
        <TouchableOpacity style={styles.completeBtn} onPress={handleComplete}>
          <Text style={styles.completeText}>✓ Complete Task</Text>
        </TouchableOpacity>
      )}

      {/* Accept / Decline by Assignee */}
      {task.assigned_to === user.id && task.status === 'PENDING' && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAction('accept')}>
            <Text style={styles.btnText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.declineBtn} onPress={() => handleAction('decline')}>
            <Text style={styles.btnText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* self assign */}
      {(task.status === 'PENDING' || task.status === 'DECLINED') && isMember && !isManager && task.assigned_to != user.id &&(
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.acceptBtn} onPress={handleSelfAssign}>
            <Text style={styles.btnText}>Self Assign</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: COLORS.background },
  loading: { textAlign: 'center', marginTop: 40, fontSize: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.primaryDark, marginBottom: 16 },
  label: { marginTop: 10, fontWeight: 'bold', color: COLORS.primary },
  value: { fontSize: 15, marginBottom: 8, color: COLORS.text },
  picker: { backgroundColor: '#fff', marginVertical: 8 },
  assignBtn: { backgroundColor: COLORS.primary, padding: 12, borderRadius: 8, marginTop: 8 },
  assignText: { color: 'white', textAlign: 'center', fontWeight: 'bold' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
  acceptBtn: { backgroundColor: 'green', padding: 10, borderRadius: 6, flex: 1, marginRight: 8 },
  declineBtn: { backgroundColor: 'red', padding: 10, borderRadius: 6, flex: 1 },
  btnText: { color: 'white', textAlign: 'center', fontWeight: 'bold' },
  completeBtn: {backgroundColor: 'green', padding: 12, borderRadius: 8, marginTop: 12,},
  completeText: {color: 'white',fontWeight: 'bold',textAlign: 'center',},
});