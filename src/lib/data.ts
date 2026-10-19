export type Kind = 'teddy' | 'cloud' | 'duck';
export type Eyes = 'round' | 'happy' | 'sleepy' | 'wink';
export type Acc = 'bow' | 'scarf' | 'star' | 'heart' | 'none';
export type Col = 'brown' | 'yellow' | 'pink' | 'purple';
export type DamageType = 'thread' | 'bandage' | 'cotton' | 'patch';
export interface ToySpec { kind: Kind; eyes: Eyes; acc: Acc; color: Col }

export const KINDS: { id: Kind; label: string }[] = [
  { id: 'teddy', label: 'Teddy' }, { id: 'cloud', label: 'Cloud' }, { id: 'duck', label: 'Duck' },
];
export const COLORS: Record<Col, { base: string; dark: string; light: string; label: string }> = {
  brown: { base: '#d2a679', dark: '#a9794d', light: '#ecd2b4', label: 'Brown' },
  yellow: { base: '#f9e08a', dark: '#d9b94a', light: '#fff2bd', label: 'Yellow' },
  pink: { base: '#f8bcd3', dark: '#d98aae', light: '#ffe0ec', label: 'Pink' },
  purple: { base: '#cdb7f0', dark: '#a28bd1', light: '#e9ddff', label: 'Purple' },
};
export const COLOR_IDS = Object.keys(COLORS) as Col[];
export const EYE_IDS: Eyes[] = ['round', 'happy', 'sleepy', 'wink'];
export const ACC_IDS: Exclude<Acc, 'none'>[] = ['bow', 'scarf', 'star', 'heart'];
export const DAMAGE_META: Record<DamageType, { icon: string; tool: string }> = {
  thread: { icon: '🧵', tool: 'needle and thread' },
  bandage: { icon: '🩹', tool: 'bandage' },
  cotton: { icon: '☁️', tool: 'cotton stuffing' },
  patch: { icon: '🧩', tool: 'patch' },
};

export type BabyId = 'sleepy' | 'curious' | 'playful' | 'dancing' | 'quiet' | 'giggly' | 'dreamy';
export interface Baby {
  id: BabyId; name: string; icon: string; wants: ToySpec;
  house: { x: number; y: number; w: number; h: number }; // px on the 1672x941 art
  box: { x: number; y: number; w: number; h: number };
}
// The "special toy" for each baby is a design choice (edit freely).
export const BABIES: Baby[] = [
  { id: 'sleepy', name: 'Sleepy Baby', icon: '🌙', wants: { kind: 'cloud', eyes: 'sleepy', acc: 'star', color: 'purple' },
    house: { x: 430, y: 125, w: 170, h: 170 }, box: { x: 385, y: 650, w: 120, h: 95 } },
  { id: 'curious', name: 'Curious Baby', icon: '❓', wants: { kind: 'duck', eyes: 'round', acc: 'scarf', color: 'yellow' },
    house: { x: 630, y: 110, w: 170, h: 165 }, box: { x: 512, y: 650, w: 120, h: 95 } },
  { id: 'playful', name: 'Playful Baby', icon: '🏐', wants: { kind: 'teddy', eyes: 'wink', acc: 'bow', color: 'brown' },
    house: { x: 835, y: 110, w: 170, h: 165 }, box: { x: 636, y: 650, w: 120, h: 95 } },
  { id: 'dancing', name: 'Dancing Baby', icon: '🎵', wants: { kind: 'duck', eyes: 'happy', acc: 'bow', color: 'pink' },
    house: { x: 1040, y: 150, w: 180, h: 170 }, box: { x: 762, y: 650, w: 120, h: 95 } },
  { id: 'quiet', name: 'Quiet Baby', icon: '🍃', wants: { kind: 'teddy', eyes: 'sleepy', acc: 'scarf', color: 'yellow' },
    house: { x: 480, y: 360, w: 190, h: 165 }, box: { x: 886, y: 650, w: 120, h: 95 } },
  { id: 'giggly', name: 'Giggly Baby', icon: '💗', wants: { kind: 'teddy', eyes: 'happy', acc: 'heart', color: 'pink' },
    house: { x: 750, y: 400, w: 185, h: 170 }, box: { x: 1015, y: 650, w: 120, h: 95 } },
  { id: 'dreamy', name: 'Dreamy Baby', icon: '☁️', wants: { kind: 'cloud', eyes: 'round', acc: 'bow', color: 'pink' },
    house: { x: 1020, y: 400, w: 190, h: 165 }, box: { x: 1143, y: 650, w: 120, h: 95 } },
];

export const specText = (s: ToySpec) =>
  `${COLORS[s.color].label.toLowerCase()} ${s.kind} with ${s.eyes} eyes${s.acc === 'none' ? '' : ' and a ' + s.acc}`;

// Wording from Lumi's handwritten notes, with grammar corrected at the owner's request.
export const BACKSTORY = {
  title: 'Lumi’s Backstory',
  story: 'Lumi gets discarded because she is a broken toy, and then she decides to fix all broken toys so they don’t end up like her.',
  personality: [
    'Always tired',
    'Playful and silly',
    'Gets angry easily',
    'Doesn’t like being touched',
    'Creates a small personal space circle',
  ],
};
