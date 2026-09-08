import type { PerfilPrevinca, Usuario } from '@/mock/session';

/**
 * Perfil de demostración. El nombre es claramente ficticio a propósito: nada de
 * lo que se muestra en la maqueta se presenta como dato real del cliente.
 * Importa SOLO tipos de `session.ts`, así que no hay ciclo en tiempo de
 * ejecución (la importación de tipos se borra al compilar).
 */
export const USUARIO_DEMO: Usuario = {
  nombre: 'Camila',
  apellido: 'Pérez',
  email: 'camila.perez@ejemplo.com',
  telefono: '3415551234',
};

export const PERFIL_DEMO: PerfilPrevinca = {
  tipoDocumento: 'DNI',
  numeroDocumento: '35123456',
  sexo: 'F',
  fechaNacimiento: '1990-04-17',
  domicilio: {
    calle: 'Córdoba',
    numero: '1234',
    piso: '3 B',
    localidad: 'Rosario',
    provincia: 'Santa Fe',
    cp: '2000',
  },
  tieneObraSocial: true,
  obraSocial: 'OSDE',
  tipoContratacion: 'tomador-beneficiario',
};
