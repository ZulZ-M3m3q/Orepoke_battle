import { usePokemonGame } from '@/lib/stores/usePokemonGame';
import { TYPE_COLORS } from '@/lib/pokemon/types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Swords, Circle, ArrowLeft, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function BattleScene() {
  const {
    playerPokemon,
    wildPokemon,
    battleLog,
    isPlayerTurn,
    phase,
    useMove,
    attemptCatch,
    runAway,
    setPhase,
    resetBattle,
  } = usePokemonGame();

  if (!playerPokemon || !wildPokemon) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-white text-xl">Loading battle...</p>
      </div>
    );
  }

  const playerHpPercent = (playerPokemon.currentHp / playerPokemon.stats.hp) * 100;
  const wildHpPercent = (wildPokemon.currentHp / wildPokemon.stats.hp) * 100;

  const getHpColor = (percent: number) => {
    if (percent > 50) return 'bg-green-500';
    if (percent > 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-gradient-to-b from-sky-400 via-sky-300 to-green-400 overflow-hidden">
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, transparent 60%, rgba(34, 197, 94, 0.3) 100%)',
        }}
      />

      <div className="absolute top-4 left-4 right-4 z-10">
        <Card className="bg-slate-900/90 border-slate-700">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold">{wildPokemon.name}</span>
                <Badge variant="secondary" className="text-xs">Lv.{wildPokemon.level}</Badge>
                {wildPokemon.types.map(type => (
                  <Badge 
                    key={type} 
                    style={{ backgroundColor: TYPE_COLORS[type] }}
                    className="text-white text-xs capitalize"
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm w-8">HP</span>
              <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${getHpColor(wildHpPercent)}`}
                  initial={{ width: '100%' }}
                  animate={{ width: `${wildHpPercent}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-slate-300 text-sm w-20 text-right">
                {wildPokemon.currentHp}/{wildPokemon.stats.hp}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <motion.div
        className="absolute top-32 right-8 w-48 h-48"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        <motion.img
          src={wildPokemon.sprite}
          alt={wildPokemon.name}
          className="w-full h-full object-contain drop-shadow-2xl"
          animate={!isPlayerTurn && phase === 'battle' ? { 
            x: [-5, 5, -5, 5, 0],
            transition: { duration: 0.3 }
          } : {}}
        />
      </motion.div>

      <motion.div
        className="absolute bottom-64 left-8 w-40 h-40"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring', delay: 0.2 }}
      >
        <motion.img
          src={playerPokemon.spriteBack || playerPokemon.sprite}
          alt={playerPokemon.name}
          className="w-full h-full object-contain drop-shadow-2xl"
          style={{ transform: playerPokemon.spriteBack ? 'none' : 'scaleX(-1)' }}
          animate={isPlayerTurn && phase === 'battle' ? {
            y: [0, -10, 0],
            transition: { duration: 0.5, repeat: Infinity, repeatDelay: 1 }
          } : {}}
        />
      </motion.div>

      <div className="absolute bottom-44 left-4 right-4 z-10">
        <Card className="bg-slate-900/90 border-slate-700">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold">{playerPokemon.name}</span>
                <Badge variant="secondary" className="text-xs">Lv.{playerPokemon.level}</Badge>
                {playerPokemon.types.map(type => (
                  <Badge 
                    key={type} 
                    style={{ backgroundColor: TYPE_COLORS[type] }}
                    className="text-white text-xs capitalize"
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm w-8">HP</span>
              <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${getHpColor(playerHpPercent)}`}
                  initial={{ width: '100%' }}
                  animate={{ width: `${playerHpPercent}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-slate-300 text-sm w-20 text-right">
                {playerPokemon.currentHp}/{playerPokemon.stats.hp}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-slate-900/95 border-t border-slate-700">
        <ScrollArea className="h-20 p-2">
          <AnimatePresence>
            {battleLog.map((log, index) => (
              <motion.p
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-sm mb-1 ${
                  log.type === 'damage' ? 'text-red-400' :
                  log.type === 'effective' ? 'text-green-400' :
                  log.type === 'critical' ? 'text-yellow-400' :
                  log.type === 'catch' ? 'text-purple-400' :
                  'text-slate-300'
                }`}
              >
                {log.message}
              </motion.p>
            ))}
          </AnimatePresence>
        </ScrollArea>

        {phase === 'battle' && isPlayerTurn && (
          <div className="grid grid-cols-2 gap-2 p-3 border-t border-slate-700">
            {playerPokemon.moves.map((move, index) => (
              <Button
                key={move.id}
                onClick={() => useMove(index)}
                disabled={move.currentPp <= 0}
                className="h-auto py-2 px-3 flex flex-col items-start"
                style={{ 
                  backgroundColor: TYPE_COLORS[move.type] + 'dd',
                  borderColor: TYPE_COLORS[move.type],
                }}
              >
                <span className="font-bold text-white">{move.name}</span>
                <span className="text-xs text-white/80">
                  PP: {move.currentPp}/{move.pp} | {move.power || '-'} PWR
                </span>
              </Button>
            ))}
          </div>
        )}

        {phase === 'battle' && isPlayerTurn && (
          <div className="flex gap-2 p-3 pt-0">
            <Button
              onClick={attemptCatch}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
            >
              <Circle className="w-4 h-4 mr-2 fill-white" />
              Catch
            </Button>
            <Button
              onClick={runAway}
              variant="outline"
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Run
            </Button>
          </div>
        )}

        {phase === 'catching' && (
          <div className="p-6 flex flex-col items-center">
            <motion.div
              className="w-16 h-16 rounded-full bg-gradient-to-b from-red-500 to-white border-4 border-slate-800"
              animate={{
                rotate: [0, -20, 20, -20, 20, 0],
                scale: [1, 1.1, 0.9, 1.1, 0.9, 1],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <p className="text-white mt-4">Catching...</p>
          </div>
        )}

        {(phase === 'caught' || phase === 'victory' || phase === 'defeat' || phase === 'escaped') && (
          <div className="p-4 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-lg font-bold">
              {phase === 'caught' && (
                <>
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                  <span className="text-yellow-400">Pokemon Caught!</span>
                </>
              )}
              {phase === 'victory' && <span className="text-green-400">Victory!</span>}
              {phase === 'defeat' && <span className="text-red-400">Defeat...</span>}
              {phase === 'escaped' && <span className="text-slate-400">Got Away Safely</span>}
            </div>
            
            <div className="flex gap-2">
              {phase === 'caught' && (
                <Button
                  onClick={() => setPhase('card_view')}
                  className="bg-gradient-to-r from-purple-500 to-pink-500"
                >
                  View Card
                </Button>
              )}
              <Button
                onClick={resetBattle}
                variant="outline"
                className="border-slate-600 text-slate-300"
              >
                Return to Menu
              </Button>
            </div>
          </div>
        )}

        {!isPlayerTurn && phase === 'battle' && (
          <div className="p-4 flex justify-center">
            <p className="text-slate-400 animate-pulse">Opponent is attacking...</p>
          </div>
        )}
      </div>
    </div>
  );
}
