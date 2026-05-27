import React, { useState, useCallback } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, CheckCircle2, AlertCircle, Loader2, Receipt } from 'lucide-react';
import { useSuiClient } from '@mysten/dapp-kit';

interface ScannedTouristData {
  version: string;
  claimObjectId?: string;   // If tourist already has a claim (for referencing)
  tourist: string;           // Tourist wallet address — pre-fill invoice recipient
  network: string;
}

interface TouristQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onTouristScanned: (data: {
    touristAddress: string;
    claimObjectId?: string;
  }) => void;
}

type ScanState = 'scanning' | 'processing' | 'success' | 'error';

export function TouristQRScanner({ isOpen, onClose, onTouristScanned }: TouristQRScannerProps) {
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [errorMessage, setErrorMessage] = useState('');
  const [scannedData, setScannedData] = useState<ScannedTouristData | null>(null);
  const suiClient = useSuiClient();

  const handleScan = useCallback(async (result: string) => {
    if (scanState !== 'scanning') return;
    setScanState('processing');

    try {
      // Parse the QR payload
      let payload: ScannedTouristData;

      // Handle two QR types:
      // Type 1: Full Safwah claim QR (from tourist app — has claimObjectId)
      // Type 2: Simple wallet QR (just a Sui address — from Sui wallet app)
      if (result.startsWith('{')) {
        payload = JSON.parse(result);
        if (payload.version !== 'safwah_v1' && !result.includes('tourist')) {
          throw new Error('Not a valid Safwah QR code');
        }
      } else if (result.startsWith('0x') && result.length === 66) {
        // Raw Sui address QR
        payload = {
          version: 'wallet_address',
          tourist: result,
          network: process.env.VITE_SUI_NETWORK ?? 'testnet',
        };
      } else if (result.startsWith('suiet://') || result.startsWith('sui://')) {
        // Suiet/Sui wallet deep link
        const address = result.split('address=')[1]?.split('&')[0] ?? '';
        if (!address) throw new Error('Could not extract address from wallet QR');
        payload = { version: 'wallet_deeplink', tourist: address, network: 'testnet' };
      } else {
        throw new Error('Unrecognized QR format. Ask tourist to show their Safwah claim QR.');
      }

      // Validate it's a real Sui address (66 chars, starts with 0x)
      if (!payload.tourist || !payload.tourist.startsWith('0x')) {
        throw new Error('Invalid tourist wallet address in QR');
      }

      // Optional: verify the claim object exists on chain
      if (payload.claimObjectId) {
        const obj = await suiClient.getObject({ id: payload.claimObjectId, options: { showContent: true } });
        if (!obj.data) throw new Error('Claim object not found on Sui chain');
      }

      setScannedData(payload);
      setScanState('success');

      // Auto-advance after 1.5s
      setTimeout(() => {
        onTouristScanned({
          touristAddress: payload.tourist,
          claimObjectId: payload.claimObjectId,
        });
        onClose();
        setScanState('scanning');
        setScannedData(null);
      }, 1500);

    } catch (err: any) {
      setErrorMessage(err.message ?? 'Invalid QR code');
      setScanState('error');
      setTimeout(() => {
        setScanState('scanning');
        setErrorMessage('');
      }, 3000);
    }
  }, [scanState, onTouristScanned, onClose, suiClient]);

  const handleError = useCallback((error: any) => {
    console.warn('QR scanner error:', error);
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 w-full max-w-sm"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-white font-bold text-lg">Scan Tourist QR</h2>
                <p className="text-zinc-400 text-xs">Scan Safwah claim or Sui wallet QR</p>
              </div>
              <button onClick={() => { onClose(); setScanState('scanning'); }} className="text-zinc-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Scanner Area */}
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-square mb-4">
              {scanState === 'scanning' && (
                <>
                  <Scanner
                    onScan={(detectedCodes) => {
                      if (detectedCodes[0]?.rawValue) {
                        handleScan(detectedCodes[0].rawValue);
                      }
                    }}
                    onError={handleError}
                    constraints={{ facingMode: 'environment' }}
                    styles={{
                      container: { width: '100%', height: '100%' },
                      video: { width: '100%', height: '100%', objectFit: 'cover' }
                    }}
                  />
                  {/* Scanning overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-8 border-2 border-yellow-400/60 rounded-2xl" />
                    <motion.div
                      animate={{ top: ['20%', '80%', '20%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute left-8 right-8 h-0.5 bg-yellow-400/80"
                      style={{ position: 'absolute' }}
                    />
                    {/* Corner markers */}
                    {[['top-8 left-8', 'border-t-2 border-l-2'],
                      ['top-8 right-8', 'border-t-2 border-r-2'],
                      ['bottom-8 left-8', 'border-b-2 border-l-2'],
                      ['bottom-8 right-8', 'border-b-2 border-r-2']].map(([pos, border], i) => (
                      <div key={i} className={`absolute ${pos} w-6 h-6 ${border} border-yellow-400 rounded-sm`} />
                    ))}
                  </div>
                </>
              )}

              {scanState === 'processing' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90">
                  <Loader2 size={40} className="text-yellow-400 animate-spin mb-3" />
                  <p className="text-white text-sm">Verifying on Sui...</p>
                </div>
              )}

              {scanState === 'success' && scannedData && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-950/90"
                >
                  <CheckCircle2 size={48} className="text-emerald-400 mb-3" />
                  <p className="text-white font-semibold text-sm">Tourist Verified!</p>
                  <p className="text-zinc-400 text-xs mt-1 font-mono">
                    {scannedData.tourist.slice(0, 10)}...{scannedData.tourist.slice(-6)}
                  </p>
                </motion.div>
              )}

              {scanState === 'error' && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/90 p-4"
                >
                  <AlertCircle size={40} className="text-red-400 mb-3" />
                  <p className="text-white font-semibold text-sm mb-1">Scan Failed</p>
                  <p className="text-red-300 text-xs text-center">{errorMessage}</p>
                </motion.div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-zinc-800/50 rounded-xl p-3 space-y-2">
              <p className="text-zinc-400 text-xs font-medium">What to scan:</p>
              <div className="space-y-1.5">
                {[
                  { icon: Receipt, text: 'Safwah Claim QR (tourist app → "Show at Airport")' },
                  { icon: Camera, text: 'Sui Wallet QR code from any wallet app' },
                ].map(({ icon: Icon, text }, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Icon size={12} className="text-yellow-400 mt-0.5 shrink-0" />
                    <p className="text-zinc-300 text-xs">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
