import {
  deleteAccount,
  getDormRoomLayout,
  getUser,
  saveDormRoomLayout,
  updateUser,
} from "./controller";
import { UserModule } from "./generated-types/module-types";

const resolvers: UserModule.Resolvers = {
  Query: {
    user: async (_, __, context) => {
      const user = await getUser(context);

      return user as unknown as UserModule.User;
    },
    dormRoomLayout: async (_, { roomId }, context) => {
      return await getDormRoomLayout(context, roomId);
    },
  },

  Mutation: {
    updateUser: async (_, { user: input }, context) => {
      const user = await updateUser(context, input);

      return user as unknown as UserModule.User;
    },
    saveDormRoomLayout: async (_, { roomId, layout }, context) => {
      return await saveDormRoomLayout(context, roomId, layout);
    },
    deleteAccount: async (_, __, context) => {
      return await deleteAccount(context);
    },
  },
};

export default resolvers;
