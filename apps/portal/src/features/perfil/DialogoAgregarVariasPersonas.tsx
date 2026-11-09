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
import { Money } from '@/ui/Money';
import { formatearPrecio } from '@/lib/formato';
import { cn } from '@/lib/cn';

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

const MIN_PERSONAS = 1;
const MAX_PERSONAS = 5;

export interface DialogoAgregarVariasPersonasProps {
  /** Precio mensual del plan por persona — se usa para el total `× cantidad`. */
  precioPorPersona: number;
  onCerrar: () => void;
  /** Se dispara con TODOS los beneficiarios completos cuando el usuario llega
   *  a "Pagar": el caller agrega al perfil y dispara el pago por el total. */
  onFinalizar: (beneficiarios: Beneficiario[]) => void;
}

/**
 * Wizard de "Agregar persona(s)" en 3 fases:
 *   1. Contador: cuántas personas querés sumar (−/+ con límites 1-5).
 *   2. Formulario por persona: N pasos, uno por adherente.
 *   3. Resumen con total = `precioPorPersona × N` y CTA "Pagar".
 *
 * Mantenemos todo en UN diálogo con un step counter interno para que el
 * usuario no vea el popup abrir/cerrar varias veces.
 */
export function DialogoAgregarVariasPersonas({
  precioPorPersona,
  onCerrar,
  onFinalizar,
}: DialogoAgregarVariasPersonasProps) {
  // step 0 = contador; 1..cantidad = formulario de persona N; cantidad+1 = resumen
  const [step, setStep] = useState(0);
  const [cantidad, setCantidad] = useState(1);
  const [borradores, setBorradores] = useState<BorradorBeneficiario[]>([
    { ...BORRADOR_BENEFICIARIO },
  ]);
  const [errores, setErrores] = useState<ErroresBeneficiario>({});

  // Sincroniza el array de borradores con la cantidad elegida sin tirar
  // datos ya cargados si el usuario sube/baja el contador.
  function ajustarCantidad(nueva: number) {
    const n = Math.max(MIN_PERSONAS, Math.min(MAX_PERSONAS, nueva));
    setCantidad(n);
    setBorradores((previos) => {
      if (n === previos.length) return previos;
      if (n > previos.length) {
        const extras = Array.from({ length: n - previos.length }, () => ({ ...BORRADOR_BENEFICIARIO }));
        return [...previos, ...extras];
      }
      return previos.slice(0, n);
    });
  }

  function actualizarCampo<C extends keyof BorradorBeneficiario>(
    idx: number,
    campo: C,
    valor: BorradorBeneficiario[C],
  ) {
    setBorradores((previos) => {
      const siguiente = [...previos];
      siguiente[idx] = { ...siguiente[idx], [campo]: valor };
      return siguiente;
    });
  }

  function continuarDesdeContador() {
    setStep(1);
  }

  function enviarFormulario(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const idx = step - 1;
    const encontrados = validarBeneficiario(borradores[idx]);
    if (Object.keys(encontrados).length > 0) {
      setErrores(encontrados);
      return;
    }
    setErrores({});
    // Si todavía quedan personas por cargar, pasar al siguiente formulario.
    // Si no, ir al step de resumen (cantidad + 1).
    setStep((previo) => previo + 1);
  }

  function volverPaso() {
    setErrores({});
    setStep((previo) => Math.max(0, previo - 1));
  }

  function finalizar() {
    // Doble check: los borradores ya pasaron validación (step N+1 solo se
    // alcanza completando todos), pero convertir a Beneficiario tipado requiere
    // que sexo/relacion no sean ''.
    const beneficiarios: Beneficiario[] = [];
    for (const b of borradores) {
      if (b.sexo === '' || b.relacion === '') return;
      beneficiarios.push({
        nombre: b.nombre.trim(),
        apellido: b.apellido.trim(),
        tipoDocumento: b.tipoDocumento,
        numeroDocumento: b.numeroDocumento.trim(),
        sexo: b.sexo,
        fechaNacimiento: b.fechaNacimiento,
        relacion: b.relacion,
      });
    }
    onFinalizar(beneficiarios);
  }

  const total = precioPorPersona * cantidad;
  const enContador = step === 0;
  const enFormulario = step >= 1 && step <= cantidad;
  const enResumen = step === cantidad + 1;
  const idxFormulario = step - 1;
  const borradorActual = enFormulario ? borradores[idxFormulario] : null;

  // Título que el Dialog muestra en su header. Cambia por fase.
  const titulo = enContador
    ? 'Agregar personas al plan'
    : enFormulario
      ? `Persona ${step} de ${cantidad}`
      : 'Confirmá el pago';
  const descripcion = enContador
    ? '¿Cuántos adherentes querés sumar? Cada persona cuesta lo mismo que tu plan.'
    : enFormulario
      ? 'Datos imprescindibles. Son los mismos que pedimos al titular.'
      : 'Vamos a crear la suscripción mensual con el total acumulado.';

  // Estilo del botón de contador, copiado del PlanPendienteCard de /inicio
  // para mantener el mismo lenguaje visual.
  const botonContador =
    'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-50 text-ink-900 ring-1 ring-ink-200 transition-colors cursor-pointer hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <Dialog
      abierto
      onCambio={(abierto) => {
        if (!abierto) onCerrar();
      }}
      titulo={titulo}
      descripcion={descripcion}
    >
      {enContador ? (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4 rounded-card bg-ink-50 p-5">
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink-900">Adherentes a sumar</p>
              <p className="mt-1 text-xs text-ink-500">Entre {MIN_PERSONAS} y {MAX_PERSONAS}.</p>
            </div>
            <div className="flex items-center gap-4" role="group" aria-label="Cantidad de adherentes">
              <button
                type="button"
                aria-label="Quitar un adherente"
                disabled={cantidad <= MIN_PERSONAS}
                onClick={() => ajustarCantidad(cantidad - 1)}
                className={botonContador}
              >
                −
              </button>
              <span aria-live="polite" className="min-w-[2ch] text-center text-2xl font-medium tabular-nums text-ink-950">
                {cantidad}
              </span>
              <button
                type="button"
                aria-label="Agregar un adherente"
                disabled={cantidad >= MAX_PERSONAS}
                onClick={() => ajustarCantidad(cantidad + 1)}
                className={botonContador}
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-baseline justify-between gap-3 border-t border-ink-100 pt-4">
            <span className="text-sm text-ink-600">
              {`${formatearPrecio(precioPorPersona)} × ${cantidad} ${cantidad === 1 ? 'persona' : 'personas'}`}
            </span>
            <Money monto={total} periodo="/mes" />
          </div>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row-reverse">
            <Button type="button" ancho="full" tamano="lg" className="sm:w-auto" onClick={continuarDesdeContador}>
              Continuar
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
        </div>
      ) : null}

      {enFormulario && borradorActual ? (
        <form onSubmit={enviarFormulario} noValidate className="flex flex-col gap-4">
          {/* Puntitos de progreso: 1 por persona, el actual lleno. */}
          <div className="flex items-center gap-2" aria-hidden="true">
            {Array.from({ length: cantidad }, (_, i) => (
              <span
                key={i}
                className={cn(
                  'size-2 rounded-pill',
                  i < step ? 'bg-marca-600' : 'bg-ink-200',
                )}
              />
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" htmlFor={`varias-${idxFormulario}-nombre`} error={errores.nombre} requerido>
              <Input
                id={`varias-${idxFormulario}-nombre`}
                value={borradorActual.nombre}
                invalido={errores.nombre !== undefined}
                onChange={(evento) => actualizarCampo(idxFormulario, 'nombre', evento.target.value)}
              />
            </Field>
            <Field label="Apellido" htmlFor={`varias-${idxFormulario}-apellido`} error={errores.apellido} requerido>
              <Input
                id={`varias-${idxFormulario}-apellido`}
                value={borradorActual.apellido}
                invalido={errores.apellido !== undefined}
                onChange={(evento) => actualizarCampo(idxFormulario, 'apellido', evento.target.value)}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
            <Field label="Tipo de documento" htmlFor={`varias-${idxFormulario}-tipo-doc`} requerido>
              <Select
                id={`varias-${idxFormulario}-tipo-doc`}
                opciones={OPCIONES_DOCUMENTO}
                value={borradorActual.tipoDocumento}
                onChange={(valor) =>
                  actualizarCampo(idxFormulario, 'tipoDocumento', valor as BorradorBeneficiario['tipoDocumento'])
                }
              />
            </Field>
            <Field
              label="Número de documento"
              htmlFor={`varias-${idxFormulario}-numero-doc`}
              error={errores.numeroDocumento}
              ayuda="Sin puntos ni espacios"
              requerido
            >
              <Input
                id={`varias-${idxFormulario}-numero-doc`}
                inputMode={borradorActual.tipoDocumento === 'DNI' ? 'numeric' : 'text'}
                value={borradorActual.numeroDocumento}
                invalido={errores.numeroDocumento !== undefined}
                onChange={(evento) => actualizarCampo(idxFormulario, 'numeroDocumento', evento.target.value)}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Sexo" htmlFor={`varias-${idxFormulario}-sexo`} error={errores.sexo} requerido>
              <Select
                id={`varias-${idxFormulario}-sexo`}
                opciones={OPCIONES_SEXO}
                placeholder="Elegí una opción"
                value={borradorActual.sexo}
                invalido={errores.sexo !== undefined}
                onChange={(valor) => actualizarCampo(idxFormulario, 'sexo', valor as BorradorBeneficiario['sexo'])}
              />
            </Field>
            <Field
              label="Relación con el titular"
              htmlFor={`varias-${idxFormulario}-relacion`}
              error={errores.relacion}
              requerido
            >
              <Select
                id={`varias-${idxFormulario}-relacion`}
                opciones={OPCIONES_RELACION}
                placeholder="Elegí una opción"
                value={borradorActual.relacion}
                invalido={errores.relacion !== undefined}
                onChange={(valor) =>
                  actualizarCampo(idxFormulario, 'relacion', valor as BorradorBeneficiario['relacion'])
                }
              />
            </Field>
          </div>

          <Field
            label="Fecha de nacimiento"
            htmlFor={`varias-${idxFormulario}-nacimiento`}
            error={errores.fechaNacimiento}
            requerido
          >
            <BirthDatePicker
              id={`varias-${idxFormulario}-nacimiento`}
              value={borradorActual.fechaNacimiento}
              invalido={errores.fechaNacimiento !== undefined}
              onChange={(iso) => actualizarCampo(idxFormulario, 'fechaNacimiento', iso)}
            />
          </Field>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row-reverse">
            <Button type="submit" ancho="full" tamano="lg" className="sm:w-auto">
              {step === cantidad ? 'Revisar total' : 'Siguiente'}
            </Button>
            <Button
              type="button"
              variante="secundario"
              ancho="full"
              tamano="lg"
              className="sm:w-auto"
              onClick={volverPaso}
            >
              Volver
            </Button>
          </div>
        </form>
      ) : null}

      {enResumen ? (
        <div className="flex flex-col gap-5">
          <ul className="flex flex-col divide-y divide-ink-100 rounded-card bg-ink-50">
            {borradores.map((b, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-900">
                    {`${b.nombre} ${b.apellido}`.trim() || `Persona ${i + 1}`}
                  </p>
                  <p className="text-xs text-ink-500">{b.numeroDocumento}</p>
                </div>
                <span className="text-sm text-ink-600">{formatearPrecio(precioPorPersona)}</span>
              </li>
            ))}
          </ul>

          <div className="flex items-baseline justify-between gap-3 border-t border-ink-100 pt-4">
            <span className="text-sm font-medium text-ink-900">Total mensual adicional</span>
            <Money monto={total} periodo="/mes" />
          </div>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row-reverse">
            <Button type="button" ancho="full" tamano="lg" className="sm:w-auto" onClick={finalizar}>
              Ir al pago
            </Button>
            <Button
              type="button"
              variante="secundario"
              ancho="full"
              tamano="lg"
              className="sm:w-auto"
              onClick={() => setStep(cantidad)}
            >
              Revisar datos
            </Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
