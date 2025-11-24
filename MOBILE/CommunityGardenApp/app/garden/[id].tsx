// File: app/garden/[id].tsx

import React, { useEffect, useState, useCallback, useMemo, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Image, FlatList, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../../constants/Config';
import { useAccessibleColors } from '../../contexts/AccessibilityContextSimple';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { Calendar } from 'react-native-calendars';
import ImageGallery from '../../components/ui/ImageGallery';
import { COLORS } from '../../constants/Config';
import EventCard from '../../components/ui/EventCard';
import CreateEventModal from '../../components/ui/CreateEventModal';
import { GardenEvent, fetchEvents, deleteEvent, AttendanceStatus } from '../../services/event';

import { useTranslation } from 'react-i18next';

const TABS = [
  { key: 'Tasks', label: 'garden.detail.tabs.tasks' },
  { key: 'Members', label: 'garden.detail.tabs.members' },
  { key: 'Events', label: 'garden.detail.tabs.events' },
  { key: 'Calendar', label: 'garden.detail.tabs.calendar' },
  { key: 'Gallery', label: 'garden.detail.tabs.gallery' }
];

export default function GardenDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { token, user } = useAuth();
  const colors = useAccessibleColors();
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [garden, setGarden] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState<string | null>(null);
  const [tab, setTab] = useState(0);
  const [followingIds, setFollowingIds] = useState<number[]>([]);
  const [blockedIds, setBlockedIds] = useState<number[]>([]);
  const [events, setEvents] = useState<GardenEvent[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<GardenEvent | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 16 }}>
          <Text style={{ color: colors.white, fontWeight: 'bold' }}>{t('garden.detail.back')}</Text>
        </TouchableOpacity>
      ),
      headerTitle: t('garden.detail.title'),
    });
  }, [navigation, colors, t]);

  // ---------- Helper function to extract city from location ----------
  const getCityFromLocation = (location?: string): string | null => {
    if (!location) return null;
    // Extract city (part before the first comma, or the whole string if no comma)
    const city = location.split(',')[0].trim();
    return city || null;
  };

  // ---------- Data fetchers (top-level, before useFocusEffect) ----------
  const fetchGarden = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/gardens/${id}/`);
      setGarden(response.data);
      
      // Extract and log the city from garden location
      console.log('=== GARDEN LOCATION DEBUG ===');
      console.log('Full garden data:', JSON.stringify(response.data, null, 2));
      console.log('Garden location field:', response.data?.location);
      
      const city = getCityFromLocation(response.data?.location);
      if (city) {
        console.log('✅ Garden City:', city);
      } else {
        console.log('❌ Garden location not available or no city found');
        console.log('Location value:', response.data?.location);
      }
      console.log('=== END GARDEN LOCATION DEBUG ===');
    } catch (error) {
      console.error('Error fetching garden:', error);
      Alert.alert('Error', 'Could not load garden.');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  const fetchMembershipStatus = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/memberships/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const existing = res.data.find(
        (m: any) => m.garden === parseInt(id as string, 10) && m.username === user?.username
      );
      if (existing) setMembershipStatus(existing.status);
      else setMembershipStatus(null);
    } catch (err) {
      console.error('Membership status fetch error:', err);
    }
  }, [token, id, user?.username]);

  const fetchMembers = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/memberships/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const filtered = res.data.filter((m: any) => m.garden === parseInt(id as string, 10));
      setMembers(filtered);
    } catch (err) {
      console.error('Error fetching members:', err);
    }
  }, [token, id]);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/tasks/?garden=${id}`, {
        headers: { Authorization: `Token ${token}` },
      });
      setTasks(res.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  }, [id, token]);

  const fetchFollowing = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/profile/following/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setFollowingIds(res.data.map((u: any) => u.id));
    } catch (err) {
      setFollowingIds([]);
    }
  }, [token]);

  const fetchBlocked = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/profile/block/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setBlockedIds(res.data.map((u: any) => u.id));
    } catch (err) {
      setBlockedIds([]);
    }
  }, [token]);

  const fetchEventsData = useCallback(async () => {
    if (!token) return;
    try {
      const gardenId = parseInt(id as string, 10);
      const allEvents = await fetchEvents();
      // Filter events for this garden
      const gardenEvents = allEvents.filter(event => event.garden === gardenId);
      setEvents(gardenEvents);
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  }, [token, id]);

  // ---------- Effects ----------
  useEffect(() => {
    fetchGarden();
    fetchFollowing();
    fetchBlocked();
  }, [id, fetchGarden, fetchFollowing, fetchBlocked]);

  useFocusEffect(
    useCallback(() => {
      fetchMembershipStatus();
      fetchMembers();
      fetchTasks();
      fetchEventsData();
    }, [fetchMembershipStatus, fetchMembers, fetchTasks, fetchEventsData])
  );

  // ---------- Derived data ----------
  const { pendingTasks, inProgressTasks, completedTasks, markedDates, userIsManager } = useMemo(() => {
    const pending = tasks.filter(
      (task: any) => task.status === 'PENDING' || (task.status === 'DECLINED' && task.assigned_to !== user?.id)
    );
    const inProgress = tasks.filter((task: any) => task.status === 'IN_PROGRESS');
    const completed = tasks.filter((task: any) => task.status === 'COMPLETED');
    const calendarTasks = [...pending, ...inProgress, ...completed];
    const dates: Record<string, any> = {};

    const getDotColor = (task: any) => {
      if (task.status === 'COMPLETED') return 'red';
      if (task.status === 'IN_PROGRESS') return 'blue';
      if (task.status === 'PENDING') return 'green';
      return 'orange';
    };

    calendarTasks.forEach((task: any) => {
      const date = task.due_date?.split('T')[0];
      if (!date) return;
      dates[date] = {
        marked: true,
        dotColor: getDotColor(task),
      };
    });

    const isManager = members.some(
      (m: any) => m.username === user?.username && m.role === 'MANAGER' && m.status === 'ACCEPTED'
    );

    return {
      pendingTasks: pending,
      inProgressTasks: inProgress,
      completedTasks: completed,
      markedDates: dates,
      userIsManager: isManager,
    };
  }, [tasks, user?.id, user?.username, members]);

  // Memoized gallery images (top-level, not conditional)
  const galleryImages = useMemo(() => {
    const imageArray = garden?.images || garden?.gallery;
    if (Array.isArray(imageArray) && imageArray.length > 0) {
      return imageArray.map((img: any) => ({
        id: img.id,
        image_base64: img.image_base64,
      }));
    }
    return [];
  }, [garden?.images, garden?.gallery]);



  const getGardenImageSource = useCallback(() => {
    if (garden?.cover_image?.image_base64) {
      return { uri: garden.cover_image.image_base64 };
    }
    return { uri: 'https://via.placeholder.com/120x120/8bc34a/ffffff?text=Garden' };
  }, [garden?.cover_image?.image_base64]);

  // ---------- Actions ----------
  const handleFollow = async (userId: number) => {
    try {
      await axios.post(
        `${API_URL}/profile/follow/`,
        { user_id: userId },
        { headers: { Authorization: `Token ${token}` } }
      );
      setFollowingIds(prev => [...prev, userId]);
    } catch (err) {
      Alert.alert('Error', 'Could not follow user.');
    }
  };

  const handleUnfollow = async (userId: number) => {
    try {
      await axios.delete(`${API_URL}/profile/follow/`, {
        data: { user_id: Number(userId) },
        headers: { Authorization: `Token ${token}` },
      });
      setFollowingIds(prev => prev.filter(id => id !== userId));
    } catch (err) {
      Alert.alert('Error', 'Could not unfollow user.');
    }
  };

  const handleBlock = async (userId: number) => {
    try {
      await axios.post(
        `${API_URL}/profile/block/`,
        { user_id: userId },
        { headers: { Authorization: `Token ${token}` } }
      );
      setBlockedIds(prev => [...prev, userId]);
      setFollowingIds(prev => prev.filter(id => id !== userId));
      Alert.alert('Success', 'User has been blocked.');
    } catch (err: any) {
      if (err.response?.status === 400) {
        Alert.alert('Error', 'You cannot block yourself.');
      } else {
        Alert.alert('Error', 'Error blocking user.');
      }
    }
  };

  const handleUnblock = async (userId: number) => {
    try {
      await axios.delete(`${API_URL}/profile/block/`, {
        data: { user_id: Number(userId) },
        headers: { Authorization: `Token ${token}` },
      });
      setBlockedIds(prev => prev.filter(id => id !== userId));
      Alert.alert('Success', 'User has been unblocked.');
    } catch (err) {
      Alert.alert('Error', 'Error unblocking user.');
    }
  };

  const handleJoin = async () => {
    if (joining) return; // Prevent double-click

    setJoining(true);
    try {
      console.log('Sending join request for garden:', id);
      const response = await axios.post(
        `${API_URL}/memberships/`,
        {
          garden: parseInt(id as string, 10),
          role: 'WORKER',
          status: 'PENDING',
        },
        {
          headers: { Authorization: `Token ${token}` },
        }
      );
      console.log('Join request successful:', response.data);

      Alert.alert(
        'Success',
        'Join request sent! Waiting for manager approval.'
      );

      // Refresh state
      await fetchMembershipStatus();
      await fetchMembers();
      await fetchTasks();
    } catch (err: any) {
      console.error('Join request error:', err);
      console.error('Error response:', err?.response?.data);

      let errorMessage = t('garden.detail.joinRequestError') || 'Could not send join request';
      if (err?.response?.data) {
        // Handle specific error messages from backend
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        }
      }

      Alert.alert(
        t('common.error') || 'Error',
        errorMessage
      );
    } finally {
      setJoining(false);
    }
  };

  const handleMembershipAccept = async (membershipId: any) => {
    try {
      await axios.post(
        `${API_URL}/memberships/${membershipId}/accept/`,
        {},
        { headers: { Authorization: `Token ${token}` } }
      );
      fetchMembers();
    } catch (err: any) {
      console.error('Failed to accept member:', err?.response?.data || err);
      Alert.alert('Error', 'Could not accept membership.');
    }
  };
  if (loading || !garden) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color={COLORS.primary} />;
  }

  // ---------- Render ----------
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerCard, { backgroundColor: colors.surface }]}>
        <Image source={getGardenImageSource()} style={styles.headerImage} />
        <View style={styles.headerContent}>
          <Text style={[styles.gardenName, { color: colors.text }]}>{(garden as any).name}</Text>
          <View style={styles.chipRow}>
            <View style={[styles.chip, { backgroundColor: colors.secondary }]}>
              <Ionicons name="location-outline" size={16} color={colors.primary} />
              <Text style={[styles.chipText, { color: colors.text }]}>{(garden as any).location}</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: colors.secondary }]}>
              <Ionicons name="people-outline" size={16} color={colors.primary} />
              <Text style={[styles.chipText, { color: colors.text }]}>{members.filter(m => m.status === 'ACCEPTED').length} Members</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: colors.secondary }]}>
              <Ionicons name="list-outline" size={16} color={colors.primary} />
              <Text style={[styles.chipText, { color: colors.text }]}>{tasks.length} Tasks</Text>
            </View>
          </View>
          <Text style={[styles.gardenDesc, { color: colors.textSecondary }]}>{(garden as any).description}</Text>
          {membershipStatus && (
            <View style={[styles.statusBadge, {
              backgroundColor: membershipStatus === 'ACCEPTED' ? '#4CAF50' :
                              membershipStatus === 'PENDING' ? '#FFA500' : '#F44336'
            }]}>
              <Text style={[styles.statusText, { color: '#FFFFFF' }]}>
                {membershipStatus === 'PENDING'
                  ? 'Pending Approval'
                  : membershipStatus === 'ACCEPTED'
                  ? 'Member'
                  : `Status: ${membershipStatus}`}
              </Text>
            </View>
          )}
          {garden.is_public && !membershipStatus && (
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: joining ? colors.disabled : colors.primary }
              ]}
              onPress={handleJoin}
              disabled={joining}
            >
              <Text style={[styles.buttonText, { color: colors.white }]}>
                {joining ? t('garden.detail.sendingRequest') || 'Sending...' : t('garden.detail.joinGarden') || 'Join Garden'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={[styles.tabsRow, { borderColor: colors.border }]}>
        {TABS.map((tabItem, idx) => (
          <TouchableOpacity
            key={tabItem.key}
            style={[styles.tab, tab === idx && { borderBottomColor: colors.primary }]}
            onPress={() => setTab(idx)}
          >
            <Text style={[styles.tabText, {
              color: tab === idx ? colors.primary : colors.text,
              fontWeight: tab === idx ? 'bold' : 'normal'
            }]}>{t(tabItem.label)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.tabContent}>
        {tab === 0 && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('garden.detail.gardenTasks')}</Text>
            {membershipStatus === 'ACCEPTED' && userIsManager && (
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/tasks/create-task', params: { gardenId: id.toString() } })}
                style={{ backgroundColor: COLORS.primary, padding: 10, borderRadius: 8, marginBottom: 16 }}
              >
                <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>+ Create Task</Text>
              </TouchableOpacity>
            )}
            <Text style={[styles.statusTitle, { color: colors.primary }]}>{t('garden.detail.pending')} ({pendingTasks.length})</Text>
            <FlatList data={pendingTasks} keyExtractor={item => item.id.toString()} renderItem={({ item }) => <TaskCard task={item} color={colors.surface} />} />
            <Text style={[styles.statusTitle, { color: colors.primary }]}>{t('garden.detail.inProgress')} ({inProgressTasks.length})</Text>
            <FlatList data={inProgressTasks} keyExtractor={item => item.id.toString()} renderItem={({ item }) => <TaskCard task={item} color={colors.surface} />} />
            <Text style={[styles.statusTitle, { color: colors.primary }]}>{t('garden.detail.completed')} ({completedTasks.length})</Text>
            <FlatList data={completedTasks} keyExtractor={item => item.id.toString()} renderItem={({ item }) => <TaskCard task={item} color={colors.surface} />} />
          </View>
        )}

        {tab === 1 && (
          <View>
            <Text style={styles.sectionTitle}>Garden Members</Text>
            <FlatList
              data={members}
              keyExtractor={(item: any) => item.id.toString()}
              renderItem={({ item }: { item: any }) => (
                <View style={taskCardStyles.card}>
                  <Text style={taskCardStyles.title}>Username: {item.username}</Text>
                  <Text>Role: {item.role}</Text>
                  <Text>Status: {item.status}</Text>

                  {/* Follow/Unfollow and Block/Unblock button for each member except self */}
                  {user && String(item.user_id) !== String(user.id) && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                      {blockedIds.includes(Number(item.user_id)) ? (
                        <TouchableOpacity style={styles.unfollowButtonSmall} onPress={() => handleUnblock(Number(item.user_id))}>
                          <Text style={styles.unfollowButtonTextSmall}>Unblock</Text>
                        </TouchableOpacity>
                      ) : (
                        <>
                          {followingIds.includes(Number(item.user_id)) ? (
                            <TouchableOpacity style={styles.unfollowButtonSmall} onPress={() => handleUnfollow(Number(item.user_id))}>
                              <Text style={styles.unfollowButtonTextSmall}>Unfollow</Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity style={styles.followButtonSmall} onPress={() => handleFollow(Number(item.user_id))}>
                              <Text style={styles.followButtonTextSmall}>Follow</Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity style={styles.blockIconButton} onPress={() => handleBlock(Number(item.user_id))}>
                            <Text style={styles.blockIconText}>🚫</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  )}

                  {userIsManager && item.status === 'PENDING' && (
                    <View style={{ flexDirection: 'row', marginTop: 8, gap: 10 }}>
                      <TouchableOpacity
                        onPress={() => handleMembershipAccept(item.id)}
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
          <ScrollView>
            <View style={styles.eventsHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t('events.gardenEvents') || 'Garden Events'}
              </Text>
              {membershipStatus === 'ACCEPTED' && (
                <TouchableOpacity
                  style={[styles.createEventButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    setEditingEvent(null);
                    setShowEventModal(true);
                  }}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.createEventButtonText}>
                    {t('events.createEvent') || 'Create Event'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {events.length === 0 ? (
              <View style={styles.emptyEvents}>
                <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {t('events.noEvents') || 'No events scheduled'}
                </Text>
              </View>
            ) : (
              events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onVote={(eventId, status) => {
                    // Update local state after voting
                    setEvents(prev =>
                      prev.map(e =>
                        e.id === eventId
                          ? { ...e, my_attendance: status }
                          : e
                      )
                    );
                    fetchEventsData();
                  }}
                  canEdit={event.created_by === user?.id || userIsManager}
                  canDelete={event.created_by === user?.id || userIsManager}
                  onEdit={(event) => {
                    setEditingEvent(event);
                    setShowEventModal(true);
                  }}
                  onDelete={async (event) => {
                    Alert.alert(
                      t('common.confirm') || 'Confirm',
                      t('events.deleteConfirm') || 'Are you sure you want to delete this event?',
                      [
                        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
                        {
                          text: t('common.delete') || 'Delete',
                          style: 'destructive',
                          onPress: async () => {
                            try {
                              await deleteEvent(event.id);
                              fetchEventsData();
                              Alert.alert(
                                t('common.success') || 'Success',
                                t('events.deleteSuccess') || 'Event deleted'
                              );
                            } catch (error) {
                              Alert.alert(
                                t('common.error') || 'Error',
                                t('events.deleteError') || 'Failed to delete event'
                              );
                            }
                          },
                        },
                      ]
                    );
                  }}
                />
              ))
            )}

            <CreateEventModal
              visible={showEventModal}
              onClose={() => {
                setShowEventModal(false);
                setEditingEvent(null);
              }}
              onSuccess={() => {
                setShowEventModal(false);
                setEditingEvent(null);
                fetchEventsData();
              }}
              gardenId={parseInt(id as string, 10)}
              editEvent={editingEvent}
            />
          </ScrollView>
        )}

        {tab === 3 && (
          <View style={{ padding: 20 }}>
            <Calendar
              markedDates={markedDates}
              markingType={'dot'}
              onDayPress={(day: any) => {
                console.log('Selected day:', day.dateString);
              }}
              theme={{
                calendarBackground: colors.surface,
                textSectionTitleColor: colors.text,
                dayTextColor: colors.text,
                todayTextColor: colors.primary,
                selectedDayTextColor: colors.white,
                selectedDayBackgroundColor: colors.primary,
                arrowColor: colors.primary,
                monthTextColor: colors.text,
                indicatorColor: colors.primary,
                textDayFontWeight: '300',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '300',
                textDayFontSize: 16,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 13
              }}
            />
          </View>
        )}

        {tab === 4 && (
          <View>
            <Text style={styles.sectionTitle}>Garden Gallery</Text>
            {galleryImages.length > 0 ? (
              <ImageGallery
                images={galleryImages}
                coverImage={garden?.cover_image}
                showCoverBadge={false}
                maxColumns={2}
                imageHeight={150}
              />
            ) : (
              <View style={styles.emptyGallery}>
                <Ionicons name="image-outline" size={48} color={COLORS.secondary} />
                <Text style={styles.emptyText}>No gallery images yet</Text>
                <Text style={styles.emptySubtext}>
                  {userIsManager
                    ? 'Add images by editing the garden'
                    : 'Images will appear here when added by garden managers'}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

function TaskCard({ task, color }: { task: any; color: any }) {
  const router = useRouter();
  const colors = useAccessibleColors();
  return (
    <View style={[taskCardStyles.card, { backgroundColor: color }]}>
      <Text style={[taskCardStyles.title, { color: colors.text }]}>{task.title}</Text>
      <Text style={[taskCardStyles.caption, { color: colors.textSecondary }]}>Due: {task.due_date?.split('T')[0]}</Text>
      <View style={taskCardStyles.row}>
        <Text style={[taskCardStyles.caption, { color: colors.textSecondary }]}>{task.assigned_to_username || 'Unassigned'}</Text>
        <TouchableOpacity
          onPress={() =>
            router.push({ pathname: '/tasks/task-detail', params: { taskId: task.id.toString() } })
          }
        >
          <Text style={[taskCardStyles.details, { color: colors.primary }]}>Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerCard: { flexDirection: 'row', borderRadius: 12, margin: 16, overflow: 'hidden', elevation: 2 },
  headerImage: { width: 120, height: 120, backgroundColor: '#eee' },
  headerContent: { flex: 1, padding: 16 },
  gardenName: { fontSize: 22, fontWeight: 'bold' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4, marginRight: 8 },
  chipText: { marginLeft: 4, fontSize: 13 },
  gardenDesc: { fontSize: 15, marginVertical: 6 },
  status: { fontSize: 14, marginBottom: 8 },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  button: { padding: 10, borderRadius: 8, marginTop: 10 },
  buttonText: { fontWeight: 'bold' },
  tabsRow: { flexDirection: 'row', borderBottomWidth: 1, marginHorizontal: 16, marginTop: 8 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabActive: { borderBottomWidth: 3 },
  tabText: { fontSize: 16 },
  tabTextActive: { fontWeight: 'bold' },
  tabContent: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  statusTitle: { fontSize: 15, fontWeight: 'bold', marginTop: 16, marginBottom: 4 },
  emptyText: { fontSize: 14, textAlign: 'center', marginVertical: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText: { fontSize: 18, marginBottom: 16 },
  backButton: { padding: 12, borderRadius: 8 },
  backButtonText: { fontWeight: 'bold' },
  unfollowButtonSmall: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  unfollowButtonTextSmall: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  followButtonSmall: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  followButtonTextSmall: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  blockIconButton: {
    padding: 8,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
  },
  blockIconText: { fontSize: 18, color: '#d00', fontWeight: 'bold' },
  emptyGallery: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32,
    backgroundColor: COLORS.background, borderRadius: 12, margin: 16,
    borderWidth: 2, borderColor: COLORS.secondary, borderStyle: 'dashed',
  },
  emptySubtext: { fontSize: 14, color: COLORS.text, textAlign: 'center', marginTop: 8, opacity: 0.7 },
  eventsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  createEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  createEventButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 4,
  },
  emptyEvents: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
});

const taskCardStyles = StyleSheet.create({
  card: { borderRadius: 10, padding: 12, marginBottom: 10, elevation: 1 },
  title: { fontWeight: 'bold', fontSize: 15 },
  caption: { fontSize: 13 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  details: { fontWeight: 'bold', fontSize: 13 },
});
