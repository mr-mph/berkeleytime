import { gql } from "@apollo/client";

export const GET_DORM_ROOM_LAYOUT = gql`
  query GetDormRoomLayout($roomId: DormRoomId!) {
    dormRoomLayout(roomId: $roomId)
  }
`;

export const SAVE_DORM_ROOM_LAYOUT = gql`
  mutation SaveDormRoomLayout($roomId: DormRoomId!, $layout: String) {
    saveDormRoomLayout(roomId: $roomId, layout: $layout)
  }
`;
