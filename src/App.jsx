import React, { lazy, Suspense } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AppShell from "./components/layout/AppShell";
import PrivateRoute from "./components/PrivateRoutes";
import Home from "./pages/Home";

// Home loads eagerly; every other page is split into its own chunk.
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Discover = lazy(() => import("./pages/Discover"));
const Results = lazy(() => import("./pages/Results"));
const PlaceDetail = lazy(() => import("./pages/PlaceDetail"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Itineraries = lazy(() => import("./pages/Itineraries"));
const SharedItinerary = lazy(() => import("./pages/SharedItinerary"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const GuideCheckout = lazy(() => import("./pages/GuideCheckout"));
const MapPage = lazy(() => import("./pages/MapPage"));
const Guides = lazy(() => import("./pages/Guides"));
const NotFound = lazy(() => import("./pages/NotFound"));

const App = () => {
  return (
    <Router>
      <ToastContainer theme="dark" />
      <AppShell>
        <Suspense fallback={<div className="min-h-screen bg-kijiji-deep" />}>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/" element={<Home />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/results" element={<Results />} />
          <Route path="/places/:id" element={<PlaceDetail />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/guides" element={<Guides />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/itinerary/:token" element={<SharedItinerary />} />
          <Route
            path="/favorites"
            element={
              <PrivateRoute>
                <Favorites />
              </PrivateRoute>
            }
          />
          <Route
            path="/itineraries"
            element={
              <PrivateRoute>
                <Itineraries />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/guides/book"
            element={
              <PrivateRoute>
                <GuideCheckout />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </AppShell>
    </Router>
  );
};

export default App;
