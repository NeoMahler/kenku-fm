import React from "react";
import { useNavigate } from "react-router-dom";

import styled from "@mui/material/styles/styled";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import LinearProgress from "@mui/material/LinearProgress";
import Chip from "@mui/material/Chip";

import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../app/store";
import { stopSound } from "../soundboards/soundboardPlaybackSlice";

const SoundProgress = styled(LinearProgress)({
  height: 32,
  borderRadius: 16,
  position: "absolute",
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  "& .MuiLinearProgress-bar": {
    transition: "transform 1s linear",
  },
});

// Use a styled version of Chip to add hover effects
const ClickableChip = styled(Chip)(({ theme }) => ({
  cursor: "pointer",
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
  },
}));

type SoundboardPlayerProps = {
  onSoundboardStop: (id: string) => void;
};

export function SoundboardPlayer({ onSoundboardStop }: SoundboardPlayerProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const soundboardPlayback = useSelector(
    (state: RootState) => state.soundboardPlayback
  );

  const soundboards = useSelector((state: RootState) => state.soundboards);

  function handleSoundboardStop(id: string) {
    dispatch(stopSound(id));
    onSoundboardStop(id);
  }

  function handleChipClick(sound: any) {
    // Look up the soundboard for this sound using the sound's ID
    // We need to find which soundboard this sound belongs to
    for (const boardId of Object.keys(soundboards.soundboards.byId)) {
      const soundboard = soundboards.soundboards.byId[boardId];
      if (soundboard.sounds.includes(sound.id)) {
        navigate(`/soundboards/${boardId}`);
        return;
      }
    }
  }

  const sounds = Object.values(soundboardPlayback.playback);

  if (sounds.length === 0) {
    return null;
  }

  return (
    <Stack direction="row" gap={1} pb={1} overflow="auto">
      {sounds.map((sound) => {
        return (
          <Box sx={{ position: "relative" }} key={sound.id}>
            <SoundProgress
              variant="determinate"
              value={Math.min((sound.progress / sound.duration) * 100, 100)}
            />
            <ClickableChip
              label={sound.title}
              onClick={() => handleChipClick(sound)}
              onDelete={() => handleSoundboardStop(sound.id)}
              sx={{
                position: "relative",
                zIndex: 1,
              }}
            />
          </Box>
        );
      })}
    </Stack>
  );
}
