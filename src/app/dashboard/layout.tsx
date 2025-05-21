"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <nav className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 shadow-lg backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-2xl font-extrabold tracking-tight text-blue-700 dark:text-blue-400 flex items-center gap-2">
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#2563eb" opacity="0.15"/><path d="M7 12l3 3 7-7" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                PoR Dashboard
              </Link>
              <div className="hidden md:flex md:space-x-2 lg:space-x-6">
                <Link
                  href="/dashboard"
                  className={
                    `${pathname === "/dashboard" ? "border-blue-600 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 shadow" : "border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-blue-300"} transition-all duration-150 rounded-md px-3 py-2 border-b-2 font-medium text-sm flex items-center`
                  }
                >
                  Ana Sayfa
                </Link>
                <Link
                  href="/dashboard/lists"
                  className={
                    `${pathname.startsWith("/dashboard/lists") ? "border-blue-600 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 shadow" : "border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-blue-300"} transition-all duration-150 rounded-md px-3 py-2 border-b-2 font-medium text-sm flex items-center`
                  }
                >
                  Listeler
                </Link>
                <Link
                  href="/dashboard/snapshots"
                  className={
                    `${pathname.startsWith("/dashboard/snapshots") ? "border-blue-600 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 shadow" : "border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-blue-300"} transition-all duration-150 rounded-md px-3 py-2 border-b-2 font-medium text-sm flex items-center`
                  }
                >
                  Snapshotlar
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                aria-label="Tema Değiştir"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {theme === "dark" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-300 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.07l-.71.71M21 12h-1M4 12H3m16.66 5.66l-.71-.71M4.05 4.93l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-300 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" /></svg>
                )}
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  router.push("/login");
                }}
                className="inline-flex items-center px-4 py-2 border border-blue-600 dark:border-blue-400 text-sm font-semibold rounded-md text-blue-700 dark:text-blue-200 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-800 transition-all duration-150 shadow-sm"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-8 px-2 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
} 