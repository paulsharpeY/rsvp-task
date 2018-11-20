context('RSVP')

## JSON data
participants = data.frame(token = c('1','2'))

fixture_dir <- '../fixtures/1'
path <- paste0(fixture_dir,'/',participants[1,1],'/rsvp-task-results.json')
test_that("process_rsvp() can process a JSON file", {
  expect_silent(process_rsvp(path, p=1))
})

