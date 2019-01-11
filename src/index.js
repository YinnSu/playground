import Tone from 'tone';
import { Note } from 'tonal';
import samples from './samples.json';

Tone.context.latencyHint = 'playback';

const OCTAVES = [2, 3, 4];
const notes = OCTAVES.reduce(
  (allNotes, octave) =>
    allNotes.concat(Note.names().map(pitchClass => `${pitchClass}${octave}`)),
  []
);

const getInstrument = () =>
  new Promise(resolve => {
    const instrument = new Tone.Sampler(samples.otherness, {
      onload: () => resolve(instrument),
      attack: 1,
    });
  });

const sineSynth = new Tone.MonoSynth({
  oscillator: { type: 'sine' },
  envelope: {
    attack: 3,
    release: 10,
  },
}).toMaster();

sineSynth.volume.value = -35;

const playNote = (instrument, lastNoteMidi) => {
  const newNotes = notes.filter(n => Note.midi(n) !== lastNoteMidi);
  const note = newNotes[Math.floor(Math.random() * newNotes.length)];
  instrument.triggerAttack(note, '+0.5');
  const pitchClass = Note.pc(note);
  sineSynth.triggerAttackRelease(`${pitchClass}1`, 5, '+0.5');
  setTimeout(() => {
    playNote(instrument, Note.midi(note));
  }, Math.random() * 10000 + 10000);
};

getInstrument().then(instrument => {
  instrument.toMaster();
  instrument.volume.value = -15;
  playNote(instrument);
});
