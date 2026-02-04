export type Profile = {
  id: string;

  username: string | null;
  display_name: string | null;
  avatar_url: string | null;

  bio: string | null;
  instruments: string[];

  preferences: Record<string, unknown>;
  push_enabled: boolean;

  is_public: boolean;

  created_at: string;
  updated_at: string;
};

export type ProfileDraft = {
  username: string;
  bio: string;
  instruments: string[];
  preferences: Record<string, unknown>;
  push_enabled: boolean;
  is_public: boolean;
};
