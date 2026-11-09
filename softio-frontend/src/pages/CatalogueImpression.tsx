import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Barcode as BarcodeIcon } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { getProduits, type Produit } from '../services/catalogue';
import { useToast } from '../contexts/ToastContext';

function getBarcodeValue(reference: string) {
  return reference
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7e]/g, '');
}

function BarcodeCard({
  reference,
  designation,
}: {
  reference: string;
  designation: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && reference) {
      try {
        JsBarcode(canvasRef.current, getBarcodeValue(reference), {
          format: 'CODE128',
          width: 1.4,
          height: 40,
          displayValue: false,
          margin: 0,
          background: '#ffffff',
        });
      } catch {
        // ignore
      }
    }
  }, [reference, designation]);

  const handleDownload = () => {
    const src = canvasRef.current;
    if (!src) return;

    const padding = 8;
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = 320;
    finalCanvas.height = 100;
    const ctx = finalCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    ctx.drawImage(src, padding, padding, finalCanvas.width - padding * 2, 54);
    ctx.fillStyle = '#333333';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const maxWidth = finalCanvas.width - padding * 2;
    const drawLabel = (text: string, y: number) => {
      let display = text;
      while (ctx.measureText(display).width > maxWidth && display.length > 0) {
        display = display.slice(0, -1);
      }
      if (display.length < text.length) display = `${display.trim()}…`;
      ctx.fillText(display, finalCanvas.width / 2, y);
    };

    drawLabel(reference, 66);
    drawLabel(designation || '', 82);

    const url = finalCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `Code barre ${reference.replace(/[\\/:*?"<>|]/g, '-')}.png`;
    a.click();
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="barcode-print-card bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow text-center w-full"
      title="Cliquer pour télécharger en PNG"
    >
      <canvas ref={canvasRef} className="barcode-print-code mx-auto h-[44px] w-[220px] max-w-full" />
      <p className="barcode-print-reference text-[11px] mt-1 text-gray-800 font-medium leading-tight">
        {reference}
      </p>
      <p className="barcode-print-designation text-[11px] mt-1 text-gray-600 leading-tight line-clamp-2">
        {designation}
      </p>
    </button>
  );
}

export default function CatalogueImpression() {
  const navigate = useNavigate();
  const toast = useToast();
  const toastRef = useRef(toast);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  useEffect(() => {
    (async () => {
      try {
        let all: Produit[] = [];
        let page = 1;
        let last = 1;
        do {
          const res = await getProduits({ page });
          all = [...all, ...(res.data || [])];
          last = res.last_page || 1;
          page++;
        } while (page <= last);
        setProduits(all);
      } catch {
        toastRef.current.error('Erreur de chargement');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="catalogue-impression-page p-4 sm:p-6 max-w-6xl mx-auto">
      <style>{'@media print { @page { size: A4 portrait; margin: 8mm; } }'}</style>
      {/* Actions (cachées à l'impression) */}
      <div className="flex items-center justify-between mb-4 print:hidden">
        <button
          onClick={() => navigate('/catalogue')}
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft size={16} /> Retour aux produits
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
        >
          <Printer size={16} /> Imprimer tous les codes-barres
        </button>
      </div>

      {/* Header style Softio */}
      <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-card to-card p-5 mb-5 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-400/90 text-white flex items-center justify-center shadow-sm">
            <BarcodeIcon size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold">Codes-barres</h1>
            <p className="text-sm text-muted-foreground">
              Étiquettes de vos produits : référence et désignation
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 print:hidden">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            {produits.length} produit(s)
          </span>
          <span>Cliquez sur une étiquette pour télécharger « Code barre [référence] » (PNG).</span>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-12">Chargement...</p>
      ) : (
        <div className="barcode-print-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {produits.map((p) => (
          <BarcodeCard
            key={p.id_produit}
            reference={p.reference}
            designation={p.designation}
          />
        ))} 
        </div>
      )}
    </div>
  );
}