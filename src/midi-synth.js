import Tone from 'tone';
//import './midi-reader';
Tone.context.latencyHint = 'interactive';

const envelope = {
  attack: 3,
  decay: 1,
  sustain: 3,
  release: 1,
};

const filterEnvelope = {
  attack: 5,
  decay: 12,
  sustain: 3,
  release: 1,
};

const filter = {
  frequency: 10000,
};

const synth = new Tone.DuoSynth({
  voice0: {
    oscillator: {
      type: 'sawtooth',
    },
    envelope,
    filterEnvelope,
    filter,
  },
  voice1: {
    oscillator: {
      type: 'square',
    },
    envelope,
    filterEnvelope,
    filter,
  },
  vibratoAmount: 0.2,
  vibratoRate: 1,
}).toMaster();

window.synth = synth;
window.Tone = Tone;

const max = 20;

const paramMap = {
  1: 'attack',
  2: 'decay',
  3: 'sustain',
  0: 'release',
};

window.navigator.requestMIDIAccess().then(access => {
  const inputs = Array.from(access.inputs);
  const device = inputs[0][1];
  const voices = [synth.voice0, synth.voice1];
  device.onmidimessage = ({ data }) => {
    const [command, buttonId, value] = data;
    console.log(command);
    if (command === 176) {
      // knobs
      const modifiedEnvelope = buttonId < 5 ? 'envelope' : 'filterEnvelope';
      const paramName = paramMap[buttonId % 4];
      const adjustedValue = (value / 127) * max + 0.01;
      [synth.voice0, synth.voice1].forEach(voice => {
        voice[modifiedEnvelope][paramName] = adjustedValue;
      });
    } else if (command === 144) {
      synth.triggerAttack(Tone.Midi(buttonId).toFrequency(), Tone.now(), value);
    } else if (command === 128) {
      synth.triggerRelease(Tone.now());
    }
  };
});
