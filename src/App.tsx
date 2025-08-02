import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import CreateProfile from './pages/CreateProfile';
import { Toaster } from 'react-hot-toast';
import { PrivateRoute } from './routes/PrivateRoute';
import GlobalContextProvider from './context/GlobalContextProvider';
import ProfileSummary from './pages/ProfileSummary';

function App() {
  return (
    <>
      <GlobalContextProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<AuthPage />} />

            {/* Protected Routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/generate-profile" element={<CreateProfile />} />
              <Route path="/profile-summary" element={<ProfileSummary />} />
              {/* <Route path="/chat" element={<ChatPage />} /> */}
            </Route>
          </Routes>
        </Router>
      </GlobalContextProvider>

      {/* Global Toast Container */}
      <Toaster reverseOrder={false} />
    </>
  );
}

export default App;
