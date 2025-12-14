import { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TYPE_COLORS } from '@/lib/pokemon/types';
import { fetchPokemon, generateQRDataForPokemon } from '@/lib/pokemon/api';
import type { Pokemon } from '@/lib/pokemon/types';
import { Download, Search, ArrowLeft, Printer } from 'lucide-react';
import { motion } from 'framer-motion';

interface CardGeneratorProps {
  onBack: () => void;
}

export function CardGenerator({ onBack }: CardGeneratorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const searchPokemon = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    const query = searchQuery.toLowerCase().trim();
    const result = await fetchPokemon(query);
    
    if (result) {
      setPokemon(result);
    } else {
      setError('Pokemon not found. Try a name (pikachu) or number (25).');
      setPokemon(null);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    if (pokemon) {
      const generateQR = async () => {
        const qrData = generateQRDataForPokemon(pokemon);
        const url = await QRCode.toDataURL(qrData, {
          width: 200,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
        setQrCodeUrl(url);
      };
      generateQR();
    }
  }, [pokemon]);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 3,
        useCORS: true,
        allowTaint: true,
      });
      
      const link = document.createElement('a');
      link.download = `${pokemon?.name.toLowerCase()}-card.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Failed to download card:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const primaryType = pokemon?.types[0] || 'normal';
  const gradientColor = TYPE_COLORS[primaryType] || '#6B7280';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-white hover:bg-slate-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-white text-xl font-bold">Card Generator</h1>
        </div>

        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchPokemon()}
                placeholder="Enter Pokemon name or number..."
                className="bg-slate-900 border-slate-600 text-white"
              />
              <Button
                onClick={searchPokemon}
                disabled={isLoading}
                className="bg-blue-500 hover:bg-blue-600"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </CardContent>
        </Card>

        {pokemon && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div 
              ref={cardRef}
              className="mx-auto print:mx-0"
              style={{
                width: '85.6mm',
                height: '53.98mm',
                minWidth: '85.6mm',
                minHeight: '53.98mm',
              }}
            >
              <div
                className="w-full h-full rounded-xl overflow-hidden shadow-2xl relative"
                style={{
                  background: `linear-gradient(135deg, ${gradientColor} 0%, ${gradientColor}cc 50%, ${gradientColor}99 100%)`,
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-16 opacity-20"
                  style={{
                    background: 'radial-gradient(circle at 20% 30%, white 0%, transparent 50%)',
                  }}
                />

                <div className="p-3 h-full flex">
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h2 className="text-lg font-black text-white drop-shadow-lg leading-tight">
                          {pokemon.name}
                        </h2>
                        <p className="text-white/70 text-xs">#{pokemon.id.toString().padStart(4, '0')}</p>
                      </div>
                    </div>

                    <div className="flex-1 flex items-center justify-center">
                      <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm">
                        <img
                          src={pokemon.sprite}
                          alt={pokemon.name}
                          className="w-20 h-20 object-contain drop-shadow-lg"
                          crossOrigin="anonymous"
                        />
                      </div>
                    </div>

                    <div className="flex gap-1 mt-1">
                      {pokemon.types.map(type => (
                        <Badge
                          key={type}
                          className="text-[9px] capitalize px-1.5 py-0 text-white border-0"
                          style={{ backgroundColor: TYPE_COLORS[type] + 'cc' }}
                        >
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between ml-2">
                    <div className="grid grid-cols-2 gap-1 text-center">
                      <div className="bg-white/20 rounded px-1.5 py-0.5">
                        <p className="text-white/70 text-[8px]">HP</p>
                        <p className="text-white font-bold text-xs">{pokemon.stats.hp}</p>
                      </div>
                      <div className="bg-white/20 rounded px-1.5 py-0.5">
                        <p className="text-white/70 text-[8px]">ATK</p>
                        <p className="text-white font-bold text-xs">{pokemon.stats.attack}</p>
                      </div>
                      <div className="bg-white/20 rounded px-1.5 py-0.5">
                        <p className="text-white/70 text-[8px]">DEF</p>
                        <p className="text-white font-bold text-xs">{pokemon.stats.defense}</p>
                      </div>
                      <div className="bg-white/20 rounded px-1.5 py-0.5">
                        <p className="text-white/70 text-[8px]">SPD</p>
                        <p className="text-white font-bold text-xs">{pokemon.stats.speed}</p>
                      </div>
                    </div>

                    <div className="bg-white rounded p-0.5 mt-1">
                      {qrCodeUrl && (
                        <img 
                          src={qrCodeUrl} 
                          alt="Pokemon QR Code" 
                          className="w-16 h-16"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-1 left-3 text-white/50 text-[7px]">
                  QR Battle Card
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-center print:hidden">
              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                className="bg-gradient-to-r from-green-500 to-emerald-500"
              >
                <Download className="w-4 h-4 mr-2" />
                {isDownloading ? 'Saving...' : 'Download'}
              </Button>
              <Button
                onClick={handlePrint}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>

            <p className="text-slate-400 text-xs text-center print:hidden">
              Card is credit card size (85.6mm x 53.98mm) for printing
            </p>
          </motion.div>
        )}

        {!pokemon && !error && (
          <div className="text-center text-slate-400 py-12">
            <p className="mb-2">Search for any Pokemon to generate a printable card</p>
            <p className="text-sm">Try: pikachu, charizard, 25, 150</p>
          </div>
        )}
      </div>
    </div>
  );
}
