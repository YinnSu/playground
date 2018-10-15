// import startAudioContext from 'startaudiocontext';
// import Tone from 'tone';
// import piece from './wind';
//
// startAudioContext(Tone.context).then(() => {
//   piece();
// });
//

import { Scale, Distance, Note } from 'tonal';
import { Sampler, Volume } from 'tone';
import samples from './samples.json';

const EIGHT_NOTE_MS = 200;

const scales = Scale.names();
const scaleIntervals = scales
  .map(scale => ({
    intervals: Scale.intervals(scale),
    similarities: new Map(),
  }))
  .filter(({ intervals }) => intervals.length === 5);

scaleIntervals.forEach(scale =>
  scaleIntervals
    .filter(({ intervals }) => scale.intervals !== intervals)
    .forEach(comparisonScale => {
      const sharedIntervalCount = scale.intervals.filter(interval =>
        comparisonScale.intervals.includes(interval)
      ).length;
      scale.similarities.set(
        comparisonScale,
        sharedIntervalCount / scale.intervals.length
      );
    })
);

scaleIntervals.forEach(scale => {
  const valueSum = Array.from(scale.similarities.values()).reduce(
    (sum, value) => sum + value,
    0
  );
  Array.from(scale.similarities.keys()).forEach(key => {
    scale.similarities.set(key, scale.similarities.get(key) / valueSum);
  });
});

const lowHarp = new Sampler(samples['vsco2-harp']).toMaster();

const makeAlternatingSection = sampleName => {
  const section1 = new Sampler(samples[sampleName]['2']).toMaster();
  const section2 = new Sampler(samples[sampleName]['1']).toMaster();
  let currentSectionNumber = 1;
  return {
    triggerAttack(...args) {
      let section;
      if (currentSectionNumber === 1) {
        section = section1;
        currentSectionNumber = 2;
      } else {
        section = section2;
        currentSectionNumber = 1;
      }
      section.triggerAttack(...args);
    },
  };
};

const celloSection = makeAlternatingSection('vsco2-cello-spic');
const violinSection = makeAlternatingSection('vsco2-violin-spic');

const harp = new Sampler(samples['vsco2-harp'], {
  onload: () => {
    makePlayScale(harp)(
      scaleIntervals[Math.floor(Math.random() * scaleIntervals.length)]
    );
  },
}).toMaster();

const makePlayScale = instrument => {
  const playScale = ({ intervals, similarities }, same = true) => {
    const bassNote = Distance.transpose('C2', intervals[1]);
    const midNote = Distance.transpose('C3', intervals[1]);
    const playNote = (note, time) => {
      setTimeout(() => {
        instrument.triggerAttack(note, '+0.1');
        celloSection.triggerAttack(bassNote, '+0.1');
        violinSection.triggerAttack(midNote, '+0.1');
      }, time);
    };
    intervals.forEach((interval, i) => {
      const note = Distance.transpose('C4', interval);
      playNote(note, i * EIGHT_NOTE_MS);
    });

    playNote('C5', intervals.length * EIGHT_NOTE_MS);

    let nextScale;
    if (same) {
      nextScale = { intervals, similarities };
    } else {
      let relativeProb = 0;
      const probs = Array.from(similarities.keys()).map(key => {
        const value = similarities.get(key);
        relativeProb += value;
        return { scale: key, relativeProb };
      });
      const roll = Math.random();
      nextScale = probs.find(
        scaleWithProb => scaleWithProb.relativeProb >= roll
      ).scale;
    }
    setTimeout(() => {
      playScale(nextScale, !same);
    }, EIGHT_NOTE_MS * (intervals.length + 1));
  };
  return playScale;
};
