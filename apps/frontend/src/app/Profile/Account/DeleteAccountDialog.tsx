import { VisuallyHidden } from "@radix-ui/themes";
import classNames from "classnames";
import { WarningTriangleSolid } from "iconoir-react";

import { Button, Dialog } from "@repo/theme";

import styles from "./DeleteAccountDialog.module.scss";

interface DeleteAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteAccountDialog({
  isOpen,
  onClose,
}: DeleteAccountDialogProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Card>
          <VisuallyHidden>
            <Dialog.Title>Delete Account</Dialog.Title>
            <Dialog.Description>
              This will permanently delete your account and all associated data.
            </Dialog.Description>
          </VisuallyHidden>
          <Dialog.Body className={styles.body}>
            <WarningTriangleSolid
              className={classNames(styles.icon, styles.iconWarning)}
            />
            <div className={styles.title}>Delete Account?</div>
            <div className={styles.message}>
              This will permanently delete your account and all associated data,
              including your saved collections, schedules, and ratings. This
              action cannot be undone.
            </div>
          </Dialog.Body>
          <Dialog.Footer>
            <Button
              onClick={onClose}
              variant="tertiary"
              style={{ color: "var(--paragraph-color)" }}
            >
              Cancel
            </Button>
            {/* everyone shares this account, so deletion stays off the table */}
            <Button disabled isDelete={true}>
              Nice try
            </Button>
          </Dialog.Footer>
        </Dialog.Card>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
