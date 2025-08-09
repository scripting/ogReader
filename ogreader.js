const myProductName = "ogReader", myVersion = "0.4.0"; 

const fs = require ("fs");
const request = require ("request"); 
const utils = require ("daveutils"); 
const davehttp = require ("davehttp"); 
const cheerio = require ("cheerio");


var config = { 
	port: process.env.PORT || 1408,
	flLogToConsole: true,
	flAllowAccessFromAnywhere: true
	};

function getMetadataFromHtml (htmlUrl, callback) {
	request (htmlUrl, function (err, response, htmltext) {
		if (err) {
			callback (err);
			}
		else {
			if ((response.statusCode >= 200) && (response.statusCode <= 299)) {
				const $ = cheerio.load (htmltext);
				const ogTags = {};
				$("meta[property^='og:']").each (function () {
					const property = $(this).attr ("property");
					const content = $(this).attr ("content");
					if (property && content) {
						const name = utils.stringDelete (property, 1, 3); //pop off "og:"
						ogTags [name] = content;
						}
					});
				callback (undefined, ogTags);
				}
			else {
				const message = "Couldn't read HTML page because status code == " + response.statusCode;
				callback ({message});
				}
			}
		});
	}

function handleHttpRequest (theRequest, options = new Object ()) { //returns true if request was handled
	const params = theRequest.params;
	
	function returnRedirect (url, code) { //9/30/20 by DW
		var headers = {
			location: url
			};
		if (code === undefined) {
			code = 302;
			}
		theRequest.httpReturn (code, "text/plain", code + " REDIRECT", headers);
		}
		
	function returnPlaintext (theText) {
		theRequest.httpReturn (200, "text/plain", theText);
		}
	function returnNotFound () {
		theRequest.httpReturn (404, "text/plain", "Not found.");
		}
	function returnError (err) {
		theRequest.httpReturn (503, "text/plain", err.message);
		}
	function returnData (jstruct) {
		theRequest.httpReturn (200, "text/json", utils.jsonStringify (jstruct)); //5/9/24 by DW
		}
	function httpReturn (err, data) {
		if (err) {
			if (err.code !== undefined) { //2/22/25 by DW -- let the caller determine the code
				theRequest.httpReturn (err.code, "text/plain", err.message);
				}
			else {
				returnError (err);
				}
			}
		else {
			returnData (data);
			}
		}
	
	switch (theRequest.lowermethod) {
		case "get":
			switch (theRequest.lowerpath) {
				case "/":
					if (params.url === undefined) { //8/9/25 by DW
						returnNotFound ();
						}
					else {
						getMetadataFromHtml (params.url, httpReturn);
						}
					return (true);
				case "/now":
					returnPlaintext (new Date ().toUTCString ());
					return (true);
				default:
					returnNotFound ();
					return (true);
				}
		}
	}

function startup () {
	
	davehttp.start (config, handleHttpRequest);
	
	
	}
startup ();
