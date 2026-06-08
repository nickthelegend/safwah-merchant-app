import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TouristQRScanner } from '../components/TouristQRScanner';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock yudiel QR scanner
vi.mock('@yudiel/react-qr-scanner', () => ({
  Scanner: ({ onScan }: any) => (
    <button data-testid="mock-scanner" onClick={() => onScan([{ rawValue: '0x73954305f663e08711eec149e0c29af30fb514dd9a3c2f39b3cd5507478783f8' }])}>
      Trigger Scan
    </button>
  ),
}));

// Mock framer-motion to bypass animations in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock dapp-kit
const mockGetObject = vi.fn();
vi.mock('@mysten/dapp-kit', () => ({
  useSuiClient: () => ({
    getObject: mockGetObject,
  }),
}));

describe('TouristQRScanner Component', () => {
  const mockOnClose = vi.fn();
  const mockOnTouristScanned = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  test('does not render when isOpen is false', () => {
    render(
      <TouristQRScanner
        isOpen={false}
        onClose={mockOnClose}
        onTouristScanned={mockOnTouristScanned}
      />
    );
    expect(screen.queryByText('Scan Tourist QR')).not.toBeInTheDocument();
  });

  test('renders scanner header when isOpen is true', () => {
    render(
      <TouristQRScanner
        isOpen={true}
        onClose={mockOnClose}
        onTouristScanned={mockOnTouristScanned}
      />
    );
    expect(screen.getByText('Scan Tourist QR')).toBeInTheDocument();
    expect(screen.getByText('Scan Safwah claim or Sui wallet QR')).toBeInTheDocument();
  });

  test('successfully processes raw Sui address QR scan', async () => {
    render(
      <TouristQRScanner
        isOpen={true}
        onClose={mockOnClose}
        onTouristScanned={mockOnTouristScanned}
      />
    );

    const scanBtn = screen.getByTestId('mock-scanner');
    await act(async () => {
      fireEvent.click(scanBtn);
    });

    expect(screen.getByText('Tourist Verified!')).toBeInTheDocument();
    expect(screen.getByText('0x73954305...8783f8')).toBeInTheDocument();

    // Advance timer to trigger success callback
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(mockOnTouristScanned).toHaveBeenCalledWith({
      touristAddress: '0x73954305f663e08711eec149e0c29af30fb514dd9a3c2f39b3cd5507478783f8',
      claimObjectId: undefined,
    });
    expect(mockOnClose).toHaveBeenCalled();
  });
});
