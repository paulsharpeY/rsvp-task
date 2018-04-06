var rsvp_task_experiment = []; // main timeline

// welcome message
var welcome = {
  type: "html-keyboard-response",
  stimulus: "<p class='instructions'>Welcome to the experiment. Press any key to begin.</p>",
  data: {test_part: 'instructions'}
};
rsvp_task_experiment.push(welcome);

// instructions
var instructions = {
  type: "html-keyboard-response",
  stimulus: "<div class='instructions'><p>You will see a series of letters and numbers rapidly " +
            "appearing on the computer screen. Your task is to remember " +
            "the digits in the series.</p><p>When the series ends, you have to " +
            "respond to the question ‘which two digits did you see?’</p><p>You " +
            "type in the digits you saw (order does not matter), and then " +
            "another series will appear.</p>" +
            "<p>Press any key to begin.</p></div>",
  data: {test_part: 'instructions'},
  post_trial_gap: 2000
};
rsvp_task_experiment.push(instructions);

// RSVP stimuli
var letters = alphabetRange('A', 'Z');
var numbers = alphabetRange('2', '9');

// stimuli definitions
var rsvp_iti = {
    type: 'html-keyboard-response',
    stimulus: '<span></span>',
    choices: jsPsych.NO_KEYS,
    trial_duration: 30,
    data: {test_part: 'iti'}
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
var rsvp_stimulus_block = {
    type: 'html-keyboard-response',
    stimulus: jsPsych.timelineVariable('stimulus'),
    choices: jsPsych.NO_KEYS,
    trial_duration: 70,
    data: jsPsych.timelineVariable('data'),
};
var response_block = {
  type: "html-keyboard-response",
  stimulus: jsPsych.timelineVariable('stimulus'),
  choices: numbers,
  data: jsPsych.timelineVariable('data'),
  trial_duration: 5000,
  on_finish: function(data) {
    data.correct    = data.correct_responses.includes(data.key_press); // accuracy irrespective of order
    if ( ! data.lag ) {                                                // only T2 has a lag
	    data.t1_correct = data.correct_response == data.key_press;     // T1 accuracy
	} else {
	    data.t2_correct = data.correct_response == data.key_press;     // T2 accuracy
	}
  }
}

// Factorial design
// 3 locations x 4 lags = 12
var factors = {
    t1_location: [7, 8, 9],
    lag: [1, 3, 5, 8]
};
var practice_repetitions = 2;
var test_repetitions     = 12;

// make slow instruction trial

/* make 24 practice trials (2 repetitions)*/
make_block(jsPsych.randomization.factorial(factors, practice_repetitions), 'practice');

var debrief_block = {
  type: "html-keyboard-response",
  stimulus: function() {
    var trials = jsPsych.data.get().filter({test_part: 'test'});
    var correct_trials = trials.filter({correct: true});
    var accuracy = Math.round(correct_trials.count() / trials.count() * 100);
    var rt = Math.round(correct_trials.select('rt').mean());
/*
    if (>= 50% correct) {
    	// only push this when they pass the test?!  what test?  The _practice_ test!
    } else {
    	// repeat practice
	    return "<p>You responded correctly on "+accuracy+"% of the trials.</p>"+
	    "<p>Your average response time was "+rt+"ms.</p>"+
	    "<p>Press any key to complete the experiment. Thank you!</p>";
	}
*/
  }
};
//rsvp_task_experiment.push(debrief_block);


// build 144 test trials (12 repetitions)
make_block(jsPsych.randomization.factorial(factors, test_repetitions), 'test');


/** functions **/
function alphabetRange (start, end) {
  return new Array(end.charCodeAt(0) - start.charCodeAt(0) + 1).fill().map((d, i) => String.fromCharCode(i + start.charCodeAt(0)));
}
function numberRange (start, end) {
  return new Array(end - start + 1).fill().map((d, i) => i + start);
}

function rsvp_trial(o) {
	var stimuli                    = jsPsych.randomization.sampleWithoutReplacement(letters, 20);
	var targets                    = jsPsych.randomization.sampleWithoutReplacement(numbers, 2);
	stimuli[o.t1_location]         = targets[0];
	stimuli[o.t1_location + o.lag] = targets[1];

	return({stimuli: stimuli, targets: targets.map(jsPsych.pluginAPI.convertKeyCharacterToKeyCode)});
}

function make_block(design, phase) {
	trial_number = 0;
	for (trial in design) {
		trial_number++;
		rsvp_stimuli = rsvp_trial(design[trial]);

		// RSVP: 18 letters, 2 number targets
		var rsvp_block_stimuli = [];
		for (stimulus in rsvp_stimuli.stimuli) {
			rsvp_block_stimuli.push(
	  			{
	  				stimulus: "<span class='rsvp'>" + rsvp_stimuli.stimuli[stimulus] + "</span>",
	  				data: {
	  					phase: phase,
	  					test_part: 'rsvp',
	  					stim: rsvp_stimuli.stimuli[stimulus],
	  					trial_number: trial_number
	  				}
	  			}
	  		);
		}
		// attach RSVP stimuli to a timeline
		var test_procedure = {
			timeline: [rsvp_stimulus_block, rsvp_iti],
			timeline_variables: rsvp_block_stimuli
		}

		// 2 responses
	  	var rsvp_response_stimuli = [];
	  	// T1
	  	rsvp_response_stimuli.push(
			{
				stimulus:'<div class="rsvp">Which two targets did you see?</div>',
				data: {
					phase: phase,
					test_part: 'response',
					correct_responses: rsvp_stimuli.targets,
					correct_response: rsvp_stimuli.targets[0],
					trial_number: trial_number
				}
			}
		);
	  	// T2
		rsvp_response_stimuli.push(
			{
				stimulus:'<div class="rsvp">Which two targets did you see?</div>',
				data: {
					phase: phase,
					test_part: 'response',
					correct_responses: rsvp_stimuli.targets,
					correct_response: rsvp_stimuli.targets[1],
					lag: design[trial].lag,
					trial_number: trial_number
				}
			}
		);
		// attach responses to timeline
		var response_procedure = {
			timeline: [response_block],
			timeline_variables: rsvp_response_stimuli
		}
		rsvp_task_experiment.push(fixation);
		rsvp_task_experiment.push(blank);
		rsvp_task_experiment.push(test_procedure);
		rsvp_task_experiment.push(response_procedure);
	}
}
