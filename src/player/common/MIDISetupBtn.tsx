import React, { useState, useEffect } from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import MusicNoteIcon from "@mui/icons-material/MusicNote";

type MIDISetupBtnProps = {
  onMIDIReceived?: (midiData: { note: number; channel: number; velocity: number }) => void;
  disabled?: boolean;
};

export function MIDISetupBtn({ onMIDIReceived, disabled = false }: MIDISetupBtnProps) {
  const [isListening, setIsListening] = useState(false);
  const [midiAccess, setMidiAccess] = useState<MIDIAccess | null>(null);

  // Initialize MIDI access
  useEffect(() => {
    if (navigator.requestMIDIAccess) {
      console.log('Requesting MIDI access...');
      navigator.requestMIDIAccess({ sysex: false })
        .then(access => {
          console.log('MIDI access granted!');
          setMidiAccess(access);
          
          // Log available inputs
          const inputs: MIDIInput[] = [];
          access.inputs.forEach(input => inputs.push(input));
          console.log('Available MIDI inputs:', inputs.map(i => i.name || i.id));
        })
        .catch(err => {
          console.error('MIDI access denied:', err);
        });
    } else {
      console.warn('WebMIDI not supported in this browser');
    }
  }, []);

  useEffect(() => {
    if (!isListening || !midiAccess) return;

    const handleMidiMessage = (event: MIDIMessageEvent) => {
      console.log('MIDI message received:', {
        data: Array.from(event.data),
        timestamp: event.timeStamp
      });

      // Check if this is a Note On message (status byte 144-159) with velocity > 0
      if (event.data[0] >= 144 && event.data[0] <= 159 && event.data[2] > 0) {
        const channel = event.data[0] - 144;
        const note = event.data[1];
        const velocity = event.data[2];

        console.log('Note On detected:', { note, channel, velocity });

        // Stop listening after receiving the first note
        setIsListening(false);

        // Call the callback if provided
        if (onMIDIReceived) {
          onMIDIReceived({ note, channel, velocity });
        }
      } else {
        // Log other types of messages for debugging
        console.log('Non-Note-On message:', {
          status: event.data[0],
          data1: event.data[1],
          data2: event.data[2]
        });
      }
    };

    // Set up MIDI message handlers
    console.log('Setting up MIDI listeners for button');
    
    midiAccess.inputs.forEach(input => {
      console.log(`Adding listener to: ${input.name || input.id}`);
      input.addEventListener('midimessage', handleMidiMessage);
    });

    // Cleanup function
    return () => {
      console.log('Cleaning up MIDI listeners for button');
      midiAccess.inputs.forEach(input => {
        input.removeEventListener('midimessage', handleMidiMessage);
      });
    };
  }, [isListening, midiAccess, onMIDIReceived]);

  const handleClick = () => {
    console.log('MIDI Setup button clicked');
    if (!midiAccess) {
      console.warn('MIDI access not available');
      return;
    }
    setIsListening(true);
  };

  const handleCancel = () => {
    console.log('MIDI Setup cancelled');
    setIsListening(false);
  };

  return (
    <Button
      variant="outlined"
      color={isListening ? "secondary" : "primary"}
      onClick={isListening ? handleCancel : handleClick}
      disabled={disabled || !midiAccess}
      startIcon={isListening ? <CircularProgress size={16} /> : <MusicNoteIcon />}
      sx={{
        minWidth: 140,
        transition: "all 0.2s ease",
        "&:hover": {
          transform: isListening ? "none" : "scale(1.02)",
        },
      }}
    >
      {isListening ? "Press a MIDI key" : "MIDI set-up"}
    </Button>
  );
}