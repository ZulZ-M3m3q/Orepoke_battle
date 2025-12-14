import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { BattlePokemon, PokemonMove, Pokemon } from '../pokemon/types';
import { calculateDamage, calculateCatchRate } from '../pokemon/types';
import { fetchPokemon, getPokemonByQRData, validatePokemonQR } from '../pokemon/api';

export type GamePhase = 
  | 'menu' 
  | 'card_generator'
  | 'scan_wild'
  | 'scan_player'
  | 'battle' 
  | 'catching'
  | 'caught'
  | 'victory'
  | 'defeat';

export interface BattleLog {
  message: string;
  type: 'info' | 'damage' | 'effective' | 'critical' | 'catch' | 'status' | 'error';
}

interface PokemonGameState {
  phase: GamePhase;
  playerPokemon: BattlePokemon | null;
  wildPokemon: BattlePokemon | null;
  caughtPokemon: BattlePokemon | null;
  battleLog: BattleLog[];
  isPlayerTurn: boolean;
  scanError: string | null;

  setPhase: (phase: GamePhase) => void;
  setWildPokemon: (qrData: string) => Promise<boolean>;
  setPlayerPokemon: (qrData: string) => Promise<boolean>;
  startBattleWithPokemon: () => void;
  useMove: (moveIndex: number) => void;
  attemptCatch: () => void;
  resetGame: () => void;
  addBattleLog: (message: string, type: BattleLog['type']) => void;
  clearBattleLog: () => void;
  clearScanError: () => void;
}

function createBattlePokemon(
  pokemon: Pokemon | null,
  level: number,
  isWild: boolean
): BattlePokemon | null {
  if (!pokemon) return null;
  
  const levelMultiplier = level / 50;
  const scaledStats = {
    hp: Math.floor(pokemon.stats.hp * (1 + levelMultiplier)),
    attack: Math.floor(pokemon.stats.attack * (1 + levelMultiplier * 0.5)),
    defense: Math.floor(pokemon.stats.defense * (1 + levelMultiplier * 0.5)),
    specialAttack: Math.floor(pokemon.stats.specialAttack * (1 + levelMultiplier * 0.5)),
    specialDefense: Math.floor(pokemon.stats.specialDefense * (1 + levelMultiplier * 0.5)),
    speed: Math.floor(pokemon.stats.speed * (1 + levelMultiplier * 0.5)),
  };

  return {
    ...pokemon,
    stats: scaledStats,
    currentHp: scaledStats.hp,
    level,
    isWild,
    statusCondition: null,
    moves: pokemon.moves.map(m => ({ ...m, currentPp: m.pp })),
  };
}

export const usePokemonGame = create<PokemonGameState>()(
  subscribeWithSelector((set, get) => ({
    phase: 'menu',
    playerPokemon: null,
    wildPokemon: null,
    caughtPokemon: null,
    battleLog: [],
    isPlayerTurn: true,
    scanError: null,

    setPhase: (phase) => set({ phase, scanError: null }),

    setWildPokemon: async (qrData) => {
      const validation = validatePokemonQR(qrData);
      
      if (!validation.isValid) {
        set({ scanError: validation.error || 'Invalid QR code' });
        return false;
      }

      const pokemon = await getPokemonByQRData(qrData);
      
      if (!pokemon) {
        set({ scanError: 'Could not load Pokemon data' });
        return false;
      }

      const wildLevel = Math.floor(Math.random() * 25) + 5;
      const wildPokemon = createBattlePokemon(pokemon, wildLevel, true);

      set({ 
        wildPokemon, 
        phase: 'scan_player',
        scanError: null,
        battleLog: [],
      });
      
      return true;
    },

    setPlayerPokemon: async (qrData) => {
      const validation = validatePokemonQR(qrData);
      
      if (!validation.isValid) {
        set({ scanError: validation.error || 'Invalid QR code' });
        return false;
      }

      const pokemon = await getPokemonByQRData(qrData);
      
      if (!pokemon) {
        set({ scanError: 'Could not load Pokemon data' });
        return false;
      }

      const playerLevel = Math.floor(Math.random() * 20) + 10;
      const playerPokemon = createBattlePokemon(pokemon, playerLevel, false);

      set({ playerPokemon, scanError: null });
      
      get().startBattleWithPokemon();
      return true;
    },

    startBattleWithPokemon: () => {
      const { playerPokemon, wildPokemon } = get();
      
      if (!playerPokemon || !wildPokemon) return;

      set({
        phase: 'battle',
        isPlayerTurn: playerPokemon.stats.speed >= wildPokemon.stats.speed,
        battleLog: [],
      });

      get().addBattleLog(`A wild ${wildPokemon.name} appeared!`, 'info');
      get().addBattleLog(`Go, ${playerPokemon.name}!`, 'info');
    },

    useMove: (moveIndex) => {
      const { playerPokemon, wildPokemon, isPlayerTurn, phase } = get();
      if (!playerPokemon || !wildPokemon || phase !== 'battle') return;

      const attacker = isPlayerTurn ? playerPokemon : wildPokemon;
      const defender = isPlayerTurn ? wildPokemon : playerPokemon;
      const move = attacker.moves[moveIndex];

      if (!move || move.currentPp <= 0) return;

      move.currentPp--;

      const accuracyCheck = move.accuracy === null || Math.random() * 100 < move.accuracy;

      if (!accuracyCheck) {
        get().addBattleLog(`${attacker.name}'s ${move.name} missed!`, 'info');
      } else if (move.category === 'status') {
        get().addBattleLog(`${attacker.name} used ${move.name}!`, 'info');
      } else {
        const { damage, effectiveness, critical } = calculateDamage(attacker, defender, move);
        
        defender.currentHp = Math.max(0, defender.currentHp - damage);

        get().addBattleLog(`${attacker.name} used ${move.name}!`, 'info');
        
        if (critical) {
          get().addBattleLog('A critical hit!', 'critical');
        }
        
        if (effectiveness > 1) {
          get().addBattleLog("It's super effective!", 'effective');
        } else if (effectiveness < 1 && effectiveness > 0) {
          get().addBattleLog("It's not very effective...", 'info');
        } else if (effectiveness === 0) {
          get().addBattleLog("It doesn't affect " + defender.name + "...", 'info');
        }

        get().addBattleLog(`${defender.name} took ${damage} damage!`, 'damage');
      }

      if (isPlayerTurn) {
        set({ wildPokemon: { ...wildPokemon }, playerPokemon: { ...playerPokemon } });
      } else {
        set({ playerPokemon: { ...playerPokemon }, wildPokemon: { ...wildPokemon } });
      }

      if (defender.currentHp <= 0) {
        if (isPlayerTurn) {
          get().addBattleLog(`${wildPokemon.name} fainted!`, 'info');
          set({ phase: 'victory' });
        } else {
          get().addBattleLog(`${playerPokemon.name} fainted!`, 'info');
          set({ phase: 'defeat' });
        }
        return;
      }

      set({ isPlayerTurn: !isPlayerTurn });

      if (isPlayerTurn) {
        setTimeout(() => {
          const { wildPokemon: currentWild, phase: currentPhase } = get();
          if (currentWild && currentWild.currentHp > 0 && currentPhase === 'battle') {
            const availableMoves = currentWild.moves.filter(m => m.currentPp > 0);
            if (availableMoves.length > 0) {
              const randomMoveIndex = currentWild.moves.indexOf(
                availableMoves[Math.floor(Math.random() * availableMoves.length)]
              );
              get().useMove(randomMoveIndex);
            }
          }
        }, 1500);
      }
    },

    attemptCatch: () => {
      const { wildPokemon } = get();
      if (!wildPokemon) return;

      set({ phase: 'catching' });

      const catchRate = calculateCatchRate(wildPokemon);
      const roll = Math.random();

      get().addBattleLog('You threw a Pokeball!', 'catch');

      setTimeout(() => {
        if (roll < catchRate) {
          get().addBattleLog(`Gotcha! ${wildPokemon.name} was caught!`, 'catch');
          set({ phase: 'caught', caughtPokemon: wildPokemon });
        } else {
          get().addBattleLog(`Oh no! ${wildPokemon.name} escaped!`, 'info');
          set({ phase: 'victory' });
        }
      }, 2000);
    },

    resetGame: () => {
      set({
        playerPokemon: null,
        wildPokemon: null,
        caughtPokemon: null,
        battleLog: [],
        isPlayerTurn: true,
        phase: 'menu',
        scanError: null,
      });
    },

    addBattleLog: (message, type) => {
      set((state) => ({
        battleLog: [...state.battleLog.slice(-9), { message, type }],
      }));
    },

    clearBattleLog: () => {
      set({ battleLog: [] });
    },

    clearScanError: () => {
      set({ scanError: null });
    },
  }))
);
