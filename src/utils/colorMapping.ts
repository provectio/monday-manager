// Couleurs officielles disponibles dans Monday.com (basées sur la palette officielle)
export const MONDAY_AVAILABLE_COLORS = [
  { name: 'Rose vif', hex: '#ff5ac4', monday: '#ff5ac4' },
  { name: 'Rose foncé', hex: '#ff158a', monday: '#ff158a' },
  { name: 'Rouge foncé', hex: '#bb3354', monday: '#bb3354' },
  { name: 'Rouge', hex: '#e2445c', monday: '#e2445c' },
  { name: 'Orange', hex: '#ff642e', monday: '#ff642e' },
  { name: 'Orange clair', hex: '#fdab3d', monday: '#fdab3d' },
  { name: 'Jaune', hex: '#ffcb00', monday: '#ffcb00' },
  { name: 'Jaune olive', hex: '#cab641', monday: '#cab641' },
  { name: 'Vert clair', hex: '#9cd326', monday: '#9cd326' },
  { name: 'Vert', hex: '#00c875', monday: '#00c875' },
  { name: 'Vert foncé', hex: '#037f4c', monday: '#037f4c' },
  { name: 'Bleu foncé', hex: '#0086c0', monday: '#0086c0' },
  { name: 'Bleu', hex: '#579bfc', monday: '#579bfc' },
  { name: 'Bleu clair', hex: '#66ccff', monday: '#66ccff' },
  { name: 'Violet clair', hex: '#a25ddc', monday: '#a25ddc' },
  { name: 'Violet', hex: '#784bd1', monday: '#784bd1' },
  { name: 'Marron', hex: '#7f5347', monday: '#7f5347' },
  { name: 'Gris clair', hex: '#c4c4c4', monday: '#c4c4c4' },
  { name: 'Gris', hex: '#808080', monday: '#808080' },
];


// Couleurs par défaut disponibles dans l'interface (uniquement celles supportées par Monday.com)
export const DEFAULT_COLORS = MONDAY_AVAILABLE_COLORS;

export function mapColorToMonday(color: string): string {
  // Since we now use only Monday.com official colors, return the color directly
  return color;
}

export function getColorPreview(hexColor: string) {
  const mondayColor = mapColorToMonday(hexColor);
  return {
    original: hexColor,
    monday: mondayColor,
    name: MONDAY_AVAILABLE_COLORS.find(c => c.hex.toLowerCase() === mondayColor.toLowerCase())?.name || 'Couleur personnalisée'
  };
}