import Tone from 'tone';
import samples from './samples.json';

const getBuffers = instrumentName =>
  new Promise(resolve => {
    const buffers = new Tone.Buffers(
      samples[instrumentName].map(url => `./samples/${instrumentName}/${url}`),
      () => resolve(buffers)
    );
  });

const percussionInstrument = instrumentName =>
  getBuffers(instrumentName).then(buffers => {
    const instrumentSamples = samples[instrumentName];

    const randomBuffer = () =>
      buffers.get(Math.floor(Math.random() * instrumentSamples.length));

    let currentBuffer = randomBuffer();
    return {
      newSound: () => {
        currentBuffer = randomBuffer();
      },
      play: t => {
        const bufferSource = new Tone.BufferSource(currentBuffer).toMaster();
        bufferSource.onended = () => bufferSource.dispose();
        bufferSource.start(t);
      },
    };
  });

const BEAT_SIXTEETHS = 32;

const getPattern = (quarterP, eighthP, sixteethP) => {
  const pattern = [];
  for (let i = 0; i < BEAT_SIXTEETHS; i += 1) {
    if (i % 4 === 0) {
      if (Math.random() < quarterP) {
        pattern.push(i);
      }
    } else if (i % 2 === 0) {
      if (Math.random() < eighthP) {
        pattern.push(i);
      }
    } else if (Math.random() < sixteethP) {
      pattern.push(i);
    }
  }
  return pattern;
};

const SIXTEENTH_TIME = Math.random() * 0.07 + 0.07;

Promise.all(
  ['itslucid-lofi-hats', 'itslucid-lofi-kick', 'itslucid-lofi-snare'].map(i =>
    percussionInstrument(i)
  )
).then(([hats, kick, snare]) => {
  const hatPattern = getPattern(0.9, 0.5, 0.1);
  const snarePattern = getPattern(0.5, 0.25, 0.1);
  const kickPattern = getPattern(0.5, 0.2, 0.05);

  [[hats, hatPattern], [snare, snarePattern], [kick, kickPattern]].forEach(
    ([inst, pattern]) => {
      Tone.Transport.scheduleRepeat(t => {
        pattern.forEach(beat => {
          inst.play(t + beat * SIXTEENTH_TIME);
        });
      }, BEAT_SIXTEETHS * SIXTEENTH_TIME);
    }
  );

  Tone.Transport.start();
});

document.body.onclick = () => {
  Tone.context.resume();
};
