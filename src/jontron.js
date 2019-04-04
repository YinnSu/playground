import Tone from 'tone';
import { of, from } from 'rxjs';
import { concatMap, delay, repeat, mergeMap } from 'rxjs/operators';
import { Scale, Note } from 'tonal';
import samples from './samples';

const toss = (pcs = [], octaves = []) =>
  octaves.reduce(
    (notes, octave) => notes.concat(pcs.map(pc => `${pc}${octave}`)),
    []
  );

const OCTAVES = [3, 4];
const TONIC = 'C';
const SCALE = 'major';
const PITCH_CLASSES = Scale.notes(TONIC, SCALE);
const NOTES = toss(PITCH_CLASSES, OCTAVES);

const getSampler = instrumentName =>
  new Promise(resolve => {
    const sampler = new Tone.Sampler(samples[instrumentName], {
      baseUrl: `./samples/${instrumentName}/`,
      onload: () => resolve(sampler),
    });
  });

const MAX_STEP_SIZE = 2;

function* makeMelodyGenerator(notes) {
  let lastNoteIndex = Math.floor(Math.random() * notes.length);
  while (true) {
    const step = Math.ceil(Math.random() * MAX_STEP_SIZE);
    if (lastNoteIndex + step >= notes.length) {
      lastNoteIndex = lastNoteIndex - step;
    } else if (lastNoteIndex - step < 0) {
      lastNoteIndex = lastNoteIndex + step;
    } else {
      lastNoteIndex =
        Math.random() < 0.5 ? lastNoteIndex + step : lastNoteIndex - step;
    }

    yield notes[lastNoteIndex];
  }
}

const melodyGenerator = makeMelodyGenerator(NOTES);

const getDelayTimeInMS = () => 500 * Math.ceil(Math.random() * 4);

const octaved = (p, octaveChange) => source =>
  source.pipe(
    mergeMap(
      note =>
        NOTES.includes(note) && Math.random() < p
          ? from([note, `${Note.pc(note)}${Note.oct(note) + octaveChange}`])
          : of(note)
    )
  );

const humanize = () => source =>
  source.pipe(mergeMap(note => of(note).pipe(delay(Math.random() * 100))));

const notes$ = of(null).pipe(
  concatMap(() =>
    of(melodyGenerator.next().value).pipe(delay(getDelayTimeInMS()))
  ),
  repeat(),
  octaved(0.25, -1),
  humanize()
);

Promise.all([
  getSampler('vcsl-dan-tranh-mf'),
  getSampler('vcsl-dan-tranh-vib-mf'),
]).then(([jonTron, jonTronVib]) => {
  notes$.subscribe(note => {
    if (Math.random() < 0.1) {
      jonTronVib.triggerAttack(note);
    } else {
      jonTron.triggerAttack(note);
    }
  });
  jonTron.toMaster();
  jonTronVib.toMaster();
  // NOTES.forEach((note, i) => {
  //   jonTron.triggerAttack(note, i + 1);
  // });
});
