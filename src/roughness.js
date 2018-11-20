import Tone from 'tone';
import { Chord, Note, Scale } from 'tonal';
import shuffle from 'shuffle-array';

const TONIC = 'C4';

const allChords = Chord.names();

const getMinMax = (...args) => [Math.min(...args), Math.max(...args)];

// http://www.acousticslab.org/learnmoresra/moremodel.html
const getRoughness = (note1, note2) => {
  const f1 = Note.freq(note1);
  const f2 = Note.freq(note2);
  const [fMin, fMax] = getMinMax(f1, f2);
  const a1 = 1;
  const a2 = 1;
  const [aMin, aMax] = getMinMax(a1, a2);
  const X = aMin * aMax;
  const Y = (2 * aMin) / (aMin + aMax);
  const b1 = 3.5;
  const b2 = 5.75;
  const s1 = 0.0207;
  const s2 = 18.96;
  const s = 0.24 / (s1 * fMin + s2);
  const Z =
    Math.E ** (-b1 * s * (fMax - fMin)) - Math.E ** (-b2 * s * (fMax - fMin));
  return X ** 0.1 * 0.5 * Y ** 3.11 * Z;
};

const allPairs = arr =>
  arr.reduce(
    (pairs, element, i) =>
      pairs.concat(
        arr.filter((_, j) => i < j).map(friend => [element, friend])
      ),
    []
  );

class SineSynth extends Tone.Synth {
  constructor() {
    super({
      oscillator: { type: 'sine' },
      envelope: { attack: 3, release: 3 },
    });
  }
}

const lowpass = new Tone.Filter(1000, 'lowpass', -48).toMaster();
const synth = new Tone.PolySynth(7, SineSynth).connect(lowpass);
synth.volume.value = -10;

const chordsWithRoughness = allChords
  .map(chordName => {
    const notes = Chord.notes(TONIC, chordName);
    const roughness = allPairs(notes).reduce(
      (sum, pair) => sum + getRoughness(...pair),
      0
    );
    return { roughness, notes };
  })
  .sort((a, b) => {
    if (a.roughness < b.roughness) {
      return -1;
    } else if (a.roughness > b.roughness) {
      return 1;
    }
    return 0;
  });

const avgRoughness =
  chordsWithRoughness.reduce((sum, { roughness }) => sum + roughness, 0) /
  chordsWithRoughness.length;

const leastRough = chordsWithRoughness.filter(
  ({ roughness }) => roughness <= avgRoughness
);

const playChord = () => {
  const [chord] = shuffle(leastRough);
  const { notes } = chord;
  const totalDuration = Math.random() * 10 + 10;
  notes.forEach(note => {
    const t1 = Math.random() * totalDuration;
    const t2 = Math.random() * totalDuration;
    const start = Math.min(t1, t2);
    const end = Math.max(t1, t2);
    const duration = end - start;
    setTimeout(() => {
      synth.triggerAttackRelease(note, duration);
    }, start * 1000);
  });
  setTimeout(() => {
    playChord();
  }, totalDuration * 1000);
};

setTimeout(() => {
  playChord();
}, 1000);
