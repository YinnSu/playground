import Tone from 'tone';
import samples from './samples.json';

const PERCUSSION_INSTRUMENTS = [
  'vsco2-brake-drum',
  'vsco2-claves',
  'vsco2-conga',
  'vsco2-cowbell',
  'vsco2-guiro',
  'vsco2-logdrum',
  'vsco2-quinto',
  'vsco2-tumba',
];

const getPercussionInstrument = (instrumentName, destination) =>
  Promise.all(
    samples[instrumentName].map(
      url =>
        new Promise(resolve => {
          const buffer = new Tone.Buffer(
            `samples/${instrumentName}/${url}`,
            () => resolve(buffer)
          );
        })
    )
  ).then(buffers => {
    let lastPlayed;
    return {
      triggerAttack: time => {
        const possibleNextBuffers = buffers.filter(b => b !== lastPlayed);
        const nextBuffer =
          possibleNextBuffers[
            Math.floor(Math.random() * possibleNextBuffers.length)
          ];
        const bufferSource = new Tone.BufferSource(nextBuffer).chain(
          destination
        );
        bufferSource.start(time);
        bufferSource.onended = () => {
          bufferSource.dispose();
        };
      },
    };
  });

const MIN_UNIT = 0.2 + Math.random() * 0.1;

const makePiece = () =>
  Promise.all(
    PERCUSSION_INSTRUMENTS.map(instrumentName =>
      getPercussionInstrument(instrumentName, Tone.Master)
    )
  ).then(instruments => {
    Tone.Transport.scheduleRepeat(() => {
      instruments.forEach(instrument => {
        if (Math.random() < 0.25) {
          instrument.triggerAttack(`+${1 + (Math.random() - 0.5) / 30}`);
        }
      });
    }, MIN_UNIT);
    Tone.Transport.start();
  });

makePiece();
window.onclick = () => {
  console.log('resuming');
  Tone.context.resume();
};
