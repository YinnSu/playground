import Tone from 'tone';
import samples from './samples.json';

const getSampler = (samplesByNote, baseUrl = '') =>
  new Promise(resolve => {
    const sampler = new Tone.Sampler(samplesByNote, {
      baseUrl,
      onload: () => resolve(sampler),
    });
  });

const findClosest = (midi, samplesByMidi) => {
  const MAX_INTERVAL = 96;
  let interval = 0;
  while (interval < MAX_INTERVAL) {
    if (samplesByMidi.has(midi + interval)) {
      return -interval;
    } else if (samplesByMidi.has(midi - interval)) {
      return interval;
    }
    interval += 1;
  }
  throw new Error('No available buffers for note: ' + midi);
};

const getBuffer = url =>
  new Promise(resolve => {
    const buffer = new Tone.Buffer(url, () => resolve(buffer));
  });

const getBufferSource = (note, samplesByNote, baseUrl = '') => {
  const samplesByMidi = Object.keys(samplesByNote).reduce(
    (byMidi, sampledNote) => {
      byMidi.set(
        Tone.Frequency(sampledNote).toMidi(),
        samplesByNote[sampledNote]
      );
      return byMidi;
    },
    new Map()
  );
  const midi = Tone.Frequency(note).toMidi();
  const difference = findClosest(midi, samplesByMidi);
  const playbackRate = Tone.intervalToFrequencyRatio(difference);
  const closestSampleUrl = samplesByMidi.get(midi - difference);
  const bufferSource = new Tone.BufferSource({ playbackRate });
  return getBuffer(`${baseUrl}${closestSampleUrl}`).then(buffer => {
    bufferSource.set({ buffer });
    return bufferSource;
  });
};

const renderNote = (
  note,
  samplesByNote,
  getDestination,
  renderTime,
  baseUrl = ''
) => {
  let resolvedDestination;
  return Tone.Offline(() => {
    return Promise.all([
      getDestination().then(destination => {
        resolvedDestination = destination;
        return destination;
      }),
      getBufferSource(note, samplesByNote, baseUrl),
    ]).then(([destination, bufferSource]) => {
      bufferSource.connect(destination);
      bufferSource.start();
    });
  }, renderTime).then(buffer => {
    resolvedDestination.dispose();
    return buffer;
  });
};

const getPrerenderedSampler = (
  renderedNotes,
  samplesByNote,
  getDestination,
  renderTime,
  baseUrl = ''
) =>
  Promise.all(
    renderedNotes.map(note =>
      renderNote(note, samplesByNote, getDestination, renderTime, baseUrl)
    )
  ).then(renderedBuffers => {
    const buffersByMidi = renderedBuffers.reduce((byMidi, buffer, i) => {
      const note = renderedNotes[i];
      const midi = Tone.Frequency(note).toMidi();
      byMidi.set(midi, buffer);
      return byMidi;
    }, new Map());
    const activeSources = [];
    let output;
    return {
      trigger: (note, time) => {
        const midi = Tone.Frequency(note).toMidi();
        if (!buffersByMidi.has(midi)) {
          throw new Error(
            `Requested note ${note} (${midi}) was never rendered`
          );
        }
        const buffer = buffersByMidi.get(midi);
        const source = new Tone.BufferSource({ buffer })
          .set({
            onended: () => {
              const i = activeSources.indexOf(source);
              if (i >= 0) {
                activeSources.splice(i, 1);
              }
            },
          })
          .connect(output);
        activeSources.push(source);
        source.start(time);
      },
      dispose: () => {
        activeSources.forEach(source => source.dispose());
      },
      connect: node => {
        output = node;
      },
    };
  });

const notes = ['C3', 'C4', 'B4', 'E5', 'G5'];
// const notes = ['F3', 'F4', 'C4', 'D4', 'G5'];

const getReverb = () =>
  new Tone.Reverb(15)
    .set({ wet: 0.5 })
    .toMaster()
    .generate();

Promise.all([
  getPrerenderedSampler(
    notes,
    samples['vsco2-piano-mf'],
    getReverb,
    15,
    './samples/vsco2-piano-mf/'
  ),
  getPrerenderedSampler(
    notes.slice(1).map(note => {
      const pc = note.slice(0, note.length - 1);
      const oct = Number.parseInt(note.slice(-1), 10);
      return `${pc}${oct + 1}`;
    }),
    samples['vsco2-glock'],
    getReverb,
    15
  ),
]).then(([piano, glock]) => {
  const delay = new Tone.FeedbackDelay(5, 0.5).toMaster();
  const glockVol = new Tone.Volume(-15).connect(delay);
  const first = Math.floor(Math.random() * notes.length);
  piano.connect(delay);
  glock.connect(glockVol);
  notes.forEach((note, i) => {
    let initialized = false;
    const play = () => {
      const isFirst = i === first;
      if (isFirst) {
        piano.trigger(note);
      }
      Tone.Transport.scheduleOnce(() => {
        piano.trigger(note);
        if (Math.random() < 0.05) {
          const pc = note.slice(0, note.length - 1);
          const oct = Number.parseInt(note.slice(-1), 10);
          glock.trigger(`${pc}${Math.max(oct + 1, 5)}`);
        }
        play();
      }, `+${Math.random() * 15 + (initialized || isFirst ? 15 : 0) * (i === 0 ? 3 : 1)}`);
      initialized = true;
    };
    play();
  });

  Tone.Transport.start();
});
