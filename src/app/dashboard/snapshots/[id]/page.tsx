"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/utils/api";
import toast from "react-hot-toast";
import { saveAs } from "file-saver";

interface Wallet {
  address: string;
  block_height: number;
  native_balance: string;
  chain: string;
  native_symbol: string;
  tokens: Array<{
    symbol: string;
    balance: string;
    block_height: number;
    address: string;
  }>;
}

interface Snapshot {
  snapshot_id: string;
  exchange: string;
  timestamp: string;
  wallets: Wallet[];
}

export default function SnapshotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSnapshot = async () => {
    try {
      const response = await api.get(`/snapshots/${params.id}`);
      setSnapshot(response.data);
    } catch (error) {
      toast.error("Snapshot detayları yüklenirken bir hata oluştu!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshot();
  }, [params.id]);

  // CSV oluşturma fonksiyonu
  function downloadCSV() {
    if (!snapshot) return;
    let csv = "Block Height,Block Hash,Network Name,Token Symbol,Token Balance\n";
    snapshot.wallets.forEach(wallet => {
      if (wallet.tokens && wallet.tokens.length > 0) {
        wallet.tokens.forEach(token => {
          csv += `${token.block_height},${token.address},${wallet.native_symbol},${token.symbol},${token.balance}\n`;
        });
      } else {
        csv += `${wallet.block_height},${wallet.address},${wallet.native_balance},,\n`;
      }
    });
    // 2 satır boşluk ekle
    csv += "\n\n";
    // Sadece wallet bilgileriyle yeni tablo
    csv += "Block Height,Block Hash,Network Symbol,Network Name,Native Balance\n";
    snapshot.wallets.forEach(wallet => {
      csv += `${wallet.block_height},${wallet.address},${wallet.native_symbol},${wallet.chain},${wallet.native_balance}\n`;
    });
    // Dosya adını oluştur
    const date = new Date(snapshot.timestamp);
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const exchangeName = snapshot.exchange.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Snapshot_${snapshot.snapshot_id}_${exchangeName}_${formattedDate}.csv`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, fileName);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Snapshot bulunamadı
        </h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg flex items-center justify-between px-4 py-5 sm:p-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 shadow transition"
            title="Geri Dön"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-700 dark:text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              {snapshot.exchange} - Snapshot Detayları
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {new Date(snapshot.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex items-center justify-between">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            Cüzdan Detayları
          </h3>
          <button
            onClick={downloadCSV}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-tr from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-semibold rounded-lg shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
            </svg>
            .csv
          </button>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {snapshot.wallets.map((wallet, index) => (
              <li key={index} className="px-4 py-4 sm:px-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Block Height: {wallet.block_height}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Block Hash: {wallet.address}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                        {wallet.native_balance} {wallet.native_symbol}
                      </p>
                    </div>
                  </div>
                  {wallet.tokens.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Tokenler
                      </h4>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        {wallet.tokens.map((token, tokenIndex) => (
                          <div
                            key={tokenIndex}
                            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3"
                          >
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {token.symbol}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {token.balance}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
} 