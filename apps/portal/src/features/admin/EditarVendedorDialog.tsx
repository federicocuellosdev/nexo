import { useState } from 'react';
import type { FormEvent } from 'react';
import { Dialog } from '@/ui/Dialog';
import { Field } from '@/ui/Field';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { supabase } from '@/lib/supabase';
import { editarVendedorAdmin, ApiError, type VendedorAdmin } from '@/lib/api';
import { SelectorEtiqueta } from '@/features/admin/SelectorEtiqueta';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface EditarVendedorDialogProps {
  vendedor: VendedorAdmin;
  onCerrar: () => void;
  /** Se llama cuando el PATCH termina OK, para que el caller refresque la lista. */
  onGuardado: () => void;
}

/**
 * Dialog para editar los datos del vendedor: nombre, apellido, email, DNI,
 * teléfono, etiqueta. Al guardar, el backend sincroniza el email contra
 * auth.users (si cambia) y le manda al vendedor un mail con los datos nuevos.
 */
export function EditarVendedorDialog({ vendedor, onCerrar, onGuardado }: EditarVendedorDialogProps) {
  const [nombre, setNombre] = useState(vendedor.nombre);
  const [apellido, setApellido] = useState(vendedor.apellido);
  const [email, setEmail] = useState(vendedor.email);
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
    if (!EMAIL.test(email.trim())) {
      setError('Revisá el formato del email');
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
        email: email.trim(),
        dni: dni.trim() || undefined,
        telefono: telefono.trim() || undefined,
        etiqueta: etiqueta.trim() || undefined,
      });
      onGuardado();
    } catch (err) {
      console.error('[EditarVendedorDialog] error', err);
      if (err instanceof ApiError && err.cuerpo.error === 'email_ya_registrado') {
        setError('Ya existe otro vendedor con ese email.');
      } else {
        setError('No pudimos guardar los cambios. Probá de nuevo.');
      }
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
      descripcion="Al guardar le mandamos un email al vendedor con sus datos actualizados."
    >
      <form onSubmit={guardar} noValidate className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" htmlFor="editar-nombre" requerido>
            <Input id="editar-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </Field>
          <Field label="Apellido" htmlFor="editar-apellido" requerido>
            <Input id="editar-apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} />
          </Field>
        </div>
        <Field label="Email" htmlFor="editar-email" requerido>
          <Input
            id="editar-email"
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Teléfono" htmlFor="editar-telefono">
          <Input
            id="editar-telefono"
            inputMode="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="DNI" htmlFor="editar-dni">
            <Input id="editar-dni" inputMode="numeric" value={dni} onChange={(e) => setDni(e.target.value)} />
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
