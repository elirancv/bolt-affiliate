import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../test/utils';
import { Button } from '../Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('applies primary variant styles by default', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByText('Click me');
    expect(button).toHaveClass('bg-primary');
  });

  it('shows loading state', () => {
    render(<Button isLoading>Click me</Button>);
    expect(screen.getByText('⚪')).toBeInTheDocument();
    expect(screen.queryByText('Click me')).toBeInTheDocument();
  });

  it('can be disabled', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });

  it('applies different variants correctly', () => {
    const { rerender } = render(<Button variant="secondary">Click me</Button>);
    expect(screen.getByText('Click me')).toHaveClass('bg-secondary');

    rerender(<Button variant="outline">Click me</Button>);
    expect(screen.getByText('Click me')).toHaveClass('border-input');

    rerender(<Button variant="ghost">Click me</Button>);
    expect(screen.getByText('Click me')).toHaveClass('hover:bg-accent');
  });
});
