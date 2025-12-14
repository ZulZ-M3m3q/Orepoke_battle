import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePokemonGame } from '@/lib/stores/usePokemonGame';
import { Camera, X, Zap } from 'lucide-react';

interface QRScannerProps {
  onClose: () => void;
}

export function QRScanner({ onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { startWildBattle, setPhase } = usePokemonGame();

  useEffect(() => {
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
        scanner.clear();
        setIsScanning(false);
        
        await startWildBattle(decodedText);
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
  }, [startWildBattle]);

  const handleGenerateRandom = async () => {
    const randomId = Math.floor(Math.random() * 898) + 1;
    await startWildBattle(randomId.toString());
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Scan QR Code
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5 text-white" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div 
            id="qr-reader" 
            className="w-full rounded-lg overflow-hidden"
            style={{ minHeight: '300px' }}
          />
          
          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <p className="text-slate-400 text-sm text-center">
            Point your camera at any QR code to summon a Pokemon!
          </p>

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleGenerateRandom}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            >
              <Zap className="w-4 h-4 mr-2" />
              Encounter Random Pokemon
            </Button>
            
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
