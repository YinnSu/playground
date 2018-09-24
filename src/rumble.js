import { Noise, Master, Transport, Tremolo, EQ3 } from 'tone';

const noise = new Noise('brown');
const eq = new EQ3(0, -Infinity, -Infinity).toMaster();
eq.lowFrequency.value = 60;

export default () => {
  noise.connect(eq);
  noise.start();
};
