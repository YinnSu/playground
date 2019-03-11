import Tone from 'tone';
import { Note, Distance } from 'tonal';
import samples from './samples.json';

const findClosest = (samplesByNote, note) => {
  const noteMidi = Note.midi(note);
  const maxInterval = 96;
  let interval = 0;
  while (interval <= maxInterval) {
    const higherNote = Note.fromMidi(noteMidi + interval);
    if (samplesByNote[higherNote]) {
      return higherNote;
    }
    const lowerNote = Note.fromMidi(noteMidi - interval);
    if (samplesByNote[lowerNote]) {
      return lowerNote;
    }
    interval += 1;
  }
  return note;
};

const getBuffer = url =>
  new Promise(resolve => {
    const buffer = new Tone.Buffer(url, () => resolve(buffer));
  });

const drone = (
  instrumentName,
  note,
  destination,
  pitchShift = 0,
  reverse = false
) => {
  const samplesByNote = samples[instrumentName];
  const closestSampledNote = findClosest(samplesByNote, note);
  const difference = Distance.semitones(closestSampledNote, note);
  const playbackRate = Tone.intervalToFrequencyRatio(difference + pitchShift);
  const url = samplesByNote[closestSampledNote];
  return getBuffer(
    url.includes('samples') ? url : `./samples/${instrumentName}/${url}`
  ).then(buffer => {
    const source = new Tone.BufferSource(buffer).connect(destination);
    source.reverse = reverse;
    source.onended = () => source.dispose();
    source.playbackRate.value = playbackRate;
    source.start();
  });
};

const NOTES = ['C4', 'G4', 'E4'];

['vsco2-trumpet-sus-f', 'vsco2-trumpet-sus-mf'].forEach(instrumentName => {
  const autoFilter = new Tone.AutoFilter(Math.random() / 10, 150, 4)
    .chain(Tone.Master)
    .start();

  const lfoMin = Math.random() / 100;
  const lfoMax = lfoMin * 10;

  const frequencyLfo = new Tone.LFO({ min: lfoMin, max: lfoMax });

  frequencyLfo.connect(autoFilter.frequency);
  frequencyLfo.start();

  const lastVol = new Tone.Volume();
  const lastVolLfo = new Tone.LFO({
    min: -100,
    max: -10,
    frequency: Math.random() / 100,
    phase: 90,
  });
  lastVolLfo.connect(lastVol.volume);
  lastVolLfo.start();
  lastVol.connect(autoFilter);

  NOTES.forEach((note, i) => {
    const playDrone = () => {
      if (i === NOTES.length - 1) {
        drone(instrumentName, note, lastVol, -36);
      }
      drone(instrumentName, note, autoFilter, -36);
      setTimeout(() => {
        playDrone();
      }, Math.random() * 20000 + 40000);
    };
    playDrone();
  });
});
