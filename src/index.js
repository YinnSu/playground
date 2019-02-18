import Tone from 'tone';
import samples from './samples.json';

const flutePromise = new Promise(resolve => {
  const flute = new Tone.Sampler(samples['vsco2-flute-susvib'], {
    onload: () => resolve(flute),
    volume: -40,
    fadeIn: 3,
    curve: 'linear',
  });
});

// COPY

const FLUTE_NOTES = ['C3', 'C4', 'G3', 'G4'];
const guitarSamples = [];
for (let i = 1; i <= 86; i += 1) {
  guitarSamples.push(`./samples/acoustic-chords/${i}.wav`);
}

const makePiece = master =>
  Promise.all([
    flutePromise,
    ...guitarSamples.map(
      url =>
        new Promise(resolve => {
          const buffer = new Tone.Buffer(url, () => resolve(buffer));
        })
    ),
  ]).then(([flute, ...guitarBuffers]) => {
    const volumeLfo = new Tone.LFO({
      frequency: Math.random() / 100,
      min: -40,
      max: -25,
    });
    volumeLfo.connect(flute.volume);
    volumeLfo.start();
    const fluteReverb = new Tone.Reverb(50);
    fluteReverb.wet.value = 1;
    const delay = new Tone.FeedbackDelay({ delayTime: 1, feedback: 0.7 });
    fluteReverb.generate().then(() => {
      flute.chain(fluteReverb, delay, master);

      const intervalTimes = FLUTE_NOTES.map(() => Math.random() * 10000 + 5000);

      const shortestInterval = Math.min(...intervalTimes);

      FLUTE_NOTES.forEach((note, i) => {
        const playNote = () => {
          flute.triggerAttack(note, '+1');
        };
        setTimeout(() => {
          playNote();
          setInterval(() => {
            playNote();
          }, intervalTimes[i]);
        }, intervalTimes[i] - shortestInterval);
      });
    });

    const reverb = new Tone.Freeverb({
      roomSize: 0.5,
      dampening: 5000,
      wet: 0.2,
    });
    const compressor = new Tone.Compressor();
    reverb.chain(compressor, master);
    const playRandomChord = lastChord => {
      const nextChords = guitarBuffers.filter(chord => chord !== lastChord);
      const randomChord =
        nextChords[Math.floor(Math.random() * nextChords.length)];
      const source = new Tone.BufferSource(randomChord).connect(reverb);
      source.onended = () => console.log('ended');
      source.start('+1');
      setTimeout(() => {
        playRandomChord(randomChord);
      }, Math.random() * 10000 + 10000);
    };
    setTimeout(() => {
      playRandomChord();
    }, Math.random() * 5000 + 5000);
  });

makePiece(Tone.Master);

document.addEventListener('DOMContentLodaed', () => {
  document.body.onclick = () => {
    Tone.context.resume();
  };
});
