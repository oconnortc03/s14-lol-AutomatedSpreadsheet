/*
--  Automated League of Legends Spreadsheet
--  Version - v7.0.0
--  Current League Patch: 14.21
--  Developers:	Lucas Nagy
--  Edited and updated for s14 and new riot API by Cathal O'Connor
-- 
--  
--  File: apiCalls.gs
--  Last Updated: 2024-10-29 v7.0.0
*/

//{		API Call
function apiCall(apiKey,url){
	var options = {
		'method':'get',
		'muteHttpExceptions': true,
    'validateHttpsCertificates' : false
	};
	if (apiKey != ""){
			options['headers'] = {'X-Riot-Token':apiKey};
	}
	
	// Fetch Data from provided URL & Options
	var response = UrlFetchApp.fetch(url, options);
	
	// Retrieve the Body from the Response
	var responseBody = JSON.parse(response.getContentText());
	
	// Spreadsheet UI - Used for Sending Error Alerts
	try{
		var ui = SpreadsheetApp.getUi();
	}catch(error){}

	// Error Handling
	switch (response.getResponseCode()){
		// Success
		case 200: return responseBody; break;
		// 400 Series Errors
		case 400:	case 403:	case 404:
			ui.alert(""+response.getResponseCode()+": "+responseBody['status']['message']);break;
		case 429:
			// Special Handling here - 429 is Rate Limit Reached.
			var responseHeader = response.getHeaders();
			// Retry time in seconds
			var timeoutFor = 0 + (responseHeader['Retry-After']);
			// Alert the User
			ui.alert("429: Rate Limit Reached.  Waiting "+timeoutFor+" seconds, after this window is closed.");
			// Wait the time specified by the reponse header
			Utilities.sleep((timeoutFor*1000));
			// Retry
			return apiCall(apiKey,url);
			break;
		// 500 Series Errors
		case 500:	case 502:	case 503:	case 504:
			ui.alert(""+response.getResponseCode()+": "+responseBody['status']['message']+".  Check API Status or Try again in a few minutes"); break;
		// Default
		default: ui.alert(""+response.getResponseCode()+": "+responseBody['status']['message']);
	}
}
//}

//{		URL Assemblers

//{		Summoner-V4
function summonersByName(apiKey,route, region,summonerName, tag){
  var urlPUID = apiCall(apiKey,"https://"+route+".api.riotgames.com/riot/account/v1/accounts/by-riot-id/"+summonerName+"/"+tag);
  var puuid = urlPUID['puuid'];
	var url = "https://"+region+".api.riotgames.com/lol/summoner/v4/summoners/by-puuid/"+puuid;
	return apiCall(apiKey,url);
}
//}

//{		League-V4
function leaguesBySummoner(apiKey,region,summonerId){
	var url = "https://"+region+".api.riotgames.com/lol/league/v4/entries/by-summoner/"+summonerId;
	return apiCall(apiKey,url);
}

function challengerLeagues(apiKey,route,queue){
	var url = "https://"+route+".api.riotgames.com/lol/league/v4/challengerleagues/by-queue/"+queue;
	return apiCall(apiKey,url);
}

function grandmasterLeagues(apiKey,route,queue){
	var url = "https://"+route+".api.riotgames.com/lol/league/v4/grandmasterleagues/by-queue/"+queue;
	return apiCall(apiKey,url);
}

function masterLeagues(apiKey,route,queue){
	var url = "https://"+route+".api.riotgames.com/lol/league/v4/masterleagues/by-queue/"+queue;
	return apiCall(apiKey,url);
}

function leaguesByLeagueId(apiKey,route,leagueId){
	var url = "https://"+route+".api.riotgames.com/lol/league/v4/leagues/"+leagueId;
	return apiCall(apiKey,url);
}
//}

//{		Match-V5
function matchesById(apiKey,route,matchId){
	var url = "https://"+route+".api.riotgames.com/lol/match/v5/matches/"+matchId;
	return apiCall(apiKey,url);
}

function matchlistsByAccount(apiKey,route,puuid,options){
	var url = "https://"+route+".api.riotgames.com/lol/match/v5/matches/by-puuid/"+puuid+"/ids"+options;
	return apiCall(apiKey,url);
}

function timelinesByMatchId(apiKey,route,matchId){
	var url = "https://"+route+".api.riotgames.com/lol/match/v5/matches/"+matchId+"/timeline";
	return apiCall(apiKey,url);
}
//}

//{		Champion-Mastery-V4
function championmasteriesBySummoner(apiKey,route,puuid){
	var url = "https://"+route+".api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/"+puuid;
	return apiCall(apiKey,url)
}
//}

//{		Data Dragon
function currentPatch(region){
	// Region Correction
	switch (region){
		// These regions just need thier numbers removed
		case "NA1":case "EUW1":case "TR1":case "BR1":case "JP1":
			region = region.slice(0,-1).toLowerCase();
			break;
		case "RU":
			region = "ru";
			break;
		case "KR":
			region = "kr";
			break;
		case "EUN1":
			region = "eune";
			break;
		case "OC1":
			region = "oce";
			break;
		case "LA1":
			region = "lan";
			break;
		case "LA2":
			region = "las";
			break;
	}
	
	var url = "https://ddragon.leagueoflegends.com/realms/"+region+".json";
	return apiCall("",url);
}

function championStaticData(language,patch){
	// If language isn't Set - Default to English
	if (language == ""){
		language="en_US";
	}
	
	try{
		var url = "https://ddragon.leagueoflegends.com/cdn/"+patch+"/data/"+language+"/champion.json";
		return apiCall("",url);
	}catch(error){}
	
	try{
		var url = "https://ddragon.leagueoflegends.com/cdn/14.11.1/data/"+language+"/champion.json";
		return apiCall("",url);
	}catch(error){}
}
//}

//}

