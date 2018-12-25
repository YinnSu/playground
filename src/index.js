import { Scale } from 'tonal';

const OCTAVES = [3, 4, 5, 6];
const MAX_STEP_DISTANCE = 2;
const pitchClasses = Scale.notes('C', 'major');

const notes = OCTAVES.reduce(
  (allNotes, octave) =>
    allNotes.concat(pitchClasses.map(pc => `${pc}${octave}`)),
  []
);

const getNextNotesForNote = note => {
  const index = notes.findIndex(n => n === note);
  const lowestIndex = Math.max(0, index - MAX_STEP_DISTANCE);
  return notes
    .slice(lowestIndex, index)
    .concat(notes.slice(index + 1, index + MAX_STEP_DISTANCE + 1));
};

const generatePhrase = (
  phrase = [notes[Math.floor(Math.random() * notes.length)]]
) => {
  if (Math.random() < 0.6 - 0.1 * phrase.length) {
    const lastNote = phrase[phrase.length - 1];
    const possibleNextNotes = getNextNotesForNote(lastNote);
    return generatePhrase(
      phrase.concat([
        possibleNextNotes[Math.floor(Math.random() * possibleNextNotes.length)],
      ])
    );
  }
  return phrase;
};

setInterval(() => {
  console.log(generatePhrase());
}, 2000);
