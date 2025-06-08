import { useCallback, useEffect, useRef } from "react";
import { Howl } from "howler";

import { useDispatch, useSelector, useStore } from "react-redux";
import { RootState } from "../../app/store";
import {
  playPause,
  playTrack,
  updatePlayback,
  updateQueue,
  stopTrack,
  setGapWaiting, // Add this import
} from "./playlistPlaybackSlice";
import { Track } from "./playlistsSlice";

export function usePlaylistPlayback(onError: (message: string) => void) {
  const trackRef = useRef<Howl | null>(null);
  const animationRef = useRef<number | null>(null);
  const gapTimerRef = useRef<number | null>(null); // Add ref for gap timer

  const playlists = useSelector((state: RootState) => state.playlists);
  const store = useStore<RootState>();
  const muted = useSelector((state: RootState) => state.playlistPlayback.muted);
  const repeat = useSelector(
    (state: RootState) => state.playlistPlayback.repeat
  );
  const shuffle = useSelector(
    (state: RootState) => state.playlistPlayback.shuffle
  );
  const queue = useSelector((state: RootState) => state.playlistPlayback.queue);
  const playbackTrack = useSelector(
    (state: RootState) => state.playlistPlayback.track
  );
  const dispatch = useDispatch();

  // Clear any active gap timer
  const clearGapTimer = useCallback(() => {
    if (gapTimerRef.current !== null) {
      window.clearTimeout(gapTimerRef.current);
      gapTimerRef.current = null;
      dispatch(setGapWaiting(false)); // Set waiting state to false when clearing timer
    }
  }, [dispatch]);

  const play = useCallback(
    (track: Track) => {
      // Clear any existing gap timer when manually playing
      clearGapTimer();
      
      let prevTrack = trackRef.current;
      function removePrevTrack() {
        if (prevTrack) {
          prevTrack.unload();
          prevTrack = undefined;
        }
      }
      function error() {
        trackRef.current = undefined;
        dispatch(stopTrack());
        removePrevTrack();
        onError(`Unable to play track: ${track.title}`);
      }

      try {
        const howl = new Howl({
          src: track.url,
          html5: true,
          mute: muted,
          volume: 0,
        });

        trackRef.current = howl;
        howl.once("load", () => {
          dispatch(
            playTrack({
              track,
              duration: Math.floor(howl.duration()),
            })
          );
          // Fade out previous track and fade in new track
          if (prevTrack) {
            prevTrack.fade(prevTrack.volume(), 0, 1000);
            prevTrack.once("fade", removePrevTrack);
          }
          howl.fade(0, store.getState().playlistPlayback.volume, 1000);
          // Update playback
          // Create playback animation
          if (animationRef.current !== null) {
            cancelAnimationFrame(animationRef.current);
          }
          let prevTime = performance.now();
          function animatePlayback(time: number) {
            animationRef.current = requestAnimationFrame(animatePlayback);
            // Limit update to 1 time per second
            const delta = time - prevTime;
            if (howl.playing() && delta > 1000) {
              dispatch(updatePlayback(Math.floor(howl.seek())));
              prevTime = time;
            }
          }
          animationRef.current = requestAnimationFrame(animatePlayback);
        });

        howl.on("loaderror", error);

        howl.on("playerror", error);

        const sound = (howl as any)._sounds[0];
        if (!sound) {
          error();
        }
      } catch {
        error();
      }
    },
    [onError, muted, store, dispatch, clearGapTimer]
  );

  // Function to handle playing the next track with the gap
  const playNextTrackWithGap = useCallback((id: string, index: number) => {
    // Get the current gap setting from the store
    const currentGap = store.getState().playlistPlayback.gap;
    
    // If no gap, play immediately
    if (currentGap <= 0) {
      const nextTrack = playlists.tracks[id];
      if (nextTrack) {
        play(nextTrack);
        dispatch(updateQueue(index));
      }
      return;
    }
    
    // Clear any existing timer
    clearGapTimer();
    
    // Set waiting state to true
    dispatch(setGapWaiting(true));
    
    // Set a timer for the specified gap
    gapTimerRef.current = window.setTimeout(() => {
      dispatch(setGapWaiting(false)); // Clear waiting state when gap ends
      const nextTrack = playlists.tracks[id];
      if (nextTrack) {
        play(nextTrack);
        dispatch(updateQueue(index));
      }
      gapTimerRef.current = null;
    }, currentGap * 1000);
  }, [play, playlists, dispatch, store, clearGapTimer]);

  const seek = useCallback((to: number) => {
    // Clear any gap timer when seeking
    clearGapTimer();
    
    dispatch(updatePlayback(to));
    trackRef.current?.seek(to);
  }, [dispatch, clearGapTimer]);

  const stop = useCallback(() => {
    // Clear any gap timer when stopping
    clearGapTimer();
    
    dispatch(playPause(false));
    dispatch(updatePlayback(0));
    trackRef.current?.stop();
  }, [dispatch, clearGapTimer]);

  const next = useCallback(() => {
    // Clear any existing gap timer
    clearGapTimer();
    
    if (!trackRef.current) {
      return;
    }
    if (!queue) {
      stop();
    } else if (repeat === "track") {
      seek(0);
    } else {
      let index = queue.current + 1;

      if (index >= queue.tracks.length) {
        // Repeat off just stop the playback
        if (repeat === "off") {
          stop();
          return;
        }
        index = 0;
      }

      let id: string;
      if (shuffle) {
        id = queue.tracks[queue.shuffled[index]];
      } else {
        id = queue.tracks[index];
      }
      if (id) {
        if (id === playbackTrack?.id) {
          // Playing the same track just restart it
          seek(0);
        } else {
          // Play the next track with gap
          playNextTrackWithGap(id, index);
        }
      }
    }
  }, [repeat, queue, shuffle, playbackTrack, seek, stop, playNextTrackWithGap, clearGapTimer]);

  const previous = useCallback(() => {
    // Clear any gap timer when going to previous
    clearGapTimer();
    
    if (!trackRef.current) {
      return;
    }
    if (!queue) {
      stop();
    } else if (repeat === "track") {
      seek(0);
    } else {
      let index = queue.current;
      // Only go to previous if at the start of the track
      if (trackRef.current.seek() < 5) {
        index -= 1;
      }
      if (index < 0) {
        // Start of playlist with repeat off just stop the track
        if (repeat === "off") {
          stop();
          return;
        }
        index = queue.tracks.length - 1;
      }
      let id: string;
      if (shuffle) {
        id = queue.tracks[queue.shuffled[index]];
      } else {
        id = queue.tracks[index];
      }
      if (id) {
        if (id === playbackTrack?.id) {
          // Playing the same track just restart it
          seek(0);
        } else {
          // For previous, always play immediately (no gap)
          const previousTrack = playlists.tracks[id];
          if (previousTrack) {
            play(previousTrack);
            dispatch(updateQueue(index));
          }
        }
      }
    }
  }, [repeat, queue, shuffle, playbackTrack, playlists, seek, play, stop, dispatch, clearGapTimer]);

  useEffect(() => {
    const track = trackRef.current;
    // Move to next song or repeat this song on track end
    function handleEnd() {
      if (!queue) {
        stop();
      } else if (repeat === "track") {
        seek(0);
        track?.play();
      } else {
        let index = queue.current + 1;
        if (index >= queue.tracks.length) {
          // Repeat off just stop the playback
          if (repeat === "off") {
            stop();
            return;
          }
          index = 0;
        }
        let id: string;
        if (shuffle) {
          id = queue.tracks[queue.shuffled[index]];
        } else {
          id = queue.tracks[index];
        }
        if (id) {
          if (id === playbackTrack?.id) {
            // Playing the same track just restart it
            seek(0);
            track?.play();
          } else {
            // This is where automatic playback happens - apply the gap here
            playNextTrackWithGap(id, index);
          }
        }
      }
    }
    track?.on("end", handleEnd);
    return () => {
      track?.off("end", handleEnd);
    };
  }, [repeat, queue, shuffle, playbackTrack, playlists, play, seek, stop, playNextTrackWithGap]);

  const pauseResume = useCallback((resume: boolean) => {
    // Clear any gap timer when manually pausing/resuming
    clearGapTimer();
    
    if (trackRef.current) {
      if (resume) {
        trackRef.current.play();
      } else {
        trackRef.current.pause();
      }
    }
  }, [clearGapTimer]);

  const mute = useCallback((muted: boolean) => {
    if (trackRef.current) {
      trackRef.current.mute(muted);
    }
  }, []);

  const volume = useCallback((volume: number) => {
    if (trackRef.current) {
      trackRef.current.volume(volume);
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearGapTimer();
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [clearGapTimer]);

  return {
    seek,
    play,
    next,
    previous,
    stop,
    pauseResume,
    mute,
    volume,
  };
}
