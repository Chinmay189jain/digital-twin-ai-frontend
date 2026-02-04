import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { LoadingSpinner } from "./components/LoadingSpinner";

import { PrivateRoute } from "./routes/PrivateRoute";
import GlobalContextProvider from "./context/GlobalContextProvider";

// keep Home non-lazy for faster initial load
import Home from "./pages/Home";

// lazy loaded components
const AuthPage = lazy(() => import("./pages/auth/AuthPage"));
const CreateProfile = lazy(() => import("./pages/profile/CreateProfile"));
const ProfileSummary = lazy(() => import("./pages/profile/ProfileSummary"));
const Layout = lazy(() => import("./components/Layout"));

const Chat = lazy(() => import("./pages/chat/Chat"));
const History = lazy(() => import("./pages/History"));
const EditProfile = lazy(() => import("./pages/profile/EditProfile"));
const Settings = lazy(() => import("./pages/Settings"));

const EmailVerification = lazy(() => import("./pages/auth/EmailVerification"));
const RequestEmailVerification = lazy(
  () => import("./pages/auth/RequestEmailVerification")
);
const PasswordChangePage = lazy(() => import("./pages/auth/PasswordChange"));

// Simple fallback UI
function PageFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <LoadingSpinner
        size="lg"
        className="border-gray-200 dark:border-gray-700 border-t-indigo-600 dark:border-t-indigo-400"
      />
    </div>
  );
}

function App() {
  return (
    <>
      <GlobalContextProvider>
        <Router>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/change/password" element={<PasswordChangePage />} />
              <Route path="/user/email" element={<RequestEmailVerification />} />
              <Route path="/account/verify" element={<EmailVerification />} />

              {/* Private Routes */}
              <Route element={<PrivateRoute />}>
                <Route path="/generate-profile" element={<CreateProfile />} />
                <Route path="/profile-summary" element={<ProfileSummary />} />
                <Route path='/chat' element={<Layout><Chat /></Layout>} />
                <Route path="/chat/:sessionId" element={<Layout><Chat /></Layout>} />
                <Route path='/history' element={<Layout><History /></Layout>} />
                <Route path='/profile-edit' element={<Layout><EditProfile /></Layout>} />
                <Route path='/settings' element={<Layout><Settings /></Layout>} />
              </Route>
            </Routes>
          </Suspense>
        </Router>
      </GlobalContextProvider>

      <Toaster reverseOrder={false} />
    </>
  );
}

export default App;
