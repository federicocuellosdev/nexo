import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestimonioCard } from '@/features/testimonios/TestimonioCard';
import { TESTIMONIOS, type Testimonio } from '@/mock/testimonios';

const CORTO: Testimonio = {
  id: 'corto',
  texto: 'Excelente atención telefónica.',
  autor: 'Clau Dowling',
  antiguedad: 'Socia nueva',
};

const LARGO: Testimonio = {
  id: 'largo',
  texto: `Tengo el servicio desde que tengo uso de razón ${'y sigue estando ahí cuando lo necesito '.repeat(6)}`,
  autor: 'Denise Coletti',
  antiguedad: 'Socia desde hace años',
};

test('la cita usa blockquote para que se anuncie como cita, no como párrafo suelto', () => {
  const { container } = render(<TestimonioCard testimonio={CORTO} />);
  expect(container.querySelector('blockquote')).toHaveTextContent('Excelente atención telefónica.');
});

test('la autoría va en un cite dentro del figcaption, ligada a la cita', () => {
  const { container } = render(<TestimonioCard testimonio={CORTO} />);
  const pie = container.querySelector('figcaption');
  expect(pie?.querySelector('cite')).toHaveTextContent('Clau Dowling');
  expect(pie).toHaveTextContent('Socia nueva');
});

test('un testimonio corto no ofrece "Ver más": no hay nada más que ver', () => {
  render(<TestimonioCard testimonio={CORTO} />);
  expect(screen.queryByRole('button', { name: /ver más/i })).not.toBeInTheDocument();
});

test('un testimonio largo se recorta y ofrece expandirlo', () => {
  const { container } = render(<TestimonioCard testimonio={LARGO} />);
  const cita = container.querySelector('blockquote');
  expect(cita?.textContent?.length).toBeLessThan(LARGO.texto.length);
  expect(cita).toHaveTextContent('…');
  expect(screen.getByRole('button', { name: /ver más/i })).toHaveAttribute('aria-expanded', 'false');
});

test('el recorte no parte una palabra al medio', () => {
  const { container } = render(<TestimonioCard testimonio={LARGO} />);
  const visible = container.querySelector('blockquote')?.textContent ?? '';
  // Se quitan las comillas tipográficas y la elipsis para mirar la última palabra.
  const sinAdornos = visible.replace(/[“”]/g, '').replace(/…$/, '').trimEnd();
  const ultimaPalabra = sinAdornos.split(/\s+/).pop() ?? '';
  expect(LARGO.texto).toContain(` ${ultimaPalabra} `);
});

test('expandir muestra el texto completo y el botón cambia de estado', async () => {
  const usuario = userEvent.setup();
  const { container } = render(<TestimonioCard testimonio={LARGO} />);

  await usuario.click(screen.getByRole('button', { name: /ver más/i }));

  expect(container.querySelector('blockquote')).toHaveTextContent(LARGO.texto.trim());
  const boton = screen.getByRole('button', { name: /ver menos/i });
  expect(boton).toHaveAttribute('aria-expanded', 'true');
  // El botón dice de qué región habla: sin esto, un lector de pantalla anuncia
  // "expandido" sin decir qué se expandió.
  expect(boton).toHaveAttribute('aria-controls', container.querySelector('blockquote')?.id);
});

test('el avatar muestra las iniciales del autor', () => {
  render(<TestimonioCard testimonio={CORTO} />);
  expect(screen.getByText('CD')).toBeInTheDocument();
});

/* ── La regla que importa ────────────────────────────────────────────────── */

test('cada testimonio trae texto, autor y antigüedad', () => {
  // Este archivo NO es un mock decorativo: son citas de personas con nombre y
  // apellido sobre una empresa de salud.
  for (const t of TESTIMONIOS) {
    expect(t.texto.trim().length).toBeGreaterThan(20);
    expect(t.autor.trim()).not.toBe('');
    expect(t.antiguedad.trim()).not.toBe('');
  }
});

test('una cita que termina en puntos suspensivos está declarada como abreviada', () => {
  // La regla no prohíbe citas ABREVIADAS —el cliente puede aportar un extracto—
  // sino que una cita recortada pase por completa. Si termina en "…" tiene que
  // decirlo en el dato, para que nadie después la tome por el texto entero ni
  // se le complete el final por inferencia.
  for (const t of TESTIMONIOS) {
    if (/…$|\.{3}$/.test(t.texto.trimEnd())) {
      expect(t.abreviado).toBe(true);
    }
  }
});

test('una cita declarada abreviada termina efectivamente en puntos suspensivos', () => {
  // La otra mitad de la regla: la marca no puede quedar puesta al azar.
  for (const t of TESTIMONIOS.filter((x) => x.abreviado === true)) {
    expect(t.texto.trimEnd()).toMatch(/…$|\.{3}$/);
  }
});
