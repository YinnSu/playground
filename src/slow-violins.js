import Tone from 'tone';
import samples from './samples.json';

const violinsSamples = samples['vsco2-violin-susvib'];

const sampledNotes = Reflect.ownKeys(violinsSamples);
const buffers = sampledNotes.reduce(
  (sources, note) => sources.concat([new Tone.Buffer(violinsSamples[note])]),
  []
);

const playRandom = () => {
  const buffer = buffers[Math.floor(Math.random() * buffers.length)];
  const bufferSource = new Tone.BufferSource(buffer).toMaster();
  bufferSource.playbackRate.value = 0.1;
  bufferSource.start();
};

setTimeout(() => {
  playRandom();
  setInterval(() => {
    playRandom();
  }, 30000);
}, 5000);
