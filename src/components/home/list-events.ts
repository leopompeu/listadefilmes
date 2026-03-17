import { ListItem, UserList } from "@/components/home/types";

export const LISTS_UPDATED_EVENT = "home:lists-updated";

export type ListsUpdatedPayload = {
  items: ListItem[];
  lists: UserList[];
  activeListId: string;
};
