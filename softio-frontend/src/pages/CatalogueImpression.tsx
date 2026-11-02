import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Barcode as BarcodeIcon } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { getProduits, type Produit } from '../services/catalogue';
import { useToast } from '../contexts/ToastContext';

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
        JsBarcode(canvasRef.current, reference, {
          format: 'CODE128',
          width: 2,
          height: 60,
          displayValue: true,
          fontSize: 12,
          margin: 8,
          background: '#ffffff',
        });
      } catch {
        // ignore
      }
    }
  }, [reference]);

  const handleDownload = () => {
    const src = canvasRef.current;
    if (!src) return;

    // Canvas final = barcode + texte désignation en dessous
    const padding = 16;
    const textHeight = 36;
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = src.width + padding * 2;
    finalCanvas.height = src.height + textHeight + padding;
    const ctx = finalCanvas.getContext('2d');
    if (!ctx) return;

    // Fond blanc
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

    // Code-barre (avec référence déjà affichée par JsBarcode)
    ctx.drawImage(src, padding, padding / 2);

    // Désignation sous le code-barre
    ctx.fillStyle = '#333333';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const maxWidth = finalCanvas.width - padding * 2;
    const text = designation || '';
    // Tronque si trop long
    let display = text;
    while (ctx.measureText(display).width > maxWidth && display.length > 0) {
      display = display.slice(0, -1);
    }
    if (display.length < text.length) display = display.trim() + '…';

    ctx.fillText(
      display,
      finalCanvas.width / 2,
      src.height + padding / 2 + 6
    );

    const url = finalCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `barcode-${reference}.png`;
    a.click();
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow text-center w-full"
      title="Cliquer pour télécharger en PNG"
    >
      <canvas ref={canvasRef} className="mx-auto max-w-full" />
      <p className="text-[11px] mt-1 text-gray-600 leading-tight line-clamp-2">
        {designation}
      </p>
    </button>
  );
}

export default function CatalogueImpression() {
  const navigate = useNavigate();
  const toast = useToast();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);

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
        toast.error('Erreur de chargement');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const downloadPng = (canvas: HTMLCanvasElement, name: string) => {
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `barcode-${name}.png`;
    a.click();
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
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
          <Printer size={16} /> Imprimer
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
          <span>Cliquez sur une étiquette pour télécharger son image (PNG).</span>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-12">Chargement...</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
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