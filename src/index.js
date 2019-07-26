import Tone from 'tone';
import { Note, Distance, Interval } from 'tonal';
import samples from './samples.json';

const findClosest = (samplesByNote, note) => {
  const noteMidi = Note.midi(note);
  const maxInterval = 96;
  let interval = 0;
  while (interval <= maxInterval) {
    const higherNote = Note.fromMidi(noteMidi + interval);
    if (samplesByNote[higherNote]) {
      return higherNote;
    }
    const lowerNote = Note.fromMidi(noteMidi - interval);
    if (samplesByNote[lowerNote]) {
      return lowerNote;
    }
    interval += 1;
  }
  return note;
};

const getBuffers = (samplesByNote, baseUrl = '') =>
  new Promise(resolve => {
    const buffers = new Tone.Buffers(samplesByNote, {
      onload: () => resolve(buffers),
      baseUrl,
    });
  });

const ragaBhairavi = [
  [1, 2],
  [-2, 2],
  [0, 2],
  [1, 2],
  [3, 2],
  [5, 4],
  [7, 2],
  [3, 2],
  [5, 2],
  [8, 2],
  [10, 2],
  [12, 4],
  [10, 2],
  [8, 2],
  [7, 2],
  [5, 2],
  [7, 2],
  [3, 2],
  [5, 2],
  [3, 2],
  [1, 2],
  [0, 4],
];

const ragaBhairav = [
  [0, 2],
  [4, 2],
  [5, 2],
  [7, 2],
  [4, 2],
  [5, 2],
  [8, 4],
  [11, 2],
  [12, 4],
  [8, 2],
  [11, 2],
  [8, 2],
  [7, 2],
  [5, 2],
  [7, 2],
  [4, 2],
  [1, 2],
  [0, 4],
];

function* makeRagaGenerator(raga) {
  function getNewPhrase() {
    const phrase = [];
    let noteIdx = Math.floor(Math.random() * (raga.length - 4));
    const remainingNoteCount = raga.length - noteIdx;
    const maxPhraseLength = Math.ceil(Math.random() * remainingNoteCount);
    const divisor = Math.random() * 1.25 + 0.25;
    console.log('new phrase');
    for (
      let count = 0;
      phrase.length < maxPhraseLength &&
      noteIdx < raga.length &&
      count < 100 &&
      (phrase.length > 1 || Math.random() < 0.95);
      count += 1, Math.random() < 0.7 ? (noteIdx += 1) : (noteIdx += 2)
    ) {
      const [interval, time] = raga[noteIdx];

      const multiplier =
        phrase.length === maxPhraseLength - 1 || noteIdx === raga.length - 1
          ? 4
          : 1;

      phrase.push([interval, (time / divisor) * multiplier]);
    }
    return phrase;
  }

  let phrase;

  while (true) {
    if (
      typeof phrase !== 'undefined' &&
      phrase.length > 1 &&
      Math.random() < 0.5
    ) {
      console.log('same phrase again');
    } else {
      phrase = getNewPhrase();
    }
    for (const note of phrase) {
      yield note;
    }
  }
}

const getSampler = (samplesByNote, baseUrl, opts = {}) =>
  new Promise(resolve => {
    const sampler = new Tone.Sampler(
      samplesByNote,
      Object.assign(opts, {
        baseUrl,
        onload: () => resolve(sampler),
      })
    );
  });

const pianoSamples = samples['vsco2-piano-mf'];

Promise.all([
  getSampler(pianoSamples, './samples/vsco2-piano-mf/'),
  getSampler(
    samples['vsco2-cellos-susvib-mp'],
    './samples/vsco2-cellos-susvib-mp/',
    { attack: 2, curve: 'linear', release: 2 }
  ),
  new Tone.Reverb(15)
    .set({ wet: 0.6 })
    .toMaster()
    .generate(),
]).then(([pianoSampler, cellos, reverb]) => {
  pianoSampler.connect(reverb);

  let tonic = Math.random() < 0.5 ? 'C#4' : 'C#5';

  const playNote = (note, time = 0, velocity = 1) =>
    pianoSampler.triggerAttack(note, `+${1 + time}`, velocity);

  const ragaGenerator = makeRagaGenerator(ragaBhairav);

  const celloFilter = new Tone.AutoFilter(
    Math.random() / 100 + 0.01,
    50,
    3
  ).connect(reverb);
  celloFilter.start();
  cellos.connect(celloFilter);

  const celloDrone = note => {
    cellos.triggerAttack(note, '+1');
    Tone.Transport.scheduleOnce(() => {
      celloDrone(note);
    }, `+${Math.random() * 10 + 5}`);
  };

  ['C#2', 'C#1', 'G#1', 'G#2'].forEach(note => {
    Tone.Transport.scheduleOnce(() => {
      celloDrone(note);
    }, `+${Math.random() * 5}`);
  });

  const playNextNote = () => {
    const { value } = ragaGenerator.next();
    const [interval, time] = value;
    const note = Distance.transpose(tonic, Interval.fromSemitones(interval));
    playNote(note);
    if (Math.random() < (interval === 0 || interval === 12 ? 0.5 : 0.1)) {
      const lowNote =
        Math.random() < 0.5
          ? 'C#3'
          : Distance.transpose(note, Interval.fromSemitones(-12));
      playNote(lowNote);
    }
    Tone.Transport.scheduleOnce(() => {
      if (time > 8 && Math.random() < 0.4) {
        console.log('CHANGING TONIC');
        tonic = tonic === 'C#4' ? 'C#5' : 'C#4';
      }
      playNextNote();
    }, `+${time + Math.random() - 0.5}`);
  };

  Tone.Transport.scheduleOnce(() => {
    playNextNote();
  }, `+${Math.random() * 2 + 2}`);
  Tone.Transport.start();
});
