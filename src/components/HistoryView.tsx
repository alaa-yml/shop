import React from 'react';
import { History, Receipt, Trash2, ArrowUpRight } from 'lucide-react';
import { TransactionRecord } from '../types';
import { formatDA } from '../utils/format';

interface HistoryViewProps {
  transactions: TransactionRecord[];
  onClearHistory: () => void;
  onSelectReceipt: (record: TransactionRecord) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  transactions,
  onClearHistory,
  onSelectReceipt
}) => {
  const totalVolume = transactions.reduce((sum, t) => sum + t.total, 0);

  if (transactions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
          <History className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Aucun Historique de Calcul
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Les tickets et calculs terminés apparaîtront ici pour consultation et réimpression.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Historique des Tickets & Calculs
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {transactions.length} ticket{transactions.length > 1 ? 's' : ''} enregistré{transactions.length > 1 ? 's' : ''} · Total cumulé : <span className="font-mono font-bold text-emerald-600">{formatDA(totalVolume)}</span>
          </p>
        </div>

        <button
          onClick={onClearHistory}
          className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Effacer l'historique</span>
        </button>
      </div>

      {/* Grid of Receipts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-xs hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-mono">{tx.id}</span>
              <span>{tx.timestamp}</span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="font-semibold text-slate-700 dark:text-slate-300">
                {tx.itemCount} article{tx.itemCount > 1 ? 's' : ''} :
              </div>
              <ul className="text-slate-500 dark:text-slate-400 space-y-0.5 truncate">
                {tx.items.slice(0, 3).map((it, idx) => (
                  <li key={idx} className="truncate">
                    • {it.quantity}x {it.product.name}
                  </li>
                ))}
                {tx.items.length > 3 && (
                  <li className="text-[11px] text-slate-400 italic">
                    +{tx.items.length - 3} autre(s) article(s)...
                  </li>
                )}
              </ul>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase text-slate-400 font-semibold">Total</div>
                <div className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
                  {formatDA(tx.total)}
                </div>
              </div>

              <button
                onClick={() => onSelectReceipt(tx)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Voir Ticket</span>
                <ArrowUpRight className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
