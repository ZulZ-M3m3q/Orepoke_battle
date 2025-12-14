import type { Pokemon, PokemonMove, PokemonStats } from './types';

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';

interface PokeAPIStats {
  base_stat: number;
  stat: { name: string };
}

interface PokeAPIType {
  type: { name: string };
}

interface PokeAPIMove {
  move: { name: string; url: string };
}

interface PokeAPIPokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number;
  stats: PokeAPIStats[];
  types: PokeAPIType[];
  moves: PokeAPIMove[];
  sprites: {
    front_default: string;
    back_default: string;
    other?: {
      'official-artwork'?: {
        front_default: string;
      };
    };
  };
}

interface PokeAPIMoveDetail {
  id: number;
  name: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
  type: { name: string };
  damage_class: { name: string };
  effect_entries: { effect: string; language: { name: string } }[];
}

interface PokeAPISpecies {
  capture_rate: number;
}

const pokemonCache = new Map<number, Pokemon>();
const moveCache = new Map<string, PokemonMove>();

export async function fetchPokemon(idOrName: number | string): Promise<Pokemon | null> {
  const id = typeof idOrName === 'number' ? idOrName : parseInt(String(idOrName), 10);
  
  if (!isNaN(id) && pokemonCache.has(id)) {
    return pokemonCache.get(id)!;
  }

  try {
    const response = await fetch(`${POKEAPI_BASE}/pokemon/${idOrName}`);
    if (!response.ok) return null;
    
    const data: PokeAPIPokemon = await response.json();
    
    const speciesResponse = await fetch(`${POKEAPI_BASE}/pokemon-species/${data.id}`);
    const speciesData: PokeAPISpecies = speciesResponse.ok 
      ? await speciesResponse.json() 
      : { capture_rate: 45 };

    const stats: PokemonStats = {
      hp: data.stats.find(s => s.stat.name === 'hp')?.base_stat || 50,
      attack: data.stats.find(s => s.stat.name === 'attack')?.base_stat || 50,
      defense: data.stats.find(s => s.stat.name === 'defense')?.base_stat || 50,
      specialAttack: data.stats.find(s => s.stat.name === 'special-attack')?.base_stat || 50,
      specialDefense: data.stats.find(s => s.stat.name === 'special-defense')?.base_stat || 50,
      speed: data.stats.find(s => s.stat.name === 'speed')?.base_stat || 50,
    };

    const moveUrls = data.moves.slice(0, 20).map(m => m.move.url);
    const moves = await Promise.all(
      moveUrls.slice(0, 4).map(url => fetchMove(url))
    );
    const validMoves = moves.filter((m): m is PokemonMove => m !== null);

    if (validMoves.length < 4) {
      validMoves.push({
        id: 33,
        name: 'Tackle',
        type: 'normal',
        category: 'physical',
        power: 40,
        accuracy: 100,
        pp: 35,
        currentPp: 35,
      });
    }

    const pokemon: Pokemon = {
      id: data.id,
      name: data.name.charAt(0).toUpperCase() + data.name.slice(1),
      types: data.types.map(t => t.type.name),
      stats,
      moves: validMoves.slice(0, 4),
      sprite: data.sprites.other?.['official-artwork']?.front_default || data.sprites.front_default,
      spriteBack: data.sprites.back_default,
      height: data.height,
      weight: data.weight,
      baseExperience: data.base_experience || 50,
      catchRate: speciesData.capture_rate,
    };

    pokemonCache.set(data.id, pokemon);
    return pokemon;
  } catch (error) {
    console.error('Error fetching Pokemon:', error);
    return null;
  }
}

async function fetchMove(url: string): Promise<PokemonMove | null> {
  const moveName = url.split('/').filter(Boolean).pop() || '';
  
  if (moveCache.has(moveName)) {
    const cached = moveCache.get(moveName)!;
    return { ...cached, currentPp: cached.pp };
  }

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data: PokeAPIMoveDetail = await response.json();
    
    if (data.power === null && data.damage_class.name !== 'status') {
      return null;
    }

    const category = data.damage_class.name as 'physical' | 'special' | 'status';
    
    const move: PokemonMove = {
      id: data.id,
      name: data.name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      type: data.type.name,
      category,
      power: data.power,
      accuracy: data.accuracy,
      pp: data.pp,
      currentPp: data.pp,
      effect: data.effect_entries.find(e => e.language.name === 'en')?.effect,
    };

    moveCache.set(moveName, move);
    return move;
  } catch (error) {
    console.error('Error fetching move:', error);
    return null;
  }
}

export async function getRandomWildPokemon(minLevel: number = 5, maxLevel: number = 30): Promise<Pokemon | null> {
  const randomId = Math.floor(Math.random() * 898) + 1;
  return fetchPokemon(randomId);
}

export interface QRValidationResult {
  isValid: boolean;
  pokemonId?: number;
  pokemonName?: string;
  error?: string;
}

export function validatePokemonQR(qrData: string): QRValidationResult {
  try {
    const parsed = JSON.parse(qrData);
    if (parsed.pokemonId && typeof parsed.pokemonId === 'number' && parsed.pokemonId >= 1 && parsed.pokemonId <= 1010) {
      return {
        isValid: true,
        pokemonId: parsed.pokemonId,
        pokemonName: parsed.name,
      };
    }
    return {
      isValid: false,
      error: 'Invalid Pokemon QR code format',
    };
  } catch {
    return {
      isValid: false,
      error: 'Not a valid Pokemon QR code. Please scan a card generated from this app.',
    };
  }
}

export async function getPokemonByQRData(qrData: string): Promise<Pokemon | null> {
  const validation = validatePokemonQR(qrData);
  
  if (validation.isValid && validation.pokemonId) {
    return fetchPokemon(validation.pokemonId);
  }
  
  return null;
}

export function generateQRDataForPokemon(pokemon: Pokemon): string {
  return JSON.stringify({
    pokemonId: pokemon.id,
    name: pokemon.name,
    type: 'pokemon-qr-battle',
    version: 1,
  });
}
