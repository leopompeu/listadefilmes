export type AppUser = {
  id: string;
  username: string;
  photo_url: string | null;
};

export type Movie = {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  director?: string | null;
};

export type ListItem = {
  list_id: string;
  movie_id: number;
  title: string;
  poster_path: string | null;
  release_date: string | null;
  vote_average: number | null;
  added_at: string;
};

export type UserList = {
  id: string;
  name: string;
};

export type OtherUser = {
  username: string;
  photo_url: string | null;
};

export type Genre = {
  id: number;
  name: string;
};

export type FilterState = {
  sortBy: string;
  genreId: string;
  year: string;
  minVote: string;
  includeAdult: boolean;
};

export type ListSort = "added_desc" | "added_asc" | "year_desc" | "year_asc" | "rating_desc";
