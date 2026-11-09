import { useState } from 'react';
import type { FormEvent } from 'react';
import { cn } from '@/lib/cn';
import type { PerfilPrevinca } from '@/mock/session';
import {
  aPerfil,
  BORRADOR_INICIAL,
  identidadDelBorrador,
  LOCALIDADES,
  PASOS,
  PROVINCIA_POR_DEFECTO,
  validarPaso,
  type BorradorPerfil,
  type ErroresPerfil,
  type PasoPerfil,
} from '@/features/perfil/validacion';
import { BirthDatePicker } from '@/features/perfil/BirthDatePicker';
import { Field } from '@/ui/Field';
import { Input } from '@/ui/Input';
import { Select } from '@/ui/Select';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';

export interface PerfilWizardProps {
  /** Paso en el que abre. Lo usa /cuenta para editar una sección puntual. */
  pasoInicial?: PasoPerfil;
  borradorInicial?: BorradorPerfil;
  /**
   * Modo edición de una sola sección: el wizard queda fijo en `pasoInicial`
   * (sin "Volver" ni avance a los siguientes pasos) y el CTA guarda directo,
   * validando solo ese paso. Lo usa /cuenta, donde `borradorInicial` ya viene
   * completo desde el perfil existente. El alta desde /perfil/completar
   * (4 pasos secuenciales) no pasa esta prop y sigue igual.
   */
  soloEstePaso?: boolean;
  onGuardar: (datos: DatosDelWizard) => void;
}

/**
 * Lo que el wizard entrega al guardar, con los DOS destinos separados.
 *
 * `perfil` va a `sesion.perfil` e `identidad` a `sesion.usuario`. Van aparte a
 * propósito: nombre y apellido no pertenecen a `PerfilPrevinca`, y devolverlos
 * en un solo objeto invitaría a guardarlos ahí adentro, duplicando la fuente de
 * verdad que hoy lee el saludo, el avatar y /cuenta.
 */
export interface DatosDelWizard {
  perfil: PerfilPrevinca;
  identidad: { nombre: string; apellido: string };
}

const TOTAL_PASOS = PASOS.length;

const OPCIONES_DOCUMENTO = [
  { value: 'DNI', label: 'DNI' },
  { value: 'Pasaporte', label: 'Pasaporte' },
];

const OPCIONES_SEXO = [
  { value: 'F', label: 'Femenino' },
  { value: 'M', label: 'Masculino' },
  { value: 'X', label: 'X' },
];

const OPCIONES_OBRA_SOCIAL = [
  { value: 'si', label: 'Sí' },
  { value: 'no', label: 'No' },
];

const OPCIONES_LOCALIDAD = LOCALIDADES.map((l) => ({ value: l, label: l }));

export function PerfilWizard({
  pasoInicial = 1,
  borradorInicial,
  soloEstePaso = false,
  onGuardar,
}: PerfilWizardProps) {
  const [paso, setPaso] = useState<PasoPerfil>(pasoInicial);
  const [borrador, setBorrador] = useState<BorradorPerfil>(borradorInicial ?? BORRADOR_INICIAL);
  const [errores, setErrores] = useState<ErroresPerfil>({});

  const esUltimo = paso === TOTAL_PASOS;
  // En modo sección puntual el CTA siempre guarda, sin importar en qué paso
  // esté parado: no hay "siguiente" al que avanzar.
  const guardaDirecto = soloEstePaso || esUltimo;
  const titulo = PASOS.find((p) => p.numero === paso)?.titulo ?? '';

  function actualizar<C extends keyof BorradorPerfil>(campo: C, valor: BorradorPerfil[C]) {
    setBorrador((previo) => ({ ...previo, [campo]: valor }));
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const encontrados = validarPaso(paso, borrador);
    if (Object.keys(encontrados).length > 0) {
      setErrores(encontrados);
      return;
    }
    setErrores({});

    if (!guardaDirecto) {
      setPaso((previo) => (previo + 1) as PasoPerfil);
      return;
    }

    onGuardar({ perfil: aPerfil(borrador), identidad: identidadDelBorrador(borrador) });
  }

  function volver() {
    setErrores({});
    setPaso((previo) => (previo - 1) as PasoPerfil);
  }

  return (
    <Card className="flex flex-col gap-5">
      {soloEstePaso ? (
        // Sin "Paso X de 4" ni barra de progreso: en modo sección puntual no
        // hay pasos siguientes ni anteriores, mostrarlos sería prometer una
        // navegación que esta instancia no ofrece.
        <span className="text-sm font-medium text-ink-900">{titulo}</span>
      ) : (
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium text-ink-500">{`Paso ${paso} de ${TOTAL_PASOS}`}</span>
            <span className="text-sm text-ink-600">{titulo}</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={paso}
            aria-valuemin={1}
            aria-valuemax={TOTAL_PASOS}
            aria-label="Progreso del perfil"
            className="mt-3 flex items-center gap-2"
          >
            {Array.from({ length: TOTAL_PASOS }, (_, i) => i + 1).map((n) => (
              <span
                key={n}
                aria-hidden="true"
                className={cn(
                  'size-2 rounded-pill transition-colors duration-200',
                  n <= paso ? 'bg-marca-600' : 'bg-ink-200',
                )}
              />
            ))}
          </div>
        </div>
      )}

      <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
        {paso === 1 ? (
          <>
            <Field label="Tipo de documento" htmlFor="perfil-tipo-doc" requerido>
              <Select
                id="perfil-tipo-doc"
                opciones={OPCIONES_DOCUMENTO}
                value={borrador.tipoDocumento}
                onChange={(valor) => actualizar('tipoDocumento', valor as BorradorPerfil['tipoDocumento'])}
              />
            </Field>
            <Field
              label="Número de documento"
              htmlFor="perfil-numero-doc"
              error={errores.numeroDocumento}
              ayuda="Sin puntos ni espacios"
              requerido
            >
              <Input
                id="perfil-numero-doc"
                inputMode={borrador.tipoDocumento === 'DNI' ? 'numeric' : 'text'}
                value={borrador.numeroDocumento}
                invalido={errores.numeroDocumento !== undefined}
                onChange={(evento) => actualizar('numeroDocumento', evento.target.value)}
              />
            </Field>
          </>
        ) : null}

        {paso === 2 ? (
          <>
            {/* Nombre y apellido NO se piden acá: ya se cargaron en el alta de
                la landing (AltaDialog) o quedan vacíos para el camino de login,
                donde los suma /cuenta. Mantenerlos en el borrador (vía
                `BORRADOR_INICIAL` + precarga de PerfilCompletar) alcanza para
                que `identidad` siga llegando a `sesion.usuario`. */}
            <Field label="Sexo" htmlFor="perfil-sexo" error={errores.sexo} requerido>
              <Select
                id="perfil-sexo"
                opciones={OPCIONES_SEXO}
                placeholder="Elegí una opción"
                value={borrador.sexo}
                invalido={errores.sexo !== undefined}
                onChange={(valor) => actualizar('sexo', valor as BorradorPerfil['sexo'])}
              />
            </Field>
            <Field
              label="Fecha de nacimiento"
              htmlFor="perfil-nacimiento"
              error={errores.fechaNacimiento}
              ayuda="Necesitamos verificar que seas mayor de edad"
              requerido
            >
              <BirthDatePicker
                id="perfil-nacimiento"
                value={borrador.fechaNacimiento}
                invalido={errores.fechaNacimiento !== undefined}
                onChange={(iso) => actualizar('fechaNacimiento', iso)}
              />
            </Field>
          </>
        ) : null}

        {paso === 3 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
              <Field label="Calle" htmlFor="perfil-calle" error={errores.calle} requerido>
                <Input
                  id="perfil-calle"
                  autoComplete="address-line1"
                  value={borrador.calle}
                  invalido={errores.calle !== undefined}
                  onChange={(evento) => actualizar('calle', evento.target.value)}
                />
              </Field>
              <Field label="Número" htmlFor="perfil-numero" error={errores.numero} requerido>
                <Input
                  id="perfil-numero"
                  inputMode="numeric"
                  value={borrador.numero}
                  invalido={errores.numero !== undefined}
                  onChange={(evento) => actualizar('numero', evento.target.value)}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Piso" htmlFor="perfil-piso">
                <Input
                  id="perfil-piso"
                  autoComplete="address-line2"
                  value={borrador.piso}
                  onChange={(evento) => actualizar('piso', evento.target.value)}
                />
              </Field>
              <Field label="Departamento" htmlFor="perfil-departamento">
                <Input
                  id="perfil-departamento"
                  autoComplete="address-line3"
                  value={borrador.departamento}
                  onChange={(evento) => actualizar('departamento', evento.target.value)}
                />
              </Field>
              <Field label="Torre" htmlFor="perfil-torre">
                <Input
                  id="perfil-torre"
                  value={borrador.torre}
                  onChange={(evento) => actualizar('torre', evento.target.value)}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Localidad" htmlFor="perfil-localidad" error={errores.localidad} requerido>
                <Select
                  id="perfil-localidad"
                  opciones={OPCIONES_LOCALIDAD}
                  placeholder="Elegí tu localidad"
                  value={borrador.localidad}
                  invalido={errores.localidad !== undefined}
                  // Al elegir una localidad, auto-rellena la provincia: hoy
                  // las tres cubiertas (Rosario / Granadero / Villa Gálvez)
                  // son de Santa Fe. Si la provincia no estaba ya cargada se
                  // sugiere el default; si venía otra (p.ej. editada a mano
                  // en una sesión previa) se la respeta.
                  onChange={(valor) => {
                    setBorrador((previo) => ({
                      ...previo,
                      localidad: valor,
                      provincia: previo.provincia.trim() === '' ? PROVINCIA_POR_DEFECTO : previo.provincia,
                    }));
                  }}
                />
              </Field>
              <Field label="Provincia" htmlFor="perfil-provincia" error={errores.provincia} requerido>
                <Input
                  id="perfil-provincia"
                  autoComplete="address-level1"
                  value={borrador.provincia}
                  invalido={errores.provincia !== undefined}
                  onChange={(evento) => actualizar('provincia', evento.target.value)}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Código postal" htmlFor="perfil-cp" error={errores.cp} requerido>
                <Input
                  id="perfil-cp"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  value={borrador.cp}
                  invalido={errores.cp !== undefined}
                  onChange={(evento) => actualizar('cp', evento.target.value)}
                />
              </Field>
              <Field label="País" htmlFor="perfil-pais" error={errores.pais} requerido>
                <Input
                  id="perfil-pais"
                  autoComplete="country-name"
                  value={borrador.pais}
                  invalido={errores.pais !== undefined}
                  onChange={(evento) => actualizar('pais', evento.target.value)}
                />
              </Field>
            </div>
          </>
        ) : null}

        {paso === 4 ? (
          <>
            <Field label="¿Tenés obra social o prepaga?" htmlFor="perfil-tiene-os">
              <Select
                id="perfil-tiene-os"
                opciones={OPCIONES_OBRA_SOCIAL}
                placeholder="Elegí una opción"
                value={borrador.tieneObraSocial}
                onChange={(valor) => actualizar('tieneObraSocial', valor as BorradorPerfil['tieneObraSocial'])}
              />
            </Field>

            {borrador.tieneObraSocial === 'si' ? (
              <Field label="¿Cuál?" htmlFor="perfil-os">
                <Input
                  id="perfil-os"
                  value={borrador.obraSocial}
                  onChange={(evento) => actualizar('obraSocial', evento.target.value)}
                />
              </Field>
            ) : null}
          </>
        ) : null}

        <div className="mt-2 flex flex-col gap-3 sm:flex-row-reverse">
          <Button type="submit" ancho="full" tamano="lg" className="sm:w-auto">
            {soloEstePaso ? 'Guardar cambios' : esUltimo ? 'Guardar y activar' : 'Continuar'}
          </Button>
          {/* Sin "Volver" en modo sección puntual: no hay otro paso al que
              navegar, esta instancia solo edita `pasoInicial`. */}
          {paso > 1 && !soloEstePaso ? (
            <Button
              type="button"
              variante="secundario"
              ancho="full"
              tamano="lg"
              className="sm:w-auto"
              onClick={volver}
            >
              Volver
            </Button>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
