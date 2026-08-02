import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../store/auth';
import { money, timeAgo } from '../lib/format';
import { Plus, ArrowUpRight, ArrowDownLeft } from '../components/icons';
import type { Transaction } from '../types';

const KIND_LABEL: Record<string, string> = {
  TOPUP: 'Top-up',
  RIDE_PAYMENT: 'Ride fare',
  RIDE_EARNING: 'Ride earning',
};

export default function Wallet() {
  const { refresh } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    const d = await api.get<{ balance: number; transactions: Transaction[] }>('/wallet');
    setBalance(d.balance);
    setTxns(d.transactions);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function topup(amount: number) {
    setBusy(true);
    try {
      const d = await api.post<{ balance: number }>('/wallet/topup', { amount });
      setBalance(d.balance);
      await load();
      refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl w-full px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Wallet</h1>

      <div className="rounded-2xl p-6 sm:p-7 text-white bg-brand-500">
        <p className="text-sm text-white/80">Available balance</p>
        <p className="text-[2.75rem] leading-none font-bold mt-2 tabular-nums">{money(balance)}</p>
        <div className="mt-6 flex gap-2">
          {[10, 25, 50].map((a) => (
            <button
              key={a}
              disabled={busy}
              onClick={() => topup(a)}
              className="btn bg-white/20 hover:bg-white/30 text-white text-sm !py-2.5"
            >
              <Plus size={16} /> {money(a)}
            </button>
          ))}
        </div>
      </div>

      <h2 className="section-title mt-8">Transactions</h2>
      {loading ? (
        <p className="text-slate-400 px-4">Loading…</p>
      ) : txns.length === 0 ? (
        <div className="card p-8 text-center text-slate-500">No transactions yet.</div>
      ) : (
        <div className="list-group divide-y divide-black/[0.06]">
          {txns.map((t) => (
            <div key={t.id} className="list-row">
              <div
                className={`app-chip h-9 w-9 shrink-0 ${
                  t.amount >= 0 ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              >
                {t.amount >= 0 ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[15px]">{KIND_LABEL[t.kind] ?? t.kind}</p>
                <p className="text-xs text-slate-400 truncate">
                  {t.note && t.note !== (KIND_LABEL[t.kind] ?? '') ? `${t.note} · ` : ''}
                  {timeAgo(t.createdAt)}
                </p>
              </div>
              <div className={`font-semibold tabular-nums ${t.amount >= 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                {t.amount >= 0 ? '+' : ''}
                {money(t.amount)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
