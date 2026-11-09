import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

function getBarcodeValue(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7e]/g, '');
}

export default function Barcode({
  value,
  designation,
  height = 40,
  displayValue = true,
}: {
  value: string;
  designation?: string;
  height?: number;
  displayValue?: boolean;
}) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (ref.current && value) {
      try {
        JsBarcode(ref.current, getBarcodeValue(value), {
          format: 'CODE128',
          width: 1.4,
          height,
          displayValue: displayValue && !designation,
          fontSize: 10,
          margin: 0,
        });
      } catch {
        // ignore invalid value
      }
    }
  }, [value, designation, height, displayValue]);

  return (
    <span className="inline-flex flex-col items-center">
      <svg
        ref={ref}
        className="w-[180px] max-w-full"
        style={{ height }}
      />
      {designation && (
        <span className="max-w-40 truncate text-[10px] text-muted-foreground">
          {value} · {designation}
        </span>
      )}
    </span>
  );
}