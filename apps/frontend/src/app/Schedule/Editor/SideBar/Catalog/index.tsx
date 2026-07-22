import { ReactNode, useState } from "react";

import { Xmark } from "iconoir-react";

import { Dialog, IconButton } from "@repo/theme";

import ClassBrowser from "@/components/ClassBrowser";
import useCatalogBrowser from "@/components/ClassBrowser/hooks/useCatalogBrowser";
import { Semester } from "@/lib/generated/graphql";

import styles from "./Catalog.module.scss";

interface CatalogProps {
  onClassSelect: (
    subject: string,
    courseNumber: string,
    number: string,
    sessionId: string
  ) => void;
  children: ReactNode;
  semester: Semester;
  year: number;
}

export default function Catalog({
  onClassSelect,
  children,
  year,
  semester,
}: CatalogProps) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  // Own browser state here so filter/query survive the dialog unmounting.
  const browser = useCatalogBrowser({ year, semester });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setExpanded(false);
  };

  const handleSelect = (
    subject: string,
    courseNumber: string,
    number: string,
    sessionId: string
  ) => {
    onClassSelect(subject, courseNumber, number, sessionId);
    setOpen(false);
    setExpanded(false);
  };

  return (
    <Dialog.Root onOpenChange={handleOpenChange} open={open}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Drawer align="start" className={styles.drawer}>
          <div className={styles.header}>
            Add a course to this schedule
            <Dialog.Close asChild>
              <IconButton>
                <Xmark />
              </IconButton>
            </Dialog.Close>
          </div>
          <div className={styles.body}>
            <ClassBrowser
              semester={semester}
              year={year}
              onSelect={handleSelect}
              forceMode="semi-compact"
              hideTermPicker
              browser={browser}
              expanded={expanded}
              onExpandedChange={setExpanded}
            />
          </div>
        </Dialog.Drawer>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
