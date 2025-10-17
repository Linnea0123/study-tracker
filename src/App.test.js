import { render, screen } from '@testing-library/react';
import App from './App';

test('renders study plan title', () => {
  render(<App />);
  const titleElement = screen.getByText(/汤圆学习计划和打卡/i);
  expect(titleElement).toBeInTheDocument();
});

