import Tone from 'tone';
import { Note, Distance } from 'tonal';
import samples from './samples.json';

Tone.context.latencyHint = 'playback';

const tonicPitchClasses = Note.names().slice(0, 5);
const tonicPitchClass =
  tonicPitchClasses[Math.floor(Math.random() * tonicPitchClasses.length)];

const pitchClassesOverOctaves = (pitchClasses, octaves) =>
  pitchClasses.reduce(
    (notes, pitchClass) =>
      notes.concat(octaves.map(octave => `${pitchClass}${octave}`)),
    []
  );

const LOWER_OCTAVES = [1, 2];
const HIGHER_OCTAVES = [3, 4];
const lowPitchClasses = [
  tonicPitchClass,
  Distance.transpose(tonicPitchClass, 'P5'),
];
const highPitchClasses = lowPitchClasses.concat(
  ['M2', 'P4'].map(interval => Distance.transpose(tonicPitchClass, interval))
);
const lows = pitchClassesOverOctaves(lowPitchClasses, LOWER_OCTAVES);
const highs = pitchClassesOverOctaves(highPitchClasses, HIGHER_OCTAVES);

const delay = new Tone.FeedbackDelay({
  wet: 0.5,
  delayTime: 20,
  feedback: 0.8,
}).toMaster();
const glock = new Tone.Sampler(samples['kasper-singing-bowls']).connect(delay);

Tone.Master.volume.value = -10;

const makeNotes = notes => () => {
  glock.triggerAttack(notes[Math.floor(Math.random() * notes.length)]);
  if (Math.random() > 0.3) {
    glock.triggerAttack(
      notes[Math.floor(Math.random() * notes.length)],
      `+${Math.random() * 15 + 1}`
    );
  }
};

const lowNotes = makeNotes(lows);
const highNotes = makeNotes(highs);

setTimeout(() => {
  lowNotes();
  setInterval(() => {
    lowNotes();
  }, Math.random() * 5000 + 45000);
}, 2000 + Math.random() * 5000);

setTimeout(() => {
  highNotes();
  setInterval(() => {
    highNotes();
  }, Math.random() * 5000 + 75000);
}, 5000 + Math.random() * 5000);

window.navigator.requestMIDIAccess().then(access => {
  console.log(access);
  const inputs = Array.from(access.inputs);
  const device = inputs[1][1];
  console.log(device);
  device.onmidimessage = ({ data }) => {
    console.log(data);
    const [command, key, value] = data;
    if (command === 144) {
      glock.triggerAttack(Tone.Midi(key).toFrequency(), '+0.1');
      console.log(Tone.Midi(key).toNote());
    } else if (command === 176) {
      if (key === 1) {
        delay.delayTime.value = (value / 127) * 20;
      } else if (key === 2) {
        delay.feedback.value = value / 127;
      } else if (key === 5) {
        lowpass.frequency.value = (value / 127) * 9000 + 1000;
      }
    }
  };
});
