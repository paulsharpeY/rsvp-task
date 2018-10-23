context('RSVP')

## JSON data
participants = data.frame(token = c('06eaaeeb-fab1-4c7f-a00f-3e66f063adcb','0117a606-a57c-40a2-87fe-258afa6f007c'))

fixture_dir <- '../fixtures/1'
path <- paste0(fixture_dir,'/',participants[1,1],'_finished/rsvp-task-results.json')
test_that("process_rsvp() can process a JSON file", {
  expect_silent(process_rsvp(path, p=1))
})

