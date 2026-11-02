import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

export default function Barcode({ value, height = 40 }: { value: string; height?: number }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (ref.current && value) {
      try {
        JsBarcode(ref.current, value, {
          format: 'CODE128',
          width: 1.4,
          height,
          displayValue: true,
          fontSize: 10,
          margin: 0,
        });
      } catch {
        // ignore invalid value
      }
    }
  }, [value, height]);

  return <svg ref={ref} />;
}