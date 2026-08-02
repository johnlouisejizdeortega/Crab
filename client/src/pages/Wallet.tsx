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
      <h1 className="text-xl font-bold mb-4">Wallet</h1>

      <div className="rounded-2xl p-5 text-white bg-neutral-900">
        <p className="text-[13px] text-white/60">Available balance</p>
        <p className="text-3xl leading-none font-bold mt-1.5 tabular-nums">{money(balance)}</p>
        <div className="mt-5 flex gap-2">
          {[10, 25, 50].map((a) => (
            <button
              key={a}
              disabled={busy}
              onClick={() => topup(a)}
              className="btn bg-white/10 hover:bg-white/20 text-white !py-1.5 !px-3 text-[13px]"
            >
              <Plus size={15} /> {money(a)}
            </button>
          ))}
        </div>
      </div>

      <h2 className="section-title mt-6">Transactions</h2>
      {loading ? (
        <p className="text-slate-400 px-4">Loading…</p>
      ) : txns.length === 0 ? (
        <div className="card p-8 text-center text-slate-500">No transactions yet.</div>
      ) : (
        <div className="list-group divide-y divide-black/[0.06]">
          {txns.map((t) => (
            <div key={t.id} className="list-row">
              <div
                className={`app-chip h-8 w-8 shrink-0 ${
                  t.amount >= 0 ? 'bg-emerald-500 text-white' : 'bg-neutral-200 text-neutral-600'
                }`}
              >
                {t.amount >= 0 ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[13px]">{KIND_LABEL[t.kind] ?? t.kind}</p>
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
