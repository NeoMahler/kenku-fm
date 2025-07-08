import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../app/store";
import { startQueue, playPause, playTrack } from "../playlists/playlistPlaybackSlice";
import { Track } from "../playlists/playlistsSlice";

type MidiListenerProps = {
  onPlay: (track: Track) => void;
};

export function MidiListener({onPlay}: MidiListenerProps): JSX.Element | null {
  const dispatch = useDispatch();
  const [midiAccess, setMidiAccess] = useState<MIDIAccess | null>(null);
  
  const playlists = useSelector((state: RootState) => state.playlists);
  const playlistsById = useSelector((state: RootState) => state.playlists.playlists.byId);
  const shuffle = useSelector((state: RootState) => state.playlistPlayback.shuffle);
  
  // Initialize MIDI access
  useEffect(() => {
    if (navigator.requestMIDIAccess) {
      console.log('Global MIDI listener: Requesting MIDI access...');
      navigator.requestMIDIAccess({ sysex: false })
        .then(access => {
          console.log('Global MIDI listener: MIDI access granted!');
          setMidiAccess(access);
          
          // Log available inputs
          const inputs = Array.from((access.inputs as Map<string, MIDIInput>).values());
          console.log('Global MIDI listener: Available inputs:', inputs.map(i => i.name || i.id));
        })
        .catch(err => {
          console.error('Global MIDI listener: MIDI access denied:', err);
        });
    } else {
      console.warn('Global MIDI listener: WebMIDI not supported in this browser');
    }
  }, []);

  // Set up global MIDI listeners
  useEffect(() => {
    if (!midiAccess) return;

    const handleMidiMessage = (event: MIDIMessageEvent) => {
      // We're looking for noteOn messages (type 144-159)
      if (event.data[0] >= 144 && event.data[0] <= 159 && event.data[2] > 0) {
        const channel = event.data[0] - 144;
        const note = event.data[1];
        const velocity = event.data[2];

        console.log('Global MIDI: Note On detected:', { note, channel, velocity });

        // Find a playlist that matches this MIDI note
        const matchingPlaylistId = Object.keys(playlistsById).find(playlistId => {
          const playlist = playlistsById[playlistId];
          return playlist.midiNote && 
                 playlist.midiNote.note === note && 
                 playlist.midiNote.channel === channel;
        });

        if (matchingPlaylistId) {
          const playlist = playlistsById[matchingPlaylistId];
          console.log('Global MIDI: Found matching playlist:', playlist.title);

          // Always start the playlist (same logic as PlaylistItem but without the current playlist check)
          let tracks = [...playlist.tracks];
          const trackIndex = shuffle
            ? Math.floor(Math.random() * tracks.length)
            : 0;
          const trackId = tracks[trackIndex];
          const track = playlists.tracks[trackId];
          if (track) {
            dispatch(startQueue({ tracks, trackId, playlistId: playlist.id }));
            onPlay(track)
          }
        } else {
          console.log('Global MIDI: No playlist matched this MIDI note and channel');
        }
      }
    };

    // Set up MIDI message handlers on all inputs
    midiAccess.inputs.forEach(input => {
      input.addEventListener('midimessage', handleMidiMessage);
    });

    // Cleanup function
    return () => {
      midiAccess.inputs.forEach(input => {
        input.removeEventListener('midimessage', handleMidiMessage);
      });
    };
  }, [midiAccess, playlistsById, playlists, dispatch, shuffle]);

  return (
    <div 
      style={{ 
        position: 'fixed', 
        bottom: 5, 
        right: 5, 
        fontSize: '10px', 
        color: '#666',
        userSelect: 'none',
        pointerEvents: 'none',
        zIndex: 9999
      }}
    >
      🎹 {midiAccess ? 'MIDI Ready' : 'MIDI Loading...'}
    </div>
  );
}