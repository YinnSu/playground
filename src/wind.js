import { Noise, AutoFilter, Master, Sampler, Transport } from 'tone';
import { Chord } from 'tonal';
import samples from './samples.json';

const glock = new Sampler(samples['vsco2-glock']).toMaster();

const randomBetween = (min, max) => Math.random() * (max - min) + min;

export default () => {
  const noise = new Noise('pink').start();

  const autoFilter = new AutoFilter({
    frequency: '60m',
    min: 40,
    max: 11500,
  }).connect(Master);

  noise.connect(autoFilter);
  autoFilter.start();

  const notes = Chord.notes('A4', 'm7').concat(Chord.notes('A5', 'm7'));
  notes.forEach(note => {
    Transport.scheduleRepeat(() => {
      glock.triggerAttack(note, `+1`);
    }, randomBetween(20, 80));
  });
  Transport.start();
};
