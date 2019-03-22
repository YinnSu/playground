import Tone from 'tone';
import samples from './samples.json';

const getBuffers = instrumentName =>
  new Promise(resolve => {
    const buffers = new Tone.Buffers(
      samples[instrumentName].map(url => `./samples/${instrumentName}/${url}`),
      () => resolve(buffers)
    );
  });

const DRUM_LOOP_LENGTH_S = 75;

const autoFilter = new Tone.AutoFilter({
  frequency: 0.08,
  octaves: 4,
  filter: { type: 'bandpass' },
})
  .set({ wet: 0.7 })
  .start()
  .toMaster();
const volume = new Tone.Volume(-500).connect(autoFilter);

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
        const bufferSource = new Tone.BufferSource(currentBuffer).connect(
          volume
        );
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

Promise.all(
  ['itslucid-lofi-hats', 'itslucid-lofi-kick', 'itslucid-lofi-snare'].map(i =>
    percussionInstrument(i)
  )
).then(([hats, kick, snare]) => {
  Tone.Transport.scheduleRepeat(time => {
    volume.volume.linearRampToValueAtTime(-10, time + DRUM_LOOP_LENGTH_S / 2);
    Tone.Transport.scheduleOnce(volumeTime => {
      volume.volume.linearRampToValueAtTime(
        -500,
        volumeTime + DRUM_LOOP_LENGTH_S / 2
      );
    }, time + DRUM_LOOP_LENGTH_S / 2);
    const SIXTEENTH_TIME = Math.random() * 0.05 + 0.1;

    const hatPattern = getPattern(0.9, 0.5, 0.1);
    const snarePattern = getPattern(0.5, 0.25, 0.1);
    const kickPattern = getPattern(0.5, 0.2, 0.05);

    [snare, kick].forEach(({ newSound }) => newSound());

    [[hats, hatPattern], [snare, snarePattern], [kick, kickPattern]].forEach(
      ([inst, pattern], i) => {
        if (i > 0 || Math.random() < 0.3) {
          Tone.Transport.scheduleRepeat(
            patternTime => {
              pattern.forEach(beat => {
                inst.play(patternTime + beat * SIXTEENTH_TIME);
              });
            },
            BEAT_SIXTEETHS * SIXTEENTH_TIME,
            time,
            DRUM_LOOP_LENGTH_S
          );
        }
      }
    );
  }, DRUM_LOOP_LENGTH_S);
});

const autoFilter2 = new Tone.AutoFilter({
  frequency: 0.06,
  octaves: 4,
  filter: { type: 'bandpass' },
})
  .set({ wet: 0.7 })
  .start()
  .toMaster();

getBuffers('vcsl-digeridoo-sus').then(digeridooBuffers => {
  const chorus = new Tone.Chorus().connect(autoFilter2);
  const delay = new Tone.FeedbackDelay({
    feedback: 0.8,
    delayTime: 0.2,
  }).connect(chorus);
  const reverb = new Tone.Freeverb({ roomSize: 0.7, wet: 0.5 }).connect(delay);

  const playDigeridoo = time => {
    const index = Math.floor(Math.random() * 3);
    const buffer = digeridooBuffers.get(index);
    let playbackRate = 1;
    if (Math.random() < 0.1) {
      playbackRate -= 0.2;
    }
    if (Math.random() < 0.1) {
      playbackRate -= 0.2;
    }
    const source = new Tone.BufferSource({
      buffer,
      playbackRate,
    }).connect(reverb);
    source.start(time + 1);
    Tone.Transport.scheduleOnce(nextTime => {
      playDigeridoo(nextTime);
    }, time + (Math.random() < 0.03 ? Math.random() * 10 + 10 : Math.random() * 5 + 5));
  };
  playDigeridoo(1);

  Tone.Transport.start();
});
