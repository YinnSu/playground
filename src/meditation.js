import Tone from 'tone';
import samples from './samples.json';

Tone.context.latencyHint = 'playback';

const delay = new Tone.FeedbackDelay({
  wet: 0.5,
  delayTime: 20,
  feedback: 0.8,
}).toMaster();
const lowpass = new Tone.Filter({ rolloff: -96, frequency: 1000 }).connect(
  delay
);
const glock = new Tone.Sampler(samples['kasper-singing-bowls']).connect(
  lowpass
);

Tone.Master.volume.value = -10;

const lows = ['C1', 'G1', 'C2', 'G2'];
const highs = ['C5', 'G5', 'C4', 'G4', 'F4', 'F5', 'D4', 'D5'];

const makeNotes = notes => () => {
  glock.triggerAttack(notes[Math.floor(Math.random() * notes.length)]);
  if (Math.random() > 0.3) {
    glock.triggerAttack(
      notes[Math.floor(Math.random() * notes.length)],
      `+${Math.random() * 10 + 1}`
    );
  }
};

const lowNotes = makeNotes(lows);
const highNotes = makeNotes(highs);

setTimeout(() => {
  lowNotes();
  setInterval(() => {
    lowNotes();
  }, 30200);
}, 2000);

setTimeout(() => {
  highNotes();
  setInterval(() => {
    highNotes();
  }, 60230);
}, 5000);

window.navigator.requestMIDIAccess().then(access => {
  console.log(access);
  const inputs = Array.from(access.inputs);
  const device = inputs[1][1];
  console.log(device);
  device.onmidimessage = ({ data }) => {
    console.log(data);
    const [command, key, value] = data;
    if (command === 144) {
      glock.triggerAttack(Tone.Midi(key).toFrequency(), '+0.1');
    } else if (command === 176) {
      if (key === 1) {
        delay.delayTime.value = (value / 127) * 20;
      } else if (key === 2) {
        delay.feedback.value = value / 127;
      } else if (key === 5) {
        lowpass.frequency.value = (value / 127) * 9000 + 1000;
      }
    }
  };
});
