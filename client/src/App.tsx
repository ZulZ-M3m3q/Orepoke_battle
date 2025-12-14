import { Suspense, useState } from 'react';
import { usePokemonGame } from '@/lib/stores/usePokemonGame';
import { MainMenu } from '@/components/game/MainMenu';
import { QRScanner } from '@/components/game/QRScanner';
import { BattleScene } from '@/components/game/BattleScene';
import { CardGenerator } from '@/components/game/CardGenerator';
import { PrintableCard } from '@/components/game/PrintableCard';
import '@fontsource/inter';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-600 to-yellow-400 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-b from-red-400 to-white border-4 border-slate-800 animate-bounce relative">
          <div className="absolute inset-x-0 top-1/2 h-1 bg-slate-800 -translate-y-1/2" />
          <div className="absolute left-1/2 top-1/2 w-4 h-4 rounded-full bg-white border-2 border-slate-800 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-white text-xl font-bold">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  const { phase, setPhase, caughtPokemon, resetGame } = usePokemonGame();
  const [showCaughtCard, setShowCaughtCard] = useState(false);

  const handleShowCard = () => {
    setShowCaughtCard(true);
  };

  const handleCloseCard = () => {
    setShowCaughtCard(false);
    resetGame();
  };

  return (
    <Suspense fallback={<LoadingScreen />}>
      <div className="w-screen h-screen overflow-hidden">
        {phase === 'menu' && <MainMenu />}
        
        {phase === 'card_generator' && (
          <CardGenerator onBack={() => setPhase('menu')} />
        )}
        
        {phase === 'scan_wild' && (
          <QRScanner mode="wild" onClose={() => setPhase('menu')} />
        )}
        
        {phase === 'scan_player' && (
          <QRScanner mode="player" onClose={() => setPhase('menu')} />
        )}
        
        {(phase === 'battle' || phase === 'catching' || phase === 'caught' || 
          phase === 'victory' || phase === 'defeat') && (
          <BattleScene onShowCard={handleShowCard} />
        )}
        
        {showCaughtCard && caughtPokemon && (
          <PrintableCard 
            pokemon={caughtPokemon} 
            onClose={handleCloseCard}
            title="Pokemon Caught!"
          />
        )}
      </div>
    </Suspense>
  );
}

export default App;
