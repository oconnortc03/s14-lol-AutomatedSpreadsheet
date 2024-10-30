/*
--  Automated League of Legends Spreadsheet
--  Version - v7.0.0
--  Current League Patch: 14.21
--  Developers:	Lucas Nagy
--  Edited and updated for s14 and new riot API by Cathal O'Connor
--
--  
--  File: championFunctions.gs
--  Last Updated: 2024-10-29 v7.0.0
*/

function updateChampions(){
	// Sheet
	var championSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Champions");
  var gettingStartedSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Getting Started");
	
	// Run the Startup Function
	startup();
	
	// Get Champion List and Champion Mastery
	var championMastery = championmasteriesBySummoner(apiKey, route, summoner['puuid']);
	var patch = currentPatch(region);
	var championList = championStaticData(language, patch['v']);
	
	// Champions Array
	var champions = [];
	
	// Add Champion Names & IDs to the array
	for (var champion in championList['data']){
		champions[championList['data'][champion]['key']] = championList['data'][champion]['name'];
	}
	
	// "Sort" Champion Mastery - Array of Objects stored by Champion ID
	var sortedMastery = [];
	for (var mastery in championMastery){
		sortedMastery[championMastery[mastery]['championId']] = championMastery[mastery];
	}
	
	// Create Output Array
	var output = [];
	var outputRow = 0;
	// Add Data to Output Array
	for (var currentChampion in champions){
		// Add 2D Array
		output[outputRow] = [];
		
		// Mastery Variables
		var chestEarned = false;
		var championLevel = "";
		var championPoints = "";
		
		// If the player has mastery on the champion
		if (sortedMastery[currentChampion]!=null || sortedMastery[currentChampion]!=undefined){
			chestEarned = sortedMastery[currentChampion]['chestGranted'];
			championLevel = sortedMastery[currentChampion]['championLevel'];
			championPoints = sortedMastery[currentChampion]['championPoints'];
		}
		
    // Performance Variables
    var k = "";
    var d = "";
    var a = "";
    var kda = "";

    var kp = "";

    var wins = "";
    var losses = "";
    var winrate = "";

    // add performance stats if the player opted into the Advanced Champion Sheet
    if (gettingStartedSheet.getRange("A22").getValue()){
      k = "=IF(ISNA(FILTER('Match History'!BE5:BE,'Match History'!B5:B=C"+(outputRow+5)+")),\"\",SUM(FILTER('Match History'!BE5:BE,'Match History'!B5:B=C"+(outputRow+5)+")))";
      d = "=IF(ISNA(FILTER('Match History'!BF5:BF,'Match History'!B5:B=C"+(outputRow+5)+")),\"\",SUM(FILTER('Match History'!BF5:BF,'Match History'!B5:B=C"+(outputRow+5)+")))";
      a = "=IF(ISNA(FILTER('Match History'!BG5:BG,'Match History'!B5:B=C"+(outputRow+5)+")),\"\",SUM(FILTER('Match History'!BG5:BG,'Match History'!B5:B=C"+(outputRow+5)+")))";
      kda = "=IF(OR(H"+(outputRow+5)+"=0,H"+(outputRow+5)+"=\"\"),G"+(outputRow+5)+"+I"+(outputRow+5)+",(G"+(outputRow+5)+"+I"+(outputRow+5)+")/H"+(outputRow+5)+")";

      kp = "=IF((G"+(outputRow+5)+"+I"+(outputRow+5)+")=0,0,(G"+(outputRow+5)+"+I"+(outputRow+5)+")/SUM(FILTER('Match History'!CW5:CW,'Match History'!AG5:AG<>\"Remake\",'Match History'!B5:B=C"+(outputRow+5)+")))";

      wins = "=COUNTIF(FILTER('Match History'!AG5:AG,'Match History'!AG5:AG<>\"Remake\",'Match History'!B5:B=C"+(outputRow+5)+"),\"Victory\")";
      losses = "=COUNTIF(FILTER('Match History'!AG5:AG,'Match History'!AG5:AG<>\"Remake\",'Match History'!B5:B=C"+(outputRow+5)+"),\"Defeat\")+COUNTIF(FILTER('Match History'!AG5:AG,'Match History'!AG5:AG<>\"Remake\",'Match History'!B5:B=C"+(outputRow+5)+"),\"LEAVE\")";
      winrate = "=IF(L"+(outputRow+5)+"+M"+(outputRow+5)+">0,L"+(outputRow+5)+"/(L"+(outputRow+5)+"+M"+(outputRow+5)+"),\"\")";
    }

		output[outputRow] = [currentChampion,champions[currentChampion],chestEarned,championLevel,championPoints,k,d,a,kda,kp,wins,losses,winrate];
		outputRow++;
	}
	
	// Clear Sheet and Set new Values
	championSheet.getRange(5,2,outputRow,13).clearContent().setValues(output);
  SpreadsheetApp.flush();
  championSheet.getRange(5,2,outputRow,13).setValues(championSheet.getRange(5,2,outputRow,13).getValues());
	// Change Last Updated
	championSheet.getRange(4,16,1,2).setValues([[championSheet.getRange("Z4").getValue(),patch['v']]]);
	// Sort - Default by Name (A-Z)
	sortChampions();
}

function championList(region, language){
	
	// Get New Champion List from Data Dragon
	var patch = currentPatch(region);
	var championList = championStaticData(language, patch['v']);
	
	// Champions Array
	var champions = [];
	
	// Add Champion Names & IDs to the array
	for (var champion in championList['data']){
		champions[championList['data'][champion]['key']] = championList['data'][champion]['name'];
	}

	return champions;
}

function sortChampions(){
	// Sheet
	var championSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Champions");
	
	// Get User Selected Sort Method
	var sortBy = championSheet.getRange("K4").getValue().split(" ");
	
	// Sort Methods by Column
	switch (sortBy[0]){
		case "Name":
			sortBy[0] = 3;
			break;
		case "Level":
			sortBy[0] = 5;
			break;
		case "Points":
			sortBy[0] = 6;
			break;
		case "Chest":
			sortBy[0] = 4;
			break;
		default:
			sortBy[0] = 3;
			break;
	}
	
	// Sort Method Ascending / Descending
	switch (sortBy[1]){
		// Ascending
		case "(A-Z)":
		case "(Low-High)":
			sortBy[1] = true;
			break;
		// Descending
		case "(Z-A)":
		case "(High-Low)":
			sortBy[1] = false;
			break;
		// Chest will Trigger Default - Chest True-to-False is Ascending
		default:
			sortBy[1] = true;
			break;
	}
	
	// Sort
	championSheet.getRange("A5:Z").sort({column:sortBy[0],ascending:sortBy[1]});
}
