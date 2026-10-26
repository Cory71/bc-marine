// Environment Canada marine wind warnings, from least to most severe.
// Checked most-severe first, since "hurricane force wind" also contains "wind".
const WARNING_RANKS = [
  { phrase: 'hurricane force', rank: 4 }, // 64+ knots
  { phrase: 'storm', rank: 3 }, // 48–63 knots
  { phrase: 'gale', rank: 2 }, // 34–47 knots
  { phrase: 'strong wind', rank: 1 }, // 20–33 knots
];

// Gale and above are shown in the stronger (red) warning style
const SEVERE_RANK = 2;

// Rank a warning by its title: 0 for other warnings (e.g. freezing spray), up to 4.
// "Gale warning ended" ranks 0 too, so it isn't shown red or ahead of active warnings.
export function getWarningRank(title) {
  const text = String(title ?? '').toLowerCase();
  if (text.includes('ended')) return 0;
  return WARNING_RANKS.find(({ phrase }) => text.includes(phrase))?.rank ?? 0;
}

export function isSevereWarning(title) {
  return getWarningRank(title) >= SEVERE_RANK;
}

// Most severe first, so banners lead with the warning that matters most
export function sortWarningsBySeverity(warnings) {
  return [...(warnings ?? [])].sort((a, b) => getWarningRank(b.title) - getWarningRank(a.title));
}
