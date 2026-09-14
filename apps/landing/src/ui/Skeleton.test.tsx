import { render } from '@testing-library/react';
import { Skeleton } from '@/ui/Skeleton';

test('es decorativo y late', () => {
  const { container } = render(<Skeleton className="h-4 w-24" />);
  const raiz = container.firstElementChild;
  expect(raiz).toHaveAttribute('aria-hidden', 'true');
  expect(raiz).toHaveClass('animate-pulse');
});

test('acepta clases de tamaño', () => {
  const { container } = render(<Skeleton className="h-4 w-24" />);
  expect(container.firstElementChild).toHaveClass('h-4', 'w-24');
});
