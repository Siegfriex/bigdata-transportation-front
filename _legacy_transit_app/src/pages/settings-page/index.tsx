import type { ComponentProps } from "react";
import { SettingsForm } from "../../widgets/settings-form";

export type SettingsPageProps = ComponentProps<typeof SettingsForm>;

export function SettingsPage(props: SettingsPageProps) {
  return <SettingsForm {...props} />;
}
