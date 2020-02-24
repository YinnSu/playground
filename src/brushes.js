import Tone from 'tone';
import samples from './samples.json';

const getBuffers = (buffersByName, baseUrl = '') =>
  new Promise(resolve => {
    const buffers = new Tone.Buffers(buffersByName, {
      baseUrl,
      onload: () => resolve(buffers),
    });
  });

const pitchShiftSampler = (
  samplesByNote,
  baseUrl,
  destination,
  semitoneChange = 0
) =>
  new Promise(resolve => {
    const midiNoteMap = new Map(
      Reflect.ownKeys(samplesByNote).map(note => [
        new Tone.Midi(note).toMidi(),
        note,
      ])
    );
    const activeSources = [];
    const buffers = new Tone.Buffers(samplesByNote, {
      baseUrl,
      onload: () => {
        resolve({
          play(note, time) {
            const midi = new Tone.Midi(note);
            let buffer;
            let interval;
            for (let i = 0; !buffer && i < 24; i += 1) {
              //eslint-disable-next-line no-loop-func
              [i, -i].some(transposition => {
                const transposedMidi = midi.transpose(transposition);
                if (midiNoteMap.has(transposedMidi.toMidi())) {
                  buffer = buffers.get(transposedMidi.toNote());
                  interval = -transposition;
                  return true;
                }
                return false;
              });
            }
            if (buffer) {
              const playbackRate = Tone.intervalToFrequencyRatio(
                interval + semitoneChange
              );
              const source = new Tone.BufferSource(buffer).set({
                playbackRate,
                onended: () => {
                  const i = activeSources.indexOf(buffer);
                  if (i >= 0) {
                    activeSources.splice(i, 1);
                  }
                },
              });
              source.connect(destination);
              source.start(time);
            }
          },
          dispose: () => {
            [buffers, ...activeSources].forEach(node => node.dispose());
            activeSources.splice(0, activeSources.length);
          },
        });
      },
    });
  });

const reverseSampler = (samplesByNote, baseUrl, destination) =>
  new Promise(resolve => {
    const midiNoteMap = new Map(
      Reflect.ownKeys(samplesByNote).map(note => [
        new Tone.Midi(note).toMidi(),
        note,
      ])
    );
    const activeSources = [];
    const buffers = new Tone.Buffers(samplesByNote, {
      baseUrl,
      onload: () => {
        Reflect.ownKeys(samplesByNote).forEach(note => {
          buffers.get(note).reverse = true;
        });
        resolve({
          play(note, time, duration) {
            const midi = new Tone.Midi(note);
            let buffer;
            let interval;
            for (let i = 0; !buffer && i < 24; i += 1) {
              //eslint-disable-next-line no-loop-func
              [i, -i].some(transposition => {
                const transposedMidi = midi.transpose(transposition);
                if (midiNoteMap.has(transposedMidi.toMidi())) {
                  buffer = buffers.get(transposedMidi.toNote());
                  interval = -transposition;
                  return true;
                }
                return false;
              });
            }
            if (buffer) {
              const playbackRate = Tone.intervalToFrequencyRatio(interval);
              const source = new Tone.BufferSource(buffer).set({
                playbackRate,
                onended: () => {
                  const i = activeSources.indexOf(buffer);
                  if (i >= 0) {
                    activeSources.splice(i, 1);
                  }
                },
              });
              source.connect(destination);
              const adjustedDuration = duration * playbackRate;
              const bufferDuration = buffer.duration;
              if (bufferDuration > adjustedDuration) {
                const offset = bufferDuration - adjustedDuration;
                source.start(time, offset);
              } else {
                const waitTime = duration - bufferDuration / playbackRate;
                Tone.Transport.scheduleOnce(() => {
                  source.start(time);
                }, `+${waitTime}`);
              }
            }
          },
          dispose: () => {
            [buffers, ...activeSources].forEach(node => node.dispose());
            activeSources.splice(0, activeSources.length);
          },
        });
      },
    });
  });

const percussionAutoFilter = new Tone.AutoFilter(
  Math.random() / 500 + 0.005,
  150,
  6
).toMaster();
percussionAutoFilter.start();

const pianoAutoFilter = new Tone.AutoFilter(
  Math.random() / 500 + 0.005,
  150,
  6
).toMaster();
pianoAutoFilter.start();

const stirAutoFilter = new Tone.AutoFilter(Math.random() / 500 + 0.005, 150, 6);
stirAutoFilter.start();

const chords = [
  ['C3', 'E3', 'G3', 'B3'],
  ['C3', 'Eb3', 'G3', 'B3'],
  ['B2', 'D3', 'G3', 'B3'],
  ['A2', 'C#3', 'G3', 'A3'],
];

const nextChordMap = new Map([
  [0, [0, 1, 3]],
  [1, [0, 2, 3]],
  [2, [0, 3]],
  [3, [0, 2]],
]);

const pianoVerb = new Tone.Reverb(30).connect(pianoAutoFilter);
const pianoVerbWetLfo = new Tone.LFO(Math.random() / 500 + 0.005, 0.5, 1).set({
  phase: Math.random() * 360,
});
pianoVerbWetLfo.connect(pianoVerb.wet);
pianoVerbWetLfo.start();

Promise.all([
  getBuffers(samples['snare-brush-stir'], './samples/snare-brush-stir/'),
  getBuffers(samples['snare-brush-hit-p'], './samples/snare-brush-hit-p/'),
  getBuffers(samples['ride-brush-p'], './samples/ride-brush-p/'),
  reverseSampler(
    samples['vsco2-piano-mf'],
    './samples/vsco2-piano-mf/',
    pianoVerb
  ),
  pitchShiftSampler(
    samples['vsco2-piano-mf'],
    './samples/vsco2-piano-mf/',
    pianoVerb,
    -24
  ),
  new Tone.Reverb(15)
    .set({ wet: 0.6 })
    .toMaster()
    .generate(),
  pianoVerb.generate(),
]).then(
  ([stirBuffers, hitBuffers, rideBuffers, reversePiano, lowPiano, reverb]) => {
    stirAutoFilter.connect(reverb);
    const stirVol = new Tone.Volume(-5).connect(stirAutoFilter);
    const stirBuffer = stirBuffers.get(0);
    const stir = () => {
      const playbackRate = 1;
      const source = new Tone.BufferSource(stirBuffer)
        .set({ curve: 'linear', fadeIn: 5, fadeOut: 5, playbackRate })
        .connect(stirVol);
      source.start('+1', 0, stirBuffer.duration / playbackRate - 5);
      Tone.Transport.scheduleOnce(() => {
        stir();
      }, `+${stirBuffer.duration / playbackRate - 10 - Math.random() * 5}`);
    };

    stir();

    const hitVol = new Tone.Volume(-4).connect(percussionAutoFilter);

    const randomHit = (time = '+1') => {
      const randomBuffer = hitBuffers.get(
        Math.floor(Math.random() * samples['snare-brush-hit-p'].length)
      );
      const hitSource = new Tone.BufferSource(randomBuffer)
        .set({ playbackRate: Math.random() * 0.1 + 0.95 })
        .connect(hitVol);
      hitSource.start(time);
    };

    const randomRide = (time = '+1') => {
      const randomBuffer = rideBuffers.get(
        Math.floor(Math.random() * samples['ride-brush-p'].length)
      );
      const source = new Tone.BufferSource(randomBuffer)
        .set({ playbackRate: Math.random() * 0.1 + 0.95 })
        .connect(hitVol);
      source.start(time);
    };

    const synth = new Tone.Synth({ oscillator: { type: 'sine' } })
      .set({ volume: -7 })
      .connect(percussionAutoFilter);

    let chordI = 0;
    let measure = 0;
    const playMeasure = (
      bpm = Math.random() * 40 + 60,
      up = Math.random() < 0.5
    ) => {
      const beats = 8;
      const spb = (1 / bpm) * 60;
      const chord = chords[chordI];
      const chordCopy = chord.slice(0);
      const arpeggio = [];
      while (chordCopy.length) {
        const i = Math.floor(Math.random() * chordCopy.length);
        const note = chordCopy[i];
        chordCopy.splice(i, 1);
        arpeggio.push(note);
      }
      for (let i = 0; i < beats; i += 1) {
        const time = 1 + i * spb + (Math.random() * 0.005 - 0.0025);
        if (i === 0) {
          synth.triggerAttackRelease('C2', 0.05, `+${time}`);
          chord
            .filter(() => Math.random() < 0.9)
            .forEach(note => {
              reversePiano.play(
                note,
                `+${time}`,
                spb * 2 + Math.random() * 0.5
              );
            });
          if (Math.random() < 0.25) {
            chord
              .filter(() => Math.random() < 0.9)
              .forEach(note => {
                const pc = note.slice(0, -1);
                const oct = Number.parseInt(note.slice(-1), 10);
                reversePiano.play(
                  `${pc}${oct + 1}`,
                  `+${time}`,
                  spb * 2 + Math.random() * 0.5
                );
              });
          }
          const nextChordIndicies = nextChordMap.get(chordI);
          chordI =
            nextChordIndicies[
              Math.floor(Math.random() * nextChordIndicies.length)
            ];
        } else if (i === 2 || i === 6) {
          randomHit(`+${time}`);
        } else if ((i === 3 || i === 7) && Math.random() < 0.3) {
          randomHit(`+${time + spb / 2}`);
        }
        if (i === 7 && Math.random() < 0.1) {
          synth.triggerAttackRelease('C2', 0.05, `+${time + spb / 2}`);
        }
        randomRide(`+${time}`);
        const note = arpeggio[i % arpeggio.length];
        const pc = note.slice(0, -1);
        const oct = Number.parseInt(note[note.length - 1], 10);
        const pianoDelay = Math.random() * 0.1 - 0.05;
        lowPiano.play(`${pc}${oct + 3}`, `+${time + pianoDelay}`);
        lowPiano.play(`${pc}${oct + 4}`, `+${time + pianoDelay}`);
      }

      if (measure === 2) {
        measure = 0;
      } else {
        measure += 1;
      }

      Tone.Transport.scheduleOnce(() => {
        if (bpm >= 100) {
          playMeasure(bpm * (1 - Math.random() * 0.001), false);
        } else if (bpm <= 60) {
          playMeasure(bpm * (1 + Math.random() * 0.001), true);
        } else if (up) {
          playMeasure(bpm * (1 + Math.random() * 0.001), true);
        } else {
          playMeasure(bpm * (1 - Math.random() * 0.001), false);
        }
      }, `+${spb * beats}`);
    };

    playMeasure();
    Tone.Transport.start();
  }
);
