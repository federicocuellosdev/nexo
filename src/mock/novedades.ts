import type { LucideIcon } from 'lucide-react';
import { Glasses, Gift, Stethoscope } from 'lucide-react';
import type { Tono } from '@/ui/tipos';

export interface Novedad {
  id: string;
  titulo: string;
  texto: string;
  icono: LucideIcon;
  tono: Tono;
}

/** Contenido ficticio de demostración. A futuro se personaliza por perfil. */
export const NOVEDADES: Novedad[] = [
  {
    id: 'optica',
    titulo: 'Tu par de anteojos al año',
    texto: 'Retiralos en cualquiera de las 4 sucursales de Rosario Visión con tu credencial.',
    icono: Glasses,
    tono: 'marca',
  },
  {
    id: 'doc24',
    titulo: 'Telemedicina 24 horas',
    texto: 'Consulta clínica sin cargo desde la app de Doc24, sin turno previo.',
    icono: Stethoscope,
    tono: 'ok',
  },
  {
    id: 'referidos',
    titulo: 'Traé a alguien y ganás',
    texto: 'Programa de referidos en preparación. Te avisamos cuando esté disponible.',
    icono: Gift,
    tono: 'warn',
  },
];
