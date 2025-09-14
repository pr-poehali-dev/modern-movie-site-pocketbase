import PocketBase from 'pocketbase';

export const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090');

// TypeScript interfaces based on PocketBase schema
export interface User {
  id: string;
  username: string;
  slug: string;
  bio?: string;
  meta_title?: string;
  meta_description?: string;
  avatar?: string;
  email: string;
  emailVisibility: boolean;
  verified: boolean;
  created: string;
  updated: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  meta_title?: string;
  meta_description?: string;
}

export interface Genre {
  id: string;
  title: string;
  slug: string;
  icon?: string;
}

export interface Video {
  id: string;
  title: string;
  type: 'movie' | 'serias';
  slug: string;
  description?: string;
  thumbnail?: string;
  videoFile?: string;
  videoSourceUrl?: string;
  createdBy?: string;
  year?: number;
  genre?: string[];
  country?: string;
  created: string;
  updated: string;
  expand?: {
    genre?: Genre[];
    createdBy?: User;
  };
}

export interface Episode {
  id: string;
  video: string;
  season: number;
  episodeNumber: number;
  title: string;
  thumbnail?: string;
  videoFile?: string;
  videoSourceUrl?: string;
  createdBy?: string;
  created: string;
  updated: string;
  expand?: {
    video?: Video;
    createdBy?: User;
  };
}

export interface Comment {
  id: string;
  content: string;
  video: string;
  createdBy: string;
  created: string;
  updated: string;
  expand?: {
    video?: Video;
    createdBy?: User;
  };
}

export interface Rating {
  id: string;
  video: string;
  rating: number;
  createdBy: string;
  created: string;
  updated: string;
  expand?: {
    video?: Video;
    createdBy?: User;
  };
}

export interface Favorite {
  id: string;
  video: string;
  user: string;
  created: string;
  updated: string;
  expand?: {
    video?: Video;
    user?: User;
  };
}

export interface WatchHistory {
  id: string;
  video: string;
  user: string;
  progress: number;
  created: string;
  updated: string;
  expand?: {
    video?: Video;
    user?: User;
  };
}

export interface Playlist {
  id: string;
  title: string;
  videos?: string[];
  createdBy: string;
  created: string;
  updated: string;
  expand?: {
    videos?: Video[];
    createdBy?: User;
  };
}

export interface Profile {
  id: string;
  rel_user?: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  roles: string[];
  expand?: {
    rel_user?: User;
  };
}

export interface View {
  id: string;
  video?: string;
  episodes?: string;
  user?: string;
  session?: string;
  created: string;
  updated: string;
  expand?: {
    video?: Video;
    episodes?: Episode;
    user?: User;
  };
}

// Auth helpers
export const authStore = {
  isValid: () => pb.authStore.isValid,
  model: () => pb.authStore.model as User | null,
  token: () => pb.authStore.token,
  clear: () => pb.authStore.clear(),
  onChange: (callback: (token: string, model: User | null) => void) => {
    return pb.authStore.onChange(callback);
  }
};

// Collection helpers
export const collections = {
  users: () => pb.collection('users'),
  categories: () => pb.collection('categories'),
  genres: () => pb.collection('genres'),
  videos: () => pb.collection('videos'),
  episodes: () => pb.collection('episodes'),
  comments: () => pb.collection('comments'),
  ratings: () => pb.collection('ratings'),
  favorites: () => pb.collection('favorites'),
  watchHistory: () => pb.collection('watch_history'),
  playlists: () => pb.collection('playlists'),
  profiles: () => pb.collection('profiles'),
  views: () => pb.collection('views'),
};

export default pb;