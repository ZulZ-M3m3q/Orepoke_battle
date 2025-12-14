import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TYPE_COLORS, type CaughtPokemon } from '@/lib/pokemon/types';
import { generateQRDataForPokemon } from '@/lib/pokemon/api';
import { Download, X, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface PokemonCardProps {
  pokemon: CaughtPokemon;
  onClose: () => void;
}

export function PokemonCard({ pokemon, onClose }: PokemonCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const generateQR = async () => {
      const qrData = generateQRDataForPokemon(pokemon);
      const url = await QRCode.toDataURL(qrData, {
        width: 120,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQrCodeUrl(url);
    };
    generateQR();
  }, [pokemon]);

  const primaryType = pokemon.types[0];
  const gradientColor = TYPE_COLORS[primaryType] || '#6B7280';

  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });
      
      const link = document.createElement('a');
      link.download = `${pokemon.name.toLowerCase()}-card.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Failed to download card:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.8, rotateY: -90 }}
        animate={{ scale: 1, rotateY: 0 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="max-w-sm w-full"
      >
        <div
          ref={cardRef}
          className="relative rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: `linear-gradient(135deg, ${gradientColor}ee 0%, ${gradientColor}99 50%, ${gradientColor}cc 100%)`,
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-32 opacity-30"
            style={{
              background: 'radial-gradient(circle at 30% 20%, white 0%, transparent 50%)',
            }}
          />

          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                  {pokemon.name}
                </h2>
                <p className="text-white/80 text-sm">#{pokemon.id.toString().padStart(4, '0')}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge className="bg-white/20 text-white border-white/30">
                  Lv.{pokemon.level}
                </Badge>
                <div className="flex gap-1">
                  {pokemon.types.map(type => (
                    <Badge 
                      key={type}
                      className="text-xs capitalize text-white"
                      style={{ backgroundColor: TYPE_COLORS[type] + 'cc' }}
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative bg-white/20 rounded-xl p-4 mb-4 backdrop-blur-sm">
              <img
                src={pokemon.sprite}
                alt={pokemon.name}
                className="w-40 h-40 mx-auto object-contain drop-shadow-xl"
                crossOrigin="anonymous"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
              <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm">
                <p className="text-white/70 text-xs">HP</p>
                <p className="text-white font-bold">{pokemon.stats.hp}</p>
              </div>
              <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm">
                <p className="text-white/70 text-xs">ATK</p>
                <p className="text-white font-bold">{pokemon.stats.attack}</p>
              </div>
              <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm">
                <p className="text-white/70 text-xs">DEF</p>
                <p className="text-white font-bold">{pokemon.stats.defense}</p>
              </div>
              <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm">
                <p className="text-white/70 text-xs">SP.ATK</p>
                <p className="text-white font-bold">{pokemon.stats.specialAttack}</p>
              </div>
              <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm">
                <p className="text-white/70 text-xs">SP.DEF</p>
                <p className="text-white font-bold">{pokemon.stats.specialDefense}</p>
              </div>
              <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm">
                <p className="text-white/70 text-xs">SPD</p>
                <p className="text-white font-bold">{pokemon.stats.speed}</p>
              </div>
            </div>

            <div className="flex justify-between items-end">
              <div className="bg-white rounded-lg p-1">
                {qrCodeUrl && (
                  <img 
                    src={qrCodeUrl} 
                    alt="Pokemon QR Code" 
                    className="w-20 h-20"
                  />
                )}
              </div>
              <div className="text-right">
                <p className="text-white/70 text-xs">Caught</p>
                <p className="text-white text-sm font-medium">
                  {formatDate(pokemon.caughtAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500"
          >
            <Download className="w-4 h-4 mr-2" />
            {isDownloading ? 'Saving...' : 'Download Card'}
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
