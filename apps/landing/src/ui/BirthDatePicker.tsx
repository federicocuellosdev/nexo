import { useEffect, useId, useState } from 'react';
import { Select, type OpcionSelect } from '@/ui/Select';

export interface BirthDatePickerProps {
  /** Fecha en formato ISO `YYYY-MM-DD` o vacío. */
  value: string;
  /** Emite ISO cuando los tres campos están completos; `''` si falta alguno. */
  onChange: (iso: string) => void;
  invalido?: boolean;
  /** Id que recibe el combo del día: lo toma el `<label htmlFor>` del Field. */
  id?: string;
  /** Edad mínima — recorta el rango de años. Default 18. */
  edadMinima?: number;
  /** Edad máxima — recorta el rango de años. Default 100. */
  edadMaxima?: number;
}

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

function diasEnMes(mes: number, anio: number): number {
  // Day 0 del mes siguiente = último día del mes actual.
  return new Date(anio, mes, 0).getDate();
}

function parsear(iso: string): { dia: number | null; mes: number | null; anio: number | null } {
  const partes = iso.split('-').map((n) => parseInt(n, 10));
  const [a, m, d] = partes;
  return {
    anio: Number.isNaN(a) ? null : a,
    mes: Number.isNaN(m) ? null : m,
    dia: Number.isNaN(d) ? null : d,
  };
}

/**
 * Selector de fecha de nacimiento con tres combos (Día / Mes / Año).
 *
 * Reemplaza al `<input type="date">` nativo porque para una fecha de los años
 * 80/90 el calendario del navegador obliga a navegar mes por mes desde el día
 * actual: 400+ clicks hasta llegar al año. Tres combos resuelven en 3 clicks.
 *
 * Mantiene state local para selecciones parciales (el padre recibe `''` hasta
 * que los tres campos estén elegidos, pero el UI tiene que recordar lo que
 * ya se eligió). Se rehidrata si cambia `value` desde afuera (ej. reset).
 */
export function BirthDatePicker({
  value,
  onChange,
  invalido = false,
  id,
  edadMinima = 18,
  edadMaxima = 100,
}: BirthDatePickerProps) {
  const generado = useId();
  const prefijo = id ?? `bdp-${generado}`;
  const hoy = new Date();
  const anioMax = hoy.getFullYear() - edadMinima;
  const anioMin = hoy.getFullYear() - edadMaxima;

  const inicial = parsear(value);
  const [dia, setDia] = useState<number | null>(inicial.dia);
  const [mes, setMes] = useState<number | null>(inicial.mes);
  const [anio, setAnio] = useState<number | null>(inicial.anio);

  useEffect(() => {
    const nuevo = parsear(value);
    setDia(nuevo.dia);
    setMes(nuevo.mes);
    setAnio(nuevo.anio);
  }, [value]);

  function emitir(nd: number | null, nm: number | null, na: number | null) {
    setDia(nd);
    setMes(nm);
    setAnio(na);
    if (nd === null || nm === null || na === null) {
      if (value !== '') onChange('');
      return;
    }
    // Ajuste: si cambia año/mes y el día queda fuera de rango (ej. 31 → feb),
    // se recorta al último día del mes para no emitir una fecha inválida.
    const dAjustado = Math.min(nd, diasEnMes(nm, na));
    const iso = `${na}-${String(nm).padStart(2, '0')}-${String(dAjustado).padStart(2, '0')}`;
    onChange(iso);
  }

  const diasDisponibles = mes !== null && anio !== null ? diasEnMes(mes, anio) : 31;
  const opcionesDia: OpcionSelect[] = Array.from({ length: diasDisponibles }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1),
  }));
  const opcionesMes: OpcionSelect[] = MESES.map((nombre, i) => ({
    value: String(i + 1),
    label: nombre,
  }));
  const opcionesAnio: OpcionSelect[] = Array.from(
    { length: anioMax - anioMin + 1 },
    (_, i) => {
      const anioOpcion = anioMax - i;
      return { value: String(anioOpcion), label: String(anioOpcion) };
    },
  );

  return (
    <div className="grid grid-cols-[1fr_1.4fr_1fr] gap-2">
      <Select
        id={prefijo}
        aria-label="Día"
        opciones={opcionesDia}
        value={dia === null ? '' : String(dia)}
        placeholder="Día"
        invalido={invalido}
        onChange={(e) => emitir(parseInt(e.target.value, 10), mes, anio)}
      />
      <Select
        id={`${prefijo}-mes`}
        aria-label="Mes"
        opciones={opcionesMes}
        value={mes === null ? '' : String(mes)}
        placeholder="Mes"
        invalido={invalido}
        onChange={(e) => emitir(dia, parseInt(e.target.value, 10), anio)}
      />
      <Select
        id={`${prefijo}-anio`}
        aria-label="Año"
        opciones={opcionesAnio}
        value={anio === null ? '' : String(anio)}
        placeholder="Año"
        invalido={invalido}
        onChange={(e) => emitir(dia, mes, parseInt(e.target.value, 10))}
      />
    </div>
  );
}
