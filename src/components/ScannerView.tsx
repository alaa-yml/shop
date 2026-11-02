import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Camera, 
  CameraOff, 
  RefreshCw, 
  Plus, 
  Check, 
  ShoppingBag, 
  Sparkles, 
  Edit3, 
  Upload, 
  Search, 
  Zap,
  Volume2,
  VolumeX,
  Package
} from 'lucide-react';
import { Product } from '../types';
import { BarcodeVisual } from './BarcodeVisual';
import { formatDA, estimatePriceForProduct } from '../utils/format';
import { playBarcodeBeep } from '../utils/audio';

interface ScannerViewProps {
  products: Product[];
  onAddToCart: (product: Product, quantity?: number, customPrice?: number) => void;
  onUpdateProductPrice: (productId: string, newPrice: number) => void;
  onAddNewProduct: (product: Product) => void;
  cartCount: number;
  onOpenCart: () => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  products,
  onAddToCart,
  onUpdateProductPrice,
  onAddNewProduct,
  cartCount,
  onOpenCart
}) => {
  // Scanner state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [continuousScan, setContinuousScan] = useState<boolean>(true);

  // Manual / file state
  const [manualBarcode, setManualBarcode] = useState<string>('');
  const [detectedProduct, setDetectedProduct] = useState<Product | null>(null);
  const [isUnknownBarcode, setIsUnknownBarcode] = useState<boolean>(false);
  const [unknownCode, setUnknownCode] = useState<string>('');
  const [suggestedPrice, setSuggestedPrice] = useState<number>(150);

  // Quick edit price state
  const [isEditingPrice, setIsEditingPrice] = useState<boolean>(false);
  const [priceInput, setPriceInput] = useState<string>('');
  const [scanQuantity, setScanQuantity] = useState<number>(1);
  const [lastAddedNotice, setLastAddedNotice] = useState<string | null>(null);

  // Video refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const lastScannedCodeRef = useRef<string>('');
  const lastScannedTimeRef = useRef<number>(0);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Handle scanned barcode code
  const handleBarcodeIdentified = useCallback((rawBarcode: string) => {
    const code = rawBarcode.trim();
    if (!code) return;

    // Debounce duplicate scans within 1.5 seconds if continuous
    const now = Date.now();
    if (code === lastScannedCodeRef.current && now - lastScannedTimeRef.current < 1500) {
      return;
    }
    lastScannedCodeRef.current = code;
    lastScannedTimeRef.current = now;

    if (soundEnabled) {
      playBarcodeBeep();
    }

    // Look up in products catalog
    const matched = products.find(p => p.barcode === code || p.barcode.endsWith(code) || code.endsWith(p.barcode));

    if (matched) {
      setDetectedProduct(matched);
      setIsUnknownBarcode(false);
      setPriceInput(matched.price.toString());
      setScanQuantity(1);

      if (continuousScan) {
        onAddToCart(matched, 1);
        setLastAddedNotice(`+1 ${matched.name} (${formatDA(matched.price)})`);
        setTimeout(() => setLastAddedNotice(null), 2500);
      }
    } else {
      // Auto-price recommendation for Algerian item
      const estPrice = estimatePriceForProduct(code);
      setUnknownCode(code);
      setSuggestedPrice(estPrice);
      setPriceInput(estPrice.toString());
      setIsUnknownBarcode(true);
      setDetectedProduct(null);
    }
  }, [products, soundEnabled, continuousScan, onAddToCart]);

  // Start Camera
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);

        // Native BarcodeDetector loop if supported
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const win = window as any;
        if ('BarcodeDetector' in win) {
          const barcodeDetector = new win.BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code']
          });

          const scanLoop = async () => {
            if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
              if (!isProcessingRef.current) {
                isProcessingRef.current = true;
                try {
                  const barcodes = await barcodeDetector.detect(videoRef.current);
                  if (barcodes.length > 0) {
                    const rawValue = barcodes[0].rawValue;
                    if (rawValue) {
                      handleBarcodeIdentified(rawValue);
                    }
                  }
                } catch {
                  // Frame capture error ignored
                } finally {
                  isProcessingRef.current = false;
                }
              }
            }
            animationFrameRef.current = requestAnimationFrame(scanLoop);
          };

          animationFrameRef.current = requestAnimationFrame(scanLoop);
        } else {
          // If native BarcodeDetector not available, keep camera alive for manual preview
          // and provide informative helper
        }
      }
    } catch (err: unknown) {
      console.warn('Camera access failed:', err);
      const errorMsg = err instanceof Error ? err.message : 'Impossible d’accéder à la caméra.';
      setCameraError(`Caméra indisponible (${errorMsg}). Utilisez le clavier ou le rayon de test ci-dessous.`);
      setIsCameraActive(false);
    }
  }, [facingMode, stopCamera, handleBarcodeIdentified]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Handle manual code submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      handleBarcodeIdentified(manualBarcode.trim());
      setManualBarcode('');
    }
  };

  // Save new unknown product with auto or custom price
  const handleSaveUnknownProduct = (name: string, category: string, price: number) => {
    const newProduct: Product = {
      id: `custom-${Date.now()}`,
      barcode: unknownCode,
      name: name.trim() || `Produit Algérien (${unknownCode.slice(-4)})`,
      brand: 'Marque Locale',
      category: category || 'Épicerie de Base',
      price: price > 0 ? price : suggestedPrice,
      unit: 'Pièce',
      origin: 'Algérie',
      isCustom: true,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    onAddNewProduct(newProduct);
    onAddToCart(newProduct, 1);
    setDetectedProduct(newProduct);
    setIsUnknownBarcode(false);
    setLastAddedNotice(`+1 ${newProduct.name} (${formatDA(newProduct.price)})`);
    setTimeout(() => setLastAddedNotice(null), 2500);
  };

  // Sample quick test products (authentic Algerian items)
  const quickTestProducts = products.slice(0, 8);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner Notice when item added */}
      {lastAddedNotice && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg flex items-center justify-between shadow-md transition-all animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-200" />
            <span className="font-semibold text-sm">{lastAddedNotice}</span>
          </div>
          <button
            onClick={onOpenCart}
            className="text-xs bg-white text-emerald-800 font-bold px-3 py-1 rounded-md hover:bg-emerald-50 transition-colors"
          >
            Voir Total ({cartCount})
          </button>
        </div>
      )}

      {/* Main 2-Column Grid: Scanner Left / Result & Basket Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Viewfinder & Input Affordances */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Scanner Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            
            {/* Header controls bar */}
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Lecteur Code-Barres Algérie
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title={soundEnabled ? 'Son activé' : 'Son désactivé'}
                  className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs transition-colors"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                </button>

                <button
                  onClick={() => setContinuousScan(!continuousScan)}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                    continuousScan 
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                  title="Ajouter automatiquement au total à chaque scan"
                >
                  {continuousScan ? '⚡ Scan Continu: ON' : 'Scan Manuel: ON'}
                </button>
              </div>
            </div>

            {/* Video Viewfinder Area */}
            <div className="relative aspect-16/10 bg-slate-950 flex items-center justify-center overflow-hidden">
              {isCameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                  {/* Visual reticle & laser scan animation */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-64 h-36 sm:w-72 sm:h-44 border-2 border-emerald-400/80 rounded-lg relative overflow-hidden shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                      {/* Laser red/green beam */}
                      <div className="absolute left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-[bounce_2s_infinite]" />
                      
                      {/* Corner marks */}
                      <div className="absolute top-1 left-1 text-[10px] text-emerald-300 font-mono">
                        SCANNER GS1-613
                      </div>
                    </div>
                  </div>

                  {/* Camera overlay toolbar */}
                  <div className="absolute bottom-3 inset-x-3 flex items-center justify-between bg-black/60 backdrop-blur-xs p-2 rounded-lg text-white">
                    <button
                      onClick={() => {
                        setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
                        startCamera();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs hover:bg-white/20 rounded-md transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Changer Caméra</span>
                    </button>

                    <button
                      onClick={stopCamera}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs bg-rose-600/80 hover:bg-rose-600 rounded-md transition-colors"
                    >
                      <CameraOff className="w-3.5 h-3.5" />
                      <span>Arrêter Caméra</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-800 text-slate-300 mx-auto flex items-center justify-center">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-white">
                      Scanner avec la Caméra
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Pointez la caméra vers le code-barres (ex. 613...) de votre produit algérien pour obtenir le prix instantané.
                    </p>
                  </div>
                  <div className="pt-2 flex justify-center gap-3">
                    <button
                      onClick={startCamera}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Démarrer la Caméra</span>
                    </button>
                  </div>
                  {cameraError && (
                    <div className="text-xs text-amber-300 bg-amber-950/60 p-2.5 rounded-lg border border-amber-800/50 max-w-md mx-auto">
                      {cameraError}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Manual Barcode & File Upload */}
            <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    placeholder="Entrez un code-barres (ex: 6130123456789)..."
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!manualBarcode.trim()}
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Identifier
                </button>
              </form>

              {/* Upload image fallback */}
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                <span>Glissez ou importez une photo de code-barres :</span>
                <label className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer font-medium">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Importer Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Quick scan simulation from uploaded photo
                        const randomProduct = products[Math.floor(Math.random() * products.length)];
                        handleBarcodeIdentified(randomProduct.barcode);
                      }
                    }}
                  />
                </label>
              </div>
            </div>

          </div>

          {/* Rayon Démo: Algerian Quick Test Shelf */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Rayon Produits Algériens (Test en 1 Clic)</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cliquez sur n'importe quel article ci-dessous pour simuler son scan et vérifier son prix :
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {quickTestProducts.map((prod) => (
                <button
                  key={prod.id}
                  onClick={() => handleBarcodeIdentified(prod.barcode)}
                  className="p-2.5 text-left rounded-lg border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all group cursor-pointer"
                >
                  <div className="text-[11px] font-mono text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                    {prod.barcode}
                  </div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                    {prod.name}
                  </div>
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-1 tabular-nums">
                    {formatDA(prod.price)}
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Identified Product Result & Automatic Pricing */}
        <div className="lg:col-span-5 space-y-5">
          
          {detectedProduct ? (
            /* Identified Product Detail Card */
            <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-emerald-500/40 dark:border-emerald-500/30 p-6 space-y-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{detectedProduct.brand}</span>
                    <span aria-hidden="true">·</span>
                    <span>{detectedProduct.category}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {detectedProduct.name}
                  </h3>
                  {detectedProduct.nameAr && (
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-400" dir="rtl">
                      {detectedProduct.nameAr}
                    </p>
                  )}
                </div>

                <span className="text-xs font-semibold px-2 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-md shrink-0">
                  {detectedProduct.origin || 'Algérie'}
                </span>
              </div>

              {/* Price Highlight Area */}
              <div className="bg-slate-50 dark:bg-slate-800/70 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Prix Identifié / السعر
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums">
                    {formatDA(detectedProduct.price)}
                  </div>
                  <div className="text-xs text-slate-400">
                    Conditionnement : {detectedProduct.unit}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsEditingPrice(!isEditingPrice);
                    setPriceInput(detectedProduct.price.toString());
                  }}
                  className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 font-semibold px-2.5 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-800 hover:bg-emerald-50 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Modifier Prix</span>
                </button>
              </div>

              {/* Inline Price Editor if user requested to adjust price */}
              {isEditingPrice && (
                <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800/50 space-y-2">
                  <div className="text-xs font-semibold text-amber-900 dark:text-amber-300 flex items-center justify-between">
                    <span>Mettre à jour le prix de ce produit (DA) :</span>
                    <span className="text-[11px] text-amber-700 dark:text-amber-400">Enregistré automatiquement</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="5"
                      min="0"
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-md font-mono"
                    />
                    <button
                      onClick={() => {
                        const newP = parseFloat(priceInput);
                        if (!isNaN(newP) && newP > 0) {
                          onUpdateProductPrice(detectedProduct.id, newP);
                          setDetectedProduct({ ...detectedProduct, price: newP });
                          setIsEditingPrice(false);
                        }
                      }}
                      className="px-3 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-md hover:bg-amber-700 transition-colors"
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>
              )}

              {/* Barcode Visual Representation */}
              <div className="pt-1">
                <BarcodeVisual code={detectedProduct.barcode} height={46} />
              </div>

              {/* Quantity Stepper & Add to Basket Button */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Quantité à calculer :
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setScanQuantity(Math.max(1, scanQuantity - 1))}
                      className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-mono font-bold text-sm text-slate-900 dark:text-white">
                      {scanQuantity}
                    </span>
                    <button
                      onClick={() => setScanQuantity(scanQuantity + 1)}
                      className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onAddToCart(detectedProduct, scanQuantity);
                    setLastAddedNotice(`+${scanQuantity} ${detectedProduct.name} ajouté(s)`);
                    setTimeout(() => setLastAddedNotice(null), 2500);
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs active:scale-98 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter au Total ({formatDA(detectedProduct.price * scanQuantity)})</span>
                </button>
              </div>

            </div>
          ) : isUnknownBarcode ? (
            /* Unknown Product / Auto-Price Setup Card */
            <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-amber-500/50 dark:border-amber-500/40 p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Zap className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Nouveau Code-Barres Détecté
                </h3>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400">
                Le code <code className="font-mono font-bold text-slate-900 dark:text-slate-200">{unknownCode}</code> n'est pas encore dans votre catalogue. L'application a calculé un prix automatique :
              </p>

              <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-xl border border-amber-200 dark:border-amber-800/60 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-semibold text-amber-900 dark:text-amber-300">
                    Prix Automatique Suggéré :
                  </span>
                  <span className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-400">
                    {formatDA(suggestedPrice)}
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block">
                    Nom du produit :
                  </label>
                  <input
                    type="text"
                    id="unknown-name-input"
                    defaultValue={`Article Algérie ${unknownCode.slice(-4)}`}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md"
                  />

                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block">
                    Prix en Dinars Algériens (DA) :
                  </label>
                  <input
                    type="number"
                    id="unknown-price-input"
                    defaultValue={suggestedPrice}
                    step="5"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md font-mono font-bold"
                  />
                </div>

                <button
                  onClick={() => {
                    const nameEl = document.getElementById('unknown-name-input') as HTMLInputElement;
                    const priceEl = document.getElementById('unknown-price-input') as HTMLInputElement;
                    const finalName = nameEl?.value || 'Nouveau Produit';
                    const finalPrice = parseFloat(priceEl?.value) || suggestedPrice;
                    handleSaveUnknownProduct(finalName, 'Épicerie de Base', finalPrice);
                  }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Enregistrer & Ajouter au Total</span>
                </button>
              </div>

              <BarcodeVisual code={unknownCode} height={42} />
            </div>
          ) : (
            /* Standby / Guide Card */
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Identification & Calcul de Prix
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Scannez un code-barres avec votre caméra ou sélectionnez un produit du rayon de test. Dès qu'un article est scanné :
                </p>
              </div>

              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-[10px]">1</span>
                  <span>Le prix officiel en Dinars Algériens (DA) s'affiche immédiatement.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-[10px]">2</span>
                  <span>Vous pouvez modifier ou ajuster le prix selon votre épicerie.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-[10px]">3</span>
                  <span>Ajoutez au panier pour calculer la somme totale de tous vos articles.</span>
                </li>
              </ul>

              {cartCount > 0 && (
                <div className="pt-2">
                  <button
                    onClick={onOpenCart}
                    className="w-full py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Accéder au Calculateur de Total ({cartCount} article{cartCount > 1 ? 's' : ''})</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick Summary Strip */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Articles dans le calcul actuel :
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {cartCount} produit{cartCount > 1 ? 's' : ''}
            </span>
          </div>

        </div>

      </div>

    </div>
  );
};
