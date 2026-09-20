import { Monitor, Moon, Sun } from 'lucide-react'
import { Dropdown } from '@/components/ui/Dropdown'
import { Button } from '@/components/ui/Button'
import { useThemeStore } from '@/store/themeStore'

const ICONS = { light: Sun, dark: Moon, system: Monitor }

/** Theme switcher for the topbar and the public site header. */
export function ThemeToggle({ className }) {
  const theme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)
  const Icon = ICONS[theme] ?? Monitor

  return (
    <Dropdown
      align="end"
      trigger={
        <Button variant="ghost" size="icon-sm" className={className} aria-label="Change theme">
          <Icon className="size-4" />
        </Button>
      }
      items={[
        { heading: 'Theme' },
        { label: 'Light', icon: Sun, onSelect: () => setTheme('light') },
        { label: 'Dark', icon: Moon, onSelect: () => setTheme('dark') },
        { label: 'System', icon: Monitor, onSelect: () => setTheme('system') },
      ]}
    />
  )
}
