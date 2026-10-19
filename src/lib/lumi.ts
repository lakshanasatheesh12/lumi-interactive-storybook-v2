/** Visitor memory (localStorage) and Lumi's rule-based dialogue. */
export type Mood = 'happy' | 'sleepy' | 'angry';
export interface Visitor { name: string; visits: number; firstVisit: string; lastVisit: string }
export interface Reply { text: string; mood: Mood }

const KEY = 'lumi-visitor';
const SESSION = 'lumi-visit-counted';
const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];

export function loadVisitor(): Visitor | null {
  try { const v = JSON.parse(localStorage.getItem(KEY) ?? 'null'); return v && typeof v.visits === 'number' ? v : null; } catch { return null; }
}
function save(v: Visitor) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* storage blocked */ } }

/** Counts one visit per browser session. */
export function registerVisit(): { visitor: Visitor; returning: boolean; daysAgo: number } {
  const old = loadVisitor();
  const now = new Date().toISOString();
  let counted = false;
  try { counted = sessionStorage.getItem(SESSION) === '1'; } catch { /* ignore */ }
  if (!old) {
    const v = { name: '', visits: 1, firstVisit: now, lastVisit: now };
    save(v);
    try { sessionStorage.setItem(SESSION, '1'); } catch { /* ignore */ }
    return { visitor: v, returning: false, daysAgo: 0 };
  }
  const daysAgo = Math.floor((Date.now() - new Date(old.lastVisit).getTime()) / 86_400_000);
  if (counted) return { visitor: old, returning: old.visits > 1, daysAgo };
  const v = { ...old, visits: old.visits + 1, lastVisit: now };
  save(v);
  try { sessionStorage.setItem(SESSION, '1'); } catch { /* ignore */ }
  return { visitor: v, returning: true, daysAgo };
}

export function setVisitorName(name: string): Visitor | null {
  const v = loadVisitor();
  if (!v) return null;
  const n = { ...v, name: name.trim().slice(0, 24) };
  save(n);
  return n;
}

export function greeting(v: Visitor, returning: boolean, daysAgo: number): string {
  if (!returning) return 'Hi… *yawn* I’m Lumi. I fix broken toys. What’s your name?';
  const who = v.name || 'you';
  const away = daysAgo >= 2 ? ` It’s been ${daysAgo} days. I counted. Slowly.` : '';
  if (!v.name) return `Oh. You’re back. *yawn* That’s visit number ${v.visits}.${away} I still don’t know your name, silly.`;
  return pick([
    `Oh, it’s ${who} again. *yawn* Visit number ${v.visits}!${away}`,
    `${who}! You came back. I was napping. Just kidding. I was napping a little.${away}`,
    `Welcome back, ${who}. Visit number ${v.visits}. Please keep your hands to yourself.${away}`,
  ]);
}

const RULES: { re: RegExp; mood: Mood; say: (v: Visitor | null) => readonly string[] }[] = [
  { re: /\b(touch|hug|pat|poke|pet|cuddle|squeeze|tickle|boop|grab|hold)\b/i, mood: 'angry',
    say: () => ['HEY! Personal space circle! Back up. Three steps. Now.', 'Do NOT poke me. I’m tired AND grumpy.', 'No touching! …Nice try, though. Silly human.', 'GRRR. Hands off! I only let toys near my circle.'] },
  { re: /\b(stupid|dumb|ugly|hate|shut up|annoying)\b/i, mood: 'angry',
    say: () => ['Hmph! Rude. I’m telling the teddies.', 'That’s not nice. My circle just got bigger.', 'Grrr. I’m grumpy now. Say sorry in a silly way.'] },
  { re: /\b(sorry|apolog)/i, mood: 'sleepy', say: () => ['…Okay. I forgive you. *yawn* But stay outside the circle.', 'Fine. Sorry accepted. Now make me laugh.'] },
  { re: /\b(hi|hello|hey|hiya|yo|good (morning|evening|afternoon))\b/i, mood: 'sleepy',
    say: (v) => [`Hi${v?.name ? ', ' + v.name : ''}… *yawn* Sorry, I was resting my eyes.`, 'Oh, hello. Beep boop. Please stand outside my circle.'] },
  { re: /who are you|your name|what are you/i, mood: 'happy',
    say: () => ['I’m Lumi, a small robot. I repair toys, make toys, and deliver them. Mostly I yawn.', 'Lumi! Small robot, big yawn. I fix broken toys.'] },
  { re: /\b(tired|sleep|sleepy|nap|yawn|bed|rest)\b/i, mood: 'sleepy',
    say: () => ['Sleepy? Same. I’ve been tired since forever. *yawn*', 'Naps are my favourite repair. …Don’t tell the toys.', 'Zzz… oh! I’m awake. Mostly.'] },
  { re: /\b(joke|funny|silly|laugh|haha|lol)\b/i, mood: 'happy',
    say: () => ['Why did the teddy skip dessert? It was already stuffed! *yawn* I’m hilarious.', 'What do you call a sleepy robot? Me. Beep boop!', 'Knock knock. …Who’s there? …I forgot. I was napping.'] },
  { re: /\b(fix|broken|repair|mend|rip|torn)\b/i, mood: 'happy',
    say: () => ['Broken toys get a second chance. That’s my whole job.', 'I decided to fix every broken toy so none of them end up like me. Thread, patches, and cotton!', 'Bring me a torn teddy and I’ll stitch it. Slowly. With love.'] },
  { re: /\b(puzzle|game|play|piece)\b/i, mood: 'happy',
    say: () => ['Try the puzzle bench in my workshop! Put the pieces back where they belong. I’ll watch. From a nap.', 'Games are great. Winning is better. Napping is best.'] },
  { re: /\b(toy|teddy|bear|duck|cloud)\b/i, mood: 'happy',
    say: () => ['Teddies are my favourite patients. Ducks squeak when I stitch them. Clouds are mostly stuffing and feelings.', 'Teddy, cloud, or duck? I can make all three. Quack.'] },
  { re: /\b(baby|babies|deliver|delivery|truck)\b/i, mood: 'happy',
    say: () => ['Seven babies, seven toys. I deliver them in my little truck. Beep beep!', 'Sleepy, curious, playful, dancing, quiet, giggly, dreamy. Every baby gets a special toy.'] },
  { re: /\b(night|dark|moon|dream|star)\b/i, mood: 'sleepy',
    say: () => ['Night is my favourite. Everything glows and nobody asks me to do things.', 'Make a dream wish in the guestbook! I read them. Slowly.'] },
  { re: /\b(love|cute|friend|like you|adorable)\b/i, mood: 'happy',
    say: () => ['Cute? …I’m a serious robot. *blushes, tiredly*', 'Friends are okay. From a respectful distance.'] },
  { re: /\b(thanks|thank you|thx)\b/i, mood: 'happy', say: () => ['…You’re welcome. Don’t make it weird.', 'Beep boop. Any time. After my nap.'] },
  { re: /\b(bye|goodbye|goodnight|good night|see you|cya)\b/i, mood: 'sleepy', say: () => ['Bye. *yawn* Don’t touch anything on your way out.', 'Goodnight! I’ll be here. Napping.'] },
  { re: /\b(how are you|how r u|what'?s up|sup)\b/i, mood: 'sleepy', say: () => ['Tired. Silly. A little grumpy. The usual!', 'Fine. *yawn* Gears squeaky, circle intact.'] },
];
const FALLBACK = ['Mmm? *blinks slowly* Say that again, but sillier.', 'I wasn’t listening. I was thinking about naps.', 'Beep boop. That’s all I’ve got. *yawn*', 'Hmm. Ask me about toys, naps, or babies.'];

export function reply(input: string, v: Visitor | null): Reply {
  const text = input.trim();
  for (const r of RULES) if (r.re.test(text)) return { text: pick(r.say(v)), mood: r.mood };
  return { text: pick(FALLBACK), mood: 'sleepy' };
}

/** Pulls a first name out of "my name is X", "I'm X", "call me X", or a single word. */
export function parseName(input: string): string {
  const m = input.match(/(?:my name is|i am|i['’]m|call me|it['’]s)\s+([\p{L}'-]{1,24})/iu);
  const raw = (m ? m[1] : input.trim().split(/\s+/)[0]) ?? '';
  const clean = raw.replace(/[^\p{L}'-]/gu, '');
  return clean ? clean[0].toUpperCase() + clean.slice(1) : '';
}
