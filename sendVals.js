// sendVals_cleaned.js
autowatch = 1;

inlets = 1;
outlets = 1;

// === INCLUDES ===
include('globalShapes.js');
include('envelopes.js');
include('probability_arcs_emphasized.js');

// === GLOBAL CONSTANTS ===
var ENVELOPE_GRAIN = 50;
var envelopeDensity = 1.0;
var playbackSpeed = 1.0;

// === PARAMETER SETUP ===
var PARAMETERS = ['delaywet', 'delayfeedback', 'delaytime', 'reverbwet', 'reverbtime', 'distortion', 'shift', 'pan'];
var PARAMETERS_FOR_ENVELOPE = ['distortion', 'shift', 'pan']
var CHANNELS = [1, 2, 3, 4];

var POLLING_FREQUENCIES = {
  'delaywet': 10000, 'delayfeedback': 10000, 'delaytime': 10000,
  'reverbwet': 30000, 'reverbtime': 30000,
  'distortion': 3000, 'shift': 50, 'pan': 100,
};

var INITIAL_STATE = {};
for (var i in CHANNELS) {
  var ch = CHANNELS[i];
  INITIAL_STATE[ch] = {};
  for (var j in PARAMETERS) {
    var p = PARAMETERS[j];
    INITIAL_STATE[ch][p] = (p === 'shift' || p === 'pan') ? 0.5 : 0;
  }
  INITIAL_STATE[ch]['probability'] = 0;

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


// === UTILITY FUNCTIONS ===
function timeElapsed() {
  return this.patcher.getnamed("timeElapsed").getvalueof();
}

function setPlaybackSpeed(num) {
  playbackSpeed = num;
}

function get(channel, parameter) {
  return state[channel][parameter];
}

function set(channel, parameter, value, strength) {
  strength = (strength !== undefined) ? strength : 1;
  var channels = channel === 0 ? CHANNELS : [channel];
  for (var i in channels) {
    var c = channels[i];
    var result = (1.0 - strength) * get(c, parameter) + strength * value;
    messnamed(String(c) + "_" + parameter, result);
    state[c][parameter] = result;
  }
  outlet(0, stateString());
}

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

// === GLOBAL VARIABLES ===
var activeTasks = []; // Array to store all active tasks

// === RESET FUNCTION ===
function reset() {
  // Cancel all active tasks
  for (var i = 0; i < activeTasks.length; i++) {
    activeTasks[i].cancel();
  }
  activeTasks = []; // Clear the activeTasks array

  // Reset state
  set(0, 'shift', 0.5);
  set(0, 'pan', 0.5);
  for (var i in PARAMETERS) {
    var p = PARAMETERS[i];
    if (p !== 'shift' && p !== 'pan') set(0, p, 0);
  }
  objectAssign(state, INITIAL_STATE);
  post('Reset\n');
}

// === GLOBAL SCALING FACTOR ===
var strengthScalingMin = 0; // Default minimum scaling value

function setStrengthScalingMin(value) {
  strengthScalingMin = Math.max(0, Math.min(1, value)); // Clamp between 0 and 1
  // post("Strength scaling minimum set to", strengthScalingMin, "\n");
}

// === AUTOMATION SYSTEM ===
function sendAutomation(channel, parameter, breakpoints, strength) {
  strength = (strength !== undefined) ? strength : 1;
  var currentIndex = 0;
  var stepCount = 0;
  
  var currentTask = new Task(step, this);
  currentTask.interval = ENVELOPE_GRAIN;
  // post('Automation points will update at interval of ' + String(currentTask.interval) + ' ms.');

  // Add the task to the activeTasks array
  activeTasks.push(currentTask);

  currentTask.repeat();

  function step() {
    var now = timeElapsed() * 1000;
    
    stepCount++;

    if (currentIndex >= breakpoints.length - 1) {
      set(channel, parameter, breakpoints[breakpoints.length - 1][1], strength);
      currentTask.cancel();

      // Remove the task from activeTasks when completed
      for (var i = 0; i < activeTasks.length; i++) {
        if (activeTasks[i] === currentTask) {
          activeTasks.splice(i, 1); // Remove the task from the array
          break;
        }
      }
      return;
    }

    var t0 = breakpoints[currentIndex][0] / playbackSpeed; // Scale the breakpoint times
    var v0 = breakpoints[currentIndex][1];
    var t1 = breakpoints[currentIndex + 1][0] / playbackSpeed; // Scale the breakpoint times
    var v1 = breakpoints[currentIndex + 1][1];

    if (now >= t1) {
      currentIndex++;
      step();
      return;
    }

    var frac = (now - t0) / (t1 - t0);
    var value = v0 + frac * (v1 - v0);
    set(channel, parameter, value);
  }
}

// === ENVELOPE BANKS ===
var envelopeBankSimple = [quick_oscillation_base0_1s, attack_decay_base0_1s, pyramid_base0_1s];
var envelopeBankComplex = [decay_bounce_base05_4s, double_peak_base05_2s, surge_hold_fade_base05_2s];

var probabilityArcs = {
  1: probability_arc_1,
  2: probability_arc_2,
  3: probability_arc_3,
  4: probability_arc_4,
};

// === ENVELOPE TRIGGERS ===
function triggerRandomEnvelopes() {
  var now = timeElapsed() * 1000; // Convert to ms
  for (var i in CHANNELS) {
    var ch = CHANNELS[i];
    var arc = probabilityArcs[ch];
    var prob = 0;
    for (var k = 0; k < arc.length; k++) {
      // post('arc k 0 = ' + String(arc[k][0] / playbackSpeed) + '\n')
      if (arc[k][0] / playbackSpeed >= now) { // Scale the arc time
        prob = arc[k][1];
        break;
      }
    }
    state[ch]['probability'] = prob;
    // post('Envelope probability at ' + String(now) + ' ms is ' + String(prob))

    var strength = strengthScalingMin + prob * (1 - strengthScalingMin); // Scale strength
    for (var j in PARAMETERS_FOR_ENVELOPE) {
      var param = PARAMETERS_FOR_ENVELOPE[j];
      if (Math.random() < prob * envelopeDensity) {
        var bank = Math.random() < 0.5 ? envelopeBankSimple : envelopeBankComplex;
        var env = bank[Math.floor(Math.random() * bank.length)];
        sendAutomation(ch, param, env, strength); // automation still takes the desired fixed amount of time
        // post('Envelope sent to ch ' + String(ch) + ' ' + param)
      }
    }
  }
}

function setEnvelopeDensity(v) {
  envelopeDensity = Math.max(0.0, Math.min(1.0, v));
  // post("Envelope density set to", envelopeDensity, "\n");
}

// === TESTING ===
function testEnvelope() {
  sendAutomation(1, 'shift', [[0, 0.5], [500, 1], [2000, 0], [6000, 0.25]]);
}

function start() {
  post('Timer started.\n');
  
  sendAutomation(0, 'delaywet', delay_strength, 1);
  sendAutomation(0, 'delayfeedback', delay_strength, 1);
  sendAutomation(0, 'delaytime', delay_time, 1);
  sendAutomation(0, 'reverbwet', reverb_strength, 1);
  sendAutomation(0, 'reverbtime', reverb_strength, 1);
  sendAutomation(0, 'distortion', distortion, 1);
  sendAutomation(1, 'shift', channel_1_pitch, 1);
  sendAutomation(2, 'shift', channel_2_pitch, 1);
  sendAutomation(3, 'shift', channel_3_pitch, 1);
  sendAutomation(4, 'shift', channel_4_pitch, 1);
  sendAutomation(1, 'pan', channel_1_pan, 1);
  sendAutomation(2, 'pan', channel_2_pan, 1);
  sendAutomation(3, 'pan', channel_3_pan, 1);
  sendAutomation(4, 'pan', channel_4_pan, 1);
}

function pause() {
  post('Timer paused.\n');
}