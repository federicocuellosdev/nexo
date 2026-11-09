import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  BORRADOR_BENEFICIARIO,
  validarBeneficiario,
  type BorradorBeneficiario,
  type ErroresBeneficiario,
} from '@/features/perfil/validacion';
import type { Beneficiario } from '@/mock/session';
import { BirthDatePicker } from '@/features/perfil/BirthDatePicker';
import { Dialog } from '@/ui/Dialog';
import { Field } from '@/ui/Field';
import { Input } from '@/ui/Input';
import { Select } from '@/ui/Select';
import { Button } from '@/ui/Button';

const OPCIONES_DOCUMENTO = [
  { value: 'DNI', label: 'DNI' },
  { value: 'Pasaporte', label: 'Pasaporte' },
];

const OPCIONES_SEXO = [
  { value: 'F', label: 'Femenino' },
  { value: 'M', label: 'Masculino' },
  { value: 'X', label: 'X' },
];

const OPCIONES_RELACION = [
  { value: 'conyuge', label: 'Cónyuge' },
  { value: 'hijo', label: 'Hijo/a' },
  { value: 'padre', label: 'Padre' },
  { value: 'madre', label: 'Madre' },
  { value: 'otro', label: 'Otro' },
];

export interface DialogoAgregarPersonaProps {
  onCerrar: () => void;
  onAgregar: (beneficiario: Beneficiario) => void;
}

/**
 * Formulario standalone para agregar un adherente desde fuera del wizard de
 * perfil. Pide los mismos campos que el paso "familiar" (nombre, apellido,
 * documento, sexo, fecha de nacimiento, relación) — exactamente lo que SF
 * necesita para un beneficiario de /additional-sales. Reusa `validarBeneficiario`
 * para no duplicar reglas.
 */
export function DialogoAgregarPersona({ onCerrar, onAgregar }: DialogoAgregarPersonaProps) {
  const [borrador, setBorrador] = useState<BorradorBeneficiario>({ ...BORRADOR_BENEFICIARIO });
  const [errores, setErrores] = useState<ErroresBeneficiario>({});

  function actualizar<C extends keyof BorradorBeneficiario>(campo: C, valor: BorradorBeneficiario[C]) {
    setBorrador((previo) => ({ ...previo, [campo]: valor }));
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const encontrados = validarBeneficiario(borrador);
    if (Object.keys(encontrados).length > 0) {
      setErrores(encontrados);
      return;
    }
    setErrores({});
    if (borrador.sexo === '' || borrador.relacion === '') return;
    onAgregar({
      nombre: borrador.nombre.trim(),
      apellido: borrador.apellido.trim(),
      tipoDocumento: borrador.tipoDocumento,
      numeroDocumento: borrador.numeroDocumento.trim(),
      sexo: borrador.sexo,
      fechaNacimiento: borrador.fechaNacimiento,
      relacion: borrador.relacion,
    });
  }

  return (
    <Dialog
      abierto
      onCambio={(abierto) => {
        if (!abierto) onCerrar();
      }}
      titulo="Agregar persona al plan"
      descripcion="Sumá a un familiar como adherente. Vamos a pedir solo los datos imprescindibles."
    >
      <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" htmlFor="agregar-nombre" error={errores.nombre} requerido>
            <Input
              id="agregar-nombre"
              value={borrador.nombre}
              invalido={errores.nombre !== undefined}
              onChange={(evento) => actualizar('nombre', evento.target.value)}
            />
          </Field>
          <Field label="Apellido" htmlFor="agregar-apellido" error={errores.apellido} requerido>
            <Input
              id="agregar-apellido"
              value={borrador.apellido}
              invalido={errores.apellido !== undefined}
              onChange={(evento) => actualizar('apellido', evento.target.value)}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
          <Field label="Tipo de documento" htmlFor="agregar-tipo-doc" requerido>
            <Select
              id="agregar-tipo-doc"
              opciones={OPCIONES_DOCUMENTO}
              value={borrador.tipoDocumento}
              onChange={(valor) => actualizar('tipoDocumento', valor as BorradorBeneficiario['tipoDocumento'])}
            />
          </Field>
          <Field
            label="Número de documento"
            htmlFor="agregar-numero-doc"
            error={errores.numeroDocumento}
            ayuda="Sin puntos ni espacios"
            requerido
          >
            <Input
              id="agregar-numero-doc"
              inputMode={borrador.tipoDocumento === 'DNI' ? 'numeric' : 'text'}
              value={borrador.numeroDocumento}
              invalido={errores.numeroDocumento !== undefined}
              onChange={(evento) => actualizar('numeroDocumento', evento.target.value)}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Sexo" htmlFor="agregar-sexo" error={errores.sexo} requerido>
            <Select
              id="agregar-sexo"
              opciones={OPCIONES_SEXO}
              placeholder="Elegí una opción"
              value={borrador.sexo}
              invalido={errores.sexo !== undefined}
              onChange={(valor) => actualizar('sexo', valor as BorradorBeneficiario['sexo'])}
            />
          </Field>
          <Field
            label="Relación con el titular"
            htmlFor="agregar-relacion"
            error={errores.relacion}
            requerido
          >
            <Select
              id="agregar-relacion"
              opciones={OPCIONES_RELACION}
              placeholder="Elegí una opción"
              value={borrador.relacion}
              invalido={errores.relacion !== undefined}
              onChange={(valor) => actualizar('relacion', valor as BorradorBeneficiario['relacion'])}
            />
          </Field>
        </div>

        <Field
          label="Fecha de nacimiento"
          htmlFor="agregar-nacimiento"
          error={errores.fechaNacimiento}
          requerido
        >
          <BirthDatePicker
            id="agregar-nacimiento"
            value={borrador.fechaNacimiento}
            invalido={errores.fechaNacimiento !== undefined}
            onChange={(iso) => actualizar('fechaNacimiento', iso)}
          />
        </Field>

        <div className="mt-2 flex flex-col gap-3 sm:flex-row-reverse">
          <Button type="submit" ancho="full" tamano="lg" className="sm:w-auto">
            Agregar al plan
          </Button>
          <Button
            type="button"
            variante="secundario"
            ancho="full"
            tamano="lg"
            className="sm:w-auto"
            onClick={onCerrar}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
