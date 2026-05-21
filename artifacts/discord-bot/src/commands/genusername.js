/**
 * /genusername — Generate pronounceable 4-letter username suggestions.
 *
 * Uses consonant-vowel patterns so every result sounds like a real word
 * rather than a random string. Generates 8 suggestions at once and shows
 * each in 4 styles so you can pick the format that suits your platform.
 *
 * Styles shown:
 *   lowercase   viko
 *   Capitalized Viko
 *   UPPERCASE   VIKO
 *   + digit     viko4
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

// ─── Letter pools ─────────────────────────────────────────────────────────────

const VOWELS = ['a', 'e', 'i', 'o', 'u'];

// Consonants that look and feel clean in short usernames
const CONSONANTS = [
  'b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l',
  'm', 'n', 'p', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z',
];

// Pairs that sound natural as a 2-consonant start (for CCVC pattern)
const STARTING_BLENDS = [
  'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr',
  'pl', 'pr', 'sk', 'sl', 'sm', 'sn', 'sp', 'st',
  'sw', 'tr', 'bl', 'sc', 'sh', 'th',
];

// Pairs that sound natural at the end of a word (for CVCC pattern)
const ENDING_BLENDS = [
  'lk', 'lt', 'lm', 'nd', 'nk', 'nt', 'rd', 'rk',
  'rm', 'rn', 'rt', 'sk', 'st', 'xt',
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Pattern generators ───────────────────────────────────────────────────────

/**
 * CVCV — consonant vowel consonant vowel
 * Examples: viko, mela, zuka, bero
 */
function patternCVCV() {
  return pick(CONSONANTS) + pick(VOWELS) + pick(CONSONANTS) + pick(VOWELS);
}

/**
 * VCVC — vowel consonant vowel consonant
 * Examples: azon, evel, ovir, ukan
 */
function patternVCVC() {
  return pick(VOWELS) + pick(CONSONANTS) + pick(VOWELS) + pick(CONSONANTS);
}

/**
 * CVCC — consonant vowel + ending blend
 * Examples: valk, melt, zork, burk
 */
function patternCVCC() {
  return pick(CONSONANTS) + pick(VOWELS) + pick(ENDING_BLENDS);
}

/**
 * CCVC — starting blend + vowel + consonant
 * Examples: brix, skev, plum (trimmed to 4), tran
 */
function patternCCVC() {
  const blend = pick(STARTING_BLENDS);
  return (blend + pick(VOWELS) + pick(CONSONANTS)).slice(0, 4);
}

const PATTERNS = [patternCVCV, patternCVCV, patternCVCV, patternVCVC, patternCVCC, patternCCVC];

/** Generate one unique 4-letter username base, retrying on collision. */
function generateUsername(seen) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const name = pick(PATTERNS)();
    if (name.length === 4 && !seen.has(name)) {
      seen.add(name);
      return name;
    }
  }
  // Fallback: pure CVCV — virtually guaranteed to be unique enough
  let name;
  do { name = patternCVCV(); } while (seen.has(name));
  seen.add(name);
  return name;
}

// ─── Command ──────────────────────────────────────────────────────────────────

export const data = new SlashCommandBuilder()
  .setName('genusername')
  .setDescription('Generate pronounceable 4-letter username ideas')
  .addIntegerOption((opt) =>
    opt
      .setName('count')
      .setDescription('How many suggestions to generate (default 8, max 15)')
      .setMinValue(1)
      .setMaxValue(15),
  );

export async function execute(interaction) {
  const count = interaction.options.getInteger('count') ?? 8;

  const seen = new Set();
  const usernames = Array.from({ length: count }, () => generateUsername(seen));

  // Format each username in 4 styles on one line
  const lines = usernames.map((name) => {
    const cap = name[0].toUpperCase() + name.slice(1);
    const up = name.toUpperCase();
    const digit = name + Math.floor(1 + Math.random() * 9);
    return `\`${name}\`  \`${cap}\`  \`${up}\`  \`${digit}\``;
  });

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('🎲 Username Suggestions')
        .setDescription(lines.join('\n'))
        .addFields({
          name: 'Formats shown',
          value: '`lower`  `Capitalized`  `UPPER`  `+digit`',
          inline: false,
        })
        .setFooter({
          text: 'All names are 4 letters and pronounceable • Run again for more options',
        })
        .setTimestamp(),
    ],
    ephemeral: true,
  });
}
