import { useEffect, useRef, useState } from "react";

import { Navigate, useParams } from "react-router-dom";

import { LoadingIndicator } from "@repo/theme";

import type { DormRoomHandle, DormRoomOptions } from "../rooms/main";
import styles from "./RoomViewer.module.scss";

type RoomFactory = (options: DormRoomOptions) => DormRoomHandle;

const ROOMS: Record<string, () => Promise<RoomFactory>> = {
  blackwell: () => import("../rooms/main.js").then((m) => m.createBlackwellRoom),
  "unit-triple": () =>
    import("../rooms/unit-triple/main.js").then((m) => m.createUnitTripleRoom),
  "unit-double": () =>
    import("../rooms/unit-double/main.js").then((m) => m.createUnitDoubleRoom),
};

export default function RoomViewer() {
  const { roomId } = useParams();
  const hostRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load =
    roomId && Object.hasOwn(ROOMS, roomId) ? ROOMS[roomId] : undefined;

  useEffect(() => {
    const host = hostRef.current;
    if (!load || !host) return;

    let handle: DormRoomHandle | null = null;
    let cancelled = false;
    setLoading(true);
    setError(null);

    load()
      .then((createRoom) => {
        if (cancelled) return;
        handle = createRoom({ container: host });
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        console.error("Failed to load room", e);
        setError("This room failed to load. Please try again.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
      handle?.dispose();
      handle = null;
    };
  }, [load]);

  if (!load) return <Navigate to="/dorms" replace />;

  return (
    <div className={styles.root}>
      <div ref={hostRef} className={styles.host} />
      {loading && (
        <div className={styles.status}>
          <LoadingIndicator size="lg" />
        </div>
      )}
      {error && (
        <div className={`${styles.status} ${styles.error}`} role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
