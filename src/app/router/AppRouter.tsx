import type { ComponentProps } from "react";
import type { TabId } from "../../shared/config";
import { ArchivePage, MapPage, SettingsPage } from "../../pages";

type AppRouterProps = {
  activeTab: TabId;
  mapPageProps: ComponentProps<typeof MapPage>;
  archivePageProps: ComponentProps<typeof ArchivePage>;
  settingsPageProps: ComponentProps<typeof SettingsPage>;
};

export function AppRouter({
  activeTab,
  mapPageProps,
  archivePageProps,
  settingsPageProps,
}: AppRouterProps) {
  if (activeTab === "archive") {
    return <ArchivePage {...archivePageProps} />;
  }

  if (activeTab === "settings") {
    return <SettingsPage {...settingsPageProps} />;
  }

  return <MapPage {...mapPageProps} />;
}
