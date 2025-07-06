import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

import { v4 as uuid } from "uuid";

import { useDispatch } from "react-redux";
import { addPlaylist } from "./playlistsSlice";

import { backgrounds } from "../../backgrounds";
import { ImageSelector } from "../../common/ImageSelector";
import { MIDISetupBtn } from "../../common/MIDISetupBtn";

type PlaylistAddProps = {
  open: boolean;
  onClose: () => void;
};

export function PlaylistAdd({ open, onClose }: PlaylistAddProps) {
  const dispatch = useDispatch();

  const [title, setTitle] = useState("");
  const [background, setBackground] = useState(Object.keys(backgrounds)[0]);
  const [midiNote, setMidiNote] = useState<{
    note: number;
    channel: number;
    velocity: number;
  } | null>(null);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setMidiNote(null);
    }
  }, [open]);

  function handleTitleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setTitle(event.target.value);
  }

  function handleMIDIReceived(receivedMidiData: {
    note: number;
    channel: number;
    velocity: number;
  }) {
    console.log("MIDI note received for new playlist:", receivedMidiData);
    setMidiNote(receivedMidiData);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const id = uuid();
    dispatch(addPlaylist({ 
      id, 
      title, 
      background, 
      tracks: [],
      midiNote: midiNote || undefined
    }));
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add Playlist</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Name"
            fullWidth
            variant="standard"
            autoComplete="off"
            InputLabelProps={{
              shrink: true,
            }}
            value={title}
            onChange={handleTitleChange}
          />
          <ImageSelector value={background} onChange={setBackground} />
          
          {/* MIDI Setup Section */}
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              MIDI Control (Optional)
            </Typography>
            <MIDISetupBtn
              onMIDIReceived={handleMIDIReceived}
              disabled={false}
            />
            
            {/* Display MIDI Data if set */}
            {midiNote && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  MIDI Note Assigned:
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  Note: {midiNote.note}
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  Channel: {midiNote.channel + 1}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button disabled={!title || !background} type="submit">
            Add
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
