import { BrowserRouter, Routes, Route } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import PublicRoute from "./PublicRoute";
import { ROUTES } from "@/utils";

import { Home }          from "@/pages/home";
import { Login }         from "@/pages/auth/Login";
import { Register }      from "@/pages/auth/Register";
import { Onboarding }    from "@/pages/onboarding";
import { Practice }      from "@/pages/practice";
import { Playground }    from "@/pages/playground";
import { NotFound }      from "@/pages/not-found";
import { Learn }         from "@/pages/learn";
import { Session }       from "@/pages/session";
import { Report }        from "@/pages/report";
import { Progress }      from "@/pages/progress";
import { Vocabulary }    from "@/pages/vocabulary";
import { Profile }       from "@/pages/profile";

// ── 7 New unique pages ──
import { ConferenceRoom } from "@/pages/conference";
import { Patterns }       from "@/pages/patterns";
import { CultureRoom }    from "@/pages/culture";
import { Journal }        from "@/pages/journal";
import { InterviewRoom }  from "@/pages/interview-room";
import { DebateArena }    from "@/pages/debate";
import { AnxietyCoach }   from "@/pages/anxiety";

const ALL_PRIVATE = [
  ROUTES.HOME, "/practice", "/practice/:id", "/learn", "/session",
  "/report/:id", "/progress", "/vocabulary", "/profile",
  "/conference", "/patterns", "/culture", "/journal",
  "/interview-room", "/debate", "/anxiety",
];

export const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path={ROUTES.LOGIN}        element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register"           element={<Register />} />
      <Route path="/onboarding/:page"   element={<Onboarding />} />
      <Route path="/playground"         element={<Playground />} />

      {/* Protected — original */}
      <Route path="/"           element={<PrivateRoute><Home /></PrivateRoute>} />
      <Route path="/practice"   element={<PrivateRoute><Practice /></PrivateRoute>} />
      <Route path="/learn"      element={<PrivateRoute><Learn /></PrivateRoute>} />
      <Route path="/session"    element={<PrivateRoute><Session /></PrivateRoute>} />
      <Route path="/report/:id" element={<PrivateRoute><Report /></PrivateRoute>} />
      <Route path="/progress"   element={<PrivateRoute><Progress /></PrivateRoute>} />
      <Route path="/vocabulary" element={<PrivateRoute><Vocabulary /></PrivateRoute>} />
      <Route path="/profile"    element={<PrivateRoute><Profile /></PrivateRoute>} />

      {/* Protected — 7 new unique pages */}
      <Route path="/conference"    element={<PrivateRoute><ConferenceRoom /></PrivateRoute>} />
      <Route path="/patterns"      element={<PrivateRoute><Patterns /></PrivateRoute>} />
      <Route path="/culture"       element={<PrivateRoute><CultureRoom /></PrivateRoute>} />
      <Route path="/journal"       element={<PrivateRoute><Journal /></PrivateRoute>} />
      <Route path="/interview-room"element={<PrivateRoute><InterviewRoom /></PrivateRoute>} />
      <Route path="/debate"        element={<PrivateRoute><DebateArena /></PrivateRoute>} />
      <Route path="/anxiety"       element={<PrivateRoute><AnxietyCoach /></PrivateRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);
