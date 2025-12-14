export interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface PokemonMove {
  id: number;
  name: string;
  type: string;
  category: 'physical' | 'special' | 'status';
  power: number | null;
  accuracy: number | null;
  pp: number;
  currentPp: number;
  effect?: string;
}

export interface Pokemon {
  id: number;
  name: string;
  types: string[];
  stats: PokemonStats;
  moves: PokemonMove[];
  sprite: string;
  spriteBack?: string;
  height: number;
  weight: number;
  baseExperience: number;
  catchRate: number;
}

export interface BattlePokemon extends Pokemon {
  currentHp: number;
  level: number;
  isWild: boolean;
  statusCondition?: 'paralyzed' | 'burned' | 'poisoned' | 'frozen' | 'asleep' | null;
}

export interface CaughtPokemon extends Pokemon {
  caughtAt: Date;
  nickname?: string;
  level: number;
}

export const TYPE_COLORS: Record<string, string> = {
  normal: '#A8A878',
  fire: '#F08030',
  water: '#6890F0',
  electric: '#F8D030',
  grass: '#78C850',
  ice: '#98D8D8',
  fighting: '#C03028',
  poison: '#A040A0',
  ground: '#E0C068',
  flying: '#A890F0',
  psychic: '#F85888',
  bug: '#A8B820',
  rock: '#B8A038',
  ghost: '#705898',
  dragon: '#7038F8',
  dark: '#705848',
  steel: '#B8B8D0',
  fairy: '#EE99AC',
};

export const TYPE_EFFECTIVENESS: Record<string, Record<string, number>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

export function getTypeEffectiveness(moveType: string, defenderTypes: string[]): number {
  let multiplier = 1;
  const typeEffects = TYPE_EFFECTIVENESS[moveType] || {};
  
  for (const defType of defenderTypes) {
    const effect = typeEffects[defType];
    if (effect !== undefined) {
      multiplier *= effect;
    }
  }
  
  return multiplier;
}

export function calculateDamage(
  attacker: BattlePokemon,
  defender: BattlePokemon,
  move: PokemonMove
): { damage: number; effectiveness: number; critical: boolean } {
  if (move.category === 'status' || move.power === null) {
    return { damage: 0, effectiveness: 1, critical: false };
  }

  const level = attacker.level;
  const power = move.power;
  const attack = move.category === 'physical' ? attacker.stats.attack : attacker.stats.specialAttack;
  const defense = move.category === 'physical' ? defender.stats.defense : defender.stats.specialDefense;
  
  const critical = Math.random() < 0.0625;
  const critMultiplier = critical ? 1.5 : 1;
  
  const stab = attacker.types.includes(move.type) ? 1.5 : 1;
  
  const effectiveness = getTypeEffectiveness(move.type, defender.types);
  
  const random = 0.85 + Math.random() * 0.15;
  
  const baseDamage = Math.floor(
    ((((2 * level / 5 + 2) * power * attack / defense) / 50) + 2) *
    critMultiplier * stab * effectiveness * random
  );
  
  return {
    damage: Math.max(1, baseDamage),
    effectiveness,
    critical,
  };
}

export function calculateCatchRate(pokemon: BattlePokemon, ballModifier: number = 1): number {
  const hpPercent = pokemon.currentHp / pokemon.stats.hp;
  const catchRate = pokemon.catchRate;
  
  const modifiedRate = (catchRate * (1 - hpPercent * 0.7)) * ballModifier;
  const probability = Math.min(0.9, modifiedRate / 255);
  
  return probability;
}
