import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Camera } from "lucide-react";
import EventsPage from "./pages/EventsPage";
import EventPage from "./pages/EventPage";
import PersonPage from "./pages/PersonPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50">
          {/* Header */}
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
              <Link
                to="/"
                className="flex items-center gap-2 text-lg font-bold text-slate-800 transition hover:text-indigo-600"
              >
                <Camera className="h-5 w-5 text-indigo-600" />
                WhoIsIn
              </Link>
            </div>
          </header>

          {/* Routes */}
          <main>
            <Routes>
              <Route path="/" element={<EventsPage />} />
              <Route path="/events/:eventId" element={<EventPage />} />
              <Route
                path="/events/:eventId/persons/:personId"
                element={<PersonPage />}
              />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
