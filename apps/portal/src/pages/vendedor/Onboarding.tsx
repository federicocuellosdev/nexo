import { useEffect, useState } from 'react';
import { Copy, Check, Share2, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { obtenerPerfilVendedor, type VendedorAdmin } from '@/lib/api';
import { landingUrl } from '@/lib/urls';
import { Skeleton } from '@/ui/Skeleton';
import { QR } from '@/ui/QR';

/**
 * Página "Onboarding" del vendedor. Muestra:
 *  - Su URL de atribución (`landing/onboarding?ref=CODIGO_CORTO`).
 *  - Un QR escaneable con esa URL.
 *  - Botones para copiar, compartir (Web Share API cuando está disponible)
 *    y descargar el QR como PNG.
 *
 * Toda alta que entre por esa URL queda atribuida al vendedor via
 * v3.leads.vendedor_id — es lo que el admin ve en Trazabilidad de la ficha.
 */
export function VendedorOnboarding() {
  const [vendedor, setVendedor] = useState<VendedorAdmin | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    let cancelado = false;
    void (async () => {
      try {
        if (!supabase) throw new Error('supabase no configurado');
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) throw new Error('sesión expirada');
        const perfil = await obtenerPerfilVendedor(token);
        if (!cancelado) setVendedor(perfil);
      } catch (err) {
        console.error('[VendedorOnboarding] error', err);
        if (!cancelado) setError('No pudimos cargar tu URL de atribución');
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  if (error) {
    return (
      <p role="alert" className="rounded-card bg-danger-50 px-4 py-3 text-sm text-danger-700 ring-1 ring-danger-500/30">
        {error}
      </p>
    );
  }

  if (cargando || !vendedor) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-80 w-full max-w-md" />
      </div>
    );
  }

  const url = `${landingUrl()}/onboarding?ref=${vendedor.codigo_corto}`;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch (err) {
      console.warn('[copiar] clipboard', err);
    }
  }

  async function compartir() {
    if (typeof navigator.share !== 'function') {
      void copiar();
      return;
    }
    try {
      await navigator.share({
        title: 'Previnca Nexo',
        text: 'Sumate a Previnca Nexo con mi link de referido',
        url,
      });
    } catch (err) {
      console.warn('[compartir] cancelado', err);
    }
  }

  function descargarQR() {
    const svg = document.querySelector('[data-qr-vendedor] svg');
    if (!(svg instanceof SVGSVGElement)) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const urlBlob = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = urlBlob;
    a.download = `nexo-${vendedor?.codigo_corto ?? 'qr'}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(urlBlob);
  }

  return (
    <div data-entrada className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl text-ink-950">Onboarding</h1>
        <p className="mt-1 text-sm text-ink-600">
          Compartí este link o el QR con tus clientes. Cada alta que entre por acá queda registrada a tu nombre (código{' '}
          <span className="font-mono text-ink-800">{vendedor.codigo_corto}</span>).
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
        <section className="flex flex-col gap-4 rounded-card bg-white p-5 shadow-card ring-1 ring-ink-100">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Tu link</p>
            <p className="mt-2 break-all font-mono text-sm text-ink-900">{url}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copiar}
              className="inline-flex cursor-pointer items-center gap-2 rounded-pill bg-marca-600 px-4 py-2 text-sm font-medium text-white hover:bg-marca-700"
            >
              {copiado ? <Check size={14} /> : <Copy size={14} />}
              {copiado ? 'Copiado' : 'Copiar link'}
            </button>
            <button
              type="button"
              onClick={compartir}
              className="inline-flex cursor-pointer items-center gap-2 rounded-pill bg-white px-4 py-2 text-sm font-medium text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50"
            >
              <Share2 size={14} /> Compartir
            </button>
            <button
              type="button"
              onClick={descargarQR}
              className="inline-flex cursor-pointer items-center gap-2 rounded-pill bg-white px-4 py-2 text-sm font-medium text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50"
            >
              <Download size={14} /> Descargar QR
            </button>
          </div>
        </section>

        <section
          data-qr-vendedor
          className="flex items-center justify-center rounded-card bg-white p-6 shadow-card ring-1 ring-ink-100"
        >
          <QR url={url} lado={240} />
        </section>
      </div>
    </div>
  );
}
