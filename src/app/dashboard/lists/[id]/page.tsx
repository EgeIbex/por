"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/utils/api";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Wallet {
  id: string;
  address: string;
  native_balance: string;
}

interface Token {
  id: string;
  symbol: string;
  balance: string;
}

interface List {
  id: string;
  name: string;
  exchange_id: string;
  wallets: Wallet[];
  tokens: Token[];
}

interface ImportWallet {
  chain: string;
  address: string;
  tokens?: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
  }[];
}

export default function ListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [list, setList] = useState<List | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [wallets, setWallets] = useState<ImportWallet[]>([]);
  const [currentWallet, setCurrentWallet] = useState<ImportWallet>({
    chain: "ethereum",
    address: "",
    tokens: []
  });
  const [currentToken, setCurrentToken] = useState({
    address: "",
    name: "",
    symbol: "",
    decimals: 18
  });
  const [queryLoading, setQueryLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(0,0,0,0);
    return d;
  });

  const availableChains = [
    "ethereum",
    "bitcoin",
    "solana",
    "avax_cchain",
    "avax_xchain",
    "tron",
    "chiliz",
    "xrp"
  ];

  // Token bilgilerini otomatik dolduracak gerçek API fonksiyonu
  async function fetchTokenInfo(address: string, chain: string) {
    // Demo API key ve contract info endpoint
    const demoApiKey = "CG-eDGt7ohGuQyXNjvZAGqT8PSm";
    // Chain id'yi endpointte kullan
    const url = `https://api.coingecko.com/api/v3/coins/${chain}/contract/${address}`;
    console.log("CoinGecko DEMO API isteği:", url);
    try {
      const response = await fetch(url, {
        headers: {
          accept: "application/json",
          "x-cg-demo-api-key": demoApiKey
        }
      });
      console.log("Demo API cevabı status:", response.status);
      const data = await response.json();
      console.log("Demo API cevabı json:", data);
      // Cevaptan name, symbol, decimals almaya çalış
      return {
        name: data.name || "",
        symbol: data.symbol || "",
        decimals: data.detail_platforms?.[chain]?.decimal_place || 18
      };
    } catch (err) {
      console.log("Demo API isteği hatası:", err);
      return { name: "", symbol: "", decimals: 18 };
    }
  }

  const handleAddToken = async () => {
    if (!currentToken.address) return;
    // Token bilgilerini otomatik doldur
    console.log("Girilen token adresi:", currentToken.address);
    console.log("Seçili network:", currentWallet.chain);
    const info: any = await fetchTokenInfo(currentToken.address, currentWallet.chain);
    console.log("Dönen token bilgisi:", info);
    setCurrentWallet(prev => ({
      ...prev,
      tokens: [...(prev.tokens || []), { ...currentToken, ...info }]
    }));
    setCurrentToken({
      address: "",
      name: "",
      symbol: "",
      decimals: 18
    });
  };

  const handleAddWallet = () => {
    if (!currentWallet.address) return;
    setWallets(prev => [...prev, { ...currentWallet }]);
    setCurrentWallet({
      chain: "ethereum",
      address: "",
      tokens: []
    });
  };

  const handleRemoveToken = (index: number) => {
    setCurrentWallet(prev => ({
      ...prev,
      tokens: prev.tokens?.filter((_, i) => i !== index)
    }));
  };

  const handleRemoveWallet = (index: number) => {
    setWallets(prev => prev.filter((_, i) => i !== index));
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (wallets.length === 0) return;

    setImporting(true);
    try {
      const body = {
        wallets: wallets.map(w => {
          // tokens alanı boşsa göndermeyelim
          const { tokens, ...rest } = w;
          if (tokens && tokens.length > 0) {
            return { ...rest, tokens };
          } else {
            return rest;
          }
        }),
        list_id: Number(params.id)
      };
      console.log("/import endpointine gönderilen body:", JSON.stringify(body, null, 2));
      const response = await api.post("/import", body);

      if (response.data.status === "ok") {
        toast.success("İçe aktarma başarılı!");
        fetchList();
        setWallets([]);
      } else {
        toast.error("İçe aktarma sırasında hatalar oluştu!");
      }
    } catch (error) {
      toast.error("İçe aktarma sırasında bir hata oluştu!");
    } finally {
      setImporting(false);
    }
  };

  const fetchList = async () => {
    try {
      const response = await api.get(`/lists/${params.id}`);
      setList(response.data);
    } catch (error) {
      toast.error("Liste detayları yüklenirken bir hata oluştu!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [params.id]);

  const handleCreateReserve = async () => {
    try {
      await api.post("/reserves", { list_id: params.id });
      toast.success("Reserve oluşturuldu!");
    } catch (error) {
      toast.error("Reserve oluşturulurken bir hata oluştu!");
    }
  };

  // Sorgula fonksiyonu
  const handleQuery = async () => {
    setQueryLoading(true);
    try {
      const formattedDate = selectedDate.toISOString().slice(0, 10);
      await api.post("/reserves", { list_id: Number(params.id), date: formattedDate });
      toast.success("Sorgulama başarılı!");
    } catch (error) {
      toast.error("Sorgulama sırasında hata oluştu!");
    } finally {
      setQueryLoading(false);
    }
  };

  // --- Cüzdanlar ve Tokenlar için yeni gösterim ---
  // Eğer list?.wallets bir array ise (yeni backend yapısı), ona göre göster
  const isWalletArray = Array.isArray(list?.wallets);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Liste bulunamadı
        </h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 p-6">
        <div className="flex items-center gap-2 mb-4">
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
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
            Cüzdan ve Token Ekle
          </h3>
        </div>
        <form onSubmit={handleImport} className="space-y-6">
          {/* Mevcut Cüzdanlar */}
          {wallets.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium text-slate-700 dark:text-slate-300">Eklenen Cüzdanlar</h4>
              {wallets.map((wallet, index) => (
                <div key={index} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {wallet.chain.toUpperCase()} - {wallet.address}
                      </p>
                      {wallet.tokens && wallet.tokens.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {wallet.tokens.map((token, tokenIndex) => (
                            <p key={tokenIndex} className="text-sm text-slate-600 dark:text-slate-400">
                              {token.symbol} ({token.address})
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveWallet(index)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Yeni Cüzdan Ekleme Formu */}
          <div className="space-y-4">
            <h4 className="font-medium text-slate-700 dark:text-slate-300">Yeni Cüzdan Ekle</h4>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="md:basis-[25%] max-w-xs">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Chain
                </label>
                <select
                  value={currentWallet.chain}
                  onChange={(e) => setCurrentWallet(prev => ({ ...prev, chain: e.target.value }))}
                  className="w-full"
                >
                  {availableChains.map(chain => (
                    <option key={chain} value={chain}>{chain.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div className="md:basis-[37.5%]">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Cüzdan Adresi
                </label>
                <input
                  type="text"
                  value={currentWallet.address}
                  onChange={(e) => setCurrentWallet(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="0x..."
                  className="w-full"
                />
              </div>
              <div className="md:basis-[37.5%]">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Token Adresi
                </label>
                <input
                  type="text"
                  value={currentToken.address}
                  onChange={(e) => setCurrentToken(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="0x..."
                  className="w-full"
                />
              </div>
            </div>

            {/* Mevcut Tokenlar */}
            {currentWallet.tokens && currentWallet.tokens.length > 0 && (
              <div className="mt-4 space-y-2">
                <h5 className="font-medium text-slate-700 dark:text-slate-300">Eklenen Tokenlar</h5>
                {currentWallet.tokens.map((token, index) => (
                  <div key={index} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-2 rounded">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {token.symbol.toUpperCase()} {token.name} ({token.address})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveToken(index)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Cüzdan Ekleme Formu */}
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={handleAddToken}
                  className="w-full flex items-center justify-center px-4 py-2.5 bg-gradient-to-tr from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white font-medium rounded-lg shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  Token Ekle
                </button>

                <button
                  type="button"
                  onClick={handleAddWallet}
                  className="w-full flex items-center justify-center px-4 py-2.5 bg-gradient-to-tr from-violet-500 to-violet-700 hover:from-violet-600 hover:to-violet-800 text-white font-medium rounded-lg shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  Cüzdan Ekle
                </button>

                <button
                  type="button"
                  onClick={handleImport}
                  disabled={importing || wallets.length === 0}
                  className="w-full flex items-center justify-center px-4 py-2.5 bg-gradient-to-tr from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-medium rounded-lg shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {importing ? "İçe Aktarılıyor..." : "İçe Aktar"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
            Kayıtlı Cüzdan ve Tokenlar
          </h3>
          {isWalletArray && list.wallets.length > 0 && (
            <div className="flex items-center gap-2">
              <DatePicker
                selected={selectedDate}
                onChange={date => setSelectedDate(date as Date)}
                dateFormat="yyyy-MM-dd"
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                popperPlacement="bottom-end"
                calendarClassName="!z-50"
                minDate={new Date(2025, 0, 1)}
                maxDate={(() => { const d = new Date(); d.setDate(d.getDate() - 1); d.setHours(0,0,0,0); return d; })()}
              />
              <button
                type="button"
                onClick={handleQuery}
                disabled={queryLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-tr from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-semibold rounded-lg shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
              >
                {queryLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-1" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Sorgula
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                    </svg>
                    Sorgula
                  </>
                )}
              </button>
            </div>
          )}
        </div>
        {isWalletArray ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {list.wallets.map((wallet: any, idx: number) => (
              <div key={wallet.address + wallet.chain} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                <div className="mb-2">
                  <span className="font-bold text-blue-700 dark:text-blue-300">{wallet.chain.toUpperCase()}</span>
                  <span className="ml-2 font-mono text-slate-700 dark:text-slate-200 break-all">{wallet.address}</span>
                </div>
                <div className="mt-2">
                  <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Tokenlar:</div>
                  {Array.isArray(wallet.tokens) && wallet.tokens.length > 0 ? (
                    <ul className="space-y-1">
                      {wallet.tokens.map((token: any) => (
                        <li key={token.address} className="flex flex-col bg-white/80 dark:bg-slate-900/60 rounded px-2 py-1">
                          <span className="font-medium text-blue-600 dark:text-blue-300">{token.symbol}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">{token.name}</span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">{token.address}</span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">Decimals: {token.decimals}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-slate-400 italic">Bu cüzdanda token yok</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-slate-400 italic">Kayıtlı cüzdan bulunamadı</div>
        )}
      </div>
    </div>
  );
} 