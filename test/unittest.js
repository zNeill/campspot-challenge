var expect = require('chai').expect;
var request = require('request');
require('../main.js');

describe("Test various date logics", function () {
    var result; // Used to store the result
    // First we call the service
    before(function (done) {
        // Configure the call with content-type and uri
        var options = {
            headers: { "Content-Type": "application/json"},
            uri: 'http://localhost:3000/products',
            json: {
            
              "search" : {
                "startDate": "2017-03-15",
                "endDate": "2017-03-20"
              },
              "campsites": [

                { "id": 1, "name":"No Gap"},
                { "id": 2, "name":"Booked Same Days"},
                { "id": 3, "name":"One Day Gap after search"},
                { "id": 3, "name":"One Day Gap before search"},
                { "id": 4, "name":"Two Day Gap before search"}
                { "id": 5, "name":"Two Day Gap after search"},
                { "id": 6, "name":"Match Before and Two Day Gap After"}
                { "id": 7, "name":"Overlapping"}
              ],
              "gapRules": [
                {"gapSize": 2},
                {"gapSize": 1}
              ],
              "reservations":[
                {"campsiteId": 1, "startDate":"2017-03-01", "endDate":"2017-03-08"},
                {"campsiteId": 1, "startDate":"2017-03-10", "endDate":"2017-03-14"},
                {"campsiteId": 1, "startDate":"2017-03-21", "endDate":"2017-03-22"},
                {"campsiteId": 2, "startDate":"2017-03-15", "endDate":"2017-03-20"},
                {"campsiteId": 2, "startDate":"2017-03-20", "endDate":"2017-03-25"},
                {"campsiteId": 3, "startDate":"2017-03-22", "endDate":"2017-03-30"},
                {"campsiteId": 4, "startDate":"2017-03-09", "endDate":"2017-03-12"},
                {"campsiteId": 4, "startDate":"2017-03-31", "endDate":"2017-04-02"},
                {"campsiteId": 5, "startDate":"2017-03-23", "endDate":"2017-03-26"},
                {"campsiteId": 5, "startDate":"2017-03-11", "endDate":"2017-03-12"},
                {"campsiteId": 6, "startDate":"2017-03-01", "endDate":"2017-03-03"},
                {"campsiteId": 7, "startDate":"2017-03-01", "endDate":"2017-03-11"},
                {"campsiteId": 7, "startDate":"2017-03-12", "endDate":"2017-03-13"},
                {"campsiteId": 7, "startDate":"2017-03-16", "endDate":"2017-03-16"}
              ]


              }
          
          }
        };
        // Make call
        request.get(options, function (err, res, body) {
            result = {err, res, body};
            done();
        });
        
    });
    // Test the result
    it('should execute without errors', function (done) {
       expect(result.err).to.equal(null);
       done();
    });
    it('should return an array', function (done) {
       expect(result.body).constructor.to.equal('Array');
       done();
    });
    it('should return two available sites', function (done) {
       expect(result.body.length).to.equal(2);
       done();
    });
    it('should return lake haus', function (done) {
       expect(result.body[0]).to.equal(1);
       done();
    });
    it('should return two ', function (done) {
       expect(result.err).to.equal(null);
       done();
    });
});
