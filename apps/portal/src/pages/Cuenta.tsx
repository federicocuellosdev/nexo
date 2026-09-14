import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { CreditCard } from 'lucide-react';
import type { PerfilPrevinca } from '@/mock/session';
import { resetSession, setSession, useSession } from '@/mock/session';
import { desdePerfil, type PasoPerfil } from '@/features/perfil/validacion';
import { PerfilWizard, type DatosDelWizard } from '@/features/perfil/PerfilWizard';
import { Card } from '@/ui/Card';
import { Icon } from '@/ui/Icon';
import { Badge } from '@/ui/Badge';
import { Button, clasesBoton } from '@/ui/Button';
import { Dialog } from '@/ui/Dialog';
import { landingUrl } from '@/lib/urls';

const ETIQUETA_SEXO: Record<'F' | 'M' | 'X', string> = {
  F: 'Femenino',
  M: 'Masculino',
  X: 'X',
};

const ETIQUETA_CONTRATACION: Record<PerfilPrevinca['tipoContratacion'], string> = {
  beneficiario: 'Beneficiario',
  tomador: 'Tomador',
  'tomador-beneficiario': 'Tomador y beneficiario',
};

function domicilioLegible(perfil: PerfilPrevinca): string {
  const { calle, numero, piso, localidad, provincia, cp } = perfil.domicilio;
  const linea = piso ? `${calle} ${numero}, ${piso}` : `${calle} ${numero}`;
  return `${linea} · ${localidad}, ${provincia} (${cp})`;
}

function Seccion({
  titulo,
  onEditar,
  children,
}: {
  titulo: string;
  onEditar?: () => void;
  children: ReactNode;
}) {
  return (
    <section aria-label={titulo}>
      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-medium text-ink-900">{titulo}</h2>
          {onEditar ? (
            <Button variante="fantasma" tamano="sm" onClick={onEditar}>
              Editar
            </Button>
          ) : null}
        </div>
        {children}
      </Card>
    </section>
  );
}

function Interruptor({ id, label }: { id: string; label: string }) {
  const [activo, setActivo] = useState(true);
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="text-sm text-ink-700">
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={activo}
        onClick={() => setActivo((previo) => !previo)}
        className={`inline-flex h-6 w-11 shrink-0 items-center rounded-pill p-0.5 transition-colors duration-200 ${
          activo ? 'bg-marca-500' : 'bg-ink-200'
        }`}
      >
        <span
          className={`size-5 rounded-pill bg-white shadow-suave transition-transform duration-200 ease-out-quart ${
            activo ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export function Cuenta() {
  const sesion = useSession();
  const perfil = sesion.perfil;
  const usuario = sesion.usuario;
  const [pasoEditado, setPasoEditado] = useState<PasoPerfil | null>(null);

  function guardar({ perfil: actualizado, identidad }: DatosDelWizard) {
    // El nombre viaja a `usuario` y el resto a `perfil`: son dos destinos
    // distintos del store. Editar "Datos personales" desde acá ahora también
    // corrige el nombre, que es justo lo que le falta a quien entró por login.
    setSession({ perfil: actualizado, ...(usuario ? { usuario: { ...usuario, ...identidad } } : {}) });
    setPasoEditado(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl text-ink-950">Mi cuenta</h1>
        <p className="mt-1 text-sm text-ink-600">Tus datos, tu medio de pago y tus notificaciones.</p>
      </div>

      <Seccion titulo="Datos de contacto">
        <dl className="flex flex-col gap-1 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-ink-500">Nombre</dt>
            <dd className="text-ink-900">{usuario ? `${usuario.nombre} ${usuario.apellido}` : '—'}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-500">Email</dt>
            <dd className="text-ink-900">{usuario?.email ?? '—'}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-500">Teléfono</dt>
            <dd className="text-ink-900">{usuario?.telefono ?? '—'}</dd>
          </div>
        </dl>
      </Seccion>

      {perfil ? (
        <>
          <Seccion titulo="Documento" onEditar={() => setPasoEditado(1)}>
            <p className="text-sm text-ink-900">{`${perfil.tipoDocumento} ${perfil.numeroDocumento}`}</p>
          </Seccion>

          <Seccion titulo="Datos personales" onEditar={() => setPasoEditado(2)}>
            <p className="text-sm text-ink-900">
              {`${ETIQUETA_SEXO[perfil.sexo]} · Nacimiento ${perfil.fechaNacimiento}`}
            </p>
          </Seccion>

          <Seccion titulo="Domicilio" onEditar={() => setPasoEditado(3)}>
            <p className="text-sm text-ink-900">{domicilioLegible(perfil)}</p>
          </Seccion>

          <Seccion titulo="Cobertura y contratación" onEditar={() => setPasoEditado(4)}>
            <div className="flex flex-col gap-2 text-sm text-ink-900">
              <div className="flex flex-wrap items-center gap-2">
                <span>
                  {perfil.tieneObraSocial
                    ? `Obra social: ${perfil.obraSocial ?? 'sin especificar'}`
                    : 'Sin obra social'}
                </span>
                <Badge tono="warn">opcional · a definir</Badge>
              </div>
              <span>{ETIQUETA_CONTRATACION[perfil.tipoContratacion]}</span>
            </div>
          </Seccion>
        </>
      ) : (
        <Seccion titulo="Perfil Previnca">
          <p className="text-sm text-ink-600">
            Todavía no completaste tu perfil. Sin él la cobertura queda pendiente de activación.
          </p>
          <Link to="/perfil/completar" className={clasesBoton({ tamano: 'sm', className: 'self-start' })}>
            Completar perfil
          </Link>
        </Seccion>
      )}

      <Seccion titulo="Medio de pago">
        <div className="flex items-center gap-3">
          <Icon icono={CreditCard} tono="neutro" tamano="sm" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink-900">Visa •••• 4242</p>
            <p className="text-xs text-ink-500">Medio de pago de demostración</p>
          </div>
        </div>
      </Seccion>

      <Seccion titulo="Notificaciones">
        <div className="flex flex-col gap-3">
          <Interruptor id="notif-email" label="Avisos por email" />
          <Interruptor id="notif-push" label="Recordatorio de vencimiento" />
          <p className="text-xs text-ink-500">sin efecto · demo</p>
        </div>
      </Seccion>

      <Seccion titulo="Sesión">
        <a
          href={landingUrl()}
          onClick={() => resetSession()}
          className={clasesBoton({ variante: 'peligro', tamano: 'sm', className: 'self-start' })}
        >
          Cerrar sesión
        </a>
      </Seccion>

      {pasoEditado !== null && perfil ? (
        <Dialog
          abierto
          onCambio={(abierto) => {
            if (!abierto) setPasoEditado(null);
          }}
          titulo="Editar tus datos"
        >
          <PerfilWizard
            pasoInicial={pasoEditado}
            borradorInicial={desdePerfil(perfil, usuario)}
            soloEstePaso
            onGuardar={guardar}
          />
        </Dialog>
      ) : null}
    </div>
  );
}
