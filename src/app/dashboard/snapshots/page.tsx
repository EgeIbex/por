"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";
import toast from "react-hot-toast";

interface Snapshot {
  id: string;
  exchange: string;
  timestamp: string;
  wallets: Array<{
    block_hash: string;
    block_height: number;
    native_balance: string;
    tokens: Array<{
      symbol: string;
      balance: string;
    }>;
  }>;
}

export default function SnapshotsPage() {
  const router = useRouter();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSnapshots = async () => {
    try {
      const response = await api.get("/snapshots");
      if (Array.isArray(response.data)) {
        setSnapshots(response.data);
      } else if (Array.isArray(response.data.snapshots)) {
        setSnapshots(response.data.snapshots);
      } else {
        setSnapshots([]);
      }
    } catch (error) {
      toast.error("Sorgu Sonuçları yüklenirken bir hata oluştu!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshots();
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Sorgu Sonuçları</h3>
          <span className="text-xs text-slate-400 dark:text-slate-500">Tüm reserve sorgu sonuçlarının listesi</span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <ul>
            {Array.isArray(snapshots) && snapshots.map((snapshot: any) => (
              <li
                key={snapshot.id}
                className="hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer transition-colors"
                onClick={() => router.push(`/dashboard/snapshots/${snapshot.id}`)}
              >
                <div className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-blue-700 dark:text-blue-300 truncate">
                        {snapshot.exchange_name || snapshot.exchange}
                        {snapshot.historical_date && (
                          <span className="text-base font-medium text-slate-500 dark:text-slate-400 ml-2">({snapshot.historical_date})</span>
                        )}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {new Date(snapshot.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
} 