import React, { type JSX } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import ReviewPage from "./pages/ReviewPage";
import MyReviewsPage from "./pages/MyReviewPage";
import { auth } from "./firebaseConfig";
import AbstractReviewAgent from "./components/AbstractReviewAgent";

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  return auth.currentUser ? children : <Navigate to="/login" />;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/review"
          element={
            <PrivateRoute>
              <AbstractReviewAgent/>
            </PrivateRoute>
          }
        />
        <Route
          path="/my-reviews"
          element={
            <PrivateRoute>
              <MyReviewsPage />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default App;
