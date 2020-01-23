//double scaledValue = UCHAR_MAX * (dbMag - minDecibels) * rangeScaleFactor;
//rangescalefactor = 1./(max-min)
//real dB = value/(255*rangescalefactor) + minDB

var log10Tab = new Float32Array(32768+1);

export function initLog10Tab() {
  log10Tab[0] = -96;
  for (let i = 1; i <= 32768; i++) {
    log10Tab[i] = 20*Math.log10(i/32768);
  }
}


export function getVuDB(timeData, frameLen) {
  let vuMax = 0, vu = 0;

  for (let j = 0; j < frameLen; j++) {
    vu = Math.abs(timeData[j]*32768);
    if (vu > vuMax)
      vuMax = vu;
  }

  //minDb
  //let db = 20*Math.log10(vuMax/32768);
  let db = log10Tab[parseInt(vuMax)];

  return db;
}

export function getScaleVuDB(timeData, frameLen, absMinDB, scaleMax) {
  let db = getVuDB(timeData, frameLen) + absMinDB;

  return parseInt(scaleMax*(Math.abs(db)/absMinDB));
}
