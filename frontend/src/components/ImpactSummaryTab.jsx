import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    CircularProgress,
    Divider,
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import YardIcon from '@mui/icons-material/Yard';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import ForumIcon from '@mui/icons-material/Forum';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import StarIcon from '@mui/icons-material/Star';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContextUtils';

const StatCard = ({ icon, label, value, subValue }) => (
    <Paper
        elevation={2}
        sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            height: '100%',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
            },
        }}
    >
        <Box sx={{ color: 'primary.main', mb: 1 }}>{icon}</Box>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
            {label}
        </Typography>
        {subValue && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 'auto', fontStyle: 'italic' }}>
                {subValue}
            </Typography>
        )}
    </Paper>
);

const SectionHeader = ({ title, icon }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 3 }}>
        <Box sx={{ color: 'primary.main', mr: 1 }}>{icon}</Box>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
        </Typography>
    </Box>
);

const ImpactSummaryTab = ({ userId }) => {
    const { t } = useTranslation();
    const { token } = useAuth();
    const [impactData, setImpactData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchImpactSummary = async () => {
            if (!token || !userId) return;

            setLoading(true);
            setError(null);

            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/user/${userId}/impact-summary/`,
                    {
                        headers: {
                            Authorization: `Token ${token}`,
                        },
                    }
                );

                if (!response.ok) {
                    if (response.status === 403) {
                        setError(t('profile.impactSummaryBlocked'));
                    } else if (response.status === 404) {
                        setError(t('profile.userNotFound'));
                    } else {
                        setError(t('profile.noDataAvailable'));
                    }
                    return;
                }

                const data = await response.json();
                setImpactData(data);
            } catch (err) {
                console.error('Error fetching impact summary:', err);
                setError(t('profile.noDataAvailable'));
            } finally {
                setLoading(false);
            }
        };

        fetchImpactSummary();
    }, [token, userId, t]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box textAlign="center" py={4}>
                <Typography color="text.secondary">{error}</Typography>
            </Box>
        );
    }

    if (!impactData) {
        return (
            <Box textAlign="center" py={4}>
                <Typography color="text.secondary">{t('profile.noDataAvailable')}</Typography>
            </Box>
        );
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatResponseTime = (hours) => {
        if (hours === null || hours === undefined) return '-';
        if (hours < 1) {
            const value = Math.round(hours * 60);
            return <span style={{ display: 'inline-flex', alignItems: 'center', flexDirection: 'column' }}>{value}<span style={{ fontSize: '0.5em' }}>{t('profile.minutes')}</span></span>;
        }
        if (hours < 24) {
            const value = hours.toFixed(1);
            return <span style={{ display: 'inline-flex', alignItems: 'center', flexDirection: 'column' }}>{value}<span style={{ fontSize: '0.5em' }}>{t('profile.hours')}</span></span>;
        }
        const value = (hours / 24).toFixed(1);
        return <span style={{ display: 'inline-flex', alignItems: 'center', flexDirection: 'column' }}>{value}<span style={{ fontSize: '0.5em' }}>{t('profile.days')}</span></span>;
    };

    return (
        <Box sx={{ py: 2 }}>
            {/* Garden Activity & Events - Combined Row */}
            <Grid container spacing={2}>
                {/* Garden Activity */}
                <Grid item size={{ xs: 12, md: 6 }}>
                    <SectionHeader title={t('profile.gardens')} icon={<YardIcon />} />
                    <Grid container spacing={2}>
                        <Grid item size={{ xs: 6 }}>
                            <StatCard
                                icon={<YardIcon fontSize="large" />}
                                label={t('profile.gardensJoined')}
                                value={impactData.gardens_joined}
                            />
                        </Grid>
                        <Grid item size={{ xs: 6 }}>
                            <StatCard
                                icon={<YardIcon fontSize="large" />}
                                label={t('profile.gardensManaged')}
                                value={impactData.gardens_managed}
                            />
                        </Grid>
                    </Grid>
                </Grid>

                {/* Events */}
                <Grid item size={{ xs: 12, md: 6 }}>
                    <SectionHeader title={t('gardens.eventsTab')} icon={<EventIcon />} />
                    <Grid container spacing={2}>
                        <Grid item size={{ xs: 6 }}>
                            <StatCard
                                icon={<EventIcon fontSize="large" />}
                                label={t('profile.eventsCreated')}
                                value={impactData.events_created}
                            />
                        </Grid>
                        <Grid item size={{ xs: 6 }}>
                            <StatCard
                                icon={<EventIcon fontSize="large" />}
                                label={t('profile.eventsAttended')}
                                value={impactData.events_attended}
                            />
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Task Stats */}
            <SectionHeader title={t('profile.tasks')} icon={<TaskAltIcon />} />
            <Grid container spacing={2}>
                <Grid item size={{ xs: 6, sm: 2.4 }}>
                    <StatCard
                        icon={<TaskAltIcon fontSize="large" />}
                        label={t('profile.tasksCompleted')}
                        value={impactData.tasks_completed}
                    />
                </Grid>
                <Grid item size={{ xs: 6, sm: 2.4 }}>
                    <StatCard
                        icon={<TaskAltIcon fontSize="large" />}
                        label={t('profile.tasksAssignedTo')}
                        value={impactData.tasks_assigned_to}
                    />
                </Grid>
                <Grid item size={{ xs: 6, sm: 2.4 }}>
                    <StatCard
                        icon={<TaskAltIcon fontSize="large" />}
                        label={t('profile.tasksAssignedBy')}
                        value={impactData.tasks_assigned_by}
                    />
                </Grid>
                <Grid item size={{ xs: 6, sm: 2.4 }}>
                    <StatCard
                        icon={<StarIcon fontSize="large" />}
                        label={t('profile.taskCompletionRate')}
                        value={`${Math.round(impactData.task_completion_rate)}%`}
                    />
                </Grid>
                <Grid item size={{ xs: 6, sm: 2.4 }}>
                    <StatCard
                        icon={<AccessTimeIcon fontSize="large" />}
                        label={t('profile.avgResponseTime')}
                        value={formatResponseTime(impactData.average_task_response_time_hours)}
                    />
                </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Forum Engagement */}
            <SectionHeader title={t('profile.forum')} icon={<ForumIcon />} />
            <Grid container spacing={2}>
                <Grid item size={{ xs: 6, sm: 3 }}>
                    <StatCard
                        icon={<ForumIcon fontSize="large" />}
                        label={t('profile.postsCreated')}
                        value={impactData.posts_created}
                    />
                </Grid>
                <Grid item size={{ xs: 6, sm: 3 }}>
                    <StatCard
                        icon={<ForumIcon fontSize="large" />}
                        label={t('profile.commentsMade')}
                        value={impactData.comments_made}
                    />
                </Grid>
                <Grid item size={{ xs: 6, sm: 3 }}>
                    <StatCard
                        icon={<ThumbUpIcon fontSize="large" />}
                        label={t('profile.likesReceived')}
                        value={impactData.likes_received}
                    />
                </Grid>
                <Grid item size={{ xs: 6, sm: 3 }}>
                    <StatCard
                        icon={<StarIcon fontSize="large" />}
                        label={t('profile.bestAnswers')}
                        value={impactData.best_answers}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

export default ImpactSummaryTab;
