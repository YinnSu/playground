import startAudioContext from 'startaudiocontext';
import Tone from 'tone';
import piece from './rumble';

startAudioContext(Tone.context).then(() => {
  piece();
});

if (module.hot) {
  module.hot.accept('./piece', () => {
    Tone.Transport.stop();
    Tone.context.close();
    Tone.context = new AudioContext();
    piece();
  });
}
