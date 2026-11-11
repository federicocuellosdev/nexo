import type { LucideIcon } from 'lucide-react';
import { Stethoscope, HeartHandshake, Siren, Smile, Pill, ShieldCheck } from 'lucide-react';

/**
 * Icono + descripción por prestación (una línea, concisa). Los `detalle` del
 * mock son copies de coseguro ("1° Consulta sin cargo"); en el bloque
 * "Desbloqueá estos beneficios" de /inicio queremos describir el servicio en
 * sí. El match es por label — si aparece una prestación no mapeada, caemos
 * a un ShieldCheck + al detalle corto del mock.
 */
interface MetaPrestacion {
  icono: LucideIcon;
  descripcion: string;
}

const META_POR_LABEL: Record<string, MetaPrestacion> = {
  'Médico Clínico': {
    icono: Stethoscope,
    descripcion: '1 consulta sin cargo al mes.',
  },
  Psicología: {
    icono: HeartHandshake,
    descripcion: '1 sesión al mes a $15.000.',
  },
  'Emergencias médicas': {
    icono: Siren,
    descripcion: 'Asistencia inmediata 24 horas.',
  },
  'Guardia odontológica': {
    icono: Smile,
    descripcion: 'Guardia todos los días del año.',
  },
  'Descuentos en farmacias': {
    icono: Pill,
    descripcion: 'Hasta 50% off en adheridas.',
  },
};

export function iconoDePrestacion(label: string): LucideIcon {
  return META_POR_LABEL[label]?.icono ?? ShieldCheck;
}

/** Descripción expandida para el bloque de beneficios de /inicio. Si no hay
 *  mapeo específico devuelve undefined y el llamador cae al `detalle` corto
 *  del mock. */
export function descripcionDePrestacion(label: string): string | undefined {
  return META_POR_LABEL[label]?.descripcion;
}
