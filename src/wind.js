import { Sampler, Transport, FeedbackDelay, Freeverb } from 'tone';
import { Chord } from 'tonal';
import samples from './samples.json';

const glockDelay = new FeedbackDelay(8, 0.7);
const glockVerb = new Freeverb(0.9, 2000).toMaster();

const glock = new Sampler(samples['vsco2-glock']).chain(glockDelay, glockVerb);

const chordInterval = (tonic, interval) => {
  Transport.scheduleRepeat(
    time => {
      const notes = Chord.notes(tonic, 'm7');
      const numNotesToPlay = Math.floor(Math.random() * (notes.length + 1));
      let playedNotes = 0;
      let beat = 1;
      while (playedNotes < numNotesToPlay) {
        const chanceToPlay =
          0.1 + (beat % 4 === 1 ? 0.1 : 0) + (beat % 2 === 1 ? 0.1 : 0);
        if (Math.random() < chanceToPlay) {
          const noteIndex = Math.floor(Math.random() * notes.length);
          const note = notes[noteIndex];
          notes.splice(noteIndex, 1);
          glock.triggerAttack(note, time + beat);
          playedNotes += 1;
        }
        beat += 1;
      }
    },
    interval,
    Math.floor(Math.random() * 5) * 2
  );
};

export default () => {
  chordInterval('A4', 22);
  chordInterval('A5', 20);
  Transport.start();
};
