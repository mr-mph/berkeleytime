export interface DormRoomOptions {
  container: HTMLElement;
}

export interface DormRoomHandle {
  dispose(): void;
}

export function createBlackwellRoom(options: DormRoomOptions): DormRoomHandle;
