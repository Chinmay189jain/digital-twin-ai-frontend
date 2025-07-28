import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import CreateProfile from './pages/CreateProfile';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        {/* <Route path="/chat" element={<ChatPage />} /> */}
        <Route path="/generate-profile" element={<CreateProfile />} />
      </Routes>
    </Router>
  );
}

export default App;
