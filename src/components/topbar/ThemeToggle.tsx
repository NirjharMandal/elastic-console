/** Light/dark segmented toggle (prototype: renderThemeToggle). */

import { Segmented } from "../common/Segmented";
import { useUiStore } from "../../stores/useUiStore";
import type { ThemeName } from "../../theme/tokens";

export function ThemeToggle() {
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);

  return (
    <Segmented<ThemeName>
      value={theme}
      onChange={setTheme}
      bg="var(--elev)"
      radius={8}
      padding="5px 10px"
      fontSize={11.5}
      options={[
        { value: "light", label: <><span style={{ fontSize: 11 }}>☀</span>Light</> },
        { value: "dark", label: <><span style={{ fontSize: 11 }}>☾</span>Dark</> },
      ]}
    />
  );
}
