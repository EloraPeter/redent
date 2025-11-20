import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-zinc-50 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
      {/* HERO */}
      <section className="px-6 py-24 text-center sm:py-32">
        <h1 className="text-4xl font-bold sm:text-5xl">Redent</h1>
        <p className="mt-4 text-lg sm:text-xl text-zinc-600 dark:text-zinc-300">
          Your Personal Academic Assistant
        </p>

        <p className="mx-auto mt-6 max-w-xl text-base text-zinc-600 dark:text-zinc-400">
          Never miss a class. Never submit late. Never wake up rushed again.
          <br />
          Track assignments • Manage classes • Plan routines • Get smart reminders
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/login"
            className="rounded-full bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition inline-block"
          >
            Get Started
          </Link>

          <Link
            href="/login"
            className="rounded-full border border-zinc-300 px-6 py-3 text-zinc-800 dark:text-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition inline-block"
          >
            Login
          </Link>

        </div>
      </section>

      {/* WHY REDENT */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold">Why Redent?</h2>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          University life is chaotic — deadlines everywhere, early classes, long commutes,
          and constant pressure to stay organized.
        </p>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          Redent simplifies everything by putting your entire academic life in one place:
        </p>

        <ul className="mt-4 space-y-2 text-zinc-700 dark:text-zinc-300">
          <li>• All your courses and lecture times</li>
          <li>• All assignment deadlines</li>
          <li>• Your personal morning routine</li>
          <li>• Smart wake-up alerts calculated just for you</li>
          <li>• Progress tracking</li>
          <li>• Weekly summaries</li>
          <li>• Dark mode for late-night studying</li>
        </ul>
      </section>

      {/* WHAT IT FIXES */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold">What Redent Helps You Fix</h2>

        <ul className="mt-4 space-y-2 text-zinc-700 dark:text-zinc-300">
          <li>• Missing deadlines</li>
          <li>• Forgetting classes or exam dates</li>
          <li>• Oversleeping</li>
          <li>• Poor routine planning</li>
          <li>• Stress from last-minute rushes</li>
          <li>• Disorganized academic schedules</li>
        </ul>

        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          Redent solves these with automation and intelligent reminders.
        </p>
      </section>

      {/* CORE FEATURES */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold">Core Features</h2>

        <ul className="mt-4 space-y-3 text-zinc-700 dark:text-zinc-300">
          <li>🔐 Secure Login (Firebase Auth)</li>
          <li>📚 Course & Timetable Manager</li>
          <li>📝 Assignment Tracker with Priorities</li>
          <li>⏰ Smart Wake-Up Time Calculator</li>
          <li>📣 Sequential Routine Alerts</li>
          <li>🔔 Custom Reminders & Notifications</li>
          <li>📈 Visual Progress Indicators</li>
          <li>📅 Weekly Summary Reports</li>
          <li>📤 Calendar Export (.ics)</li>
          <li>🌙 Dark Mode</li>
        </ul>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold">How It Works</h2>

        <ol className="mt-4 space-y-2 text-zinc-700 dark:text-zinc-300 list-decimal list-inside">
          <li>Create an account</li>
          <li>Add your courses and assignments</li>
          <li>Enter your morning routine</li>
          <li>
            Let Redent handle the stress — reminders, alerts, progress tracking, wake-up times.
          </li>
        </ol>
      </section>

      {/* WHY STUDENTS LOVE REDENT */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold">Why Students Love Redent</h2>

        <ul className="mt-4 space-y-2 text-zinc-700 dark:text-zinc-300">
          <li>• Works offline after first load</li>
          <li>• Lightweight</li>
          <li>• Simple interface</li>
          <li>• Mobile-first</li>
          <li>• No ads</li>
          <li>• Everything stored securely</li>
        </ul>
      </section>

      {/* BUILT WITH */}
      <section className="px-6 py-16 max-w-3xl mx-auto text-center">
        <h2 className="text-2xl font-semibold">Built With</h2>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          HTML • CSS • JavaScript • Firebase • PWA technologies
        </p>
      </section>

      {/* FOOTER */}
      <footer className="py-10 text-center text-sm text-zinc-600 dark:text-zinc-400">
        © 2025 Redent. Designed for students, by students.
      </footer>
    </div>
  );
}
