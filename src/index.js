import Tone from 'tone';
import { Note } from 'tonal';
import * as Range from 'tonal-range';
import samples from './samples.json';

const MAX_STEP_DISTANCE = 3;
const MAX_PHRASE_LENGTH = 3;
const PHRASE_P_BASE = 0.5;

const delay = new Tone.FeedbackDelay({
  feedback: 0.3,
  wet: 0.5,
  delayTime: 10,
}).toMaster();

const reverb = new Tone.Freeverb({ roomSize: 0.6 }).connect(delay);

const cMajorRange = Range.scale(['C', 'D', 'E', 'F', 'G', 'A', 'B']);

const getNextNotesForNote = (notes, note) => {
  const index = notes.findIndex(n => n === note);
  const lowestIndex = Math.max(0, index - MAX_STEP_DISTANCE);
  return notes
    .slice(lowestIndex, index)
    .concat(notes.slice(index + 1, index + MAX_STEP_DISTANCE + 1));
};

const generatePhrase = (
  notes,
  phrase = [notes[Math.floor(Math.random() * notes.length)]]
) => {
  if (
    phrase.length < MAX_PHRASE_LENGTH &&
    Math.random() < PHRASE_P_BASE ** phrase.length
  ) {
    const lastNote = phrase[phrase.length - 1];
    const possibleNextNotes = getNextNotesForNote(notes, lastNote);
    return generatePhrase(
      notes,
      phrase.concat([
        possibleNextNotes[Math.floor(Math.random() * possibleNextNotes.length)],
      ])
    );
  }
  return phrase;
};

const getSampledInstrument = instrumentName =>
  new Promise(resolve => {
    const instrument = new Tone.Sampler(samples[instrumentName], {
      onload: () => resolve(instrument),
    });
  });

const getPossibleNotesForInstrument = (
  instrumentName,
  octaves = [0, 1, 2, 3, 4, 5, 6, 7, 8]
) => {
  const sampledNotes = Object.keys(samples[instrumentName]);
  const lowestNote = sampledNotes.reduce(
    (currentLowest, note) =>
      Note.freq(note) < Note.freq(currentLowest) ? note : currentLowest,
    Infinity
  );
  const highestNote = sampledNotes.reduce(
    (currentHighest, note) =>
      Note.freq(note) > Note.freq(currentHighest) ? note : currentHighest,
    -Infinity
  );

  return cMajorRange([lowestNote, highestNote]).filter(note =>
    octaves.includes(Note.oct(note))
  );
};

const instrumentConfigs = {
  'vsco2-piano-mf': {
    isSingleNote: false,
    secondsBetweenNotes: 2,
    notes: getPossibleNotesForInstrument('vsco2-piano-mf', [2, 3, 4, 5, 6]),
  },
  'vsco2-contrabass-susvib': {
    isSingleNote: true,
    notes: getPossibleNotesForInstrument('vsco2-contrabass-susvib'),
  },
  'vsco2-violin-arcvib': {
    isSingleNote: false,
    secondsBetweenNotes: 8,
    notes: getPossibleNotesForInstrument('vsco2-violin-arcvib'),
  },
};

const makeInstrumentComponent = instrumentName => {
  const start = instrument => {
    instrument.connect(reverb);
    const { isSingleNote, secondsBetweenNotes, notes } = instrumentConfigs[
      instrumentName
    ];
    const playPhrase = () => {
      const phrase = generatePhrase(notes);
      if (isSingleNote) {
        instrument.triggerAttack(phrase[0], `+0.1`);
      } else {
        phrase.forEach((note, i) => {
          instrument.triggerAttack(note, `+${i * secondsBetweenNotes + 0.1}`);
        });
      }
    };

    playPhrase();
    setInterval(() => {
      playPhrase();
    }, Math.random() * 10000 + 10000);
  };
  getSampledInstrument(instrumentName).then(instrument => start(instrument));
};

Reflect.ownKeys(instrumentConfigs).forEach(instrumentName => {
  makeInstrumentComponent(instrumentName);
});
