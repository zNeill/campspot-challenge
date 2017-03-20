# Neill's Campspot Challenge

Welcome and thank you for your time and consideration. 

# How to Build & Run

## Requisite Software
1. If you do not already have NodeJS installed on your local machine, install the LTS version from [https://nodejs.org](https://nodejs.org) following the instructions appropriate for your operating system. Once installed, you should be able to open a terminal process (or "command prompt" if using Windows) and type in `node`. If you do not get an error, then try a command like `console.log('Hello World!')` to verify proper functionality. If node is working, proceed to the next step.
2. If you do not already have Postman or a similar program for sending JSON data to web services, then please install the Postman extension powered by Google Chrome [here](https://chrome.google.com/webstore/detail/postman/fhbjgbiflinjbdggehcddcbncdddomop?hl=en-US). If you do not already have Google Chrome installed, visit [https://google.com/chrome/](https://google.com/chrome/)
3. I assume, based on the project requirements, that anyone following these directions would already have a Git client installed and be able to clone from a git repo. If not, Git can be downloaded [here](https://git-scm.com).

## Script Installation
4. Create a directory to store my script, such as `/home/username/nlewis`
5. Open up terminal ("command prompt" for windows) and navigate to the directory created in step 4.
6. Enter `git clone https://github.com/zNeill/campspot-challenge.git`
7. Enter `cd campspot-challenge/` to navgate to the newly created directory.
8. Enter `npm install` to install requsite node modules. If you already had node installed on your machine and your NODE_ENV is set to production (In other words, when you enter `npm config get production` you see true), then you'll need to also install the development dependencies (those necessary for testing) separately with `npm install --only=dev`

## Script Execution
9. In a terminal (or "command prompt") window in the campspot-challenge directory enter `node main.js` to start the server. NOTE: See assumption two below. A command line version is available if desired.
10. Open up Postman and set the HTTP verb to POST. Enter http://localhost:3000/ as the address. Click the headers tab and add `Content-Type` with a value of `application/json` Add JSON to test in the text area under the Body tab. The response will consist of an array of strings, each string consisting of the name of the available campsite based on the input provided.
11. Following the directions in the previous step will execute the program using the first gapRule specified in your JSON input. If you would like to specify which rule to use, you can append ?gr=X to the address where X is the index of the gapRule you wish to use, starting with 0. So, from the sample input, if you wanted to use the 3 night gap rule, which was the second rule provided, you would enter http://localhost:3000/?gr=1 into the address field in Postman.
12. Enter Ctrl + C whilst in your terminal ("command prompt") to terminate the program.

## Testing
13. Enter `npm test` into a terminal window whilst in the campspot-challenge directory to execute the test script at **/test/unittest.js**
14. If, for some reason, you wish to enable [excessive] logging to the console, you can do so by setting the logging variable on line 10 of main.js to true.

# High Level of Problem Solving Technique
1. Start examination campsite by campsite to determine whether a site is available.
2. Pull reservations for a campsite and examine them one by one. For each reservation, establish what start times and end times would be in compliance with the specified gapRule and compare these dates to the dates of the existing reservation. Maintain a count of how many reservations do not meet the criteria. If any, the campsite is unavailable.
3. If there are no reservations in conflict with the search, add the reservation to the array of acceptable campsites (or, if using the command line version [assumption two below], print the campsite to the console.

# Assumptions
You know what they say about assumptions...
## Assumption One : Not Matching Reported Example Output
At the risk of, well, my potential future at a job I'm **really** excited about, I believe the reported examples of what sites should be available in the json sample data to be, frankly, wrong. If endDate is the "final date during which the guest will spend the night in the campground", then the date that each reservation would depart is the following day. Thus, if one were to not sell the campsite on the following day, but rather the day after, a one night gap without revenue would occur. In the sample JSON the startDate is 2016-06-07 and the endDate is 2016-06-10, thus indicating a departure of 2016-06-11. As such, it raises suspicion that "Daniel Boone Bungalow" (siteId:5) is listed as valid, when one of the reservations for this campsite checks in on 2016-06-12. A departure on 2016-06-11 (one day after endDate), and an arrival on 2016-06-12 would leave the campground without revenue from this site on the night of 11 June, which would seem to violate the two day gap rule. Furthermore, it seemed odd that both "Bear Grylls Cozy Cave" and "Wyatt Earp Corral" were on the list of available campsites as provided with the challenge, as the former has a reservation endDate of 2016-06-05 and the ladder has a reservation with endDate of 2016-06-06. It would seem that these dates cannot _both_ be accurate when considering a gapRule and check in on 2016-06-07.
Accordingly, I have thus begun to assume that the campspot challenge itself has an inception-like challenge within, to detect this error. I thus made it my mission to build the software to accurately avoid gap dates which might cause a campground owner a loss of revenue, rather than to reverse engineer the software to provide the desired output. I could be wrong, I have been before, but I really hope I'm not, or that whoever is reading this will appreciate my logic. 

## Assumption Two : Web Service
I made one [additional] major assumption about this challenge: that was that it would be acceptable to design this program as a web service. My justification was that I was to "choose a tech stack that I am comfortable with", and as such I chose to deploy this app as a simplistic API powered by node/express, as this stack had software testing options with which I am most familiar. However, in re-reading later I noticed that there were very specific instructions to accept a json input _file_, so, I actually ammended my script to accept such a file, whilst keeping all core logic behind processing _EXACTLY_ the same.
### Command-Line Program Usage Instructions
1. Complete steps 1 through 8 from the installation instructions above.
2. Open up a terminal ("command prompt") window and navigate to the campspot-challenge/ directory.
3. Enter `vim input.json` where `vim` a variable indicating the name of your favorite text editing program. For Windows users, it may be easier/advisbale to instead navigate to the campspot-challenge/ directory in Windows Explorer and open up the input.json file with your favorite text editor.
4. Replace the contents of the `input.json` file with your preferred json for testing/input into the program.
5. In a terminal window (which should be in the campspot-challenge/ directory, enter `node localInput.js`
6. Observe results on the screen. These results assume usage of the first entry in the gapRules array. If you would like to manually indicate which gapRule to use, enter `-gr` as a command line argument followed by a space and then the index of the rule you wish to use, starting with 0. For example, entering `node localInput.js -gr 1` will use the second gap rule provided in the json file.