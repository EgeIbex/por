"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";
import toast from "react-hot-toast";

interface Exchange {
  id: number;
  name: string;
}

interface List {
  id: number;
  name: string;
  exchange_id: number;
  exchange_name?: string;
  created_at?: string;
}

export default function ListsPage() {
  const router = useRouter();
  const [lists, setLists] = useState<List[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [newListName, setNewListName] = useState("");
  const [activeExchangeId, setActiveExchangeId] = useState<number | null>(null);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [newExchangeName, setNewExchangeName] = useState("");

  const fetchData = async () => {
    try {
      const [listsRes, exchangesRes] = await Promise.all([
        api.get("/lists"),
        api.get("/exchanges"),
      ]);
      setLists(Array.isArray(listsRes.data) ? listsRes.data : listsRes.data.lists || []);
      setExchanges(exchangesRes.data);
      // Varsayılan olarak ilk borsa aktif olsun
      if (exchangesRes.data.length > 0) {
        setActiveExchangeId(exchangesRes.data[0].id);
      }
    } catch (error) {
      toast.error("Veriler yüklenirken bir hata oluştu!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Yeni borsa ekleme
  const handleAddExchange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExchangeName.trim()) return;
    try {
      console.log("POST /exchanges isteği atılıyor, name:", newExchangeName);
      const response = await api.post("/exchanges", { name: newExchangeName });
      console.log("POST /exchanges cevabı:", response.data);
      setExchanges((prev) => [...prev, response.data]);
      setNewExchangeName("");
      setShowExchangeModal(false);
      setActiveExchangeId(response.data.id); // Yeni eklenen borsayı aktif yap
      toast.success("Borsa başarıyla eklendi!");
    } catch (error) {
      console.log("POST /exchanges hatası:", error);
      toast.error("Borsa eklenirken bir hata oluştu!");
    }
  };

  // Yeni liste ekleme
  const handleAddList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim() || !activeExchangeId) {
      toast.error("Lütfen bir borsa seçin ve liste adı girin.");
      return;
    }
    try {
      const response = await api.post("/lists", {
        name: newListName,
        exchange_id: activeExchangeId,
      });
      setLists([...lists, response.data]);
      setNewListName("");
      toast.success("Liste başarıyla oluşturuldu!");
    } catch (error) {
      toast.error("Liste oluşturulurken bir hata oluştu!");
    }
  };

  // Aktif borsanın listeleri
  const filteredLists = lists.filter((list) => list.exchange_id === activeExchangeId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Borsa sekmeleri */}
      <div className="flex items-center gap-4 px-4 pt-4 pb-2 relative h-9">
        {/* Sticky + butonu */}
        <div className="sticky left-0 z-30 bg-slate-50 dark:bg-slate-900 pr-2 flex-shrink-0 h-9 flex items-center">
          <button
            onClick={e => {
              setShowExchangeModal(true);
            }}
            className="h-9 px-4 py-1.5 rounded-2xl font-bold text-base flex items-center justify-center bg-gradient-to-tr from-blue-400 to-blue-600 text-white shadow-md border-0 hover:scale-110 hover:shadow-lg transition-all duration-200 select-none focus:outline-none focus:ring-0"
            aria-label="Borsa Ekle"
            style={{ minWidth: 40 }}
            tabIndex={-1}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>
        {/* Scrollable sekmeler */}
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 flex-1 h-9 min-h-[36px] pl-2 pr-2">
          {exchanges.map((exchange) => (
            <button
              key={exchange.id}
              onClick={e => {
                setActiveExchangeId(exchange.id);
              }}
              className={`h-9 px-4 py-1.5 rounded-2xl font-bold text-base transition-all duration-200 whitespace-nowrap flex items-center justify-center shadow-sm select-none focus:outline-none focus:ring-0
                ${activeExchangeId === exchange.id
                  ? "bg-gradient-to-tr from-blue-600 to-blue-400 text-white scale-105 shadow-lg border-0"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 border-0"}
              `}
              style={{ minWidth: 90 }}
              tabIndex={-1}
            >
              <span className="w-full text-center">{exchange.name}</span>
            </button>
          ))}
        </div>
      </div>
      {/* Modal */}
      {showExchangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 m-0 p-0" onClick={e => { if (e.target === e.currentTarget) setShowExchangeModal(false); }}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 w-full max-w-sm relative animate-fade-in">
            <button
              onClick={() => setShowExchangeModal(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 text-xl"
              aria-label="Kapat"
            >
              ×
            </button>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Yeni Borsa Ekle</h3>
            <form onSubmit={handleAddExchange} className="flex flex-col gap-4">
              <input
                type="text"
                name="exchange-name"
                id="exchange-name"
                placeholder="Borsa adı"
                value={newExchangeName}
                onChange={(e) => setNewExchangeName(e.target.value)}
                autoFocus
              />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition"
              >
                Ekle
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Aktif borsanın listeleri ve yeni liste ekleme */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
            {exchanges.find((e) => e.id === activeExchangeId)?.name || "Borsa"} Listeleri
          </h3>
          <form onSubmit={handleAddList} className="flex gap-2 w-full md:w-auto">
            <input
              type="text"
              name="list-name"
              id="list-name"
              className="flex-1"
              placeholder="Yeni liste adı"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              required
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition"
            >
              Oluştur
            </button>
          </form>
        </div>
        {/* Listeler */}
        {filteredLists.length === 0 ? (
          <div className="text-slate-400 text-center py-8">Bu borsada henüz liste yok.</div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredLists.map((list) => (
              <li
                key={list.id}
                className="hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer transition-colors rounded-lg px-4 py-4 flex items-center justify-between"
                onClick={() => router.push(`/dashboard/lists/${list.id}`)}
              >
                <div>
                  <div className="text-base font-medium text-blue-700 dark:text-blue-300">{list.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Oluşturulma: {list.created_at ? new Date(list.created_at).toLocaleString() : "-"}
                  </div>
                </div>
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 