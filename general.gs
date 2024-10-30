/*
--  Automated League of Legends Spreadsheet
--  Version - v7.0.0
--  Current League Patch: 14.21
--  Developers:	Lucas Nagy
--  Edited and updated for s14 and new riot API by Cathal O'Connor
--
--  
--  File: general.gs
--  Last Updated: 2024-10-29 v7.0.0
*/

/**
 * @OnlyCurrentDoc
 */

//{		Global Variables
var apiKey = ""; // Riot Games API Key
var region = ""; // Players Region
var route = ""; // Regions Route

var getCSatX = ""; // Timeline API Call - default Blank for false
var getSupportQuest = false; // Timeline API Call - default false
var getOpponents = false; // Logic Calculation / Opponent Champion Loop - default false

var language = ""; // Players Language - Only Used for Champion Names
var	timezone = ""; // Players Timezone - If Blank defaults to Server Timezone
var summoner = {name:"", accountId:"", id:"", puuid:"", tag:""}; // Summoner Object
var rank = {tier:"Unranked",division:"4",beforeLP:"0",afterLP:"0",deltaLP:"0",queue:"",ran:0}; // Rank Object
//}

//{		Custom Menu
function onOpen(){
	try{
		var ui = SpreadsheetApp.getUi();
		ui.createMenu('League of Legends')
			.addItem('Match History - Update','updateMatchHistory')
			.addItem('Champions - Update','updateChampions')
      .addItem('Champions - Sort','sortChampions')
			.addItem('Version','versionPrompt')
      .addItem('Version Migration','migrateVersions')
      .addItem('Add Auto-Update - Every 15 Minutes','autoFifteen')
      .addItem('Add Auto-Update - Every 30 Minutes','autoThirty')
      .addItem('Remove Auto-Updates','removeAuto')
			.addToUi();
	}catch(error){}
}
//}

//{		Version
// Returns the version of the Spreadsheet - Can be accessed by typing =version() into any cell
function version(){
	return "v6.1.0";
}

// Alerts the user with the current version of the Spreadsheet
function versionPrompt(){
	SpreadsheetApp.getUi().alert("Current Version: "+version());
}
//}

//{		Patch

// Returns the Generic Patch Number
function patchNumber(){
	// Getting Started Sheet
	var gettingStartedSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Getting Started");
	
	// Get the Selected Region from the Getting Started Sheet
	var region = gettingStartedSheet.getRange("").getValue();
	
	// Get Current Patch Object for the Selected Region
	var patchObject = currentPatch(region);
	
	// Convert the full Patch Version into a 0.00 Format
	var patchNumber = '' + patchObject['v'].split('.')[0] + '.' + patchObject['v'].split('.')[1];
	
	return patchNumber;
}

//}

//{   Auto-Updaters aka Time Driven Triggers

function autoFifteen(){
  removeAuto();
  ScriptApp.newTrigger('updateMatchHistory')
    .timeBased()
    .everyMinutes(15)
    .create();
}

function autoTwenty(){
  removeAuto();
  ScriptApp.newTrigger('updateMatchHistory')
    .timeBased()
    .everyMinutes(20)
    .create();
}

function autoThirty(){
  removeAuto();
  ScriptApp.newTrigger('updateMatchHistory')
    .timeBased()
    .everyMinutes(30)
    .create();
}

function removeAuto(){
  // Loop over all triggers.
  var allTriggers = ScriptApp.getProjectTriggers();
  for (let index = 0; index < allTriggers.length; index++) {
    ScriptApp.deleteTrigger(allTriggers[index]);
  }
}
  
//}

//{		Startup
// This function sets global variables
function startup(){
	// Cache
	var cache = CacheService.getScriptCache();
	
	// Sheets
	var gettingStartedSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Getting Started");
	
	// Set the Global Variables
	apiKey = gettingStartedSheet.getRange("A2").getValue();
	region = gettingStartedSheet.getRange("A4").getValue();
	language = gettingStartedSheet.getRange("Z1").getValue();
	getCSatX = gettingStartedSheet.getRange("A16").getValue();
  getSupportQuest = gettingStartedSheet.getRange("A18").getValue();

	// Timezone needs to be converted to a number
	timezone = gettingStartedSheet.getRange("A12").getValue();
	if (timezone != 0 & timezone != ""){
		timezone = (parseInt((timezone.slice(4)).split(':')[0]) + (timezone.slice(4)).split(':')[1]/60)*3600000;
	}else {
		timezone = 0;
	}
	
	// Global Summoner Information
	// Check the Cache - Update only if required
	summoner['name'] = (gettingStartedSheet.getRange("A6").getValue()).toLowerCase().replace(/\s+/g,'');
  summoner['tag'] = (gettingStartedSheet.getRange("A8").getValue()).replace(/\s+/g,'');

  	// Global Route Information
	switch(region){
		case "NA1": case "BR1": case "LA1": case "LA2":
			route = "AMERICAS";
			break;
		case "KR": case "JP1":
			route = "ASIA";
			break;
		case "EUW1": case "EUN1": case "TR1": case "RU":
			route = "EUROPE";
			break;
    case "PH2": case "SG2":  case "TH2":  case "TW2":  case "VN2":  case "OC1":
      route = "SEA";
      break;
		default:
			route = "AMERICAS";
			break;
	}
	var cachedSummoner = cache.get("Summoner Object");
	if (cachedSummoner != null && cachedSummoner['name']==summoner['name'] & cache.get("Region")==region){
		summoner = cachedSummoner;
	}else{
		// Summoner Information API Call
		var summonerObject = summonersByName(apiKey,route,region,summoner['name'], summoner['tag']);
		summoner['id'] = summonerObject['id'];
		summoner['accountId'] = summonerObject['accountId'];
		summoner['puuid'] = summonerObject['puuid'];
		
		// Add Summoner & Region to the cache for 1 Hour
		cache.put({'Summoner Object':summoner,"Region":region},3600);
	}
	
	
	// Global Ranked Information
	// Get the Requested Queue - Default to Solo / Duo
	switch(gettingStartedSheet.getRange("A14").getValue()){
		case "Solo / Duo":	rank['queue']="RANKED_SOLO_5x5";	break;
		case "Flex":		    rank['queue']="RANKED_FLEX_SR";		break;
		default:			      rank['queue']="RANKED_SOLO_5x5";	break;
	}
	
	// Ranked Information API Call
	var rankedObject = leaguesBySummoner(apiKey,region,summoner['id']);
	
	for (var queue in rankedObject){
		if(rankedObject[queue]['queueType'] == rank['queue']){
			// Tier - Case Correction
			rank['tier'] = (rankedObject[queue]['tier']).charAt(0) + (rankedObject[queue]['tier']).slice(1).toLowerCase();
			// Division - Roman Numeral Conversion
			switch(rankedObject[queue]['rank']){
				case "I":	rank['division'] = 1; break;
				case "II":	rank['division'] = 2; break;
				case "III":	rank['division'] = 3; break;
				case "IV":	rank['division'] = 4; break;
			}
			// LP - aka League Points
			rank['afterLP'] = rankedObject[queue]['leaguePoints'];

			// Rank As a Number (RAN), is Rank represented in LP - Used for assessing peak ranks
			rank['ran'] = 0;
			// Tiers are worth 400 each | Diamond 1 100LP & All Apex are 2,800 (2,500 + 300 from Division 1)
			switch (rank['tier']){
				case "Iron":			  rank['ran'] += 0;		break;
				case "Bronze":			rank['ran'] += 400;		break;
				case "Silver":			rank['ran'] += 800;		break;
				case "Gold":			  rank['ran'] += 1200;	break;
				case "Platinum":		rank['ran'] += 1600;	break;
        case "Emerald":     rank['ran'] += 2000;  break;
				case "Diamond":			rank['ran'] += 2400;	break;
				case "Master":			rank['ran'] += 2500;	break;
				case "Grandmaster":	rank['ran'] += 2500;	break;
				case "Challenger":	rank['ran'] += 2500;	break;
			}
			// Divisions are worth 100 each
			rank['ran'] += (rank['division']-4)*-100;
			// LP is added directly
			rank['ran'] += rank['afterLP'];
		}
	}
}
