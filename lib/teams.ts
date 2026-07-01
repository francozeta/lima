const JOIN_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const ACRONYMS = new Set(["AI", "CERTUS", "IA", "UI", "UX"]);

function normalizeWord(word: string) {
  const upper = word.toUpperCase();
  if (ACRONYMS.has(upper)) return upper;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function normalizeTeamName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map(normalizeWord)
    .join(" ");
}

export function createTeamJoinCode(random = Math.random) {
  return Array.from({ length: 6 }, () => {
    const index = Math.floor(random() * JOIN_CODE_ALPHABET.length);
    return JOIN_CODE_ALPHABET[index];
  }).join("");
}
