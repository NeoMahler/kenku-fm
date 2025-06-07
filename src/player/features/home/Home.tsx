import React, { useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/AddCircleRounded";
import Stack from "@mui/material/Stack";
import Link from "@mui/material/Link";
import Tooltip from "@mui/material/Tooltip";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";

import { useSelector } from "react-redux";
import { RootState } from "../../app/store";
import { PlaylistItem } from "../playlists/PlaylistItem";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import {
  useNavigate,
  Link as RouterLink,
  LinkProps as RouterLinkProps,
} from "react-router-dom";
import { SoundboardItem } from "../soundboards/SoundboardItem";
import { Track } from "../playlists/playlistsSlice";
import { Sound } from "../soundboards/soundboardsSlice";
import { PlaylistAdd } from "../playlists/PlaylistAdd";
import { SoundboardAdd } from "../soundboards/SoundboardAdd";

const PlaylistsLink = React.forwardRef<
  HTMLAnchorElement,
  Omit<RouterLinkProps, "to">
>((props, ref) => <RouterLink ref={ref} to="/playlists" {...props} />);

const SoundboardsLink = React.forwardRef<
  HTMLAnchorElement,
  Omit<RouterLinkProps, "to">
>((props, ref) => <RouterLink ref={ref} to="/soundboards" {...props} />);

type HomeProps = {
  onPlayTrack: (track: Track) => void;
  onPlaySound: (sound: Sound) => void;
};

export function Home({ onPlayTrack, onPlaySound }: HomeProps) {
  const navigate = useNavigate();
  const playlists = useSelector((state: RootState) => state.playlists);
  const soundboards = useSelector((state: RootState) => state.soundboards);

  const [playlistAddOpen, setPlaylistAddOpen] = useState(false);
  const [soundboardAddOpen, setSoundboardAddOpen] = useState(false);
  const [playlistSearchTerm, setPlaylistSearchTerm] = useState("");
  const [soundboardSearchTerm, setSoundboardSearchTerm] = useState("");

  const allPlaylistItems = playlists.playlists.allIds
    .map((id) => playlists.playlists.byId[id]);
  
  const playlistItems = allPlaylistItems.filter(playlist => 
    playlist.title.toLowerCase().includes(playlistSearchTerm.toLowerCase())
  );
  
  const allSoundboardItems = soundboards.soundboards.allIds
    .map((id) => soundboards.soundboards.byId[id]);
  
  const soundboardItems = allSoundboardItems.filter(soundboard => 
    soundboard.title.toLowerCase().includes(soundboardSearchTerm.toLowerCase())
  );

  const handlePlaylistSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPlaylistSearchTerm(event.target.value);
  };

  const handleSoundboardSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSoundboardSearchTerm(event.target.value);
  };

  return (
    <Container
      maxWidth="md"
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        mt: 4,
        mb: "248px",
      }}
    >
      <Card>
        <CardContent>
          <Stack
            gap={1}
            justifyContent="space-between"
            alignItems="center"
            direction="row"
          >
            <Typography variant="h5" component="div">
              Playlists
            </Typography>
            <Tooltip title="Add Playlist">
              <IconButton onClick={() => setPlaylistAddOpen(true)}>
                <AddIcon />
              </IconButton>
            </Tooltip>
            <Box sx={{ flexGrow: 1 }} />
            <TextField
              placeholder="Search playlists"
              variant="outlined"
              size="small"
              value={playlistSearchTerm}
              onChange={handlePlaylistSearch}
              sx={{ width: '200px' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        </CardContent>
        <CardContent>
          <Grid container spacing={2}>
            {playlistItems.length > 0 ? (
              playlistItems.map((playlist) => (
                <Grid xs={6} sm={4} md={3} item key={playlist.id}>
                  <PlaylistItem
                    playlist={playlist}
                    onSelect={(id) => navigate(`/playlists/${id}`)}
                    onPlay={onPlayTrack}
                  />
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Typography align="center" color="text.secondary">
                  No playlists found matching "{playlistSearchTerm}"
                </Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Stack
            gap={1}
            justifyContent="space-between"
            alignItems="center"
            direction="row"
          >
            <Typography variant="h5" component="div">
              Soundboards
            </Typography>
            <Tooltip title="Add Soundboard">
              <IconButton onClick={() => setSoundboardAddOpen(true)}>
                <AddIcon />
              </IconButton>
            </Tooltip>
            <Box sx={{ flexGrow: 1 }} />
            <TextField
              placeholder="Search soundboards"
              variant="outlined"
              size="small"
              value={soundboardSearchTerm}
              onChange={handleSoundboardSearch}
              sx={{ width: '200px' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        </CardContent>
        <CardContent>
          <Grid container spacing={2}>
            {soundboardItems.length > 0 ? (
              soundboardItems.map((soundboard) => (
                <Grid xs={6} sm={4} md={3} item key={soundboard.id}>
                  <SoundboardItem
                    soundboard={soundboard}
                    onSelect={(id) => navigate(`/soundboards/${id}`)}
                    onPlay={onPlaySound}
                  />
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Typography align="center" color="text.secondary">
                  No soundboards found matching "{soundboardSearchTerm}"
                </Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
      <PlaylistAdd
        open={playlistAddOpen}
        onClose={() => setPlaylistAddOpen(false)}
      />
      <SoundboardAdd
        open={soundboardAddOpen}
        onClose={() => setSoundboardAddOpen(false)}
      />
    </Container>
  );
}
