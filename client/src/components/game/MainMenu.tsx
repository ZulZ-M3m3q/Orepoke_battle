import { usePokemonGame } from '@/lib/stores/usePokemonGame';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, CreditCard, Swords } from 'lucide-react';
import { motion } from 'framer-motion';

export function MainMenu() {
  const { setPhase } = usePokemonGame();

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-600 via-red-500 to-yellow-400 flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/10"
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-black/10"
          animate={{ 
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{ duration: 25, repeat: Infinity }}
        />
      </div>

      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center mb-8"
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <motion.div
            className="w-16 h-16 rounded-full bg-gradient-to-b from-red-400 to-white border-4 border-slate-800 relative"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="absolute inset-x-0 top-1/2 h-1 bg-slate-800 -translate-y-1/2" />
            <div className="absolute left-1/2 top-1/2 w-4 h-4 rounded-full bg-white border-2 border-slate-800 -translate-x-1/2 -translate-y-1/2" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg">
            QR Battle
          </h1>
        </div>
        <p className="text-white/90 text-lg">Scan. Battle. Catch!</p>
      </motion.div>

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative z-10 w-full max-w-sm space-y-4"
      >
        <Card className="bg-white/95 shadow-2xl">
          <CardContent className="p-6 space-y-4">
            <Button
              onClick={() => setPhase('scan_wild')}
              className="w-full h-14 text-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg"
            >
              <Swords className="w-6 h-6 mr-3" />
              Start Battle
            </Button>

            <Button
              onClick={() => setPhase('card_generator')}
              className="w-full h-14 text-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg"
            >
              <CreditCard className="w-6 h-6 mr-3" />
              Generate Cards
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="relative z-10 mt-8 text-center text-white/80 text-sm max-w-xs"
      >
        <p className="mb-2">1. Generate & print Pokemon cards</p>
        <p className="mb-2">2. Scan a wild Pokemon card to battle</p>
        <p>3. Scan your Pokemon card to fight!</p>
      </motion.div>
    </div>
  );
}
