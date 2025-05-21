"use client";

import { useEffect, useState } from "react";
import api from "@/utils/api";
import toast from "react-hot-toast";

interface Exchange {
  id: string;
  name: string;
}

interface List {
  id: string;
  name: string;
  exchange_id: string;
}

interface Snapshot {
  id: string;
  exchange: string;
  timestamp: string;
  wallets: Array<{
    native_balance: string;
  }>;
  tokens: Array<{
    balance: string;
  }>;
}

export default function DashboardPage() {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [exchangesRes, listsRes, snapshotsRes] = await Promise.all([
          api.get("/exchanges"),
          api.get("/lists"),
          api.get("/snapshots"),
        ]);

        setExchanges(exchangesRes.data);
        setLists(Array.isArray(listsRes.data) ? listsRes.data : listsRes.data.lists || []);
        if (Array.isArray(snapshotsRes.data)) {
          setSnapshots(snapshotsRes.data);
        } else if (Array.isArray(snapshotsRes.data.snapshots)) {
          setSnapshots(snapshotsRes.data.snapshots);
        } else {
          setSnapshots([]);
        }
      } catch (error) {
        toast.error("Veriler yüklenirken bir hata oluştu!");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 flex items-center gap-4 border border-slate-100 dark:border-slate-800">
          <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/40 rounded-full p-3">
            <svg className="h-7 w-7 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">Toplam Borsa</div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{exchanges.length}</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 flex items-center gap-4 border border-slate-100 dark:border-slate-800">
          <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/40 rounded-full p-3">
            <svg className="h-7 w-7 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">Toplam Liste</div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{lists.length}</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 flex items-center gap-4 border border-slate-100 dark:border-slate-800">
          <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/40 rounded-full p-3">
            <svg className="h-7 w-7 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">Toplam Snapshot</div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{snapshots.length}</div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Son Snapshotlar</h3>
          <span className="text-xs text-slate-400 dark:text-slate-500">En son 5 snapshot</span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <ul>
            {Array.isArray(snapshots) && snapshots.slice(0, 5).map((snapshot) => (
              <li key={snapshot.id} className="hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer px-6 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                    <span className="text-base font-medium text-blue-700 dark:text-blue-300 truncate">{snapshot.exchange}</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {new Date(snapshot.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                    {(snapshot.wallets?.length ?? 0)} Cüzdan
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
} 