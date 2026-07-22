export interface DormRoomOptions {
  container: HTMLElement;
  initialLayout?: string | null;
  onLayoutChange?: (layout: string | null) => void;
}

export interface DormRoomHandle {
  dispose(): void;
}

export function createBlackwellRoom(options: DormRoomOptions): DormRoomHandle;
