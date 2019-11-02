import Tone from 'tone';
import samples from './samples.json';

const getSampler = (samplesByNote, baseUrl = '') =>
  new Promise(resolve => {
    const sampler = new Tone.Sampler(samplesByNote, {
      baseUrl,
      onload: () => resolve(sampler),
    });
  });

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const pcTranspose = (note, semitones) => {
  const currentIndex = NOTES.indexOf(note);
  const naiveIndex = currentIndex + semitones;
  const octaveChange = Math.floor(naiveIndex / 12);
  const realIndex =
    naiveIndex >= 0 ? naiveIndex % 12 : (12 + (naiveIndex % 12)) % 12;
  return [NOTES[realIndex], octaveChange];
};

const transpose = (note, semitones) => {
  const matches = /([A,B,C,D,E,F,G,#]{1,2})(\d*)/.exec(note);
  if (matches !== null) {
    const [_, pc, octaveStr] = matches;
    const [newPc, octaveChange] = pcTranspose(pc, semitones);
    if (octaveStr) {
      return `${newPc}${Number(octaveStr) + octaveChange}`;
    }
    return newPc;
  }
};

window.transpose = transpose;

const isNotEqual = value1 => value2 => value1 !== value2;

function* makeNoteGenerator(octave) {
  let currentNote;

  while (1) {
    const otherNotes = NOTES.filter(isNotEqual(currentNote));
    currentNote = otherNotes[Math.floor(Math.random() * otherNotes.length)];
    yield `${currentNote}${octave}`;
  }
}

const chordGenerator = makeNoteGenerator(4);

getSampler(samples['vsco2-piano-mf'], './samples/vsco2-piano-mf/').then(
  piano => {
    piano.toMaster();
    const splatterNotes = () => {
      const up = Math.random() < 0.5;
      ['C4', 'D#4', 'G4', 'A#4', 'D5']
        .map(note => (up ? transpose(note, 5) : note))
        .forEach(note => {
          console.log(note);
          piano.triggerAttack(note, `+${1 + Math.random() ** 4 * 5}`);
        });

      Tone.Transport.scheduleOnce(() => {
        splatterNotes();
      }, `+${1 + Math.random() * 5 + 10}`);
    };
    splatterNotes();
    Tone.Transport.start();
  }
);
