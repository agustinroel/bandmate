export type SetlistId = string;

export type SetlistItem = {
  songId: string;
  title?: string;
  artist?: string;
  durationSec?: number;
};

export type Setlist = {
  id: SetlistId;
  name: string;
  notes?: string;
  items: SetlistItem[];
  createdAt: string;
  updatedAt: string;
};

export type CreateSetlistDto = {
  name: string;
  notes?: string;
};

export type UpdateSetlistDto = {
  name?: string;
  notes?: string;
};

export type AddSetlistItemDto = {
  songId: string;
};

export type ReorderSetlistDto = {
  songIds: string[];
};
