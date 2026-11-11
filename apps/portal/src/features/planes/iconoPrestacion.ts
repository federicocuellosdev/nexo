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
    descripcion: 'Teleconsultas con médicos las 24 horas.',
  },
  Psicología: {
    icono: HeartHandshake,
    descripcion: 'Sesiones con psicólogos a distancia.',
  },
  'Emergencias médicas': {
    icono: Siren,
    descripcion: 'Asistencia inmediata ante situaciones críticas.',
  },
  'Guardia odontológica': {
    icono: Smile,
    descripcion: 'Atención profesional ante dolores agudos.',
  },
  'Descuentos en farmacias': {
    icono: Pill,
    descripcion: 'Hasta 50% off en farmacias adheridas.',
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
