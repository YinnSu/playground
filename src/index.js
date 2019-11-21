import Tone from 'tone';
import samples from './samples.json';

const getSampler = (samplesByNote, baseUrl = '') =>
  new Promise(resolve => {
    const sampler = new Tone.Sampler(samplesByNote, {
      baseUrl,
      onload: () => resolve(sampler),
    });
  });

const phrases = [
  ['A#', 'F', 'G#', 'C#'],
  ['A#', 'F', 'D'],
  ['D', 'D#', 'F'],
  ['C', 'D#', 'D'],
  ['A#', 'F', 'G', 'D'],
];

Promise.all([
  getSampler(
    samples['vsco2-trumpet-sus-mf'],
    './samples/vsco2-trumpet-sus-mf/'
  ),
  getSampler(
    samples['vsco2-trombone-sus-mf'],
    './samples/vsco2-trombone-sus-mf/'
  ),
  getSampler(samples['vsco2-tuba-sus-mf'], './samples/vsco2-tuba-sus-mf/'),
  new Tone.Reverb(45).generate(),
]).then(([trumpet, trombone, tuba, reverb]) => {
  reverb.toMaster();
  const delay = new Tone.FeedbackDelay(0.2, 0.6).connect(reverb);
  const trumpetFilter = new Tone.AutoFilter(
    Math.random() / 1000 + 0.001
  ).connect(delay);
  trumpetFilter.start();
  trumpet.connect(trumpetFilter);
  const tromboneFilter = new Tone.AutoFilter(
    Math.random() / 1000 + 0.001
  ).connect(delay);
  tromboneFilter.start();
  trombone.connect(tromboneFilter);
  const tubaFilter = new Tone.AutoFilter(Math.random() / 1000 + 0.001).connect(
    reverb
  );
  tubaFilter.start();
  tuba.connect(tubaFilter);
  tuba.set({ attack: 0.5, curve: 'linear' });

  Object.assign(window, { trumpet, trombone });

  const droneTuba = note => {
    tuba.triggerAttack(note, '+1');

    Tone.Transport.scheduleOnce(() => {
      droneTuba(note);
    }, `+${Math.random() * 3 + 2}`);
  };

  droneTuba('A#0');

  const trumpetPhrase = () => {
    const trumpetOct = Math.floor(Math.random() * 2) + 2;
    const tromboneOct = Math.floor(Math.random()) + 1;
    const trumpetMultiplier = Math.random() * 10 + 5;
    const tromboneMultiplier = Math.random() * 10 + 5;
    const tromboneDelay = Math.random() * 15 + 15;
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    const sliceLength = Math.floor(
      Math.pow(Math.random(), 0.1) * phrase.length
    );
    phrase.slice(0, sliceLength).forEach((pc, i) => {
      trumpet.triggerAttack(
        `${pc}${trumpetOct}`,
        `+${1 + i * trumpetMultiplier}`
      );
      trombone.triggerAttack(
        `${pc}${tromboneOct}`,
        `${1 + i * tromboneMultiplier + tromboneDelay}`
      );
    });

    Tone.Transport.scheduleOnce(() => {
      trumpetPhrase();
    }, `+${sliceLength * trumpetMultiplier + 1 + Math.random() * 20}`);
  };

  trumpetPhrase();

  Tone.Transport.start();
});
