import React, { useState } from 'react';
import { 
  Trash2, 
  Plus, 
  Minus, 
  Receipt, 
  RotateCcw, 
  CheckCircle, 
  DollarSign, 
  Coins, 
  ScanBarcode, 
  ShoppingBag,
  Percent
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CartItem, TransactionRecord } from '../types';
import { formatDA, calculateAlgerianChange } from '../utils/format';
import { playCashChime } from '../utils/audio';

interface BasketCalculatorViewProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onUpdateItemPrice: (id: string, newPrice: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onSaveTransaction: (record: TransactionRecord) => void;
  onSwitchToScanner: () => void;
}

export const BasketCalculatorView: React.FC<BasketCalculatorViewProps> = ({
  items,
  onUpdateQuantity,
  onUpdateItemPrice,
  onRemoveItem,
  onClearCart,
  onSaveTransaction,
  onSwitchToScanner
}) => {
  // Discount & cash tendered states
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [cashTendered, setCashTendered] = useState<string>('');
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [lastFinishedRecord, setLastFinishedRecord] = useState<TransactionRecord | null>(null);

  // Calculations
  const rawSubtotal = items.reduce((sum, item) => {
    const unitPrice = item.customPrice ?? item.product.price;
    return sum + (unitPrice * item.quantity);
  }, 0);

  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const discountAmount = Math.round((rawSubtotal * discountPercent) / 100);
  const grandTotal = Math.max(0, rawSubtotal - discountAmount);

  const numericTendered = parseFloat(cashTendered) || 0;
  const changeResult = numericTendered > 0 ? calculateAlgerianChange(grandTotal, numericTendered) : null;

  // Finish transaction
  const handleCompleteTransaction = () => {
    if (items.length === 0) return;

    playCashChime();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });

    const record: TransactionRecord = {
      id: `ticket-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toLocaleString('fr-DZ', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }),
      items: [...items],
      itemCount: totalItemCount,
      subtotal: rawSubtotal,
      discount: discountAmount,
      total: grandTotal,
      cashTendered: numericTendered > 0 ? numericTendered : grandTotal,
      changeDue: changeResult ? changeResult.changeAmount : 0
    };

    onSaveTransaction(record);
    setLastFinishedRecord(record);
    setShowReceiptModal(true);
  };

  // If basket is empty
  if (items.length === 0 && !showReceiptModal) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Votre Panier de Calcul est Vide
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Scannez vos produits (Produit 1, Produit 2, Produit 3...) pour calculer le prix total instantanément en Dinars Algériens (DA).
          </p>
        </div>
        <button
          onClick={onSwitchToScanner}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer"
        >
          <ScanBarcode className="w-5 h-5" />
          <span>Commencer le Scan de Produits</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Title & Top Action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Calculateur Total des Produits
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {totalItemCount} article{totalItemCount > 1 ? 's' : ''} scanné{totalItemCount > 1 ? 's' : ''} ({items.length} produit{items.length > 1 ? 's' : ''} distinct{items.length > 1 ? 's' : ''})
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onSwitchToScanner}
            className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ScanBarcode className="w-4 h-4" />
            <span>Scanner d'autres Produits</span>
          </button>

          <button
            onClick={onClearCart}
            className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            title="Vider le panier"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Réinitialiser</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Items List Left (7 cols) / Total & Cash Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: List of Scanned Products */}
        <div className="lg:col-span-7 space-y-3">
          
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span>Articles & Prix Unitaire (DA)</span>
              <span>Total Ligne</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((item, index) => {
                const effectivePrice = item.customPrice ?? item.product.price;
                const lineTotal = effectivePrice * item.quantity;

                return (
                  <div 
                    key={item.id} 
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Item Information */}
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400">
                          #{index + 1}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {item.product.name}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>{item.product.brand}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-[11px] text-slate-400">{item.product.barcode}</span>
                      </div>

                      {/* Inline Editable Unit Price */}
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Prix unitaire :</span>
                        <input
                          type="number"
                          step="5"
                          min="0"
                          value={effectivePrice}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              onUpdateItemPrice(item.id, val);
                            }
                          }}
                          className="w-24 px-2 py-0.5 text-xs font-mono font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:ring-1 focus:ring-emerald-500"
                        />
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">DA</span>
                      </div>
                    </div>

                    {/* Quantity Stepper & Line Total */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                      
                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          className="w-7 h-7 rounded bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <span className="w-8 text-center text-xs font-mono font-bold text-slate-900 dark:text-white">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="w-7 h-7 rounded bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Line Total in DA */}
                      <div className="text-right min-w-24">
                        <div className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums font-mono">
                          {formatDA(lineTotal)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.quantity} × {effectivePrice} DA
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Supprimer la ligne"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 text-right pr-2">
            Astuce : vous pouvez ajuster directement le prix unitaire ou la quantité de chaque produit.
          </div>

        </div>

        {/* Right Column: Grand Total, Discount, Cash Given & Change */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Summary Box */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-sm">
            
            <h3 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              Récapitulatif du Total / الحساب الإجمالي
            </h3>

            {/* Calculations Breakdown */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Sous-total ({totalItemCount} articles) :</span>
                <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-200">
                  {formatDA(rawSubtotal)}
                </span>
              </div>

              {/* Discount / Remise option */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-slate-400" />
                  <span>Remise (%) :</span>
                </span>
                <div className="flex items-center gap-1">
                  {[0, 5, 10].map(pct => (
                    <button
                      key={pct}
                      onClick={() => setDiscountPercent(pct)}
                      className={`px-2 py-0.5 text-xs font-semibold rounded ${
                        discountPercent === pct
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Montant de la remise :</span>
                  <span className="font-mono tabular-nums">-{formatDA(discountAmount)}</span>
                </div>
              )}

              {/* Grand Total Display */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-baseline justify-between">
                <div>
                  <div className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                    Total Net à Payer
                  </div>
                  <div className="text-xs text-slate-400">
                    Dinars Algériens (DA)
                  </div>
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-emerald-700 dark:text-emerald-400 tracking-tight font-mono tabular-nums">
                  {formatDA(grandTotal)}
                </div>
              </div>
            </div>

            {/* Cash Tendered & Algerian Change Calculator */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-500" />
                <span>Montant Reçu / Donné par le Client (DA) :</span>
              </label>

              <div className="flex gap-2">
                <input
                  type="number"
                  step="50"
                  min="0"
                  placeholder="Ex: 2000, 3000..."
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
                {/* Fast Tendered Buttons (Common Algerian Banknotes) */}
                {[1000, 2000].map(val => (
                  <button
                    key={val}
                    onClick={() => setCashTendered(val.toString())}
                    className="px-2.5 py-1 text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-md shrink-0"
                  >
                    {val}
                  </button>
                ))}
              </div>

              {/* Monnaie à rendre breakdown */}
              {changeResult && changeResult.changeAmount > 0 && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                      Monnaie à rendre :
                    </span>
                    <span className="text-base font-extrabold font-mono text-emerald-700 dark:text-emerald-400">
                      {formatDA(changeResult.changeAmount)}
                    </span>
                  </div>

                  {changeResult.breakdown.length > 0 && (
                    <div className="text-[11px] text-emerald-800 dark:text-emerald-300 space-y-1 pt-1 border-t border-emerald-200/60 dark:border-emerald-800/40">
                      <div className="font-medium text-emerald-950 dark:text-emerald-200">
                        Détail des coupures :
                      </div>
                      <div className="grid grid-cols-2 gap-1 font-mono">
                        {changeResult.breakdown.map((b, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>{b.label}:</span>
                            <span className="font-bold">× {b.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions: Save & Receipt */}
            <div className="pt-2 space-y-2">
              <button
                onClick={handleCompleteTransaction}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Valider le Total & Ticket de Caisse</span>
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Printable Receipt Modal */}
      {showReceiptModal && lastFinishedRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Ticket de Caisse / وصل الشراء
                </h3>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                Fermer
              </button>
            </div>

            {/* Printable Paper View */}
            <div 
              id="printable-receipt" 
              className="bg-slate-50 dark:bg-slate-800/80 p-5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-mono space-y-3"
            >
              <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-slate-300 dark:border-slate-700">
                <div className="font-bold text-sm tracking-widest uppercase">ÉPICERIE MODERNE DZ</div>
                <div className="text-slate-500">Produits Algériens Authentiques</div>
                <div className="text-[10px] text-slate-400">{lastFinishedRecord.timestamp}</div>
                <div className="text-[10px] text-slate-400">N° {lastFinishedRecord.id}</div>
              </div>

              {/* Items List */}
              <div className="space-y-1.5 py-1">
                {lastFinishedRecord.items.map((it, i) => (
                  <div key={i} className="flex justify-between items-baseline">
                    <span className="truncate pr-2">
                      {it.quantity}x {it.product.name}
                    </span>
                    <span className="font-bold shrink-0">
                      {formatDA((it.customPrice ?? it.product.price) * it.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total lines */}
              <div className="pt-2 border-t border-dashed border-slate-300 dark:border-slate-700 space-y-1">
                <div className="flex justify-between">
                  <span>Articles totaux :</span>
                  <span>{lastFinishedRecord.itemCount}</span>
                </div>
                {lastFinishedRecord.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Remise accordée :</span>
                    <span>-{formatDA(lastFinishedRecord.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-300 dark:border-slate-700">
                  <span>TOTAL :</span>
                  <span>{formatDA(lastFinishedRecord.total)}</span>
                </div>

                {lastFinishedRecord.cashTendered && lastFinishedRecord.cashTendered > 0 && (
                  <>
                    <div className="flex justify-between pt-1 text-[11px] text-slate-500">
                      <span>Espèces reçues :</span>
                      <span>{formatDA(lastFinishedRecord.cashTendered)}</span>
                    </div>
                    {lastFinishedRecord.changeDue && lastFinishedRecord.changeDue > 0 ? (
                      <div className="flex justify-between text-[11px] font-bold text-emerald-600">
                        <span>Monnaie rendue :</span>
                        <span>{formatDA(lastFinishedRecord.changeDue)}</span>
                      </div>
                    ) : null}
                  </>
                )}
              </div>

              <div className="text-center pt-3 text-[10px] text-slate-400 border-t border-dashed border-slate-300 dark:border-slate-700">
                Merci de votre visite · شكراً لزيارتكم
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
              >
                <Receipt className="w-4 h-4" />
                <span>Imprimer Ticket</span>
              </button>

              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  onClearCart();
                  onSwitchToScanner();
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <ScanBarcode className="w-4 h-4" />
                <span>Nouveau Calcul</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
