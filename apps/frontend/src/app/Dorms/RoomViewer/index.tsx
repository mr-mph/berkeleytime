import { useCallback, useEffect, useRef, useState } from "react";

import { Navigate, useParams } from "react-router-dom";

import { LoadingIndicator } from "@repo/theme";

import useUser from "@/hooks/useUser";
import { DormRoomId } from "@/lib/generated/graphql";

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

type PendingLayout = { layout: string | null; savedAt: number };

const pendingLayoutKey = (userId: string, roomId: DormRoomId) =>
  `dorm-room-layout-pending:${userId}:${roomId}`;

const saveChains = new Map<string, Promise<void>>();

const saveLayoutRequest = async (
  roomId: DormRoomId,
  layout: string | null
) => {
  const response = await fetch("/api/graphql", {
    method: "POST",
    credentials: "include",
    keepalive: true,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      query:
        "mutation SaveDormRoomLayout($roomId: DormRoomId!, $layout: String) { saveDormRoomLayout(roomId: $roomId, layout: $layout) }",
      variables: { roomId, layout },
    }),
  });
  if (!response.ok) throw new Error("Room layout save failed");

  const result = (await response.json()) as {
    data?: { saveDormRoomLayout?: string | null };
    errors?: unknown[];
  };
  if (
    result.errors?.length ||
    result.data?.saveDormRoomLayout !== layout
  ) {
    throw new Error("Room layout save failed");
  }
};

const readPendingLayout = (
  userId: string,
  roomId: DormRoomId
): PendingLayout | undefined => {
  const key = pendingLayoutKey(userId, roomId);

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return undefined;

    const pending = JSON.parse(raw) as Partial<PendingLayout>;
    if (
      (pending.layout === null ||
        (typeof pending.layout === "string" &&
          pending.layout.length <= 32_768)) &&
      typeof pending.savedAt === "number"
    ) {
      return { layout: pending.layout, savedAt: pending.savedAt };
    }

    localStorage.removeItem(key);
  } catch {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore unavailable browser storage and fall back to the server value.
    }
  }

  return undefined;
};

export default function RoomViewer() {
  const { roomId } = useParams();
  const { user, loading: userLoading } = useUser();
  const userId = user?._id;
  const hostRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadedLayout, setLoadedLayout] = useState<{
    key: string;
    layout: string | null;
  } | null>(null);
  const [layoutError, setLayoutError] = useState<{
    key: string;
    error: unknown;
  } | null>(null);

  const load =
    roomId && Object.hasOwn(ROOMS, roomId) ? ROOMS[roomId] : undefined;
  const persistedRoomId = roomId ? PERSISTED_ROOM_IDS[roomId] : undefined;
  const shouldReadLayout = Boolean(userId && persistedRoomId);
  const layoutKey =
    userId && persistedRoomId ? `${userId}:${persistedRoomId}` : null;
  const persistenceLoading =
    userLoading ||
    (shouldReadLayout &&
      loadedLayout?.key !== layoutKey &&
      layoutError?.key !== layoutKey);
  const initialLayoutRef = useRef<string | null>(null);

  useEffect(() => {
    if (!layoutKey || !persistedRoomId) return;

    let cancelled = false;
    setLayoutError(null);

    void fetch("/api/graphql", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        query:
          "query GetDormRoomLayoutV3($roomId: DormRoomId!) { dormRoomLayout(roomId: $roomId) }",
        variables: { roomId: persistedRoomId },
      }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Room layout request failed");
        const result = (await response.json()) as {
          data?: { dormRoomLayout?: string | null };
          errors?: unknown[];
        };
        if (result.errors?.length) throw new Error("Room layout request failed");
        return result.data?.dormRoomLayout ?? null;
      })
      .then((layout) => {
        if (!cancelled) {
          setLoadedLayout({
            key: layoutKey,
            layout,
          });
        }
      })
      .catch((queryError: unknown) => {
        if (!cancelled) setLayoutError({ key: layoutKey, error: queryError });
      });

    return () => {
      cancelled = true;
    };
  }, [layoutKey, persistedRoomId]);

  // The saved value initializes a room once. Later cache updates come from that
  // live room and must not tear down and recreate its entire Three.js scene.
  useEffect(() => {
    if (!persistenceLoading) {
      const pending =
        userId && persistedRoomId
          ? readPendingLayout(userId, persistedRoomId)
          : undefined;
      initialLayoutRef.current = pending
        ? pending.layout
        : (loadedLayout?.layout ?? null);
    }
  }, [loadedLayout, persistedRoomId, persistenceLoading, userId]);

  useEffect(() => {
    if (layoutError) {
      console.error("Failed to load saved room layout", layoutError.error);
    }
  }, [layoutError]);

  const persistLayout = useCallback(
    (layout: string | null) => {
      if (!userId || !persistedRoomId) return;
      const key = pendingLayoutKey(userId, persistedRoomId);
      const pending = JSON.stringify({
        layout,
        savedAt: Date.now(),
      } satisfies PendingLayout);

      try {
        localStorage.setItem(key, pending);
      } catch (storageError: unknown) {
        console.error("Failed to stage room layout", storageError);
      }

      const previousSave = saveChains.get(key) ?? Promise.resolve();
      const currentSave = previousSave
        .catch(() => undefined)
        .then(() => saveLayoutRequest(persistedRoomId, layout))
        .then(() => {
          try {
            if (localStorage.getItem(key) === pending) {
              localStorage.removeItem(key);
            }
          } catch {
            // A storage failure does not invalidate the completed server save.
          }
        });

      saveChains.set(key, currentSave);
      void currentSave
        .catch((saveError: unknown) => {
          console.error("Failed to save room layout", saveError);
        })
        .finally(() => {
          if (saveChains.get(key) === currentSave) saveChains.delete(key);
        });
    },
    [persistedRoomId, userId]
  );

  // If a reload interrupted the network request, restore the staged layout and
  // retry it before accepting an older server response as the current room.
  useEffect(() => {
    if (persistenceLoading || !userId || !persistedRoomId) return;
    const pending = readPendingLayout(userId, persistedRoomId);
    if (pending) persistLayout(pending.layout);
  }, [persistLayout, persistedRoomId, persistenceLoading, userId]);

  useEffect(() => {
    const host = hostRef.current;
    if (!load || !host || persistenceLoading) return;

    let handle: DormRoomHandle | null = null;
    let cancelled = false;
    setLoading(true);
    setError(null);

    load()
      .then((createRoom) => {
        if (cancelled) return;
        handle = createRoom({
          container: host,
          initialLayout: initialLayoutRef.current,
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
  }, [load, persistLayout, persistenceLoading]);

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
