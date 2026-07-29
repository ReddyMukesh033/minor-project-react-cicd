import { render, screen } from '@testing-library/react';
import App from './App';

test('renders CI/CD pipeline demo heading', () => {
  render(<App />);
  const heading = screen.getByText(/CI\/CD Pipeline Demo/i);
  expect(heading).toBeInTheDocument();
});
