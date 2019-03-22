import Tone from 'tone';
import { Note } from 'tonal';
import samples from './samples.json';

Promise.all(
  Reflect.ownKeys(samples['sso-chorus-female'])
    .map(note => samples['sso-chorus-female'][note])
    .map(
      url =>
        new Promise(resolve => {
          const buffer = new Tone.Buffer(url, () => resolve(buffer));
        })
    )
).then(buffers => {
  const playRandom = () => {
    const randomBuffer = buffers[Math.floor(Math.random() * buffers.length)];
    const lfo = new Tone.LFO({
      frequency: Math.random() / 500,
      max: 1,
      min: 0.1,
    });
    const source = new Tone.BufferSource(randomBuffer, null, {
      onended: () => {
        lfo.dispose();
        source.dispose();
      },
      onload: () => {},
    }).toMaster();
    //lfo.connect(source.playbackRate);
    source.fadeIn = 3;
    source.fadeOut = 10;
    //lfo.start();
    source.start();
  };
  setInterval(() => {
    playRandom();
  }, 5000);
  playRandom();
});
