import { useState } from 'react';
import type { FormEvent } from 'react';
import { Dialog } from '@/ui/Dialog';
import { Field } from '@/ui/Field';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { supabase } from '@/lib/supabase';
import { crearAfiliadoAdmin, ApiError } from '@/lib/api';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface AgregarAfiliadoDialogProps {
  onCerrar: () => void;
  /** Se llama con el id del nuevo lead cuando el POST termina OK. */
  onCreado: (id: string) => void;
}

/**
 * Dialog para alta manual de un afiliado desde el admin. Solo nombre,
 * apellido y email son obligatorios — DNI y teléfono quedan opcionales
 * (se pueden completar después con el botón editar). El lead se crea con
 * mp_status=null; la "activación" real ocurre cuando el afiliado paga.
 */
export function AgregarAfiliadoDialog({ onCerrar, onCreado }: AgregarAfiliadoDialogProps) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [dni, setDni] = useState('');
  const [telefono, setTelefono] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  async function crear(evento: FormEvent<HTMLFormElement>) {
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
      const id = await crearAfiliadoAdmin(token, {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: email.trim(),
        dni: dni.trim() || undefined,
        telefono: telefono.trim() || undefined,
      });
      onCreado(id);
    } catch (err) {
      console.error('[AgregarAfiliadoDialog] error', err);
      if (err instanceof ApiError && err.cuerpo.error === 'email_ya_registrado') {
        setError('Ya existe un afiliado con ese email.');
      } else {
        setError('No pudimos crear el afiliado. Probá de nuevo.');
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
      titulo="Nuevo afiliado"
      descripcion="El afiliado activa su cobertura completando el pago con el link que le pases."
    >
      <form onSubmit={crear} noValidate className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" htmlFor="agregar-nombre" requerido>
            <Input id="agregar-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </Field>
          <Field label="Apellido" htmlFor="agregar-apellido" requerido>
            <Input id="agregar-apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} />
          </Field>
          <Field label="Email" htmlFor="agregar-email" requerido>
            <Input
              id="agregar-email"
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Teléfono" htmlFor="agregar-telefono">
            <Input
              id="agregar-telefono"
              inputMode="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </Field>
          <Field label="DNI" htmlFor="agregar-dni">
            <Input id="agregar-dni" inputMode="numeric" value={dni} onChange={(e) => setDni(e.target.value)} />
          </Field>
        </div>

        {error ? <p className="text-sm text-danger-700">{error}</p> : null}

        <div className="mt-2 flex flex-col gap-3 sm:flex-row-reverse">
          <Button type="submit" ancho="full" tamano="lg" className="sm:w-auto" disabled={guardando}>
            {guardando ? 'Creando…' : 'Crear afiliado'}
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
