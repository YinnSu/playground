import Tone from 'tone';
import samples from './samples.json';

const getSampler = (samplesByNote, baseUrl = '') =>
  new Promise(resolve => {
    const sampler = new Tone.Sampler(samplesByNote, {
      baseUrl,
      onload: () => resolve(sampler),
    });
  });

const notes = ['C3', 'C4', 'B4', 'E5', 'G5'];
//const notes = ['F3', 'F4', 'C4', 'D4', 'G5'];

Promise.all([
  getSampler(samples['vsco2-piano-mf'], './samples/vsco2-piano-mf/'),
  getSampler(samples['vsco2-glock']),
  new Tone.Reverb(15)
    .set({ wet: 0.5 })
    .toMaster()
    .generate(),
]).then(([piano, glock, reverb]) => {
  const delay = new Tone.FeedbackDelay(5, 0.5).connect(reverb);
  piano.connect(delay);
  const glockVol = new Tone.Volume(-15).connect(delay);
  glock.connect(glockVol);

  const first = Math.floor(Math.random() * notes.length);

  notes.forEach((note, i) => {
    let initialized = false;
    const play = () => {
      const isFirst = i === first;
      if (isFirst) {
        piano.triggerAttack(note);
      }
      Tone.Transport.scheduleOnce(() => {
        piano.triggerAttack(note);
        if (Math.random() < 0.05) {
          const pc = note.slice(0, note.length - 1);
          const oct = Number.parseInt(note.slice(-1), 10);
          glock.triggerAttack(`${pc}${Math.max(oct + 1, 5)}`);
        }
        play();
      }, `+${Math.random() * 15 + (initialized || isFirst ? 15 : 0) * (i === 0 ? 3 : 1)}`);
      initialized = true;
    };
    play();
  });

  Tone.Transport.start();
});
