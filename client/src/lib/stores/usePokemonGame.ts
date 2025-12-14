import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';
import type { BattlePokemon, CaughtPokemon, PokemonMove } from '../pokemon/types';
import { calculateDamage, calculateCatchRate } from '../pokemon/types';
import { fetchPokemon, getRandomWildPokemon } from '../pokemon/api';

export type GamePhase = 
  | 'menu' 
  | 'scanning' 
  | 'battle' 
  | 'catching'
  | 'caught'
  | 'escaped'
  | 'victory'
  | 'defeat'
  | 'collection'
  | 'card_view';

export interface BattleLog {
  message: string;
  type: 'info' | 'damage' | 'effective' | 'critical' | 'catch' | 'status';
}

interface PokemonGameState {
  phase: GamePhase;
  playerPokemon: BattlePokemon | null;
  wildPokemon: BattlePokemon | null;
  collection: CaughtPokemon[];
  battleLog: BattleLog[];
  selectedCard: CaughtPokemon | null;
  isPlayerTurn: boolean;
  catchAttempts: number;

  setPhase: (phase: GamePhase) => void;
  startBattle: (playerPokemonId: number, wildLevel?: number) => Promise<void>;
  startWildBattle: (qrData: string) => Promise<void>;
  useMove: (moveIndex: number) => void;
  attemptCatch: () => void;
  runAway: () => void;
  addToCollection: (pokemon: BattlePokemon) => void;
  removeFromCollection: (pokemonId: number, caughtAt: Date) => void;
  selectCard: (pokemon: CaughtPokemon | null) => void;
  resetBattle: () => void;
  addBattleLog: (message: string, type: BattleLog['type']) => void;
  clearBattleLog: () => void;
}

function createBattlePokemon(
  pokemon: Awaited<ReturnType<typeof fetchPokemon>>,
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
  subscribeWithSelector(
    persist(
      (set, get) => ({
        phase: 'menu',
        playerPokemon: null,
        wildPokemon: null,
        collection: [],
        battleLog: [],
        selectedCard: null,
        isPlayerTurn: true,
        catchAttempts: 0,

        setPhase: (phase) => set({ phase }),

        startBattle: async (playerPokemonId, wildLevel = 10) => {
          const [playerData, wildData] = await Promise.all([
            fetchPokemon(playerPokemonId),
            getRandomWildPokemon(),
          ]);

          const playerPokemon = createBattlePokemon(playerData, 15, false);
          const wildPokemon = createBattlePokemon(wildData, wildLevel, true);

          if (playerPokemon && wildPokemon) {
            set({
              playerPokemon,
              wildPokemon,
              phase: 'battle',
              isPlayerTurn: playerPokemon.stats.speed >= wildPokemon.stats.speed,
              battleLog: [],
              catchAttempts: 0,
            });

            get().addBattleLog(`A wild ${wildPokemon.name} appeared!`, 'info');
            get().addBattleLog(`Go, ${playerPokemon.name}!`, 'info');
          }
        },

        startWildBattle: async (qrData) => {
          const { getPokemonByQRData } = await import('../pokemon/api');
          const wildData = await getPokemonByQRData(qrData);
          
          if (!wildData) {
            console.error('Could not find Pokemon from QR data');
            return;
          }

          const collection = get().collection;
          let starterPokemon;
          
          if (collection.length > 0) {
            const randomIndex = Math.floor(Math.random() * collection.length);
            const starter = collection[randomIndex];
            starterPokemon = createBattlePokemon(starter, starter.level, false);
          } else {
            const defaultStarter = await fetchPokemon(25);
            starterPokemon = createBattlePokemon(defaultStarter, 15, false);
          }

          const wildLevel = Math.floor(Math.random() * 25) + 5;
          const wildPokemon = createBattlePokemon(wildData, wildLevel, true);

          if (starterPokemon && wildPokemon) {
            set({
              playerPokemon: starterPokemon,
              wildPokemon,
              phase: 'battle',
              isPlayerTurn: starterPokemon.stats.speed >= wildPokemon.stats.speed,
              battleLog: [],
              catchAttempts: 0,
            });

            get().addBattleLog(`A wild ${wildPokemon.name} appeared!`, 'info');
            get().addBattleLog(`Go, ${starterPokemon.name}!`, 'info');
          }
        },

        useMove: (moveIndex) => {
          const { playerPokemon, wildPokemon, isPlayerTurn } = get();
          if (!playerPokemon || !wildPokemon) return;

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
              const { wildPokemon: currentWild } = get();
              if (currentWild && currentWild.currentHp > 0) {
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
          const { wildPokemon, catchAttempts } = get();
          if (!wildPokemon) return;

          set({ phase: 'catching', catchAttempts: catchAttempts + 1 });

          const catchRate = calculateCatchRate(wildPokemon);
          const roll = Math.random();

          get().addBattleLog('You threw a Pokeball!', 'catch');

          setTimeout(() => {
            if (roll < catchRate) {
              get().addBattleLog(`Gotcha! ${wildPokemon.name} was caught!`, 'catch');
              get().addToCollection(wildPokemon);
              set({ phase: 'caught' });
            } else {
              get().addBattleLog(`Oh no! ${wildPokemon.name} broke free!`, 'info');
              set({ phase: 'battle', isPlayerTurn: false });
              
              setTimeout(() => {
                const { wildPokemon: currentWild } = get();
                if (currentWild && currentWild.currentHp > 0) {
                  const availableMoves = currentWild.moves.filter(m => m.currentPp > 0);
                  if (availableMoves.length > 0) {
                    const randomMoveIndex = currentWild.moves.indexOf(
                      availableMoves[Math.floor(Math.random() * availableMoves.length)]
                    );
                    get().useMove(randomMoveIndex);
                  }
                }
              }, 1000);
            }
          }, 2000);
        },

        runAway: () => {
          const { playerPokemon, wildPokemon } = get();
          if (!playerPokemon || !wildPokemon) return;

          const escapeChance = (playerPokemon.stats.speed / wildPokemon.stats.speed) * 0.5 + 0.3;
          
          if (Math.random() < escapeChance) {
            get().addBattleLog('Got away safely!', 'info');
            set({ phase: 'escaped' });
          } else {
            get().addBattleLog("Can't escape!", 'info');
            set({ isPlayerTurn: false });
            
            setTimeout(() => {
              const { wildPokemon: currentWild } = get();
              if (currentWild && currentWild.currentHp > 0) {
                const availableMoves = currentWild.moves.filter(m => m.currentPp > 0);
                if (availableMoves.length > 0) {
                  const randomMoveIndex = currentWild.moves.indexOf(
                    availableMoves[Math.floor(Math.random() * availableMoves.length)]
                  );
                  get().useMove(randomMoveIndex);
                }
              }
            }, 1000);
          }
        },

        addToCollection: (pokemon) => {
          const caught: CaughtPokemon = {
            id: pokemon.id,
            name: pokemon.name,
            types: pokemon.types,
            stats: pokemon.stats,
            moves: pokemon.moves,
            sprite: pokemon.sprite,
            spriteBack: pokemon.spriteBack,
            height: pokemon.height,
            weight: pokemon.weight,
            baseExperience: pokemon.baseExperience,
            catchRate: pokemon.catchRate,
            caughtAt: new Date(),
            level: pokemon.level,
          };
          
          set((state) => ({
            collection: [...state.collection, caught],
          }));
        },

        removeFromCollection: (pokemonId, caughtAt) => {
          set((state) => ({
            collection: state.collection.filter(
              p => !(p.id === pokemonId && p.caughtAt.getTime() === caughtAt.getTime())
            ),
          }));
        },

        selectCard: (pokemon) => {
          set({ selectedCard: pokemon, phase: pokemon ? 'card_view' : 'collection' });
        },

        resetBattle: () => {
          set({
            playerPokemon: null,
            wildPokemon: null,
            battleLog: [],
            isPlayerTurn: true,
            catchAttempts: 0,
            phase: 'menu',
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
      }),
      {
        name: 'pokemon-game-storage',
        partialize: (state) => ({
          collection: state.collection.map(p => ({
            ...p,
            caughtAt: p.caughtAt instanceof Date ? p.caughtAt.toISOString() : String(p.caughtAt),
          })),
        }),
        merge: (persistedState: any, currentState: PokemonGameState) => {
          if (persistedState?.collection) {
            const hydratedCollection = persistedState.collection.map((p: any) => ({
              ...p,
              caughtAt: new Date(p.caughtAt),
            }));
            return {
              ...currentState,
              collection: hydratedCollection,
            };
          }
          return currentState;
        },
      }
    )
  )
);
