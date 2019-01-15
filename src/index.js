import Tone from 'tone';
import { Scale, Note } from 'tonal';
import samples from './samples.json';

const pianoPromise = new Promise(resolve => {
  const piano = new Tone.Sampler(samples['vsco2-piano-mf'], {
    onload: () => resolve(piano),
  }).toMaster();
});

const tonic = Note.names()[Math.floor(Math.random() * Note.names().length)];
const scalePitchClasses = Scale.notes(tonic, 'major');
const notes = [3, 4, 5, 6, 7].reduce(
  (allNotes, octave) =>
    allNotes.concat(scalePitchClasses.map(pc => `${pc}${octave}`)),
  []
);

const getProgression = () => {
  const startingIndex = Math.floor(Math.random() * notes.length);
  const progression = [[notes[startingIndex]]];
  const gap = Math.floor(Math.random() * 5);
  for (let i = 2; i === 2 || i <= Math.random() * 5; i += 1) {
    const chord = [];
    if (i % 2 === 0) {
      for (let j = 1; j <= i; j += 2) {
        chord.push(startingIndex - j, startingIndex + j);
      }
    } else {
      chord.push(startingIndex);
      for (let j = 2; j <= i; j += 2) {
        chord.push(startingIndex - j, startingIndex + j);
      }
    }
    progression.push(
      chord
        .filter(index => index >= 0 && index < notes.length)
        .map(index => notes[index])
    );
  }
  return progression;
};

pianoPromise.then(piano => {
  setInterval(() => {
    const progression = getProgression();
    const perNoteDelay = Math.random() * 4 + 1;
    progression.forEach((chord, i) => {
      chord.forEach(note => piano.triggerAttack(note, `+${i * perNoteDelay}`));
    });
  }, 10000);
});
