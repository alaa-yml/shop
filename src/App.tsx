/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ScanBarcode, 
  ShoppingCart, 
  Moon, 
  Sun, 
  Receipt, 
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Product, CartItem, TransactionRecord, ActiveTab } from './types';
import { DEFAULT_ALGERIAN_PRODUCTS } from './data/defaultProducts';
import { Header } from './components/Header';
import { ScannerView } from './components/ScannerView';
import { BasketCalculatorView } from './components/BasketCalculatorView';
import { CatalogView } from './components/CatalogView';
import { HistoryView } from './components/HistoryView';
import { formatDA } from './utils/format';

const STORAGE_KEYS = {
  PRODUCTS: 'prixdz_products_v1',
  CART: 'prixdz_cart_v1',
  HISTORY: 'prixdz_history_v1',
  THEME: 'prixdz_theme_v1'
};

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Apply dark class to document
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(STORAGE_KEYS.THEME, 'light');
    }
  }, [isDark]);

  // Catalog state
  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return DEFAULT_ALGERIAN_PRODUCTS;
  });

  // Sync products to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.CART);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return [];
  });

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cartItems));
  }, [cartItems]);

  // History state
  const [transactions, setTransactions] = useState<TransactionRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return [];
  });

  // Sync history to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(transactions));
  }, [transactions]);

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<ActiveTab>('scanner');
  const [viewingReceipt, setViewingReceipt] = useState<TransactionRecord | null>(null);

  // Cart totals
  const totalCartCount = cartItems.reduce((acc, it) => acc + it.quantity, 0);
  const totalCartAmount = cartItems.reduce((acc, it) => {
    const p = it.customPrice ?? it.product.price;
    return acc + (p * it.quantity);
  }, 0);

  // Cart Actions
  const handleAddToCart = (product: Product, quantity = 1, customPrice?: number) => {
    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
          customPrice: customPrice ?? updated[existingIndex].customPrice
        };
        return updated;
      } else {
        const newItem: CartItem = {
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          product,
          quantity,
          customPrice,
          addedAt: Date.now()
        };
        return [...prev, newItem];
      }
    });
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter((it): it is CartItem => it !== null);
    });
  };

  const handleUpdateItemPrice = (id: string, newPrice: number) => {
    setCartItems(prev => {
      return prev.map(item => {
        if (item.id === id) {
          return { ...item, customPrice: newPrice };
        }
        return item;
      });
    });
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Product Catalog Actions
  const handleUpdateProductPrice = (productId: string, newPrice: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return { ...p, price: newPrice, updatedAt: new Date().toISOString().split('T')[0] };
      }
      return p;
    }));
  };

  const handleUpdateProduct = (updated: Product) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleAddNewProduct = (newProduct: Product) => {
    setProducts(prev => [newProduct, ...prev]);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const handleResetCatalog = () => {
    if (window.confirm('Voulez-vous rétablir le catalogue d’origine avec les prix officiels des produits algériens ?')) {
      setProducts(DEFAULT_ALGERIAN_PRODUCTS);
    }
  };

  const handleBatchAdjustPrices = (percent: number, roundTo: number) => {
    setProducts(prev => prev.map(p => {
      const factor = 1 + (percent / 100);
      let calculated = p.price * factor;
      if (roundTo > 1) {
        calculated = Math.round(calculated / roundTo) * roundTo;
      } else {
        calculated = Math.round(calculated);
      }
      return {
        ...p,
        price: Math.max(5, calculated),
        updatedAt: new Date().toISOString().split('T')[0]
      };
    }));
  };

  // Transaction Save
  const handleSaveTransaction = (record: TransactionRecord) => {
    setTransactions(prev => [record, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors flex flex-col">
      
      {/* Top Header Contract */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        cartCount={totalCartCount}
        totalAmount={totalCartAmount}
        onQuickNewScan={() => setActiveTab('scanner')}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-20">
        
        {/* Subtle Hero Banner on Scanner Page */}
        {activeTab === 'scanner' && (
          <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Identification Code-Barres GS1 Algérie (613)</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Identificateur de Prix & Calculateur d'Achats
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
                    Scannez vos produits algériens pour afficher le prix unitaire, personnalisez la tarification automatique et calculez le montant total de l'ensemble de vos articles.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => setIsDark(!isDark)}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    title={isDark ? 'Mode clair' : 'Mode sombre'}
                  >
                    {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                  </button>

                  <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl px-4 py-2 flex items-center gap-3">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">
                        Total en Cours
                      </div>
                      <div className="text-lg font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                        {formatDA(totalCartAmount)}
                      </div>
                    </div>
                    {totalCartCount > 0 && (
                      <button
                        onClick={() => setActiveTab('calculator')}
                        className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer"
                        title="Ouvrir le calculateur"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Dynamic Views */}
        {activeTab === 'scanner' && (
          <ScannerView
            products={products}
            onAddToCart={handleAddToCart}
            onUpdateProductPrice={handleUpdateProductPrice}
            onAddNewProduct={handleAddNewProduct}
            cartCount={totalCartCount}
            onOpenCart={() => setActiveTab('calculator')}
          />
        )}

        {activeTab === 'calculator' && (
          <BasketCalculatorView
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onUpdateItemPrice={handleUpdateItemPrice}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onSaveTransaction={handleSaveTransaction}
            onSwitchToScanner={() => setActiveTab('scanner')}
          />
        )}

        {activeTab === 'catalog' && (
          <CatalogView
            products={products}
            onUpdateProduct={handleUpdateProduct}
            onAddNewProduct={handleAddNewProduct}
            onDeleteProduct={handleDeleteProduct}
            onResetCatalog={handleResetCatalog}
            onBatchAdjustPrices={handleBatchAdjustPrices}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            transactions={transactions}
            onClearHistory={() => setTransactions([])}
            onSelectReceipt={(rec) => setViewingReceipt(rec)}
          />
        )}

      </main>

      {/* Persistent Bottom Bar when basket has items and not currently on calculator */}
      {cartItems.length > 0 && activeTab !== 'calculator' && (
        <div className="fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 sm:px-8 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                {totalCartCount}
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {cartItems.length} produit{cartItems.length > 1 ? 's' : ''} scanné{cartItems.length > 1 ? 's' : ''}
                </div>
                <div className="text-base font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
                  Total : {formatDA(totalCartAmount)}
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('calculator')}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-2 cursor-pointer transition-colors active:scale-98"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Calculer le Total & Monnaie</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal for viewing past receipt */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <span>Ticket #{viewingReceipt.id}</span>
              </h3>
              <button onClick={() => setViewingReceipt(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 font-mono text-xs space-y-2">
              <div className="text-center font-bold pb-2 border-b border-slate-300 dark:border-slate-700">
                <div>ÉPICERIE MODERNE DZ</div>
                <div className="text-[10px] text-slate-400">{viewingReceipt.timestamp}</div>
              </div>

              <div className="space-y-1 py-1">
                {viewingReceipt.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{it.quantity}x {it.product.name}</span>
                    <span className="font-bold">{formatDA((it.customPrice ?? it.product.price) * it.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-300 dark:border-slate-700 font-bold flex justify-between text-sm">
                <span>TOTAL :</span>
                <span>{formatDA(viewingReceipt.total)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold rounded-lg hover:bg-slate-800"
              >
                Imprimer
              </button>
              <button
                onClick={() => setViewingReceipt(null)}
                className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-200"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white">PrixDz</span>
            <span>—</span>
            <span>Scanner de Code-Barres & Calculateur de Prix pour Produits Algériens</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            Conforme GS1 Algérie 613 · Monnaie officielle : Dinar Algérien (DA / د.ج)
          </div>
        </div>
      </footer>

    </div>
  );
}
