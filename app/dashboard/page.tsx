"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import DarkModeToggle from "@/components/DarkModeToggle";
import CoursesManager from "@/components/CoursesManager";
import AssignmentsManager from "@/components/AssignmentsManager";
import RoutineManager from "@/components/RoutineManager";



export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?mode=login");
    }
  }, [user, loading, router]);

  if (loading) return <p className="p-8 text-center">Loading...</p>;
  if (!user) return null; // redirect handled in useEffect

  return (
    <div className="min-h-screen">
      <header className="flex justify-between items-center p-6 shadow-md">
        <h1 className="text-2xl font-bold">Redent Dashboard</h1>
        <DarkModeToggle />

        <button
          onClick={signOut}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
        >
          Sign Out
        </button>
      </header>
      <CoursesManager />
      <AssignmentsManager />
      <RoutineManager />


      <main className="p-6">
        <h2 className="text-xl font-semibold mb-4">Welcome, {user.email}</h2>

        {/* Upcoming Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 card rounded shadow">
            <h3 className="font-semibold mb-2">Your Courses</h3>
            <p>Course list and timetable will appear here.</p>
          </div>

          <div className="p-4 card rounded shadow">
            <h3 className="font-semibold mb-2">Assignments</h3>
            <p>Track upcoming deadlines and progress here.</p>
          </div>

          <div className="p-4 card rounded shadow">
            <h3 className="font-semibold mb-2">Morning Routine</h3>
            <p>Smart wake-up alerts and prep schedule will appear here.</p>
          </div>

          <div className="p-4 card rounded shadow">
            <h3 className="font-semibold mb-2">Notifications</h3>
            <p>All reminders, weekly summaries, and alerts.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
