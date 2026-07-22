import { useCallback, useEffect, useRef, useState } from "react";

import { useMutation, useQuery } from "@apollo/client/react";
import { Navigate, useParams } from "react-router-dom";

import { LoadingIndicator } from "@repo/theme";

import useUser from "@/hooks/useUser";
import {
  DormRoomId,
  GetDormRoomLayoutDocument,
  SaveDormRoomLayoutDocument,
} from "@/lib/generated/graphql";

import type { DormRoomHandle, DormRoomOptions } from "../rooms/main";
import styles from "./RoomViewer.module.scss";

type RoomFactory = (options: DormRoomOptions) => DormRoomHandle;

const ROOMS: Record<string, () => Promise<RoomFactory>> = {
  blackwell: () =>
    import("../rooms/main.js").then((m) => m.createBlackwellRoom),
  "unit-triple": () =>
    import("../rooms/unit-triple/main.js").then((m) => m.createUnitTripleRoom),
  "unit-double": () =>
    import("../rooms/unit-double/main.js").then((m) => m.createUnitDoubleRoom),
};

const PERSISTED_ROOM_IDS: Record<string, DormRoomId> = {
  blackwell: DormRoomId.Blackwell,
  "unit-triple": DormRoomId.UnitTriple,
  "unit-double": DormRoomId.UnitDouble,
};

export default function RoomViewer() {
  const { roomId } = useParams();
  const { user, loading: userLoading } = useUser();
  const hostRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load =
    roomId && Object.hasOwn(ROOMS, roomId) ? ROOMS[roomId] : undefined;
  const persistedRoomId = roomId ? PERSISTED_ROOM_IDS[roomId] : undefined;
  const shouldReadLayout = Boolean(user && persistedRoomId);
  const {
    data: layoutData,
    loading: layoutLoading,
    error: layoutError,
  } = useQuery(GetDormRoomLayoutDocument, {
    variables: { roomId: persistedRoomId ?? DormRoomId.Blackwell },
    skip: userLoading || !shouldReadLayout,
    fetchPolicy: "network-only",
  });
  const [saveDormRoomLayout] = useMutation(SaveDormRoomLayoutDocument);
  const persistenceLoading = userLoading || (shouldReadLayout && layoutLoading);

  const persistLayout = useCallback(
    (layout: string | null) => {
      if (!user || !persistedRoomId) return;
      void saveDormRoomLayout({
        variables: { roomId: persistedRoomId, layout },
      }).catch((mutationError: unknown) => {
        console.error("Failed to save room layout", mutationError);
      });
    },
    [persistedRoomId, saveDormRoomLayout, user]
  );

  useEffect(() => {
    const host = hostRef.current;
    if (!load || !host || persistenceLoading) return;

    if (layoutError) {
      console.error("Failed to load saved room layout", layoutError);
    }

    let handle: DormRoomHandle | null = null;
    let cancelled = false;
    setLoading(true);
    setError(null);

    load()
      .then((createRoom) => {
        if (cancelled) return;
        handle = createRoom({
          container: host,
          initialLayout: layoutData?.dormRoomLayout ?? null,
          onLayoutChange: persistLayout,
        });
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
  }, [layoutData, layoutError, load, persistLayout, persistenceLoading]);

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
