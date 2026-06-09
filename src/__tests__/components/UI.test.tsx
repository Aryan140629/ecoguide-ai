/**
 * UI Components Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { BadgeDisplay } from '../../components/ui/BadgeDisplay';
import type { Badge } from '../../types/carbon';

describe('Button Component', () => {
  it('renders correctly with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole('button', { name: /click me/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not trigger click when disabled', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} disabled>Click me</Button>);
    fireEvent.click(screen.getByRole('button', { name: /click me/i }));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders loading state', () => {
    render(<Button loading>Submit</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });
});

describe('Card Component', () => {
  it('renders children and applies classes', () => {
    render(<Card className="custom-class">Card Content</Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });
});

describe('ProgressBar Component', () => {
  it('renders with label and values', () => {
    render(<ProgressBar value={40} max={100} label="Test Progress" />);
    expect(screen.getByText('Test Progress')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '40');
    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
  });

  it('clamps value to max limit', () => {
    render(<ProgressBar value={120} max={100} label="Overflow" />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '100');
  });
});

describe('Input Component', () => {
  it('renders correctly with label', () => {
    render(<Input label="Username" placeholder="Enter name" onChange={() => {}} />);
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
  });

  it('shows error state and links with aria-describedby', () => {
    render(<Input label="Email" error="Invalid email address" onChange={() => {}} />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Invalid email address')).toBeInTheDocument();
  });
});

describe('Select Component', () => {
  it('renders select component with options', () => {
    render(
      <Select label="Choose option" onChange={() => {}}>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </Select>
    );

    expect(screen.getByLabelText('Choose option')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(2);
  });
});

describe('BadgeDisplay Component', () => {
  const mockBadge: Badge = {
    id: 'badge-1',
    name: 'Eco Warrior',
    description: 'Reduce footprint by 20%',
    requirement: 'Achieve 20% reduction',
    category: 'overall',
    tier: 'gold',
    icon: '🏆',
    earnedAt: '2026-06-08T12:00:00Z',
  };

  it('renders earned badge state', () => {
    render(<BadgeDisplay badge={mockBadge} />);
    expect(screen.getByText('Eco Warrior')).toBeInTheDocument();
    const wrapper = screen.getByRole('img');
    expect(wrapper).toHaveAttribute('aria-label', 'Eco Warrior badge — earned: Reduce footprint by 20%');
  });

  it('renders locked badge state', () => {
    const lockedBadge = { ...mockBadge, earnedAt: null };
    render(<BadgeDisplay badge={lockedBadge} />);
    expect(screen.getByText('Eco Warrior')).toBeInTheDocument();
    const wrapper = screen.getByRole('img');
    expect(wrapper).toHaveAttribute('aria-label', 'Eco Warrior badge — locked: Reduce footprint by 20%');
  });
});
