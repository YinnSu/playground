window.navigator.requestMIDIAccess().then(access => {
  console.log(access);
  const inputs = Array.from(access.inputs).forEach(([name, device]) => {
    device.onmidimessage = ({ data }) => console.log(data);
  });
});
