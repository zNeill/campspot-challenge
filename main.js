var express = require('express')
  , bodyParser = require('body-parser');
var app = express();

//set global variable for search dates
var checkInDate;
var checkOutDate;

//disable or enable logging to console
var logging = true;

//load moment.js library in order to facilitate date recognition.
var moment = require('moment');
moment().format();


//Function to roughly validate yyyy-mm-dd format
//Credit: stackoverflow user Thorben Bochenek 9/12/13
function isValidDate(dateString) {
  var regEx = /^\d{4}-\d{2}-\d{2}$/;
  return dateString.match(regEx) != null;
}

// Function to return filtered array of reservations given a campsite id
function campsiteRes(siteId,reservations) {
  var filtered = reservations.filter(function (reservation) {
    return (reservation.campsiteId === siteId);
  });
  return filtered;
}

//Function that takes a single reservation object and returns true if the reservation does not conflict or false if it does (considering both dates and gap rules)
function resCompare(existingRes,search) {
  if(logging) console.log('now comparing this reservation:');
  if(logging) console.log(existingRes);
  var resOK = false;
  var checkInDate = moment(search.startDate);
  var checkOutDate = moment(search.endDate); 
  var resInDate = moment(existingRes.startDate);
  var resOutDate = moment(existingRes.endDate);
  var gapBeforeResIn = moment(existingRes.startDate).subtract(gapNights, 'days');
  var gapAfterResOut = moment(existingRes.endDate).add(gapNights, 'days'); 
  if(logging) {
    console.log('Existing reservation in: ' + resInDate.format('YYYY-MM-DD'));
    console.log('Existing reservation out: ' + resOutDate.format('YYYY-MM-DD'));
    console.log('Must match depature to existing arrival or depart on/before: ' + gapBeforeResIn.format('YYYY-MM-DD'));
    console.log('Must start reservation on day of existing res-out or arrive after: ' + gapAfterResOut.format('YYYY-MM-DD'));
  }
  //If existing reservation ends (resOutDate) before or on same day as proposed reservation (checkInDate) starts
  if(resOutDate.isSameOrBefore(checkInDate))  {
    //Then check gap rule on proposed reservation vs existing check out
    if(checkInDate.isSame(resOutDate) || checkInDate.isSameOrAfter(gapAfterResOut)) {
      if(logging) console.log('passed the pre-date gap rule');
      resOK = true;
    } else {
      //failed the gap rule between check in and previous reservation
      if(logging) console.log('failed the pre date gap rule');
      return false;
    }
  }

  //If the existing reservation (resInDate) starts AFTER or on the same day as proposed reservation ends (checkOutDate)
  if(resInDate.isSameOrAfter(checkOutDate)) {
    if(checkOutDate.isSame(resInDate) || checkOutDate.isSameOrBefore(gapBeforeResIn)) {
      if(logging) console.log('passed the post date gap rule');
      resOK = true;
    } else {
      //failed the gap rule between check out and next reservation
      if(logging) console.log('failed the post date gap rule');
      return false;
    }
  }
  return resOK;
}

// Function that takes a list of reservations for a given campsite and returns a boolean true or false if the site is available
function checkAvailability(resList,search) {
  if(logging) console.log('------------------------------------ starting check of availability for site');
  //if no reservations return true
  if(resList.length === 0) {
    return true;
  }
  //set a counter for conflicting reservations
  var conflictedRes = 0;
  //for each reservation
  for(var i = 0; i < resList.length; i++)  {
    if(!resCompare(resList[i],search)) conflictedRes++;
  }
  if(conflictedRes === 0) {
    return true;
  }else{
    return false;
  }   
}

app.use(bodyParser.json());

//Basic usage instructions
app.get('/', function(req, res) {
  res.status(400).send('POST json object to this address to return list of bookings');
});



app.post('/', function(req, res) {
  
  //prefer input as terminology
  var input = req.body;
  
  ///////////////////////////////////
  // Error Checking of Input Data  //
  ///////////////////////////////////


  // Check search object
  if(input.search.hasOwnProperty('startDate') && input.search.hasOwnProperty('endDate')) {
    //Check that date values match yyyy-mm-dd format
    if(!(isValidDate(input.search.startDate) && isValidDate(input.search.endDate))) {
      res.status(400).send('Search dates are not in ISO 8601 (yyyy-mm-dd) format!');  
    }

    if(moment(input.search.startDate).isAfter(input.search.endDate)) {
      res.status(400).send('Search dates are invalid. Check your input.');
    }
    
    if(logging) {
      console.log("Search check in is " + moment(input.search.startDate).format('dddd MMMM D'));
      console.log("Search check out is " + moment(input.search.endDate).format('dddd MMMM D'));
    }
  }else {
    //Search dates not found in input json
    res.status(400).send('Your input does not contain a search object with startDate and endDate'); 
  }

  //Check rules array
  if(input.gapRules.constructor == Array) {
    for(var i = 0; i < input.gapRules.length; i++) {
      if(!input.gapRules[i].gapSize.constructor == Number) res.status(400).send('Check the format of your rules array input')
    }
    //If gap rule was provided as URL variable and is in the array of gaprules, then use the specified gap rule (adjusting for starting at 0) or use the first gap rule if none specified. 
    if(typeof req.query.gapRule !== 'undefined') {
      if(-1 < Number(req.query.gapRule) <= input.gapRules.length)  var gapRuleI = req.query.gapRule;
    }else {
      var gapRuleI = 0;
    }
    var gapNights = Number(input.gapRules[gapRuleI].gapSize);
  }

  //Check reservations array
  if(input.reservations.constructor === Array) {
    for(var i = 0; i < input.reservations.length; i++) {
      if(!(isValidDate(input.reservations[i].startDate) && isValidDate(input.reservations[i].endDate))) res.status(400).send('check date format in reservation ' + i);
    }
  } else {
    res.status(400).send("Input file does not contain array of reservations");
  }

  ///////////////////////////////////////////////////
  // Main loop through campsites for availability. //
  ///////////////////////////////////////////////////
  
  for(var i = 0; i < input.campsites.length; i++)  {
    //pull reservations for campsite
    var resList = campsiteRes(input.campsites[i].id,input.reservations);
    var matchingSites = [];

    //check if site is available
    if(checkAvailability(input.campsites[i].id,resList,input.search)) {
      matchingSites.push(input.campsites[i].name);
    }
  }
  if(matchingSites.length > 0) {
    res.send(matchingSites);
  } else{
    res.send('No Campsites Available');
  }
});

app.listen(3000);
