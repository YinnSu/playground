import Tone from 'tone';
import samples from './samples.json';

const getSampler = () =>
  new Promise(resolve => {
    const sampler = new Tone.Sampler(samples['dry-guitar-vib'], {
      baseUrl: './samples/dry-guitar-vib/',
      onload: () => resolve(sampler),
    });
  });

const getBuffers = () =>
  new Promise(resolve => {
    const buffers = new Tone.Buffers(samples['vcsl-ocean-drum'], {
      baseUrl: './samples/vcsl-ocean-drum/',
      onload: () => resolve(buffers),
    });
  });
const NOTES = ['C3', 'D#3', 'G3', 'A#3', 'C4', 'D#4', 'G4', 'A#4'];

Promise.all([getSampler(), getBuffers()]).then(([guitar, oceanDrum]) => {
  guitar.set({ curve: 'linear', attack: 10, release: 15 });
  const reverb = new Tone.Reverb(7).set({ wet: 1 }).toMaster();
  const delay1 = new Tone.FeedbackDelay({
    feedback: 0.7,
    delayTime: Math.random() * 0.2 + 0.8,
  }).connect(reverb);
  const delay2 = new Tone.FeedbackDelay({
    feedback: 0.5,
    delayTime: 0.25,
  }).connect(delay1);
  reverb.generate();
  const autoFilter = new Tone.AutoFilter(Math.random() / 10, 200, 5)
    .start()
    .connect(delay2);
  guitar.connect(autoFilter);
  NOTES.forEach(note => {
    const play = () => {
      guitar.triggerAttack(note, '+1');
      Tone.Transport.scheduleOnce(() => {
        play();
      }, `+${Math.random() * 25 + 25}`);
    };
    Tone.Transport.scheduleOnce(() => {
      play();
    }, `+${Math.random() * 25 + 10}`);
  });

  const firstOceanDelays = samples['vcsl-ocean-drum'].map(
    () => Math.random() * 30
  );
  const minOceanDelay = Math.min(...firstOceanDelays);
  samples['vcsl-ocean-drum'].forEach((_, i) => {
    const buffer = oceanDrum.get(i);
    const play = () => {
      buffer.reverse = Math.random() < 0.5;
      const source = new Tone.BufferSource(buffer)
        .set({ fadeIn: 3, fadeOut: 3, curve: 'linear', playbackRate: 0.5 })
        .connect(reverb);
      source.start();
      Tone.Transport.scheduleOnce(() => {
        play();
      }, `+${Math.random() * buffer.duration * 2 + buffer.duration * 2 + 1}`);
    };
    Tone.Transport.scheduleOnce(() => {
      play();
    }, `+${firstOceanDelays[i] - minOceanDelay + 1}`);
  });
  Tone.Transport.start();
});
