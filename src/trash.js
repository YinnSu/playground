import Tone from 'tone';
import { Chord, Key, Distance, Note } from 'tonal';
import samples from './samples.json';

const make = ({ instrumentName, notes }) => {
  const instrument = samples[instrumentName];

  const reverb = new Tone.Freeverb({ roomSize: 0.8, wet: 0.9 });
  const feedback = new Tone.FeedbackDelay({ feedback: 0.5, delayTime: 0.25 });

  Promise.all(
    Reflect.ownKeys(instrument).map(
      note =>
        new Promise(resolve => {
          const buf = new Tone.Buffer(instrument[note], () => resolve(buf));
        })
    )
  ).then(buffers => {
    const reverseConfig = Reflect.ownKeys(instrument).reduce(
      (config, note, i) => {
        config[note] = buffers[i];
        config[note].reverse = true;
        return config;
      },
      {}
    );
    const reverseInstrument = new Tone.Sampler(reverseConfig, {
      release: 2,
      curve: 'linear',
    }).chain(reverb, feedback, Tone.Master);

    reverseInstrument.volume.value = -25;

    const intervals = notes.map(() => Math.random() * 10000 + 10000);
    const minInterval = Math.min(...intervals);
    const randomNote = notes[Math.floor(Math.random() * notes.length)];
    //reverseInstrument.triggerAttack(randomNote, `+1`);
    notes.forEach((note, i) => {
      setTimeout(() => {
        reverseInstrument.triggerAttack(note, '+1');
        setInterval(() => {
          reverseInstrument.triggerAttack(note, '+1');
        }, intervals[i]);
      }, intervals[i] - minInterval);
    });
    // buffers.forEach(buffer => {
    //   setInterval(() => {
    //     const bufferSource = new Tone.BufferSource(buffer).connect(Tone.Master);
    //     bufferSource.playbackRate = 0.5;
    //     bufferSource.start();
    //   }, Math.random() * 10000 + 1000);
    // });
  });
};

const toss = (pcs = [], octaves = []) =>
  octaves.reduce(
    (notes, octave) => notes.concat(pcs.map(pc => `${pc}${octave}`)),
    []
  );

make({
  instrumentName: 'sso-chorus-female',
  octave: 4,
  notes: toss(Chord.notes('C', 'maj7'), [4, 5]),
});

make({
  instrumentName: 'sso-chorus-male',
  octave: 3,
  notes: toss(Chord.notes('A', 'm7'), [2, 3]),
});
