import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL, COLORS } from '../../constants/Config';
import { useAuth } from '../../contexts/AuthContext';
import { Platform } from 'react-native'; 

export default function CreateTaskScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const gardenId = params?.gardenId;
  console.log('gardenId from route params:', gardenId);
  const { token } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

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
    };
    
    console.log('Creating task with payload:', payload);
    try {
      await axios.post(`${API_URL}/tasks/`, {
        garden: gardenId,
        title,
        description,
        due_date: dueDate.toISOString(),
      }, {
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
    <View style={styles.container}>
      <Text style={styles.label}>Title</Text>
      <TextInput value={title} onChangeText={setTitle} style={styles.input} />

      <Text style={styles.label}>Description</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        style={[styles.input, { height: 100 }]}
        multiline
      />

        <Text style={styles.label}>Due Date</Text>

        {Platform.OS === 'web' ? (
        <TextInput
            value={dueDate.toISOString().substring(0, 10)} // Format as YYYY-MM-DD
            onChangeText={(text) => {
            const parsed = new Date(text);
            if (!isNaN(parsed.getTime())) setDueDate(parsed);
            }}
            placeholder="YYYY-MM-DD"
            style={styles.input}
        />
        ) : (
        <>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
            <Text>{dueDate.toDateString()}</Text>
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
      <TouchableOpacity onPress={handleCreateTask} style={styles.createButton}>
        <Text style={styles.createButtonText}>Create Task</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
  label: { fontWeight: 'bold', marginTop: 16, marginBottom: 4, color: COLORS.primaryDark },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 10 },
  dateButton: { padding: 10, backgroundColor: '#eee', borderRadius: 8, marginTop: 4 },
  createButton: { marginTop: 20, backgroundColor: '#2196F3', padding: 14, borderRadius: 8 },
  createButtonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
});
