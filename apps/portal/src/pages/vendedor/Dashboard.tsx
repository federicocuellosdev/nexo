import { AdminDashboard } from '@/pages/admin/Dashboard';

/** Dashboard del vendedor: mismo componente que el admin pero con
 *  `fuente='vendedor'` para que las métricas vengan filtradas por
 *  vendedor_id = el que está logueado. */
export function VendedorDashboard() {
  return <AdminDashboard fuente="vendedor" />;
}
