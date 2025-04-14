import { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import Home from './pages/home';
import logo from './assets/im.jpg';
import { AppBar, Toolbar, Typography, Button, Avatar, Box } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Check if user is already logged in
  useEffect(() => {
    const loginStatus = localStorage.getItem('isLoggedIn');
    if (loginStatus === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <Login onLogin={setIsLoggedIn} />;
  }

  return (
    <div className="App">
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
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      
      <Home />
    </div>
  );
}

export default App;
