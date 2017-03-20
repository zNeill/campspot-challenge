
// Requisites
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var moment = require('moment'); //for easy to read date comparisons
moment().format();

//disable or enable logging to console
var logging = false;

//Function to roughly validate yyyy-mm-dd format
//stackoverflow user Thorben Bochenek 9/12/13
function isValidDate(dateString) {
  var regEx = /^\d{4}-\d{2}-\d{2}$/;
  return dateString.match(regEx) != null;
}

//Return array of reservations for a single campsite
function campsiteRes(siteId,reservations) {
  var filtered = reservations.filter(function (reservation) {
    return (reservation.campsiteId === siteId);
  });
  return filtered;
}
  

//////////////////////////
// Compare Reservations //
//////////////////////////
function resCompare(existingRes,search,gapNights) {
//Function that takes a single reservation object and returns true if the reservation does not conflict or false if it does (considering both dates and gap rules)
  if(logging) console.log('now comparing this reservation:');
  if(logging) console.log(existingRes);
  var resOK = false;
  var checkInDate = moment(search.startDate);
  var checkOutDate = moment(search.endDate).add(1, 'days'); //json end date is final night at campground
  var resInDate = moment(existingRes.startDate);
  var resOutDate = moment(existingRes.endDate).add(1, 'days'); //json end date is final night at the campgroun
  var gapBeforeResIn = moment(existingRes.startDate).subtract(gapNights, 'days');
  var gapAfterResOut = moment(existingRes.endDate).add(gapNights+1, 'days'); 
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
      resOK = false;
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
      resOK = false;
    }
  }
  return resOK;
}

///////////////////////////////////////////
// Check all reservations for a campsite //
///////////////////////////////////////////
function checkAvailability(resList,search,gapNights) {
  if(logging) console.log('------------------------------------ starting check of availability for site');
  //if no reservations return true
  console.log();
  if(resList.length === 0) {
    return true;
  }
  //set a counter for conflicting reservations
  var conflictedRes = 0;
  //for each reservation
  for(var i = 0; i < resList.length; i++)  {
    //compare reservations
    if(!resCompare(resList[i],search,gapNights)) conflictedRes++;
  }
  if(conflictedRes === 0) {
    return true;
  }else{
    return false;
  }   
}

//Expect and parse JSON input
app.use(bodyParser.json());

//Basic usage instructions
app.get('/', function(req, res) {
  res.status(400).send('POST json object to this address to return list of bookings');
});


//////////////////////////////////////////////////////////
// Starting Point | HTTP POST sent to http://localhost/ //
//////////////////////////////////////////////////////////
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
  if(input.gapRules.constructor === Array) {
    for(var i = 0; i < input.gapRules.length; i++) {
      if(!(input.gapRules[i].gapSize.constructor === Number)) res.status(400).send('Check the format of your rules array input')
    }
    //If gap rule URL variable (ex ?gr=2) and is in the array of gaprules
    //then use the specified gap rule (adjusting for starting at 0) or use the first gap rule if none specified. 
    if(req.query.gr < input.gapRules.length && req.query.gr >= 0) {
      var gapRuleI = req.query.gr;
    }else {
      var gapRuleI = 0;
    }
    var gapNights = Number(input.gapRules[gapRuleI].gapSize);
  }else{
    res.status(400).send('Check the format of gapRules in your input!');
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
  
  var matchingSites = [];
  for(var i = 0; i < input.campsites.length; i++)  {
    //pull reservations for campsite
    var resList = campsiteRes(input.campsites[i].id,input.reservations);
    //check if site is :available
    var isAvailable = checkAvailability(resList,input.search,gapNights);
    if(isAvailable === true) {
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
