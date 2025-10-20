// File: app/tasks/task-detail.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../../constants/Config';
import { useAuth } from '../../contexts/AuthContext';
import { useAccessibleColors } from '../../contexts/AccessibilityContextSimple';
import { Picker } from '@react-native-picker/picker';
import { useTranslation } from 'react-i18next';

export default function TaskDetailScreen() {
  const { taskId } = useLocalSearchParams();
  const { token, user } = useAuth();
  const colors = useAccessibleColors();
  const { t } = useTranslation();
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
    return <Text style={[styles.loading, { color: colors.text }]}>{t('tasks.detail.loading')}</Text>;
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{task.title}</Text>
      <Text style={[styles.label, { color: colors.text }]}>{t('tasks.detail.description')}:</Text>
      <Text style={[styles.value, { color: colors.textSecondary }]}>{task.description || 'No description'}</Text>

      <Text style={[styles.label, { color: colors.text }]}>{t('tasks.detail.status')}:</Text>
      <Text style={[styles.value, { color: colors.textSecondary }]}>{task.status}</Text>

      <Text style={[styles.label, { color: colors.text }]}>{t('tasks.detail.dueDate')}:</Text>
      <Text style={[styles.value, { color: colors.textSecondary }]}>{task.due_date?.split('T')[0]}</Text>

      <Text style={[styles.label, { color: colors.text }]}>{t('tasks.detail.assignedTo')}:</Text>
      <Text style={[styles.value, { color: colors.textSecondary }]}>{task.assigned_to_username || 'Unassigned'}</Text>

      <Text style={[styles.label, { color: colors.text }]}>Assigned By:</Text>
      <Text style={[styles.value, { color: colors.textSecondary }]}>{task.assigned_by_username}</Text>

      <Text style={[styles.label, { color: colors.text }]}>{t('tasks.detail.garden')}:</Text>
      <Text style={[styles.value, { color: colors.textSecondary }]}>{task.garden_name}</Text>

      {task.custom_type_name && (
        <>
          <Text style={[styles.label, { color: colors.text }]}>Task Type:</Text>
          <Text style={[styles.value, { color: colors.textSecondary }]}>{task.custom_type_name}</Text>
        </>
      )}

      <Text style={[styles.label, { color: colors.text }]}>Created At:</Text>
      <Text style={[styles.value, { color: colors.textSecondary }]}>{task.created_at?.split('T')[0]}</Text>

      <Text style={[styles.label, { color: colors.text }]}>Updated At:</Text>
      <Text style={[styles.value, { color: colors.textSecondary }]}>{task.updated_at?.split('T')[0]}</Text>

      {/* Assignment by Manager */}
      {(isManager && (!task.assigned_to_username || task.status === 'DECLINED')) &&(
        <>
          <Text style={[styles.label, { color: colors.text }]}>Assign to Worker:</Text>
          
          <Picker
            selectedValue={selectedWorker}
            onValueChange={setSelectedWorker}
            style={[styles.picker, { backgroundColor: colors.surface }]}
          >
            <Picker.Item label="Select a worker" value="" color={colors.text} />
            {members.map(member => (
              <Picker.Item key={member.id} label={`User ${member.username}`} value={member.user_id.toString()} color={colors.text} />
            ))}
            
          </Picker>
          <TouchableOpacity style={[styles.assignBtn, { backgroundColor: colors.primary }]} onPress={handleAssign}>
            <Text style={[styles.assignText, { color: colors.white }]}>{t('tasks.detail.assignTask')}</Text>
          </TouchableOpacity>
        </>
      )}
      
      {task.assigned_to === user.id && task.status === 'IN_PROGRESS' && (
        <TouchableOpacity style={[styles.completeBtn, { backgroundColor: colors.success }]} onPress={handleComplete}>
          <Text style={[styles.completeText, { color: colors.white }]}>✓ {t('tasks.detail.completeTask')}</Text>
        </TouchableOpacity>
      )}

      {/* Accept / Decline by Assignee */}
      {task.assigned_to === user.id && task.status === 'PENDING' && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.acceptBtn, { backgroundColor: colors.success }]} onPress={() => handleAction('accept')}>
            <Text style={[styles.btnText, { color: colors.white }]}>{t('tasks.detail.acceptTask')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.declineBtn, { backgroundColor: colors.error }]} onPress={() => handleAction('decline')}>
            <Text style={[styles.btnText, { color: colors.white }]}>{t('tasks.detail.declineTask')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* self assign */}
      {(task.status === 'PENDING' || task.status === 'DECLINED') && isMember && !isManager && task.assigned_to != user.id &&(
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.acceptBtn, { backgroundColor: colors.success }]} onPress={handleSelfAssign}>
            <Text style={[styles.btnText, { color: colors.white }]}>{t('tasks.detail.selfAssign')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  loading: { textAlign: 'center', marginTop: 40, fontSize: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  label: { marginTop: 10, fontWeight: 'bold' },
  value: { fontSize: 15, marginBottom: 8 },
  picker: { marginVertical: 8 },
  assignBtn: { padding: 12, borderRadius: 8, marginTop: 8 },
  assignText: { textAlign: 'center', fontWeight: 'bold' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
  acceptBtn: { padding: 10, borderRadius: 6, flex: 1, marginRight: 8 },
  declineBtn: { padding: 10, borderRadius: 6, flex: 1 },
  btnText: { textAlign: 'center', fontWeight: 'bold' },
  completeBtn: { padding: 12, borderRadius: 8, marginTop: 12 },
  completeText: { fontWeight: 'bold', textAlign: 'center' },
});