import { useState } from 'react';
import type { FormEvent } from 'react';
import { Dialog } from '@/ui/Dialog';
import { Field } from '@/ui/Field';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { supabase } from '@/lib/supabase';
import { crearVendedorAdmin, ApiError } from '@/lib/api';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface AgregarVendedorDialogProps {
  onCerrar: () => void;
  /** Se llama con el id del nuevo vendedor cuando el POST termina OK. */
  onCreado: (id: string) => void;
}

/**
 * Dialog para alta manual de un vendedor desde el admin. Nombre, apellido y
 * email son obligatorios — DNI, teléfono y etiqueta opcionales (se pueden
 * completar después con el botón editar). El vendedor se crea sin tocar
 * auth.users: no es un usuario del portal, es un partner comercial.
 */
export function AgregarVendedorDialog({ onCerrar, onCreado }: AgregarVendedorDialogProps) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [dni, setDni] = useState('');
  const [telefono, setTelefono] = useState('');
  const [etiqueta, setEtiqueta] = useState('');
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
      const id = await crearVendedorAdmin(token, {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: email.trim(),
        dni: dni.trim() || undefined,
        telefono: telefono.trim() || undefined,
        etiqueta: etiqueta.trim() || undefined,
      });
      onCreado(id);
    } catch (err) {
      console.error('[AgregarVendedorDialog] error', err);
      if (err instanceof ApiError && err.cuerpo.error === 'email_ya_registrado') {
        setError('Ya existe un vendedor con ese email.');
      } else {
        setError('No pudimos crear el vendedor. Probá de nuevo.');
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
      titulo="Nuevo vendedor"
      descripcion="Partner comercial del programa de ventas. Le vamos a dar una URL para atribuirse ventas."
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
          <Field label="Etiqueta" htmlFor="agregar-etiqueta">
            <Input
              id="agregar-etiqueta"
              placeholder="PREVINCA, Externos…"
              value={etiqueta}
              onChange={(e) => setEtiqueta(e.target.value)}
            />
          </Field>
        </div>

        {error ? <p className="text-sm text-danger-700">{error}</p> : null}

        <div className="mt-2 flex flex-col gap-3 sm:flex-row-reverse">
          <Button type="submit" ancho="full" tamano="lg" className="sm:w-auto" disabled={guardando}>
            {guardando ? 'Creando…' : 'Crear vendedor'}
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
