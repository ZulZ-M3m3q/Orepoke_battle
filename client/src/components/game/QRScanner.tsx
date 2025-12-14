import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePokemonGame } from '@/lib/stores/usePokemonGame';
import { Camera, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QRScannerProps {
  mode: 'wild' | 'player';
  onClose: () => void;
}

export function QRScanner({ mode, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const { setWildPokemon, setPlayerPokemon, scanError, clearScanError, wildPokemon } = usePokemonGame();

  useEffect(() => {
    clearScanError();
    
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        rememberLastUsedCamera: true,
      },
      false
    );

    scannerRef.current = scanner;

    scanner.render(
      async (decodedText) => {
        console.log('QR Code scanned:', decodedText);
        
        let success = false;
        if (mode === 'wild') {
          success = await setWildPokemon(decodedText);
        } else {
          success = await setPlayerPokemon(decodedText);
        }
        
        if (success) {
          scanner.clear();
          setIsScanning(false);
        }
      },
      (errorMessage) => {
        if (!errorMessage.includes('NotFoundException')) {
          console.log('QR scan error:', errorMessage);
        }
      }
    );

    setIsScanning(true);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [mode, setWildPokemon, setPlayerPokemon, clearScanError]);

  const title = mode === 'wild' 
    ? 'Scan Wild Pokemon' 
    : 'Scan Your Pokemon';
  
  const description = mode === 'wild'
    ? 'Scan a Pokemon QR card to encounter it!'
    : `Wild ${wildPokemon?.name || 'Pokemon'} awaits! Scan your Pokemon card to battle.`;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Camera className="w-5 h-5" />
            {title}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5 text-white" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === 'player' && wildPokemon && (
            <div className="flex items-center gap-3 bg-slate-800 rounded-lg p-3">
              <img 
                src={wildPokemon.sprite} 
                alt={wildPokemon.name}
                className="w-16 h-16 object-contain"
              />
              <div>
                <p className="text-white font-bold">{wildPokemon.name}</p>
                <p className="text-slate-400 text-sm">Level {wildPokemon.level}</p>
              </div>
            </div>
          )}

          <div 
            id="qr-reader" 
            className="w-full rounded-lg overflow-hidden"
            style={{ minHeight: '300px' }}
          />
          
          <AnimatePresence>
            {scanError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 bg-red-500/20 border border-red-500/50 rounded-lg p-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{scanError}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-slate-400 text-sm text-center">
            {description}
          </p>

          <p className="text-yellow-500 text-xs text-center">
            Only Pokemon QR cards from this app will work!
          </p>

          <Button
            variant="outline"
            onClick={onClose}
            className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
