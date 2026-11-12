import { useState } from 'react';
import type { FormEvent } from 'react';
import { Dialog } from '@/ui/Dialog';
import { Field } from '@/ui/Field';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { supabase } from '@/lib/supabase';
import { editarVendedorAdmin, type VendedorAdmin } from '@/lib/api';
import { SelectorEtiqueta } from '@/features/admin/SelectorEtiqueta';

export interface EditarVendedorDialogProps {
  vendedor: VendedorAdmin;
  onCerrar: () => void;
  /** Se llama cuando el PATCH termina OK, para que el caller refresque la lista. */
  onGuardado: () => void;
}

/**
 * Dialog para editar los datos del vendedor: nombre, apellido, DNI, teléfono,
 * etiqueta. Email NO es editable — es la clave humana de la tabla; si hay
 * que cambiarlo, se borra y se crea de nuevo.
 */
export function EditarVendedorDialog({ vendedor, onCerrar, onGuardado }: EditarVendedorDialogProps) {
  const [nombre, setNombre] = useState(vendedor.nombre);
  const [apellido, setApellido] = useState(vendedor.apellido);
  const [dni, setDni] = useState(vendedor.dni ?? '');
  const [telefono, setTelefono] = useState(vendedor.telefono ?? '');
  const [etiqueta, setEtiqueta] = useState(vendedor.etiqueta ?? '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (guardando) return;
    if (nombre.trim() === '' || apellido.trim() === '') {
      setError('Nombre y apellido son obligatorios');
      return;
    }
    setError(undefined);
    setGuardando(true);
    try {
      if (!supabase) throw new Error('supabase no configurado');
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('sesión expirada');
      await editarVendedorAdmin(token, vendedor.id, {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        dni: dni.trim() || undefined,
        telefono: telefono.trim() || undefined,
        etiqueta: etiqueta.trim() || undefined,
      });
      onGuardado();
    } catch (err) {
      console.error('[EditarVendedorDialog] error', err);
      setError('No pudimos guardar los cambios. Probá de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Dialog
      abierto
      onCambio={(abierto) => {
        if (!abierto) onCerrar();
      }}
      titulo="Editar vendedor"
      descripcion={vendedor.email}
    >
      <form onSubmit={guardar} noValidate className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" htmlFor="editar-nombre" requerido>
            <Input id="editar-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </Field>
          <Field label="Apellido" htmlFor="editar-apellido" requerido>
            <Input id="editar-apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} />
          </Field>
          <Field label="DNI" htmlFor="editar-dni">
            <Input id="editar-dni" inputMode="numeric" value={dni} onChange={(e) => setDni(e.target.value)} />
          </Field>
          <Field label="Teléfono" htmlFor="editar-telefono">
            <Input
              id="editar-telefono"
              inputMode="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </Field>
          <Field label="Etiqueta" htmlFor="editar-etiqueta">
            <SelectorEtiqueta id="editar-etiqueta" valor={etiqueta} onCambio={setEtiqueta} />
          </Field>
        </div>

        {error ? <p className="text-sm text-danger-700">{error}</p> : null}

        <div className="mt-2 flex flex-col gap-3 sm:flex-row-reverse">
          <Button type="submit" ancho="full" tamano="lg" className="sm:w-auto" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </Button>
          <Button
            type="button"
            variante="secundario"
            ancho="full"
            tamano="lg"
            className="sm:w-auto"
            onClick={onCerrar}
            disabled={guardando}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
