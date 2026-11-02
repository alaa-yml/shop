import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Sparkles, 
  RotateCcw, 
  Tag, 
  Check, 
  Filter, 
  Download,
  Barcode as BarcodeIcon,
  X
} from 'lucide-react';
import { Product } from '../types';
import { CATEGORIES } from '../data/defaultProducts';
import { BarcodeVisual } from './BarcodeVisual';
import { formatDA } from '../utils/format';

interface CatalogViewProps {
  products: Product[];
  onUpdateProduct: (product: Product) => void;
  onAddNewProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onResetCatalog: () => void;
  onBatchAdjustPrices: (percent: number, roundTo: number) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  products,
  onUpdateProduct,
  onAddNewProduct,
  onDeleteProduct,
  onResetCatalog,
  onBatchAdjustPrices
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Toutes les catégories');
  
  // Modal states
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [shelfTagProduct, setShelfTagProduct] = useState<Product | null>(null);

  // Auto-pricing modal
  const [showAutoPricingModal, setShowAutoPricingModal] = useState<boolean>(false);
  const [batchPercent, setBatchPercent] = useState<number>(5);
  const [batchRound, setBatchRound] = useState<number>(5);

  // New product form fields
  const [newBarcode, setNewBarcode] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newNameAr, setNewNameAr] = useState<string>('');
  const [newBrand, setNewBrand] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('Épicerie de Base');
  const [newPrice, setNewPrice] = useState<string>('150');
  const [newUnit, setNewUnit] = useState<string>('Pièce');

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.nameAr && p.nameAr.includes(searchQuery)) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery);

    const matchesCategory = 
      selectedCategory === 'Toutes les catégories' || p.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Handle submit new product
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBarcode.trim() || !newName.trim()) return;

    const prod: Product = {
      id: `prod-${Date.now()}`,
      barcode: newBarcode.trim(),
      name: newName.trim(),
      nameAr: newNameAr.trim() || undefined,
      brand: newBrand.trim() || 'Marque Algérienne',
      category: newCategory,
      price: parseFloat(newPrice) || 100,
      unit: newUnit.trim() || 'Pièce',
      origin: 'Algérie (GS1 613)',
      isCustom: true,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    onAddNewProduct(prod);
    setIsAddingNew(false);
    // Reset inputs
    setNewBarcode('');
    setNewName('');
    setNewNameAr('');
    setNewBrand('');
    setNewPrice('150');
  };

  // Generate random Algerian barcode (starts with 613)
  const generateAlgerianBarcode = () => {
    const randomSuffix = Math.floor(1000000000 + Math.random() * 9000000000).toString().slice(0, 9);
    setNewBarcode(`613${randomSuffix}`);
  };

  // Export catalog to JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(products, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `catalogue_prix_dz_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Catalogue & Tarification Automatique
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Gérez les prix de vos produits algériens ou appliquez des règles de prix automatiques
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAutoPricingModal(true)}
            className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Prix Automatique</span>
          </button>

          <button
            onClick={() => {
              generateAlgerianBarcode();
              setIsAddingNew(true);
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter Produit</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-lg text-xs transition-colors"
            title="Exporter le catalogue JSON"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onResetCatalog}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-lg text-xs transition-colors"
            title="Réinitialiser au catalogue d'origine"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, marque ou code-barres (ex: Hamoud, Cevital, 613...)"
            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4">Code-Barres</th>
                <th className="py-3 px-4">Produit Algérien</th>
                <th className="py-3 px-4">Catégorie</th>
                <th className="py-3 px-4 text-right">Prix (DA)</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  
                  {/* Barcode & visual */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      {prod.barcode}
                    </span>
                  </td>

                  {/* Name & Arabic */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {prod.name}
                    </div>
                    {prod.nameAr && (
                      <div className="text-xs text-emerald-700 dark:text-emerald-400" dir="rtl">
                        {prod.nameAr}
                      </div>
                    )}
                    <div className="text-xs text-slate-400">{prod.brand} · {prod.unit}</div>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                    {prod.category}
                  </td>

                  {/* Price (Editable on click) */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => setEditingProduct(prod)}
                      className="font-mono font-bold text-base text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 tabular-nums inline-flex items-center gap-1 group"
                      title="Cliquer pour modifier le prix"
                    >
                      <span>{formatDA(prod.price)}</span>
                      <Edit3 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => setShelfTagProduct(prod)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Imprimer l'étiquette de rayon"
                      >
                        <Tag className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setEditingProduct(prod)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Modifier l'article"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onDeleteProduct(prod.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Supprimer du catalogue"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
                    Aucun produit trouvé pour votre recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Auto-Pricing Rules Modal */}
      {showAutoPricingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Mise à Jour Automatique des Prix
                </h3>
              </div>
              <button onClick={() => setShowAutoPricingModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Ajustez instantanément les prix de tout votre catalogue de produits algériens (inflation, hausse fournisseur, arrondi de monnaie) :
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Variation en pourcentage (%) :
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[-5, 0, 5, 10].map(val => (
                    <button
                      key={val}
                      onClick={() => setBatchPercent(val)}
                      className={`py-1.5 rounded font-mono font-semibold text-xs ${
                        batchPercent === val
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {val > 0 ? `+${val}%` : `${val}%`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Arrondi monnaie algérienne :
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Aucun (1 DA)', val: 1 },
                    { label: 'Aux 5 DA', val: 5 },
                    { label: 'Aux 10 DA', val: 10 }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => setBatchRound(opt.val)}
                      className={`py-1.5 rounded font-semibold text-xs ${
                        batchRound === opt.val
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Recommandé : Arrondi aux 5 DA ou 10 DA correspondant aux pièces courantes en Algérie.
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAutoPricingModal(false)}
                className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-200"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  onBatchAdjustPrices(batchPercent, batchRound);
                  setShowAutoPricingModal(false);
                }}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg"
              >
                Appliquer aux {products.length} Produits
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Product Modal */}
      {isAddingNew && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form 
            onSubmit={handleCreateProduct}
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <span>Nouveau Produit Algérien</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setIsAddingNew(false)} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Code-Barres (EAN-13) :
                  </label>
                  <button
                    type="button"
                    onClick={generateAlgerianBarcode}
                    className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    <BarcodeIcon className="w-3 h-3" />
                    <span>Générer Code Algérien 613...</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={newBarcode}
                  onChange={(e) => setNewBarcode(e.target.value)}
                  placeholder="Ex: 6130123456789"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Nom du Produit (Français) :
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ex: Jus Rouiba Orange 1L"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    الاسم بالعربية (Optionnel) :
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={newNameAr}
                    onChange={(e) => setNewNameAr(e.target.value)}
                    placeholder="عصير رويبة برتقال 1 لتر"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Marque :
                  </label>
                  <input
                    type="text"
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    placeholder="Ex: Rouiba, Cevital..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Catégorie :
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  >
                    {CATEGORIES.filter(c => c !== 'Toutes les catégories').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Prix en Dinars Algériens (DA) :
                  </label>
                  <input
                    type="number"
                    step="5"
                    min="0"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Conditionnement :
                  </label>
                  <input
                    type="text"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    placeholder="Bouteille 1L, Paquet 500g..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-200"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>Enregistrer le Produit</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Single Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Modifier le Prix
              </h3>
              <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                {editingProduct.name}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {editingProduct.barcode}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Nouveau Prix en Dinars Algériens (DA) :
              </label>
              <input
                type="number"
                step="5"
                min="0"
                defaultValue={editingProduct.price}
                id="edit-modal-price"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold text-lg"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditingProduct(null)}
                className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-200"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById('edit-modal-price') as HTMLInputElement;
                  const price = parseFloat(input?.value);
                  if (!isNaN(price) && price >= 0) {
                    onUpdateProduct({ ...editingProduct, price });
                    setEditingProduct(null);
                  }
                }}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg"
              >
                Mettre à Jour
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shelf Tag Modal (Étiquette de Rayon) */}
      {shelfTagProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Étiquette de Rayon / بطاقة السعر
              </h3>
              <button onClick={() => setShelfTagProduct(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Shelf Tag */}
            <div className="p-4 bg-white text-black border-2 border-slate-900 rounded-lg space-y-2 text-center">
              <div className="text-xs uppercase tracking-wider text-slate-600 font-bold">
                {shelfTagProduct.brand}
              </div>
              <div className="font-bold text-sm leading-tight">
                {shelfTagProduct.name}
              </div>
              {shelfTagProduct.nameAr && (
                <div className="text-xs text-slate-600" dir="rtl">
                  {shelfTagProduct.nameAr}
                </div>
              )}
              <div className="text-3xl font-extrabold font-mono pt-1 pb-1">
                {formatDA(shelfTagProduct.price)}
              </div>
              <BarcodeVisual code={shelfTagProduct.barcode} height={40} />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
              >
                Imprimer Étiquette
              </button>
              <button
                onClick={() => setShelfTagProduct(null)}
                className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-200"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
