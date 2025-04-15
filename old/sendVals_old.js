autowatch = 1
var p = this.patcher

inlets = 1
outlets = 1

include('globalShapes.js');
include('envelopes.js');

ENVELOPE_GRAIN = 20 //set values for custom envelopes every 20ms

startTime = 0

// TODO do this in max with objects?
POLLING_FREQUENCIES = { // how often you want each parameter to update
  'delaywet': 10000,
  'delayfeedback': 10000,
  'delaytime': 10000,
  'reverbwet': 30000,
  'reverbtime': 30000,
  'distortion': 3000,
  'shift': 20,
  'pan': 100,
}

INITIAL_STATE = {
  1: {
    'delaywet': 0,
    'delayfeedback': 0,
    'delaytime': 0,
    'reverbwet': 0,
    'reverbtime': 0,
    'distortion': 0,
    'shift': 0,
    'pan': 0
  },
  2: {
    'delaywet': 0,
    'delayfeedback': 0,
    'delaytime': 0,
    'reverbwet': 0,
    'reverbtime': 0,
    'distortion': 0,
    'shift': 0,
    'pan': 0
  },
  3: {
    'delaywet': 0,
    'delayfeedback': 0,
    'delaytime': 0,
    'reverbwet': 0,
    'reverbtime': 0,
    'distortion': 0,
    'shift': 0,
    'pan': 0
  },
  4: {
    'delaywet': 0,
    'delayfeedback': 0,
    'delaytime': 0,
    'reverbwet': 0,
    'reverbtime': 0,
    'distortion': 0,
    'shift': 0,
    'pan': 0
  },
}

function objectAssign(target, source) {
  for (var key in source) {
      if (source.hasOwnProperty(key)) {
          target[key] = source[key];
      }
  }
  return target;
}

var state = {};
objectAssign(state, INITIAL_STATE);

function stateString() {
  temp = ''
  for (var key in state) {
    temp += 'Channel ' + String(key);
    for (var k in state[key]) {
      temp += '\n' + String(k) + ': ' + String(state[key][k].toFixed(2));
    }
    temp += '\n\n';
  }
  return temp;
}

function timeElapsed() {
  return this.patcher.getnamed("timeElapsed").getvalueof();
}

function get(channel, parameter) {
  return state[channel][parameter]
}

function set(channel, parameter, value, strength) { // strength 0 = no effect, 1 = changes the value to it
  strength = (strength !== undefined) ? strength : 1; // strength defaults to 1
  
  var channels = [] // allow sending 0 as the channel to apply to all channels
  if (channel == 0) {
    channels = [1,2,3,4]
  } 
  else {
    channels = [channel]
  }
  
  for (var i = 0; i < channels.length; i++) {
    c = channels[i];
    result = (1.0 - strength)*get(c, parameter) + strength*value;
    messnamed(String(c)+"_"+parameter, result);
    state[c][parameter] = result;
  }

  outlet(0, stateString());
}



function reset() {
  set(0, 'delaywet', 0);
  set(0, 'delayfeedback', 0);
  set(0, 'delaytime', 0);

  set(0, 'reverbwet', 0);
  set(0, 'reverbtime', 0);

  set(0, 'distortion', 0);

  set(0, 'shift', 0.5);

  set(0, 'pan', 0.5);

  objectAssign(state, INITIAL_STATE);
  post('Reset')
}

// TODO figure out why taking longer than 1 minute
function sendAutomation (channel, parameter, breakpoints, strength, startTime) { 
  // make all the macro ones 
  strength = (strength !== undefined) ? strength : 1; // strength defaults to 1
  startTime = (startTime !== undefined) ? startTime : 0; // startTime defaults to 0

  var currentIndex = 0; // index of breakpoints array
  var stepCount = startTime / ENVELOPE_GRAIN; // how many ENVELOPE_GRAIN-long steps in we are
  
  var currentTask = new Task(step, this);
  currentTask.interval = ENVELOPE_GRAIN;
  currentTask.repeat();

  function step() {
      var now = stepCount * ENVELOPE_GRAIN;
      stepCount++;
  
      if (currentIndex >= breakpoints.length - 1) {
          set(channel, parameter, breakpoints[breakpoints.length - 1][1], strength);
          currentTask.cancel();
          return;
      }
  
      var t0 = breakpoints[currentIndex][0];
      var v0 = breakpoints[currentIndex][1];
      var t1 = breakpoints[currentIndex + 1][0];
      var v1 = breakpoints[currentIndex + 1][1];
  
      if (now >= t1) {
          currentIndex++;
          step(); // skip ahead immediately
          return;
      }
  
      var frac = (now - t0) / (t1 - t0);
      var value = v0 + frac * (v1 - v0);
      set(channel, parameter, value);
  }
  
  // Optional: stop and reset
  function stop() {
      currentTask.cancel();
  }
}

/* 
SHAPES
*/

// 1-3 seconds long

// 10-15 seconds long

// 60 seconds long

// 20 minutes long are from the global shapes

shapeTest = [[0, 0.5], [500, 1], [2000, 0], [6000, 0.25]]

function globalEnvelope() {
  sendAutomation(0, 'delaywet', delay_strength);
  sendAutomation(0, 'delayfeedback', delay_strength);
  sendAutomation(0, 'delaytime', delay_time);

  sendAutomation(0, 'reverbwet', reverb_strength);
  sendAutomation(0, 'reverbtime', reverb_strength);

  sendAutomation(0, 'distortion', distortion);

  sendAutomation(1, 'shift', channel_1_pitch);
  sendAutomation(2, 'shift', channel_2_pitch);
  sendAutomation(3, 'shift', channel_3_pitch);
  sendAutomation(4, 'shift', channel_4_pitch);

  sendAutomation(1, 'pan', channel_1_pan);
  sendAutomation(2, 'pan', channel_2_pan);
  sendAutomation(3, 'pan', channel_3_pan);
  sendAutomation(4, 'pan', channel_4_pan);
};



// === ENVELOPE INJECTION SETUP ===

var envelopeDensity = 1.0; // global scale, set externally (0–1)

// Replace with your loaded envelope sets
var envelopeBankSimple = [
  quick_oscillation_base0_1s,
  attack_decay_base0_1s,
  pyramid_base0_1s
];

var envelopeBankComplex = [
  decay_bounce_base05_4s,
  double_peak_base05_2s,
  surge_hold_fade_base05_2s
];

// Replace with your probability arcs (e.g., from probability_arcs_emphasized.js)
var probabilityArcs = {
  1: probability_arc_1,
  2: probability_arc_2,
  3: probability_arc_3,
  4: probability_arc_4,
};

// === MAIN RANDOM ENVELOPE FUNCTION ===
// Call this at regular intervals (e.g., every 250ms via a [metro] in Max)

function triggerRandomEnvelopes() {
  var now = timeElapsed(); // in ms
  var paramList = ['delaywet', 'delaytime', 'reverbwet', 'reverbtime', 'distortion', 'shift', 'pan'];

  for (var ch = 1; ch <= 4; ch++) {
    var arc = probabilityArcs[ch];
    var probPoint = arc.find(p => p[0] >= now);
    if (!probPoint) continue;
    var prob = probPoint[1];

    for (var i = 0; i < paramList.length; i++) {
      var param = paramList[i];

      if (Math.random() < prob * envelopeDensity) {
        var envList = Math.random() < 0.5 ? envelopeBankSimple : envelopeBankComplex;
        var env = envList[Math.floor(Math.random() * envList.length)];
        sendAutomation(ch, param, env);
      }
    }
  }
}

// === OPTIONAL: PROGRESSIVE VARIANT ===
// Gradually introduce more complex envelopes from 10–15 min

function triggerProgressiveEnvelopes() {
  var now = timeElapsed(); // in ms
  var paramList = ['delaywet', 'delaytime', 'reverbwet', 'reverbtime', 'distortion', 'shift', 'pan'];

  var complexity = Math.min(1, Math.max(0, (now - 10 * 60000) / (5 * 60000))); // from 10 to 15 min

  for (var ch = 1; ch <= 4; ch++) {
    var arc = probabilityArcs[ch];
    var probPoint = arc.find(p => p[0] >= now);
    if (!probPoint) continue;
    var prob = probPoint[1];

    for (var i = 0; i < paramList.length; i++) {
      var param = paramList[i];

      if (Math.random() < prob * envelopeDensity) {
        var useComplex = Math.random() < complexity;
        var envList = useComplex ? envelopeBankComplex : envelopeBankSimple;
        var env = envList[Math.floor(Math.random() * envList.length)];
        sendAutomation(ch, param, env);
      }
    }
  }
}

// === CONTROL FUNCTION ===
// You can call these from Max messages like: [script triggerRandomEnvelopes] or [script triggerProgressiveEnvelopes]

function setEnvelopeDensity(v) {
  envelopeDensity = Math.max(0.0, Math.min(1.0, v));
  post("Envelope density set to", envelopeDensity, "\n");
}

function testEnvelope() {
  sendAutomation(1, 'shift', shapeTest)
}

function start() {
  post('Timer started.\n')
  globalEnvelope()
}

function pause() {
  post('Timer paused.\n')
}