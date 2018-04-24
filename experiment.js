var rsvp_task = []; // main timeline

// RSVP stimuli
var letters          = alphabetRange('A', 'Z');
var numbers          = alphabetRange('2', '9');
var response_choices = keyCodeRange('2', '9');

// stimuli definitions
var rsvp_iti = {
    type: 'html-keyboard-response',
    stimulus: '<span></span>',
    choices: jsPsych.NO_KEYS,
    trial_duration: 30,
    data: {test_part: 'iti'}
};
var rsvp_demo_iti = {
    type: 'html-keyboard-response',
    stimulus: '<span></span>',
    choices: jsPsych.NO_KEYS,
    trial_duration: 90,
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
var rsvp_demo_stimulus_block = {
    type: 'html-keyboard-response',
    stimulus: jsPsych.timelineVariable('stimulus'),
    choices: jsPsych.NO_KEYS,
    trial_duration: 210,
    data: jsPsych.timelineVariable('data'),
};
var response_block = {
  type: "html-keyboard-response",
  stimulus: jsPsych.timelineVariable('stimulus'),
  prompt: jsPsych.timelineVariable('prompt'),
  choices: response_choices,
  data: jsPsych.timelineVariable('data'),
  trial_duration: 5000,
  on_finish: function(data) {
    data.correct = data.correct_responses.includes(data.key_press); // accuracy irrespective of order
    if ( ! data.lag ) {                                             // only T2 has a lag
	    data.t1_correct = data.correct_response == data.key_press;  // T1 accuracy
	} else {
	    data.t2_correct = data.correct_response == data.key_press;  // T2 accuracy
	}
  }
}

// full screen
rsvp_task.push({
  type: 'fullscreen',
  message: '<div class="instructions"><p>Welcome to the experiment.</p><p>Press the button below to begin in full screen mode.</p></div>',
  fullscreen_mode: true
});

// instructions
var instructions_1 = {
  type: "html-keyboard-response",
  stimulus: "<div class='instructions'><p>You will see a series of letters and numbers rapidly " +
            "appearing on the computer screen. Your task is to remember " +
            "the digits in the series.</p><p>When the series ends, you have to " +
            "respond to the question ‘which two digits did you see?’</p><p>You " +
            "type in the digits you saw (order does not matter), and then " +
            "another series will appear.</p>" +
            "<p>Press any key to see an example of the task.</p></div>",
  data: {test_part: 'instructions'},
  post_trial_gap: 1000
};
rsvp_task.push(instructions_1);

// make slow instruction trial
rsvp_task.push(make_rsvp_timeline([ {t1_location: 8, lag: 3} ], 'instructions'));

var instructions_2 = {
  type: "html-keyboard-response",
  stimulus: "<div class='instructions'><p>In the example you just saw, " +
            "the letters and numbers appeared quite slowly.</p>" +
            "<p>The real task is more challenging, as the letters and numbers " +
            "will appear much more rapidly.</p>" +
            "<p>You will have some time to practice before starting the test.</p>" +
            "<p>Press any key to start the practice.</p></div>",
  data: {test_part: 'instructions_2'},
  post_trial_gap: 1000
};
rsvp_task.push(instructions_2);


// Factorial design
// 3 locations x 4 lags = 12
var factors = {
    t1_location: [7, 8, 9],
    lag: [1, 3, 5, 8]
};
var practice_repetitions = 1;
var test_repetitions     = 2;
var practice_block       = 0;

var performance_block = {
  type: "html-keyboard-response",
  stimulus: function() {
  	var practice_trials = practice_repetitions * 12;
  	var correct         = 0;
  	for (i = 1; i <= practice_trials; i++) {
  		var trials         = jsPsych.data.get().filter({phase: 'practice' + practice_block});
	    trials             = trials.filter({trial_number: i});
		var correct_trials = trials.filter({correct: true});
		if (correct_trials.count() > 1) correct++;
  	}
    var accuracy = Math.round(correct / practice_trials * 100);
    if (accuracy >= 50) {
    	// practice accuracy achieved, so build test trials
    	var test_timeline = make_rsvp_timeline(jsPsych.randomization.factorial(factors, test_repetitions), 'test');
		jsPsych.addNodeToEndOfTimeline(test_timeline, function(){});
		var thanks = {
		  type: "html-keyboard-response",
		  stimulus: "<div class='instructions'><p>Thank you for completing this task.</p><p>Press any key to continue.</p></div>",
		  trial_duration: 10000,
		  data: {test_part: 'end'}
		};
		jsPsych.addNodeToEndOfTimeline(thanks, function(){});
		var feedback = "<div class='instructions'><p>Well done!  You responded correctly on "+accuracy+"% of the trials.</p>" +
	    "<p>Press any key to start the test.</p></div>";
    } else {
    	// practice accuracy too low, so repeat practice
    	pratice_block++;
    	var practice_timeline = make_rsvp_timeline(jsPsych.randomization.factorial(factors, practice_repetitions), 'practice' + practice_block);
    	practice_timeline.timeline.push(performance_block);
    	jsPsych.addNodeToEndOfTimeline(practice_timeline, function(){});
	    var feedback = "<div class='instructions'><p>You responded correctly on "+accuracy+"% of the trials.</p>" +
	    "<p>You need to score at least 50% before starting the test.</p>" +
	    "<p>Press any key to repeat the practice.</p></div>";
	}
	return feedback;
  }
};
// make initial practice block
rsvp_task.push(make_rsvp_timeline(jsPsych.randomization.factorial(factors, practice_repetitions), 'practice' + practice_block));
rsvp_task.push(performance_block);


/** functions **/
function alphabetRange (start, end) {
  return new Array(end.charCodeAt(0) - start.charCodeAt(0) + 1).fill().map((d, i) => String.fromCharCode(i + start.charCodeAt(0)));
}
function keyCodeRange (start, end) {
	var start = start.charCodeAt(0);
  return new Array(end.charCodeAt(0) - start + 1).fill().map((d, i) => i + start);
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

// Make a block of RSVP stimuli and responses
function make_rsvp_timeline(trials, phase) {
	rsvp_timeline = [];
	trial_number  = 0;
	for (trial in trials) {
		trial_number++;
		rsvp_stimuli = rsvp_trial(trials[trial]);

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
		if (phase == 'instructions') {
			// slow stimuli
			stimulus_trial = rsvp_demo_stimulus_block;
			iti_trial      = rsvp_demo_iti;
		} else {
			stimulus_trial = rsvp_stimulus_block;
			iti_trial      = rsvp_iti;
		}
		var test_procedure = {
			timeline: [stimulus_trial, iti_trial],
			timeline_variables: rsvp_block_stimuli
		}

		// 2 responses
	  	var rsvp_response_stimuli = [];
	  	// T1
	  	rsvp_response_stimuli.push(
			{
				stimulus:'<div class="rsvp">Which two targets did you see?</div>',
				prompt: '<p class="rsvp">(press a number key)</p>',
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
				prompt: '<p class="rsvp">(press another number key)</p>',
				data: {
					phase: phase,
					test_part: 'response',
					correct_responses: rsvp_stimuli.targets,
					correct_response: rsvp_stimuli.targets[1],
					lag: trials[trial].lag,
					trial_number: trial_number
				}
			}
		);
		// attach responses to timeline
		var response_procedure = {
			timeline: [response_block],
			timeline_variables: rsvp_response_stimuli
		}
		rsvp_timeline.push(fixation);
		rsvp_timeline.push(blank);
		rsvp_timeline.push(test_procedure);
		rsvp_timeline.push(response_procedure);
	}
	return { timeline: rsvp_timeline }
}
