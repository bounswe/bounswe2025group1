import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, FlatList, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../../constants/Config';
import { useAccessibleColors } from '../../contexts/AccessibilityContextSimple';
import { useAuth } from '../../contexts/AuthContext';
import { Platform } from 'react-native'; 

export default function CreateTaskScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const gardenId = params?.gardenId;
  console.log('gardenId from route params:', gardenId);
  const { token } = useAuth();
  const colors = useAccessibleColors();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [assignedTo, setAssignedTo] = useState<number | null>(null);
  const [assignedToUsername, setAssignedToUsername] = useState<string>('Unassigned');
  const [members, setMembers] = useState<Array<{ id: number; username: string }>>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!gardenId) return;

      setLoadingMembers(true);
      try {
        const response = await axios.get(`${API_URL}/gardens/${gardenId}/members/`, {
          headers: { Authorization: `Token ${token}` },
        });

        // Extract user information from memberships
        const membersList = response.data
          .filter((membership: any) => membership.status === 'ACCEPTED')
          .map((membership: any) => ({
            // GardenMembershipSerializer exposes user_id (not user) for the member
            id: membership.user_id,
            username: membership.username,
          }));

        setMembers(membersList);
      } catch (err) {
        console.error('Failed to fetch garden members:', err);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchMembers();
  }, [gardenId, token]);

  const handleCreateTask = async () => {
    if (!title || !description || !dueDate) {
      Alert.alert('Missing info', 'Please fill all fields.');
      return;
    }
    const payload = {
        garden: gardenId,
        title,
        description,
        due_date: dueDate.toISOString(),
        assigned_to: assignedTo,
    };

    console.log('Creating task with payload:', payload);
    try {
      await axios.post(`${API_URL}/tasks/`, payload, {
        headers: { Authorization: `Token ${token}` },
      });

      Alert.alert('Success', 'Task created successfully!');
      router.back();
    } catch (err) {
        console.error('Task creation failed FULL:', err);
        console.log('err.response:', err.response);
        console.log('err.response.data:', err.response?.data);
        console.log('err.message:', err.message);

        Alert.alert(
            'Error',
            err?.response?.data
            ? JSON.stringify(err.response.data)
            : `No error data\nStatus: ${err?.response?.status}\nMessage: ${err.message}`
        );
          
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.label, { color: colors.text }]}>Title</Text>
      <TextInput 
        value={title} 
        onChangeText={setTitle} 
        style={[styles.input, { 
          backgroundColor: colors.surface,
          borderColor: colors.border,
          color: colors.text 
        }]} 
        placeholderTextColor={colors.textSecondary}
      />

      <Text style={[styles.label, { color: colors.text }]}>Description</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        style={[styles.input, {
          height: 100,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          color: colors.text
        }]}
        multiline
        placeholderTextColor={colors.textSecondary}
      />

      <Text style={[styles.label, { color: colors.text }]}>Assign To (Optional)</Text>
      <TouchableOpacity
        onPress={() => setShowMemberModal(true)}
        style={[styles.memberButton, {
          backgroundColor: colors.surface,
          borderColor: colors.border
        }]}
        disabled={loadingMembers}
      >
        {loadingMembers ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={{ color: colors.text }}>{assignedToUsername}</Text>
        )}
      </TouchableOpacity>

        <Text style={[styles.label, { color: colors.text }]}>Due Date</Text>

        {Platform.OS === 'web' ? (
        <TextInput
            value={dueDate.toISOString().substring(0, 10)} // Format as YYYY-MM-DD
            onChangeText={(text) => {
            const parsed = new Date(text);
            if (!isNaN(parsed.getTime())) setDueDate(parsed);
            }}
            placeholder="YYYY-MM-DD"
            style={[styles.input, { 
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.text 
            }]}
            placeholderTextColor={colors.textSecondary}
        />
        ) : (
        <>
            <TouchableOpacity 
              onPress={() => setShowDatePicker(true)} 
              style={[styles.dateButton, { 
                backgroundColor: colors.surface,
                borderColor: colors.border 
              }]}
            >
            <Text style={{ color: colors.text }}>{dueDate.toDateString()}</Text>
            </TouchableOpacity>

            {showDatePicker && (
            <DateTimePicker
                value={dueDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setDueDate(selectedDate);
                }}
            />
            )}
        </>
        )}
      <TouchableOpacity
        onPress={handleCreateTask}
        style={[styles.createButton, { backgroundColor: colors.primary }]}
      >
        <Text style={[styles.createButtonText, { color: colors.white }]}>Create Task</Text>
      </TouchableOpacity>

      {/* Member Selection Modal */}
      <Modal
        visible={showMemberModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMemberModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Member</Text>
              <TouchableOpacity onPress={() => setShowMemberModal(false)}>
                <Text style={[styles.modalClose, { color: colors.primary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={[{ id: null, username: 'Unassigned' }, ...members]}
              keyExtractor={(item, index) => item.id?.toString() || `unassigned-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.memberItem,
                    {
                      backgroundColor: colors.surface,
                      borderColor: assignedTo === item.id ? colors.primary : colors.border,
                      borderWidth: assignedTo === item.id ? 2 : 1,
                    }
                  ]}
                  onPress={() => {
                    setAssignedTo(item.id);
                    setAssignedToUsername(item.username);
                    setShowMemberModal(false);
                  }}
                >
                  <Text style={[styles.memberName, { color: colors.text }]}>
                    {item.username}
                  </Text>
                  {assignedTo === item.id && (
                    <Text style={{ color: colors.primary, fontSize: 18 }}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  label: { fontWeight: 'bold', marginTop: 16, marginBottom: 4 },
  input: { borderRadius: 8, padding: 10, borderWidth: 1 },
  memberButton: { padding: 10, borderRadius: 8, marginTop: 4, borderWidth: 1 },
  dateButton: { padding: 10, borderRadius: 8, marginTop: 4, borderWidth: 1 },
  createButton: { marginTop: 20, padding: 14, borderRadius: 8 },
  createButtonText: { fontWeight: 'bold', textAlign: 'center' },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalClose: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  memberName: {
    fontSize: 16,
  },
});
