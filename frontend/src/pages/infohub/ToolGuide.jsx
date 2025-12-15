import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  InputAdornment,
  Pagination,
  Chip,
  useTheme,
  CircularProgress,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import CheckIcon from '@mui/icons-material/Check';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchTools } from '../../services/plantService';

const ToolGuide = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [allTools, setAllTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const toolsPerPage = 6;
  const currentLang = i18n.language || 'en';

  // Fetch tools from Supabase
  useEffect(() => {
    const loadTools = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTools(currentLang);
        setAllTools(data);
      } catch (err) {
        console.error('Error loading tools:', err);
        setError(err.message || 'Failed to load tools');
      } finally {
        setLoading(false);
      }
    };

    loadTools();
  }, [currentLang]);
  
  // Filter tools based on search query
  const filteredTools = allTools.filter((tool) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const name = tool.name.toLowerCase();
    const description = (tool.description || '').toLowerCase();
    const type = (tool.type || '').toLowerCase();
    const skillLevel = (tool.skillLevel || '').toLowerCase();
    const uses = (tool.uses || []).map(u => u.toLowerCase());
    
    return (
      name.includes(query) ||
      description.includes(query) ||
      type.includes(query) ||
      skillLevel.includes(query) ||
      uses.some(use => use.includes(query))
    );
  });
  
  const totalPages = Math.ceil(filteredTools.length / toolsPerPage);
  const startIndex = (page - 1) * toolsPerPage;
  const endIndex = startIndex + toolsPerPage;
  const currentTools = filteredTools.slice(startIndex, endIndex);

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset to first page when searching
  };

  const getSkillLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return 'success';
      case 'intermediate':
        return 'warning';
      case 'advanced':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ 
      width: '100%', 
      minHeight: '100vh',
      backgroundColor: theme.palette.background.default 
    }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Back Button */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/infohub')}
          sx={{ mb: 2 }}
        >
          Back to Infohub
        </Button>

        {/* Header */}
        <Paper
          sx={{
            p: 4,
            mb: 4,
            background: `linear-gradient(135deg, #546e7a 0%, #78909c 100%)`,
            color: 'white',
          }}
        >
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
            🔧 Tool Guide
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            The right tools make gardening easier and more enjoyable
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
            {filteredTools.length} tools {searchQuery && `found`} • Page {totalPages > 0 ? page : 0} of {totalPages}
          </Typography>
        </Paper>

        {/* Search Bar */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <TextField
            fullWidth
            placeholder="Search tools by name, type, skill level, or use..."
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Paper>

        {/* Intro */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
            Having the right tools can make all the difference in your gardening experience. 
            Quality tools, properly maintained, can last a lifetime. Here's a guide to the 
            essential tools every gardener needs.
          </Typography>
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        ) : filteredTools.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No tools found matching "{searchQuery}"
            </Typography>
          </Paper>
        ) : (
          <>
            {/* Tools Grid */}
            <Box 
              sx={{ 
                display: 'grid',
                gridTemplateColumns: { 
                  xs: '1fr', 
                  sm: 'repeat(2, 1fr)', 
                  md: 'repeat(3, 1fr)',
                },
                gap: 3,
                mb: 4,
              }}
            >
            {currentTools.map((tool) => {
              const toolName = tool.name;
              const toolDescription = tool.description || '';
              const toolCategory = tool.category || '';
              const toolType = tool.type || '';
              const toolSkillLevel = tool.skillLevel || '';
              const toolUses = tool.uses || [];
              const toolTips = tool.tips || '';

              return (
                <Card key={tool.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {toolName}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1.5 }}>
                      {toolType && (
                        <Chip 
                          label={toolType} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      )}
                      {toolSkillLevel && (
                        <Chip 
                          label={toolSkillLevel} 
                          size="small" 
                          color={getSkillLevelColor(tool.skillLevel)} // Keep using original for logic
                          variant="outlined"
                        />
                      )}
                    </Box>

                    <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 1.5 }}>
                      {toolDescription}
                    </Typography>
                    
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>
                      {t('infohub.toolGuide.uses', 'Uses')}:
                    </Typography>
                    <List dense sx={{ flexGrow: 1 }}>
                      {toolUses.map((use, i) => (
                        <ListItem key={i} sx={{ py: 0, pl: 0 }}>
                          <ListItemIcon sx={{ minWidth: 24 }}>
                            <CheckIcon fontSize="small" color="success" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={use} 
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>

                    {toolTips && (
                      <Box sx={{ 
                        mt: 2, 
                        p: 1.5, 
                        backgroundColor: 'action.hover', 
                        borderRadius: 1 
                      }}>
                        <Typography variant="caption" color="text.secondary">
                          💡 <strong>{t('infohub.toolGuide.tips', 'Tip')}:</strong> {toolTips}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            </Box>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </>
        )}

        {/* Tool Care Tips */}
        <Paper sx={{ p: 3, mt: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
            🛠️ Tool Maintenance Tips
          </Typography>
          <Box 
            sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
              gap: 2,
            }}
          >
            <List dense>
              <ListItem>
                <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                <ListItemText primary="Clean tools after each use - remove soil and sap" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                <ListItemText primary="Dry thoroughly to prevent rust" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                <ListItemText primary="Sharpen blades regularly for clean cuts" />
              </ListItem>
            </List>
            <List dense>
              <ListItem>
                <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                <ListItemText primary="Oil metal parts to prevent rust" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                <ListItemText primary="Store in a dry place, preferably hanging" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                <ListItemText primary="Replace worn handles before they break" />
              </ListItem>
            </List>
          </Box>
        </Paper>

        {/* Navigation */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button variant="contained" onClick={() => navigate('/infohub/plants')}>
            Browse Plants
          </Button>
          <Button variant="outlined" onClick={() => navigate('/infohub')}>
            Back to Infohub
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default ToolGuide;
