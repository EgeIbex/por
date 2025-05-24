"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/utils/api";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import chainValidations from "@/assets/chainValidations.json";

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
  const [wallets, setWallets] = useState<any[]>([]);
  const [currentWallet, setCurrentWallet] = useState({ chain: '', address: '' });
  const [showTokenModal, setShowTokenModal] = useState<{ open: boolean, walletIdx: number | null }>({ open: false, walletIdx: null });
  const [tokenAddressInput, setTokenAddressInput] = useState('');
  const [tokenLoading, setTokenLoading] = useState(false);
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
  const [chains, setChains] = useState<{ name: string; display_name: string }[]>([]);

  // Token bilgilerini otomatik dolduracak gerçek API fonksiyonu
  async function fetchTokenInfo(address: string, chain: string) {
    // Demo API key ve contract info endpoint
    const demoApiKey = "CG-eDGt7ohGuQyXNjvZAGqT8PSm";
    // Chain id'yi endpointte kullan (avax_cchain ise avax olarak düzelt)
    const apiChain = chain === "avax_cchain" ? "avalanche" : chain;
    const url = `https://api.coingecko.com/api/v3/coins/${apiChain}/contract/${address}`;
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
        decimals: data.detail_platforms?.[apiChain]?.decimal_place || 18
      };
    } catch (err) {
      console.log("Demo API isteği hatası:", err);
      return { name: "", symbol: "", decimals: 18 };
    }
  }

  // Cüzdan ekle
  const handleAddWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWallet.chain) {
      toast.error('Lütfen bir chain seçin!');
      return;
    }
    if (!currentWallet.address) {
      toast.error('Lütfen bir cüzdan adresi girin!');
      return;
    }

    const validation = chainValidations[currentWallet.chain as keyof typeof chainValidations];
    if (!validation) {
      toast.error('Geçersiz chain!');
      return;
    }

    const regex = new RegExp(validation.regex);
    if (!regex.test(currentWallet.address)) {
      toast.error('Geçersiz cüzdan adresi!');
      return;
    }

    setWallets(prev => [...prev, { ...currentWallet, tokens: [] }]);
    setCurrentWallet({ chain: '', address: '' });
  };

  // Token ekle popup aç
  const openTokenModal = (walletIdx: number) => {
    setShowTokenModal({ open: true, walletIdx });
    setTokenAddressInput('');
  };

  // Token ekle işlemi
  const handleAddTokenToWallet = async () => {
    if (!tokenAddressInput || showTokenModal.walletIdx === null) return;
    
    const wallet = wallets[showTokenModal.walletIdx];
    const validation = chainValidations[wallet.chain as keyof typeof chainValidations];
    
    if (!validation) {
      toast.error('Geçersiz chain!');
      return;
    }

    const regex = new RegExp(validation.regex);
    if (!regex.test(tokenAddressInput)) {
      toast.error('Geçersiz token adresi!');
      return;
    }

    setTokenLoading(true);
    try {
      const info = await fetchTokenInfo(tokenAddressInput, wallet.chain);
      setWallets(prev => prev.map((w, i) => i === showTokenModal.walletIdx ? {
        ...w,
        tokens: [...(w.tokens || []), { address: tokenAddressInput, ...info }]
      } : w));
      setShowTokenModal({ open: false, walletIdx: null });
    } catch (err) {
      toast.error('Token bilgisi alınamadı!');
    } finally {
      setTokenLoading(false);
    }
  };

  // Token sil
  const handleRemoveToken = (walletIdx: number, tokenIdx: number) => {
    setWallets(prev => prev.map((w: any, i: number) => i === walletIdx ? {
      ...w,
      tokens: w.tokens.filter((_: any, tIdx: number) => tIdx !== tokenIdx)
    } : w));
  };

  // Cüzdan sil
  const handleRemoveWallet = (walletIdx: number) => {
    setWallets(prev => prev.filter((_, i) => i !== walletIdx));
  };

  // İçe Aktar
  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (wallets.length === 0) return;
    setImporting(true);
    try {
      const body = {
        wallets: wallets.map(w => ({
          chain: w.chain,
          address: w.address,
          tokens: w.tokens
        })),
        list_id: Number(params.id)
      };
      await api.post('/import', body);
      toast.success('İçe aktarma başarılı!');
      setWallets([]);
      fetchList();
    } catch (error) {
      toast.error('İçe aktarma sırasında bir hata oluştu!');
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

  useEffect(() => {
    const fetchChains = async () => {
      try {
        const response = await api.get("/chains");
        if (response.data && Array.isArray(response.data.historical)) {
          setChains(response.data.historical);
        } else {
          setChains([]);
        }
      } catch (error) {
        toast.error("Chain listesi yüklenemedi!");
        setChains([]);
      }
    };
    fetchChains();
  }, []);

  // Sorgula fonksiyonu
  const handleQuery = async () => {
    setQueryLoading(true);
    try {
      const today = new Date();
      today.setHours(0,0,0,0);
      const isToday = selectedDate.getTime() === today.getTime();
      let response;
      if (isToday) {
        response = await api.post("/reserves", { list_id: Number(params.id) });
      } else {
        const formattedDate = `${selectedDate.getDate().toString().padStart(2, '0')}.${(selectedDate.getMonth()+1).toString().padStart(2, '0')}.${selectedDate.getFullYear()}`;
        response = await api.post("/reserves", { list_id: Number(params.id), date: formattedDate });
      }
      toast.success("Sorgulama başarılı!");
      if (response.data && response.data.snapshot_id) {
        router.push(`/dashboard/snapshots/${response.data.snapshot_id}`);
      }
    } catch (error) {
      toast.error("Sorgulama sırasında hata oluştu!");
    } finally {
      setQueryLoading(false);
    }
  };

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
    <div className="space-y-8">
      {/* Cüzdan Ekleme Formu */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 p-6 mb-6">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          Cüzdan Ekle
        </h3>
        <form onSubmit={handleAddWallet} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="md:w-1/4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Chain</label>
            <select
              value={currentWallet.chain}
              onChange={e => {
                const chain = e.target.value;
                setCurrentWallet(prev => ({ 
                  ...prev, 
                  chain,
                  address: ''
                }));
              }}
              className="w-full"
            >
              <option value="">Chain seçin</option>
              {chains.map(chain => (
                <option key={chain.name} value={chain.name}>{chain.display_name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cüzdan Adresi</label>
            <input
              type="text"
              value={currentWallet.address}
              onChange={e => setCurrentWallet(prev => ({ ...prev, address: e.target.value }))}
              placeholder={currentWallet.chain ? chainValidations[currentWallet.chain as keyof typeof chainValidations]?.demoAddress : "Chain seçin"}
              className="w-full"
              disabled={!currentWallet.chain}
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-gradient-to-tr from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-semibold rounded-lg shadow-sm transition">Ekle</button>
        </form>
      </div>

      {/* Eklenen Cüzdanlar ve Tokenlar */}
      {wallets.length > 0 && (
        <div className="space-y-6 mb-6">
          {wallets.map((wallet, wIdx) => (
            <div key={wIdx} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg shadow flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-blue-700 dark:text-blue-300 mr-2">{chains.find(c => c.name === wallet.chain)?.display_name || wallet.chain.toUpperCase()}</span>
                  <span className="font-mono text-slate-700 dark:text-slate-200 break-all">{wallet.address}</span>
                </div>
                <div className="flex gap-2">
                  {wallet.chain !== 'bitcoin' && (
                    <button onClick={() => openTokenModal(wIdx)} className="px-3 py-1 bg-gradient-to-tr from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white rounded-lg text-sm font-semibold shadow transition">Token Ekle</button>
                  )}
                  <button onClick={() => handleRemoveWallet(wIdx)} className="px-3 py-1 bg-gradient-to-tr from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white rounded-lg text-sm font-semibold shadow transition">Sil</button>
                </div>
              </div>
              {wallet.tokens && wallet.tokens.length > 0 && (
                <div className="mt-2">
                  <div className="font-medium text-slate-700 dark:text-slate-300 mb-1">Tokenlar:</div>
                  <ul className="flex flex-wrap gap-2">
                    {wallet.tokens.map((token: any, tIdx: number) => (
                      <li key={tIdx} className="bg-white dark:bg-slate-900 rounded px-3 py-1 flex items-center gap-2 shadow text-sm">
                        <span className="font-semibold text-blue-600 dark:text-blue-300">{token.symbol}</span>
                        <span className="text-slate-500 dark:text-slate-400">{token.name}</span>
                        <span className="text-slate-400 dark:text-slate-500">({token.address})</span>
                        <span className="text-slate-400 dark:text-slate-500">Decimals: {token.decimals}</span>
                        <button onClick={() => handleRemoveToken(wIdx, tIdx)} className="ml-2 text-red-500 hover:text-red-700">×</button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Token Ekleme Popup */}
      {showTokenModal.open && wallets[showTokenModal.walletIdx!]?.chain !== 'bitcoin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={e => { if (e.target === e.currentTarget) setShowTokenModal({ open: false, walletIdx: null }); }}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 w-full max-w-2xl relative animate-fade-in">
            <button
              onClick={() => setShowTokenModal({ open: false, walletIdx: null })}
              className="absolute top-4 right-4 text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 text-xl"
              aria-label="Kapat"
            >×</button>
            
            <div className="space-y-6">
              {/* Başlık ve Cüzdan Bilgileri */}
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Token Ekle</h3>
                {showTokenModal.walletIdx !== null && (
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Chain:</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-300">
                        {chains.find(c => c.name === wallets[showTokenModal.walletIdx!].chain)?.display_name || wallets[showTokenModal.walletIdx!].chain.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Cüzdan Adresi:</span>
                      <span className="font-mono text-sm text-slate-700 dark:text-slate-200 break-all">
                        {wallets[showTokenModal.walletIdx!].address}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Token Adresi Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Token Adresi
                </label>
                <input
                  type="text"
                  placeholder={showTokenModal.walletIdx !== null ? chainValidations[wallets[showTokenModal.walletIdx].chain as keyof typeof chainValidations]?.demoAddress : "Token adresi"}
                  value={tokenAddressInput}
                  onChange={e => setTokenAddressInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Lütfen geçerli bir token adresi girin. Adres, seçili chain'in formatına uygun olmalıdır.
                </p>
              </div>

              {/* Butonlar */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowTokenModal({ open: false, walletIdx: null })}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium rounded-lg transition"
                >
                  İptal
                </button>
                <button
                  onClick={handleAddTokenToWallet}
                  disabled={tokenLoading || !tokenAddressInput}
                  className="px-6 py-2 bg-gradient-to-tr from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-semibold rounded-lg shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {tokenLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Ekleniyor...
                    </span>
                  ) : (
                    'Token Ekle'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* İçe Aktar Butonu */}
      {wallets.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleImport}
            disabled={importing}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? 'Tamamlanıyor...' : 'Listeyi Tamamla'}
          </button>
        </div>
      )}

      {/* Kayıtlı Cüzdan ve Tokenlar + Sorgulama Alanı */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
            Kayıtlı Cüzdan ve Tokenlar
          </h3>
          {Array.isArray(list.wallets) && list.wallets.length > 0 && (
            <div className="flex items-center gap-2">
              <DatePicker
                selected={selectedDate}
                onChange={date => setSelectedDate(date as Date)}
                dateFormat="yyyy-MM-dd"
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                popperPlacement="bottom-end"
                calendarClassName="!z-50"
                minDate={new Date(2025, 0, 1)}
                maxDate={(() => { const d = new Date(); d.setHours(0,0,0,0); return d; })()}
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
        {/* Açıklama */}
        {Array.isArray(list.wallets) && list.wallets.length > 0 && (
          <div className="flex justify-end">
            <span className="italic text-sm text-slate-400">*bu günün tarihi seçilir ise anlık olarak sorgu atılır</span>
          </div>
        )}
        {Array.isArray(list.wallets) ? (
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