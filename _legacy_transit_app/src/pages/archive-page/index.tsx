import type { ComponentProps } from "react";
import { ArchiveCalendar } from "../../widgets/archive-calendar";

export type ArchivePageProps = ComponentProps<typeof ArchiveCalendar>;

export function ArchivePage(props: ArchivePageProps) {
  return <ArchiveCalendar {...props} />;
}
