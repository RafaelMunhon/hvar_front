import {
	ReactNode,
	createContext,
	useCallback,
	useContext,
	useState,
} from 'react'

const ThemeContext = createContext<any>({})

export const ThemeSettings = {
	layout: {
		type: { vertical: 'vertical', horizontal: 'horizontal' },
		mode: { fluid: 'fluid', boxed: 'boxed' },
		menuPosition: { scrollable: 'scrollable', fixed: 'fixed' },
	},
	theme: { light: 'light', dark: 'dark' },
	topbar: {
		theme: { light: 'light', dark: 'dark' },
		logo: { hidden: 'fullscreen', show: '' },
	},
	sidebar: {
		theme: { light: 'light', dark: 'dark' },
		size: {
			default: 'default',
			compact: 'compact',
			condensed: 'condensed',
			showOnHover: 'sm-hover',
			full: 'full',
			fullscreen: 'fullscreen',
		},
		user: { show: true, hidden: false },
	},
	rightSidebar: { show: true, hidden: false },
}

export function useThemeContext() {
	const context = useContext(ThemeContext)
	if (context === undefined) {
		throw new Error('useThemeContext must be used within an ThemeProvider')
	}
	return context
}

// Definir a interface do estado
interface Settings {
	layout: { type: string; mode: string; menuPosition: string };
	theme: string;
	topbar: { theme: string; logo: string };
	sidebar: { theme: string; size: string; user: boolean };
	rightSidebar: boolean;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
	const urlSearchParams = new URLSearchParams(window.location.search)
	const params = Object.fromEntries(urlSearchParams.entries())

	const [settings, setSettings] = useState({
		layout: {
			type:
				params['layout_type'] == 'horizontal'
					? ThemeSettings.layout.type.horizontal
					: ThemeSettings.layout.type.vertical,
			mode:
				params['layout_mode'] == 'boxed'
					? ThemeSettings.layout.mode.boxed
					: ThemeSettings.layout.mode.fluid,
			menuPosition: ThemeSettings.layout.menuPosition.fixed,
		},
		theme:
			params['layout_theme'] == 'dark'
				? ThemeSettings.theme.dark
				: ThemeSettings.theme.light,
		topbar: {
			theme:
				params['topbar_theme'] == 'dark'
					? ThemeSettings.topbar.theme.dark
					: ThemeSettings.topbar.theme.light,
			logo: ThemeSettings.topbar.logo.show,
		},
		sidebar: {
			theme:
				params['menu_theme'] == 'light'
					? ThemeSettings.sidebar.theme.light
					: ThemeSettings.sidebar.theme.dark,
			size: ThemeSettings.sidebar.size.default,
			user: ThemeSettings.sidebar.user.hidden,
		},
		rightSidebar: ThemeSettings.rightSidebar.hidden,
	})

	const updateSettings = useCallback(
		(newSettings: Partial<Settings>) => {
			setSettings((prev: Settings) => ({
				...prev,
				...newSettings
			}))
		},
		[setSettings]
	)

	const updateLayout = useCallback(
		(newLayout: any) => {
			setSettings((prev: Settings) => ({
				...prev,
				layout: { ...prev.layout, ...(newLayout ?? {}) },
				theme: prev.theme,
				topbar: prev.topbar,
				sidebar: prev.sidebar,
				rightSidebar: prev.rightSidebar
			}))
		},
		[setSettings]
	)

	const updateTopbar = useCallback(
		(newTopbar: any) => {
			setSettings((prev: Settings) => ({
				...prev,
				layout: prev.layout,
				theme: prev.theme,
				topbar: { ...prev.topbar, ...(newTopbar ?? {}) },
				sidebar: prev.sidebar,
				rightSidebar: prev.rightSidebar
			}))
		},
		[setSettings]
	)

	const updateSidebar = useCallback(
		(newSidebar: any) => {
			setSettings((prev: Settings) => ({
				...prev,
				layout: prev.layout,
				theme: prev.theme,
				topbar: prev.topbar,
				sidebar: { ...prev.sidebar, ...(newSidebar ?? {}) },
				rightSidebar: prev.rightSidebar
			}))
		},
		[setSettings]
	)

	return (
		<ThemeContext.Provider
			value={{
				settings,
				updateSettings,
				updateLayout,
				updateTopbar,
				updateSidebar,
			}}
		>
			{children}
		</ThemeContext.Provider>
	)
}
