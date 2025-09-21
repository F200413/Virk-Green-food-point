import React from 'react';
import { AppBar, Toolbar, Typography, Button, Avatar, Box } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import logo from '../../assets/im.jpg';

const Header = ({ onLogout }) => {
  return (
    <AppBar 
      position="static" 
      sx={{ 
        mb: 2, 
        bgcolor: '#2d6a4f',
        borderRadius: 0,
        boxShadow: 'none'
      }}
    >
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Avatar 
            src={logo} 
            alt="Green Food Point" 
            sx={{ width: 50, height: 50, mr: 2 }}
          />
          <Typography 
            variant="h5" 
            component="div" 
            sx={{ 
              fontWeight: 'bold', 
              fontSize: '1.5rem' 
            }}
          >
            ورک گرین فوڈ پوائنٹ
          </Typography>
        </Box>
        
        <Button 
          color="inherit" 
          onClick={onLogout}
          startIcon={<LogoutIcon />}
        >
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
