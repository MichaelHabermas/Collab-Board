import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('renders app root and example button', () => {
    render(<App />);
    expect(screen.getByTestId('app-root')).toBeInTheDocument();
    expect(screen.getByTestId('shadcn-button-example')).toHaveTextContent('Click me');
  });
});
