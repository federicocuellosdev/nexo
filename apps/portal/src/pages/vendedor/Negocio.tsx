import { AdminNegocio } from '@/pages/admin/Negocio';

/** Negocio del vendedor: mismo UI que admin pero scoped a sus propios
 *  leads via `/vendedor/me/leads`. */
export function VendedorNegocio() {
  return <AdminNegocio fuente="vendedor" />;
}
