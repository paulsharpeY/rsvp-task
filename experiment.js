/* create timeline */
var rsvp_task_experiment = [];

/* functions */
function alphabetRange (start, end) {
  return new Array(end.charCodeAt(0) - start.charCodeAt(0) + 1).fill().map((d, i) => String.fromCharCode(i + start.charCodeAt(0)));
}
function numberRange (start, end) {
  return new Array(end - start + 1).fill().map((d, i) => i + start);
}

/* define welcome message trial */
var welcome = {
  type: "html-keyboard-response",
  stimulus: "<p class='instructions'>Welcome to the experiment. Press any key to begin.</p>"
};
rsvp_task_experiment.push(welcome);

/* define instructions trial */
var instructions = {
  type: "html-keyboard-response",
  stimulus: "<div class='instructions'><p>You will see a series of letters and numbers rapidly " +
            "appearing on the computer screen. Your task is to remember " +
            "the digits in the series.</p><p>When the series ends, you have to " +
            "respond to the question ‘which two digits did you see?’</p><p>You " +
            "type in the digits you saw (order does not matter), and then " +
            "another series will appear.</p>" +
            "<p>Press any key to begin.</p></div>",
  post_trial_gap: 2000
};
rsvp_task_experiment.push(instructions);

/* practice trials */

/* test trials */
var letters = alphabetRange('A', 'Z');
var numbers = alphabetRange('2', '9');
var factors = {
    t1_location: [7, 8, 9],
    lag: [1, 3, 5, 8]
}
var design = jsPsych.randomization.factorial(factors, 12);
function rsvp_stimuli(o) {
	var stimuli                    = jsPsych.randomization.sampleWithoutReplacement(letters, 20);
	var trial_numbers              = jsPsych.randomization.sampleWithoutReplacement(numbers, 2);
	stimuli[o.t1_location]         = trial_numbers[0];
	stimuli[o.t1_location + o.lag] = trial_numbers[1];

	return(stimuli);
}

// static stimuli
var rsvp_stimulus_block = {
    type: 'html-keyboard-response',
    stimulus: jsPsych.timelineVariable('stimulus'),
    choices: jsPsych.NO_KEYS,
    trial_duration: 70,
    data: jsPsych.timelineVariable('data'),
};
var rsvp_iti = {
    type: 'html-keyboard-response',
    stimulus: '<span></span>',
    choices: jsPsych.NO_KEYS,
    trial_duration: 30,
};
var fixation = {
  type: 'html-keyboard-response',
  stimulus: '<div class="rsvp">+</div>',
  choices: jsPsych.NO_KEYS,
  trial_duration: 2000,
  data: {test_part: 'fixation'}
}
var blank = {
  type: 'html-keyboard-response',
  stimulus: '<div class="rsvp"></div>',
  choices: jsPsych.NO_KEYS,
  trial_duration: 250,
  data: {test_part: 'blank'}
}
var test = {
  type: "html-keyboard-response",
  stimulus: jsPsych.timelineVariable('stimulus'),
  choices: ['f', 'j'],
  data: jsPsych.timelineVariable('data'),
  on_finish: function(data){
    data.correct = data.key_press == jsPsych.pluginAPI.convertKeyCharacterToKeyCode(data.correct_response);
  },
}
var response = {
  type: "html-keyboard-response",
  stimulus: '<div class="rsvp">Which two targets did you see?</div>',
  choices: numbers,
  data: jsPsych.timelineVariable('data'),
  trial_duration: 2000,
  /*
  store accuracy for both?
  on_finish: function(data){
    data.correct = data.key_press == jsPsych.pluginAPI.convertKeyCharacterToKeyCode(data.correct_response);
  },
  */
}

for (trial in design) {  // loop over Array indexes
	stimuli = rsvp_stimuli(design[trial]);
	var rsvp_block_stimuli = [];
	for (stimulus in stimuli) {
		rsvp_block_stimuli.push(
  			{
  				stimulus: "<span class='rsvp'>" + stimuli[stimulus] + "</span>",
  				data: { test_part: 'test' }
  				// FIXME: add correct responses
  			}
  		);
	}
	// attach trial to a timeline
	var test_procedure = {
		timeline: [rsvp_stimulus_block, rsvp_iti],
		timeline_variables: rsvp_block_stimuli
	}
	rsvp_task_experiment.push(fixation);
	rsvp_task_experiment.push(blank);
	rsvp_task_experiment.push(test_procedure);
	//FIXME: need 2 responses
	rsvp_task_experiment.push(response);
	rsvp_task_experiment.push(response);
}

var debrief_block = {
  type: "html-keyboard-response",
  stimulus: function() {
    var trials = jsPsych.data.get().filter({test_part: 'test'});
    var correct_trials = trials.filter({correct: true});
    var accuracy = Math.round(correct_trials.count() / trials.count() * 100);
    var rt = Math.round(correct_trials.select('rt').mean());

    return "<p>You responded correctly on "+accuracy+"% of the trials.</p>"+
    "<p>Your average response time was "+rt+"ms.</p>"+
    "<p>Press any key to complete the experiment. Thank you!</p>";

  }
};
rsvp_task_experiment.push(debrief_block);