//specify and load input file.
var input = require("./input.json");

//set global variable
var checkInDate;
var checkOutDate;

//disable or enable logging to console
var logging = false;

//load moment.js library in order to facilitate date recognition.
var moment = require('moment');
moment().format();

//error checking of input file 
//TODO - Check campsites array


//Function to roughly validate yyyy-mm-dd format
//Credit: stackoverflow Thorben Bochenek 9/12/1
function isValidDate(dateString) {
  var regEx = /^\d{4}-\d{2}-\d{2}$/;
  return dateString.match(regEx) != null;
}

// Check search object
if((input.search.startDate) && (input.search.endDate))
{
  //Check that date values match yyyy-mm-dd format
  if(!isValidDate(input.search.startDate) || !isValidDate(input.search.endDate))
  {
    console.warn('Search dates are not in ISO 8601 (yyyy-mm-dd) format!');
    process.exit(1);
  }
  //Convert dates to moment recognized
  //Note that if the string was invalid yyyy-mm-dd such as 2017-02-31 moment will throw an error
  var checkInDate = moment(input.search.startDate);
  var checkOutDate = moment(input.search.endDate).add(1, 'days');
  if(logging)
  {
    console.log("Search check in is " + checkInDate.format('dddd MMMM D'));
    console.log("Search check out is " + checkOutDate.format('dddd MMMM D'));
  }
}else 
{
  //Search dates not found in input json
  console.warn('Your input does not contain a search object with startDate and endDate');
  process.exit(1);
}



//Check rules array
if(input.gapRules.constructor == Array)
{
  //This variable controls which gap rule to use. Assuming safe to hard code as the first one.
  var gapRuleArray = 0;
  var gapNights = Number(input.gapRules[gapRuleArray].gapSize);
} else {

}

//Check reservations array
if(input.reservations.constructor === Array) {
  var reservations = input.reservations;
} else {
  console.warn("input file does not contain array of reservations");
  process.exit(1);
}

// Function to return filtered array of reservations given a campsite id
function campsiteRes(siteId){
  var filtered = reservations.filter(function (reservation) {
    return (reservation.campsiteId === siteId);
  });
  return filtered;
}

//Function that takes a single reservation object and returns true if the reservation does not conflict or false if it does (considering both dates and gap rules)
function resCompare(existingRes)
{
  if(logging) console.log('now comparing this reservation:');
  if(logging) console.log(existingRes);
  var resOK = false;
  var resInDate = moment(existingRes.startDate);
  var resOutDate = moment(existingRes.endDate).add(1, 'days'); 
  var gapBeforeResIn = moment(existingRes.startDate).subtract(gapNights, 'days');
  var gapAfterResOut = moment(existingRes.endDate).add(gapNights+1, 'days'); //see documentation
  if(logging) 
  {
    console.log('Existing reservation in: ' + resInDate.format('YYYY-MM-DD'));
    console.log('Existing reservation out: ' + resOutDate.format('YYYY-MM-DD'));
    console.log('Must match depature to existing arrival or depart on/before: ' + gapBeforeResIn.format('YYYY-MM-DD'));
    console.log('Must start reservation on day of existing res-out or arrive after: ' + gapAfterResOut.format('YYYY-MM-DD'));
  }
  //If existing reservation ends (resOutDate) before or on same day as proposed reservation (checkInDate) starts
  if(resOutDate.isSameOrBefore(checkInDate))
  {
    //Then check gap rule on proposed reservation vs existing check out
    if(checkInDate.isSame(resOutDate) || checkInDate.isSameOrAfter(gapAfterResOut))
    {
      if(logging) console.log('passed the pre-date gap rule');
      resOK = true;
    } else {
      //failed the gap rule between check in and previous reservation
      if(logging) console.log('failed the pre date gap rule');
      return false;
    }
  }

  //If the existing reservation (resInDate) starts AFTER or on the same day as proposed reservation ends (checkOutDate)
  if(resInDate.isSameOrAfter(checkOutDate))
  {
    //mind fuckkkkkkk
    if(checkOutDate.isSame(resInDate) || checkOutDate.isSameOrBefore(gapBeforeResIn))
    {
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

// Function that takes a site ID and returns a boolean true or false if the site is available
function checkAvailability(siteId)
{

  if(logging) console.log('------------------------------------ starting check of availability for site id ' + siteId);
  //pull reservations for campsite
  var resList = campsiteRes(siteId);
  
  //if no reservations return true
  if(resList.length === 0) {
    return true;
  }
  //set a counter for conflicting reservations
  var conflictedRes = 0;
  //for each reservation
  for(var i = 0; i < resList.length; i++)
  {
    if(!resCompare(resList[i])) conflictedRes++;
  }
  if(conflictedRes === 0)
  {
    return true;
  }else
  {
    return false;
  }

}



//Main loop through campsites for availability.
for(var i = 0; i < input.campsites.length; i++)
{
  var currentId = input.campsites[i].id;
  if(checkAvailability(currentId))
  {
    console.log(input.campsites[i].name);
  }
}

