import React, { createContext, useContext, useState } from 'react';
import { ConfigProvider, theme as antdThemeAlgorithm, ThemeConfig } from 'antd';
import { ALL_THEMES, LIGHT_THEMES, THEMES, ThemeId, ThemePalette } from './themes';

const THEME_STORAGE_KEY = 'opspages-theme-id';

interface ThemeContextValue {
  themeId: ThemeId;
  currentThemeId: ThemeId;
  palette: ThemePalette;
  theme: ThemePalette;
  isDark: boolean;
  setThemeId: (id: ThemeId) => void;
  toggleDarkLight: () => void;
}

const defaultTheme = LIGHT_THEMES[0];

const ThemeContext = createContext<ThemeContextValue>({
  themeId: defaultTheme.id,
  currentThemeId: defaultTheme.id,
  palette: defaultTheme,
  theme: defaultTheme,
  isDark: false,
  setThemeId: () => {},
  toggleDarkLight: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const CopanThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeIdState] = useState<ThemeId>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && THEMES[saved]) {
      return saved;
    }
    return 'loft-classic';
  });

  const theme = THEMES[themeId] || LIGHT_THEMES[0];
  const isDark = theme.type === 'dark';

  const setThemeId = (id: ThemeId) => {
    if (THEMES[id]) {
      setThemeIdState(id);
      localStorage.setItem(THEME_STORAGE_KEY, id);
    }
  };

  const toggleDarkLight = () => {
    setThemeId(isDark ? 'loft-classic' : 'loft-obsidian');
  };

  const antdConfig: ThemeConfig = {
    algorithm: isDark ? antdThemeAlgorithm.darkAlgorithm : antdThemeAlgorithm.defaultAlgorithm,
    token: {
      colorPrimary: theme.primary,
      colorPrimaryHover: theme.primaryHover,
      colorPrimaryActive: theme.primaryActive,
      colorBgBase: theme.bgContainer,
      colorBgContainer: theme.bgContainer,
      colorBgLayout: theme.bgLayout,
      colorBgElevated: isDark ? theme.bgHeader : '#FFFFFF',
      colorTextBase: theme.colorText,
      colorText: theme.colorText,
      colorTextHeading: isDark ? '#FFFFFF' : '#0F172A',
      colorTextSecondary: isDark ? '#94A3B8' : '#64748B',
      colorBorder: theme.colorBorder,
      colorBorderSecondary: theme.colorBorder,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      borderRadius: 8,
      borderRadiusLG: 12,
      borderRadiusSM: 6,
    },
    components: {
      Button: {
        controlHeight: 38,
        fontWeight: 500,
        borderRadius: 8,
      },
      Table: {
        colorBgContainer: theme.bgContainer,
        headerBg: isDark ? theme.bgSidebar : '#F8FAFC',
        headerColor: isDark ? '#FFFFFF' : '#0F172A',
        rowHoverBg: isDark ? `${theme.primary}15` : '#F1F5F9',
        borderColor: theme.colorBorder,
      },
      Card: {
        borderRadiusLG: 12,
        paddingLG: 20,
        colorBgContainer: theme.bgContainer,
        colorBorderSecondary: theme.colorBorder,
      },
      Modal: {
        contentBg: theme.bgContainer,
        headerBg: theme.bgContainer,
        titleColor: theme.colorText,
      },
      Drawer: {
        colorBgElevated: theme.bgContainer,
        colorText: theme.colorText,
      },
      Select: {
        colorBgContainer: theme.bgContainer,
        colorBgElevated: isDark ? theme.bgSidebar : '#FFFFFF',
        colorBorder: theme.colorBorder,
        colorText: theme.colorText,
      },
      Input: {
        controlHeight: 38,
        colorBgContainer: theme.bgContainer,
        colorBorder: theme.colorBorder,
        colorText: theme.colorText,
        activeBorderColor: theme.primary,
        hoverBorderColor: theme.primaryHover,
      },
      Dropdown: {
        colorBgElevated: isDark ? theme.bgSidebar : '#FFFFFF',
        colorText: theme.colorText,
      },
      Tabs: {
        itemColor: isDark ? '#94A3B8' : '#64748B',
        itemSelectedColor: theme.primary,
        itemHoverColor: theme.primaryHover,
        inkBarColor: theme.primary,
      },
      Menu: {
        darkItemBg: theme.bgSidebar,
        darkItemSelectedBg: theme.primary,
        darkItemHoverBg: isDark ? '#1E252B' : '#1A2024',
        darkItemColor: '#A0AEC0',
        darkItemSelectedColor: '#FFFFFF',
      },
    },
  };

  return (
    <ThemeContext.Provider
      value={{
        themeId,
        currentThemeId: themeId,
        palette: theme,
        theme,
        isDark,
        setThemeId,
        toggleDarkLight,
      }}
    >
      <ConfigProvider theme={antdConfig}>{children}</ConfigProvider>
    </ThemeContext.Provider>
  );
};
