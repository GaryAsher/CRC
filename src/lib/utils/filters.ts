/**
 * Filter utilities for CRC
 * Used by Games index, Runners index, and any future filterable lists.
 */

/** Shape expected by TagPicker items prop */
export interface TagItem {
	id: string;
	label: string;
	aliases?: string[];
}

/**
 * Normalize a string: trim + lowercase.
 */
export function norm(s: string): string {
	return (s || '').trim().toLowerCase();
}

/**
 * Expand Roman numerals in a string to Arabic numerals.
 * e.g. "hades ii" → "hades 2", so searching "3" finds "III"
 */
export function expandRomanNumerals(s: string): string {
	let str = norm(s);
	const romans: [string, string][] = [
		['xviii', '18'], ['xvii', '17'], ['xvi', '16'], ['xv', '15'], ['xiv', '14'],
		['xiii', '13'], ['xii', '12'], ['xi', '11'], ['x', '10'],
		['viii', '8'], ['vii', '7'], ['vi', '6'], ['iv', '4'], ['v', '5'],
		['iii', '3'], ['ii', '2'], ['i', '1']
	];
	for (const [roman, arabic] of romans) {
		const regex = new RegExp(`\\b${roman}\\b`, 'g');
		str = str.replace(regex, arabic);
	}
	return str;
}

/**
 * Check if a first-letter matches the current A-Z filter.
 */
export function matchesLetterFilter(letter: string, filterLetter: string): boolean {
	if (!filterLetter || filterLetter === 'ALL') return true;

	const upper = letter.toUpperCase();
	const isDigit = upper >= '0' && upper <= '9';
	const isAZ = upper >= 'A' && upper <= 'Z';

	if (filterLetter === '0-9') return isDigit;
	if (filterLetter === 'OTHER') return !isDigit && !isAZ;
	if (filterLetter.length === 1) return upper === filterLetter;
	return true;
}

/**
 * Get the first character of a name for A-Z filtering (strips leading quotes/spaces).
 */
export function getFirstLetter(name: string): string {
	const stripped = name.replace(/^["'\s]+/, '').trim();
	return stripped.length > 0 ? stripped[0].toUpperCase() : '';
}
