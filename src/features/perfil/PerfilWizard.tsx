import { useState } from 'react';
import type { FormEvent } from 'react';
import type { PerfilPrevinca } from '@/mock/session';
import {
  aPerfil,
  BORRADOR_INICIAL,
  PASOS,
  validarPaso,
  type BorradorPerfil,
  type ErroresPerfil,
  type PasoPerfil,
} from '@/features/perfil/validacion';
import { Field } from '@/ui/Field';
import { Input } from '@/ui/Input';
import { Select } from '@/ui/Select';
import { Button } from '@/ui/Button';
import { Badge } from '@/ui/Badge';
import { Card } from '@/ui/Card';

export interface PerfilWizardProps {
  /** Paso en el que abre. Lo usa /cuenta para editar una sección puntual. */
  pasoInicial?: PasoPerfil;
  borradorInicial?: BorradorPerfil;
  onGuardar: (perfil: PerfilPrevinca) => void;
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

const OPCIONES_CONTRATACION = [
  { value: 'beneficiario', label: 'Beneficiario' },
  { value: 'tomador', label: 'Tomador' },
  { value: 'tomador-beneficiario', label: 'Tomador y beneficiario' },
];

/** Badge de los campos cuya obligatoriedad Previnca todavía no cerró. */
const EN_DEBATE = <Badge tono="warn">opcional · a definir</Badge>;

export function PerfilWizard({ pasoInicial = 1, borradorInicial, onGuardar }: PerfilWizardProps) {
  const [paso, setPaso] = useState<PasoPerfil>(pasoInicial);
  const [borrador, setBorrador] = useState<BorradorPerfil>(borradorInicial ?? BORRADOR_INICIAL);
  const [errores, setErrores] = useState<ErroresPerfil>({});

  const esUltimo = paso === TOTAL_PASOS;
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

    if (!esUltimo) {
      setPaso((previo) => (previo + 1) as PasoPerfil);
      return;
    }

    onGuardar(aPerfil(borrador));
  }

  function volver() {
    setErrores({});
    setPaso((previo) => (previo - 1) as PasoPerfil);
  }

  return (
    <Card className="flex flex-col gap-5">
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
          className="mt-2 h-1.5 w-full overflow-hidden rounded-pill bg-ink-100"
        >
          <div
            className="h-full rounded-pill bg-brand transition-[width] duration-300 ease-out-expo"
            style={{ width: `${(paso / TOTAL_PASOS) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
        {paso === 1 ? (
          <>
            <Field label="Tipo de documento" htmlFor="perfil-tipo-doc" requerido>
              <Select
                id="perfil-tipo-doc"
                opciones={OPCIONES_DOCUMENTO}
                value={borrador.tipoDocumento}
                onChange={(evento) =>
                  actualizar('tipoDocumento', evento.target.value as BorradorPerfil['tipoDocumento'])
                }
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
            <Field label="Sexo" htmlFor="perfil-sexo" error={errores.sexo} requerido>
              <Select
                id="perfil-sexo"
                opciones={OPCIONES_SEXO}
                placeholder="Elegí una opción"
                value={borrador.sexo}
                invalido={errores.sexo !== undefined}
                onChange={(evento) => actualizar('sexo', evento.target.value as BorradorPerfil['sexo'])}
              />
            </Field>
            <Field
              label="Fecha de nacimiento"
              htmlFor="perfil-nacimiento"
              error={errores.fechaNacimiento}
              ayuda="Necesitamos verificar que seas mayor de edad"
              requerido
            >
              <Input
                id="perfil-nacimiento"
                type="date"
                value={borrador.fechaNacimiento}
                invalido={errores.fechaNacimiento !== undefined}
                onChange={(evento) => actualizar('fechaNacimiento', evento.target.value)}
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

            <Field label="Piso y departamento" htmlFor="perfil-piso" extra={EN_DEBATE}>
              <Input
                id="perfil-piso"
                autoComplete="address-line2"
                value={borrador.piso}
                onChange={(evento) => actualizar('piso', evento.target.value)}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Localidad" htmlFor="perfil-localidad" error={errores.localidad} requerido>
                <Input
                  id="perfil-localidad"
                  autoComplete="address-level2"
                  value={borrador.localidad}
                  invalido={errores.localidad !== undefined}
                  onChange={(evento) => actualizar('localidad', evento.target.value)}
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
          </>
        ) : null}

        {paso === 4 ? (
          <>
            <Field label="¿Tenés obra social o prepaga?" htmlFor="perfil-tiene-os" extra={EN_DEBATE}>
              <Select
                id="perfil-tiene-os"
                opciones={OPCIONES_OBRA_SOCIAL}
                placeholder="Elegí una opción"
                value={borrador.tieneObraSocial}
                onChange={(evento) =>
                  actualizar('tieneObraSocial', evento.target.value as BorradorPerfil['tieneObraSocial'])
                }
              />
            </Field>

            {borrador.tieneObraSocial === 'si' ? (
              <Field label="¿Cuál?" htmlFor="perfil-os" extra={EN_DEBATE}>
                <Input
                  id="perfil-os"
                  value={borrador.obraSocial}
                  onChange={(evento) => actualizar('obraSocial', evento.target.value)}
                />
              </Field>
            ) : null}

            <Field
              label="Tipo de contratación"
              htmlFor="perfil-contratacion"
              error={errores.tipoContratacion}
              requerido
            >
              <Select
                id="perfil-contratacion"
                opciones={OPCIONES_CONTRATACION}
                placeholder="Elegí una opción"
                value={borrador.tipoContratacion}
                invalido={errores.tipoContratacion !== undefined}
                onChange={(evento) =>
                  actualizar('tipoContratacion', evento.target.value as BorradorPerfil['tipoContratacion'])
                }
              />
            </Field>
          </>
        ) : null}

        <div className="mt-2 flex flex-col gap-3 sm:flex-row-reverse">
          <Button type="submit" ancho="full" tamano="lg" className="sm:w-auto">
            {esUltimo ? 'Guardar y activar' : 'Continuar'}
          </Button>
          {paso > 1 ? (
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
