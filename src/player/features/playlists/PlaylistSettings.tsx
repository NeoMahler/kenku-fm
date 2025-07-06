import React, { useState } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

import { useDispatch } from "react-redux";
import { editPlaylist, Playlist, setPlaylistMidiNote, clearPlaylistMidiNote } from "./playlistsSlice";
import { ImageSelector } from "../../common/ImageSelector";
import { MIDISetupBtn } from "../../common/MIDISetupBtn";

type PlaylistSettingsProps = {
  playlist: Playlist;
  open: boolean;
  onClose: () => void;
};

export function PlaylistSettings({
  playlist,
  open,
  onClose,
}: PlaylistSettingsProps) {
  const dispatch = useDispatch();
  const [midiData, setMidiData] = useState<{
    note: number;
    channel: number;
    velocity: number;
  } | null>(playlist.midiNote || null);

  function handleTitleChange(event: React.ChangeEvent<HTMLInputElement>) {
    dispatch(editPlaylist({ id: playlist.id, title: event.target.value }));
  }

  function handleBackgroundChange(background: string) {
    dispatch(editPlaylist({ id: playlist.id, background }));
  }

  function handleMIDIReceived(receivedMidiData: {
    note: number;
    channel: number;
    velocity: number;
  }) {
    console.log("MIDI note received:", receivedMidiData);
    setMidiData(receivedMidiData);
    
    // Save MIDI note to playlist immediately
    dispatch(setPlaylistMidiNote({
      id: playlist.id,
      midiNote: receivedMidiData
    }));
  }

  function handleClearMIDI() {
    setMidiData(null);
    dispatch(clearPlaylistMidiNote({ id: playlist.id }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onClose();
  }

  // Format MIDI note for display
  const formatMidiNote = (midiNote: { note: number; channel: number; velocity: number }) => {
    const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const octave = Math.floor(midiNote.note / 12) - 1;
    const noteName = noteNames[midiNote.note % 12];
    return `${noteName}${octave}`;
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Edit Playlist</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            margin="dense"
            id="name"
            label="Name"
            fullWidth
            variant="standard"
            autoComplete="off"
            InputLabelProps={{
              shrink: true,
            }}
            value={playlist.title}
            onChange={handleTitleChange}
          />
          <ImageSelector
            value={playlist.background}
            onChange={handleBackgroundChange}
          />
          
          {/* MIDI Setup Section */}
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              MIDI Control
            </Typography>
            <MIDISetupBtn
              onMIDIReceived={handleMIDIReceived}
              disabled={false}
            />
            
            {/* Display Current MIDI Assignment */}
            {midiData && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Assigned MIDI Note:
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  Note: {midiData.note} ({formatMidiNote(midiData)})
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  Channel: {midiData.channel + 1}
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  Velocity: {midiData.velocity}
                </Typography>
                <Button 
                  size="small" 
                  color="secondary" 
                  onClick={handleClearMIDI}
                  sx={{ mt: 1 }}
                >
                  Clear MIDI Assignment
                </Button>
              </Box>
            )}
            
            {/* Show message if no MIDI assigned */}
            {!midiData && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                No MIDI note assigned to this playlist.
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button type="submit">Done</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}