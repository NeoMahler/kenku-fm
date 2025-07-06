import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Track {
  id: string;
  url: string;
  title: string;
}

export interface Playlist {
  tracks: string[];
  background: string;
  title: string;
  id: string;
  midiNote?: { note: number; channel: number; velocity: number }; // Add MIDI note support
}

export interface PlaylistsState {
  playlists: {
    byId: Record<string, Playlist>;
    allIds: string[];
  };
  tracks: Record<string, Track>;
}

const initialState: PlaylistsState = {
  playlists: {
    byId: {},
    allIds: [],
  },
  tracks: {},
};

export const playlistsSlice = createSlice({
  name: "playlists",
  initialState,
  reducers: {
    addPlaylist: (state, action: PayloadAction<Playlist>) => {
      state.playlists.byId[action.payload.id] = action.payload;
      state.playlists.allIds.push(action.payload.id);
    },
    removePlaylist: (state, action: PayloadAction<string>) => {
      for (let track of state.playlists.byId[action.payload].tracks) {
        delete state.tracks[track];
      }
      delete state.playlists.byId[action.payload];
      state.playlists.allIds = state.playlists.allIds.filter(
        (id) => id !== action.payload
      );
    },
    editPlaylist: (
      state,
      action: PayloadAction<{
        id: string;
        title?: string;
        background?: string;
        midiNote?: { note: number; channel: number; velocity: number } | null;
      }>
    ) => {
      const { id, ...changes } = action.payload;
      const playlist = state.playlists.byId[id];

      if (playlist) {
        // If midiNote is explicitly null, remove the property
        if (changes.midiNote === null) {
          const { midiNote, ...rest } = playlist;
          state.playlists.byId[id] = { ...rest, ...changes };
        } else {
          state.playlists.byId[id] = { ...playlist, ...changes };
        }
      }
    },
    addTrack: (
      state,
      action: PayloadAction<{ track: Track; playlistId: string }>
    ) => {
      const { track, playlistId } = action.payload;
      state.playlists.byId[playlistId].tracks.unshift(track.id);
      state.tracks[track.id] = track;
    },
    addTracks: (
      state,
      action: PayloadAction<{ tracks: Track[]; playlistId: string }>
    ) => {
      const { tracks, playlistId } = action.payload;
      state.playlists.byId[playlistId].tracks.unshift(
        ...tracks.map((track) => track.id)
      );
      for (let track of tracks) {
        state.tracks[track.id] = track;
      }
    },
    removeTrack: (
      state,
      action: PayloadAction<{ trackId: string; playlistId: string }>
    ) => {
      const { trackId, playlistId } = action.payload;
      state.playlists.byId[playlistId].tracks = state.playlists.byId[
        playlistId
      ].tracks.filter((id) => id !== trackId);
      delete state.tracks[trackId];
    },
    editTrack: (state, action: PayloadAction<Partial<Track>>) => {
      if (!action.payload.id) {
        throw Error("Id needed in editTrack payload");
      }
      state.tracks[action.payload.id] = {
        ...state.tracks[action.payload.id],
        ...action.payload,
      };
    },
    movePlaylist: (
      state,
      action: PayloadAction<{ active: string; over: string }>
    ) => {
      const oldIndex = state.playlists.allIds.indexOf(action.payload.active);
      const newIndex = state.playlists.allIds.indexOf(action.payload.over);
      state.playlists.allIds.splice(oldIndex, 1);
      state.playlists.allIds.splice(newIndex, 0, action.payload.active);
    },
    moveTrack: (
      state,
      action: PayloadAction<{
        playlistId: string;
        active: string;
        over: string;
      }>
    ) => {
      const playlist = state.playlists.byId[action.payload.playlistId];
      const oldIndex = playlist.tracks.indexOf(action.payload.active);
      const newIndex = playlist.tracks.indexOf(action.payload.over);
      playlist.tracks.splice(oldIndex, 1);
      playlist.tracks.splice(newIndex, 0, action.payload.active);
    },
    // Add a specific action for setting MIDI note
    setPlaylistMidiNote: (
      state,
      action: PayloadAction<{
        id: string;
        midiNote: { note: number; channel: number; velocity: number };
      }>
    ) => {
      const { id, midiNote } = action.payload;
      const playlist = state.playlists.byId[id];

      if (playlist) {
        state.playlists.byId[id] = { ...playlist, midiNote };
      }
    },
    // Add action to clear MIDI note
    clearPlaylistMidiNote: (
      state,
      action: PayloadAction<{ id: string }>
    ) => {
      const { id } = action.payload;
      const playlist = state.playlists.byId[id];

      if (playlist) {
        const { midiNote, ...rest } = playlist;
        state.playlists.byId[id] = rest;
      }
    },
  },
});

export const {
  addPlaylist,
  removePlaylist,
  editPlaylist,
  movePlaylist,
  addTrack,
  addTracks,
  removeTrack,
  editTrack,
  moveTrack,
  setPlaylistMidiNote,
  clearPlaylistMidiNote,
} = playlistsSlice.actions;

export default playlistsSlice.reducer;
