import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import CreateProfile from './pages/CreateProfile';
import { Toaster } from 'react-hot-toast';
import { PrivateRoute } from './routes/PrivateRoute';
import GlobalContextProvider from './context/GlobalContextProvider';
import ProfileSummary from './pages/ProfileSummary';
import Layout from './components/Layout';
import Chat from './pages/chat/Chat';
import History from './pages/History';

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
              <Route path='/chat' element={<Layout><Chat /></Layout>} />
              <Route path="/chat/:sessionId" element={<Layout><Chat /></Layout>} />
              <Route path='/history' element={<Layout><History /></Layout>} />
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
