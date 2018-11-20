import Tone from 'tone';

const noise = new Tone.Noise('brown');
const eq = new Tone.EQ3(0, -Infinity, -Infinity).toMaster();
eq.lowFrequency.value = 100;

const synth = new Tone.MonoSynth({ type: 'sine ' }).toMaster();

//synth.triggerAttackRelease('D2', 1);

export default () => {
  noise.connect(eq);
  noise.start();
};
