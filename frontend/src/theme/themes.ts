export type ThemeId = string;

export interface ThemePalette {
  id: string;
  name: string;
  type: 'light' | 'dark';
  isDark: boolean;
  primary: string;
  primaryHover: string;
  primaryActive: string;
  bgLayout: string;
  bgContainer: string;
  bgSidebar: string;
  bgHeader: string;
  colorText: string;
  colorBorder: string;
  badgeTag: string;
  // Aliases for backward compatibility
  bgPrimary: string;
  bgSecondary: string;
  bgElevated: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
}

interface RawTheme {
  id: string;
  name: string;
  type: 'light' | 'dark';
  primary: string;
  primaryHover: string;
  primaryActive: string;
  bgLayout: string;
  bgContainer: string;
  bgSidebar: string;
  bgHeader: string;
  colorText: string;
  colorBorder: string;
  badgeTag: string;
}

const RAW_LIGHT_THEMES: RawTheme[] = [
  {
    id: 'loft-classic',
    name: 'Loft Classic (Laranja Copan)',
    type: 'light',
    primary: '#F56738',
    primaryHover: '#D94616',
    primaryActive: '#B83208',
    bgLayout: '#F4F7F9',
    bgContainer: '#FFFFFF',
    bgSidebar: '#121619',
    bgHeader: '#FFFFFF',
    colorText: '#1A2024',
    colorBorder: '#E1E9EF',
    badgeTag: '#F56738',
  },
  {
    id: 'emerald-supabase',
    name: 'Emerald Supabase',
    type: 'light',
    primary: '#24B47E',
    primaryHover: '#1EA06E',
    primaryActive: '#17855B',
    bgLayout: '#F6FBF8',
    bgContainer: '#FFFFFF',
    bgSidebar: '#0E1E17',
    bgHeader: '#FFFFFF',
    colorText: '#182C23',
    colorBorder: '#D2EDE0',
    badgeTag: '#24B47E',
  },
  {
    id: 'sapphire-tech',
    name: 'Sapphire Tech (Azul Corporativo)',
    type: 'light',
    primary: '#1677FF',
    primaryHover: '#4096FF',
    primaryActive: '#0958D9',
    bgLayout: '#F4F8FC',
    bgContainer: '#FFFFFF',
    bgSidebar: '#0A1626',
    bgHeader: '#FFFFFF',
    colorText: '#102A45',
    colorBorder: '#D0E2FF',
    badgeTag: '#1677FF',
  },
  {
    id: 'royal-violet',
    name: 'Royal Violet (Roxo Real)',
    type: 'light',
    primary: '#722ED1',
    primaryHover: '#9254DE',
    primaryActive: '#531DAB',
    bgLayout: '#F8F6FD',
    bgContainer: '#FFFFFF',
    bgSidebar: '#1A0E2E',
    bgHeader: '#FFFFFF',
    colorText: '#22075E',
    colorBorder: '#EFDBFF',
    badgeTag: '#722ED1',
  },
  {
    id: 'sunset-coral',
    name: 'Sunset Coral (Coral Vibrante)',
    type: 'light',
    primary: '#FF5722',
    primaryHover: '#FF7043',
    primaryActive: '#E64A19',
    bgLayout: '#FFF7F4',
    bgContainer: '#FFFFFF',
    bgSidebar: '#26120D',
    bgHeader: '#FFFFFF',
    colorText: '#2B130E',
    colorBorder: '#FFDCCF',
    badgeTag: '#FF5722',
  },
  {
    id: 'nordic-teal',
    name: 'Nordic Teal (Turquesa Nórdico)',
    type: 'light',
    primary: '#13C2C2',
    primaryHover: '#36CFC9',
    primaryActive: '#08979C',
    bgLayout: '#F2FCFC',
    bgContainer: '#FFFFFF',
    bgSidebar: '#092121',
    bgHeader: '#FFFFFF',
    colorText: '#002329',
    colorBorder: '#B5F5EC',
    badgeTag: '#13C2C2',
  },
  {
    id: 'rose-berry',
    name: 'Rose Berry (Rosa Moderno)',
    type: 'light',
    primary: '#EB2F96',
    primaryHover: '#F759AB',
    primaryActive: '#C41D7F',
    bgLayout: '#FDF4F8',
    bgContainer: '#FFFFFF',
    bgSidebar: '#260B1B',
    bgHeader: '#FFFFFF',
    colorText: '#3B0A26',
    colorBorder: '#FFD6E7',
    badgeTag: '#EB2F96',
  },
  {
    id: 'amber-gold',
    name: 'Amber Gold (Dourado Âmbar)',
    type: 'light',
    primary: '#FAAD14',
    primaryHover: '#FFC53D',
    primaryActive: '#D48806',
    bgLayout: '#FDFBF2',
    bgContainer: '#FFFFFF',
    bgSidebar: '#241D09',
    bgHeader: '#FFFFFF',
    colorText: '#362602',
    colorBorder: '#FFE58F',
    badgeTag: '#FAAD14',
  },
  {
    id: 'forest-mint',
    name: 'Forest Mint (Verde Floresta)',
    type: 'light',
    primary: '#52C41A',
    primaryHover: '#73D13D',
    primaryActive: '#389E0D',
    bgLayout: '#F6FCF2',
    bgContainer: '#FFFFFF',
    bgSidebar: '#102409',
    bgHeader: '#FFFFFF',
    colorText: '#132B09',
    colorBorder: '#D9F7BE',
    badgeTag: '#52C41A',
  },
  {
    id: 'slate-graphite',
    name: 'Slate Graphite (Grafite Executivo)',
    type: 'light',
    primary: '#4A5568',
    primaryHover: '#718096',
    primaryActive: '#2D3748',
    bgLayout: '#F7FAFC',
    bgContainer: '#FFFFFF',
    bgSidebar: '#1A202C',
    bgHeader: '#FFFFFF',
    colorText: '#1A202C',
    colorBorder: '#E2E8F0',
    badgeTag: '#4A5568',
  },
];

const RAW_DARK_THEMES: RawTheme[] = [
  {
    id: 'loft-obsidian',
    name: 'Loft Obsidian (Escuro Copan)',
    type: 'dark',
    primary: '#F56738',
    primaryHover: '#FF8155',
    primaryActive: '#D94616',
    bgLayout: '#0E1216',
    bgContainer: '#141A1E',
    bgSidebar: '#0A0D10',
    bgHeader: '#141A1E',
    colorText: '#F0F4F8',
    colorBorder: '#2A3640',
    badgeTag: '#F56738',
  },
  {
    id: 'supabase-midnight',
    name: 'Supabase Midnight',
    type: 'dark',
    primary: '#24B47E',
    primaryHover: '#33D998',
    primaryActive: '#1EA06E',
    bgLayout: '#121212',
    bgContainer: '#1C1C1C',
    bgSidebar: '#0D0D0D',
    bgHeader: '#1C1C1C',
    colorText: '#EDEDED',
    colorBorder: '#2E2E2E',
    badgeTag: '#24B47E',
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    type: 'dark',
    primary: '#00F0FF',
    primaryHover: '#38F4FF',
    primaryActive: '#00C3CF',
    bgLayout: '#0B0F19',
    bgContainer: '#111827',
    bgSidebar: '#070A11',
    bgHeader: '#111827',
    colorText: '#F3F4F6',
    colorBorder: '#1F2937',
    badgeTag: '#00F0FF',
  },
  {
    id: 'synthwave-violet',
    name: 'Synthwave Violet',
    type: 'dark',
    primary: '#BD34FE',
    primaryHover: '#D369FF',
    primaryActive: '#9A15DC',
    bgLayout: '#130B24',
    bgContainer: '#1E1235',
    bgSidebar: '#0C0617',
    bgHeader: '#1E1235',
    colorText: '#F5F3FF',
    colorBorder: '#341E5C',
    badgeTag: '#BD34FE',
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    type: 'dark',
    primary: '#7AA2F7',
    primaryHover: '#96B7FA',
    primaryActive: '#5485E8',
    bgLayout: '#1A1B26',
    bgContainer: '#24283B',
    bgSidebar: '#13141C',
    bgHeader: '#24283B',
    colorText: '#C0CAF5',
    colorBorder: '#2F354D',
    badgeTag: '#7AA2F7',
  },
  {
    id: 'dracula-classic',
    name: 'Dracula Classic',
    type: 'dark',
    primary: '#FF79C6',
    primaryHover: '#FF94D2',
    primaryActive: '#E05AA7',
    bgLayout: '#21222C',
    bgContainer: '#282A36',
    bgSidebar: '#191A21',
    bgHeader: '#282A36',
    colorText: '#F8F8F2',
    colorBorder: '#44475A',
    badgeTag: '#FF79C6',
  },
  {
    id: 'nord-deep-sea',
    name: 'Nord Deep Sea',
    type: 'dark',
    primary: '#88C0D0',
    primaryHover: '#A3D4E2',
    primaryActive: '#6CA8B9',
    bgLayout: '#242933',
    bgContainer: '#2E3440',
    bgSidebar: '#1B1F27',
    bgHeader: '#2E3440',
    colorText: '#ECEFF4',
    colorBorder: '#434C5E',
    badgeTag: '#88C0D0',
  },
  {
    id: 'matrix-green',
    name: 'Matrix Terminal',
    type: 'dark',
    primary: '#00FF66',
    primaryHover: '#33FF85',
    primaryActive: '#00D655',
    bgLayout: '#0A0E0C',
    bgContainer: '#101713',
    bgSidebar: '#060907',
    bgHeader: '#101713',
    colorText: '#D1FADF',
    colorBorder: '#1A2920',
    badgeTag: '#00FF66',
  },
  {
    id: 'catppuccin-mocha',
    name: 'Catppuccin Mocha',
    type: 'dark',
    primary: '#F5C2E7',
    primaryHover: '#FAD8F0',
    primaryActive: '#E5A4D4',
    bgLayout: '#181825',
    bgContainer: '#1E1E2E',
    bgSidebar: '#11111B',
    bgHeader: '#1E1E2E',
    colorText: '#CDD6F4',
    colorBorder: '#313244',
    badgeTag: '#F5C2E7',
  },
  {
    id: 'monokai-amber',
    name: 'Monokai Amber',
    type: 'dark',
    primary: '#F59E0B',
    primaryHover: '#FBBF24',
    primaryActive: '#D97706',
    bgLayout: '#141416',
    bgContainer: '#1D1E22',
    bgSidebar: '#0C0D0E',
    bgHeader: '#1D1E22',
    colorText: '#F3F4F6',
    colorBorder: '#33353D',
    badgeTag: '#F59E0B',
  },
];

const toPalette = (t: RawTheme): ThemePalette => ({
  ...t,
  isDark: t.type === 'dark',
  bgPrimary: t.bgLayout,
  bgSecondary: t.bgContainer,
  bgElevated: t.type === 'dark' ? t.bgSidebar : '#F8FAFC',
  border: t.colorBorder,
  textPrimary: t.colorText,
  textSecondary: t.type === 'dark' ? '#94A3B8' : '#64748B',
});

export const LIGHT_THEMES: ThemePalette[] = RAW_LIGHT_THEMES.map(toPalette);
export const DARK_THEMES: ThemePalette[] = RAW_DARK_THEMES.map(toPalette);
export const ALL_THEMES: ThemePalette[] = [...LIGHT_THEMES, ...DARK_THEMES];

export const THEMES: Record<string, ThemePalette> = Object.fromEntries(
  ALL_THEMES.map((t) => [t.id, t])
);
