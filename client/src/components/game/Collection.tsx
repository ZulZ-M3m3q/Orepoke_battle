import { usePokemonGame } from '@/lib/stores/usePokemonGame';
import { TYPE_COLORS } from '@/lib/pokemon/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, BookOpen, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export function Collection() {
  const { collection, selectCard, setPhase } = usePokemonGame();

  const sortedCollection = [...collection].sort((a, b) => a.id - b.id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => setPhase('menu')}
            className="text-white hover:bg-slate-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2 text-white">
            <BookOpen className="w-5 h-5" />
            <span className="font-bold">Collection</span>
            <Badge variant="secondary">{collection.length} caught</Badge>
          </div>
        </div>

        {collection.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <Sparkles className="w-16 h-16 text-slate-600 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Pokemon Yet!</h3>
            <p className="text-slate-400 mb-6 max-w-sm">
              Scan a QR code or encounter wild Pokemon to start building your collection.
            </p>
            <Button
              onClick={() => setPhase('scanning')}
              className="bg-gradient-to-r from-yellow-500 to-orange-500"
            >
              Start Scanning
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-120px)]">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {sortedCollection.map((pokemon, index) => (
                <motion.div
                  key={`${pokemon.id}-${pokemon.caughtAt.toString()}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className="cursor-pointer transition-all hover:scale-105 hover:shadow-xl overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${TYPE_COLORS[pokemon.types[0]] || '#6B7280'}dd 0%, ${TYPE_COLORS[pokemon.types[0]] || '#6B7280'}88 100%)`,
                    }}
                    onClick={() => selectCard(pokemon)}
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-1">
                        <Badge className="bg-white/20 text-white text-xs border-0">
                          #{pokemon.id.toString().padStart(4, '0')}
                        </Badge>
                        <Badge className="bg-white/20 text-white text-xs border-0">
                          Lv.{pokemon.level}
                        </Badge>
                      </div>
                      
                      <div className="bg-white/20 rounded-lg p-2 mb-2 backdrop-blur-sm">
                        <img
                          src={pokemon.sprite}
                          alt={pokemon.name}
                          className="w-full aspect-square object-contain"
                        />
                      </div>
                      
                      <h4 className="text-white font-bold text-sm text-center truncate">
                        {pokemon.name}
                      </h4>
                      
                      <div className="flex justify-center gap-1 mt-1">
                        {pokemon.types.map(type => (
                          <Badge
                            key={type}
                            className="text-[10px] capitalize px-1.5 py-0"
                            style={{ backgroundColor: TYPE_COLORS[type] }}
                          >
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
