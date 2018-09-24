import { Draw, Sampler, Transport } from 'tone';
import { chromatic } from 'tonal-range';
import samples from './samples.json';

const harp = new Sampler(samples['vsco2-harp']).toMaster();

function* allNotes() {
  const notes = chromatic(['B1', 'F7']);
  for (
    let i = 0;
    i < notes.length;
    i + 1 === notes.length ? (i = 0) : (i += 1)
  ) {
    yield notes[i];
  }
}

const noteGenerator = allNotes();

export default () => {
  Transport.scheduleRepeat(t => {
    harp.triggerAttack('C5', t + 0.1);
    harp.triggerAttack('E5', t + 0.15);
    harp.triggerAttack('G5', t + 0.2);
  }, 1);
  Transport.start();
};
