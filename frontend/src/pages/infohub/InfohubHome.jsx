import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Paper, 
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import GrassIcon from '@mui/icons-material/Grass';
import BuildIcon from '@mui/icons-material/Build';

const InfohubHome = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();

  const mainCategories = [
    {
      id: 'plants',
      title: 'Plant Encyclopedia',
      description: 'Browse our collection of plants with detailed care guides',
      icon: <LocalFloristIcon sx={{ fontSize: 40 }} />,
      color: '#4caf50',
      route: '/infohub/plants',
    },
    {
      id: 'soil',
      title: 'Soil Types',
      description: 'Learn about different soil types and how to improve yours',
      icon: <GrassIcon sx={{ fontSize: 40 }} />,
      color: '#8d6e63',
      route: '/infohub/soil-types',
    },
    {
      id: 'tools',
      title: 'Tool Guide',
      description: 'Essential gardening tools and how to use them',
      icon: <BuildIcon sx={{ fontSize: 40 }} />,
      color: '#607d8b',
      route: '/infohub/tool-guide',
    },
  ];

  const quickLinks = [
    { id: 'gardening-basics', title: 'Gardening Basics', icon: '🌱' },
    { id: 'community-rules-safety', title: 'Community Rules & Safety', icon: '📋' },
    { id: 'faq', title: 'FAQ', icon: '❓' },
    { id: 'support', title: 'Support', icon: '💬' },
  ];

  return (
    <Box sx={{ 
      width: '100%', 
      minHeight: '100vh',
      backgroundColor: theme.palette.background.default 
    }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Paper
          sx={{
            p: { xs: 3, md: 5 },
            mb: 4,
            background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
            color: 'white',
            textAlign: 'center',
          }}
        >
          <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 2 }}>
            🌿 Garden Wiki
          </Typography>
          <Typography variant="h5" sx={{ opacity: 0.9 }}>
            Your complete guide to community gardening
          </Typography>
        </Paper>

        {/* Main Categories - Side by Side */}
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
          Browse by Category
        </Typography>
        
        <Box 
          sx={{ 
            display: 'flex', 
            gap: 3, 
            mb: 5, 
            flexDirection: { xs: 'column', md: 'row' },
          }}
        >
          {mainCategories.map((cat) => (
            <Card
              key={cat.id}
              onClick={() => navigate(cat.route)}
              sx={{ 
                flex: 1,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    backgroundColor: cat.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                    color: 'white',
                  }}
                >
                  {cat.icon}
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {cat.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {cat.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Getting Started */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
            🌻 Getting Started
          </Typography>
          <Typography variant="body1" paragraph>
            Welcome to the Garden Wiki! Here you'll find everything you need to know about 
            community gardening.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>New to gardening?</strong> Start with our Gardening Basics guide, 
            then explore the Plant Encyclopedia to find plants that suit your garden.
          </Typography>
          <Typography variant="body1">
            <strong>Need help?</strong> Check our FAQ or visit the Support section.
          </Typography>
        </Paper>

        {/* Quick Links */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
            📚 Quick Links
          </Typography>
          <List>
            {quickLinks.map((link, index) => (
              <React.Fragment key={link.id}>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => navigate(`/infohub/${link.id}`)}>
                    <ListItemIcon sx={{ minWidth: 40, fontSize: 24 }}>
                      {link.icon}
                    </ListItemIcon>
                    <ListItemText primary={link.title} />
                  </ListItemButton>
                </ListItem>
                {index < quickLinks.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      </Container>
    </Box>
  );
};

export default InfohubHome;
