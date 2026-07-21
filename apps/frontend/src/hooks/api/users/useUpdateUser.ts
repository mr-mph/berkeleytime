import { useCallback } from "react";

import { useMutation } from "@apollo/client/react";

import { GetUserDocument } from "@/lib/generated/graphql";
import {
  UpdateUserDocument,
  UpdateUserMutation,
  UpdateUserMutationVariables,
} from "@/lib/generated/graphql";

export const useUpdateUser = () => {
  const mutation = useMutation<UpdateUserMutation, UpdateUserMutationVariables>(
    UpdateUserDocument,
    {
      update(cache, { data }) {
        if (!data?.updateUser) return;

        cache.writeQuery({
          query: GetUserDocument,
          data: { user: data.updateUser },
        });
      },
    }
  );

  const updateUser = useCallback(
    async (
      user: UpdateUserMutationVariables["user"],
      options?: Omit<
        useMutation.Options<UpdateUserMutation, UpdateUserMutationVariables>,
        "variables"
      >
    ) => {
      const mutate = mutation[0];

      return await mutate({
        ...options,
        variables: { user },
      });
    },
    [mutation]
  );

  return [updateUser, mutation[1]] as [
    mutate: typeof updateUser,
    result: (typeof mutation)[1],
  ];
};
