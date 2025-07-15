import React from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { MongoCollectionEditor } from './components/MongoCollectionEditor';

const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{ height: '100vh', padding: '16px' }}>
        <MongoCollectionEditor />
      </div>
    </ThemeProvider>
  );
}

export default App;