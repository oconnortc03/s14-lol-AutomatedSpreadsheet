/*
--  Automated League of Legends Spreadsheet
--  Version - v7.0.0
--  Current League Patch: 14.21
--  Developers:	Lucas Nagy
--  Edited and updated for s14 and new riot API by Cathal O'Connor
--
--  
--  File: matchFunctions.gs
--  Last Updated: 2024-10-29 v7.0.0
*/

// Global Champions Array
var champions = [];

function updateMatchHistory(){
	// Run the Startup Function
	startup();
	
	// Sheets
	var matchHistorySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Match History');
	
	// User-Interface
	// Try/Catch is to allow Time-Driven Triggers
	try{
		var ui = SpreadsheetApp.getUi();
	}catch(error){}
	
	//{ Clear Sheet
	var oldSummoner = matchHistorySheet.getRange("BA2").getValue();
	var oldQueue = matchHistorySheet.getRange("BB2").getValue();
	
	// Summoner Name & Queue Change
	// Clear Sheet or Restore Previous Values
	if (summoner['name'] != oldSummoner | rank['queue'] != oldQueue){
		var clearSheet = ui.alert('Clear Sheet?','The Summoner Name or Queue have changed.  Press Yes to clear the sheet.  Press No to restore previous values.',ui.ButtonSet.YES_NO);
		if (clearSheet == ui.Button.YES){
			// Clear the Match History Sheet
			matchHistorySheet.getRange(5,1,matchHistorySheet.getLastRow(),matchHistorySheet.getLastColumn()).clearContent();
			// Set Old Summoner & Old Queue to new values
			matchHistorySheet.getRange("BA2").setValue(summoner['name']);
			matchHistorySheet.getRange("BB2").setValue(rank['queue']);
		}else{
			// Keep the old values
			summoner['name'] = oldSummoner;
			rank['queue'] = oldQueue;
		}
	}else{
		// If the Summoner Name & Queue haven't changed just set the old values
		matchHistorySheet.getRange("BA2").setValue(summoner['name']);
		matchHistorySheet.getRange("BB2").setValue(rank['queue']);
	}
	//}
  
	//{ Queue ID
	// Default Queue ID is Ranked Solo / Duo
	var queueId = 420;
	switch (rank['queue']){
		// Ranked Queues
		case "RANKED_SOLO_5x5":	queueId = 420;	break;
		case "RANKED_FLEX_SR":	queueId = 440;	break;
		// None of these Queue's are enabled by default - The code is here simply to make implementation easier
		// Clash
		//case "CLASH":			queueId = 700;	break;
		// Normals
		/*case "NORMAL_ARAM":	queueId = 450;									break;
		case "NORMAL_DRAFT":	queueId = 400;									break;
		case "NORMAL_BLIND":	queueId = 430;									break;*/
	}
	//}
	
	// Before LP - Default to 0 for the first match
	rank['beforeLP'] = 0;
	if(matchHistorySheet.getLastRow() > 4){
		rank['beforeLP'] = matchHistorySheet.getRange(matchHistorySheet.getLastRow(),35).getValue();
	}

  // Set Delta LP
  rank['deltaLP'] = rank['afterLP']-rank['beforeLP'];
  // If the player demoted force LP Change to -25
  if(rank['beforeLP']==0 & rank['afterLP']==75){
    rank['deltaLP'] = -25;
  }
  // If the player promoted calculate the LP Change
  if(rank['beforeLP']==100 & rank['afterLP']<65){
    rank['deltaLP']+=100;
  }
	
	//{ Start Dates/Times
	var startDate = "1715803199";		// Default NA, All updated to start s14 Split 2
	switch (region){
		case "NA1":	  startDate = "1715803199";	break;	// 2024-05-15T11:59:59-08:00    PST
		case "LA1":   startDate = "1715795999";	break;	// 2024-05-15T11:59:59-06:00		CST
		case "LA2":   startDate = "1715785199";	break;	// 2024-05-15T11:59:59-03:00		AMST
		case "BR1":   startDate = "1715785199";	break;	// 2024-05-15T11:59:59-03:00		BRT
		case "EUW1":  startDate = "1715774399";	break;	// 2024-05-15T11:59:59+00:00		GMT
		case "EUN1":  startDate = "1715767199";	break;	// 2024-05-15T11:59:59+02:00	  CET
		case "RU":    startDate = "1715763599";	break;	// 2024-05-15T11:59:59+03:00		MSK
		case "TR1":   startDate = "1715763599";	break;	// 2024-05-15T11:59:59+03:00		TRT
		case "JP1":   startDate = "1715741999";	break;	// 2024-05-15T11:59:59+09:00		JST
		case "KR":    startDate = "1715741999";	break;	// 2024-05-15T11:59:59+09:00		KST
		case "OC1":   startDate = "1715734799";	break;	// 2024-05-15T11:59:59+11:00	  AEDT
    // SEA Servers
    case "PH2":   startDate = "1715745599"; break;  // 2024-05-15T11:59:59+08:00
    case "SG2":   startDate = "1715745599"; break;  // 2024-05-15T11:59:59+08:00
    case "TH2":   startDate = "1715749199"; break;  // 2024-05-15T11:59:59+07:00
    case "TW2":   startDate = "1715745599"; break;  // 2024-05-15T11:59:59+08:00
    case "VN2":   startDate = "1715749199"; break;  // 2024-05-15T11:59:59+07:00
	}
	//}
	
	// Set the Global champions array
	champions = championList(region, language);

	//{ Match Lists
	
	// Match Lists Variables
	var matchIds = [];
	var indexed = 0;
	var gamesToIndex = true;
	var listOfMatches = {};
	
	// Match Lists Loop
	do{
		var options = "?queue="+queueId+"&startTime="+startDate+"&start="+indexed+"&count=100";
		listOfMatches = {'matches':matchlistsByAccount(apiKey,route,summoner['puuid'],options)};
		// If there are less than 100 matches in the object, then this is the last match list
		if (listOfMatches['matches'].length < 100){
			gamesToIndex = false;
		}
		
		// Populate matchIds Array
		for (var match in listOfMatches['matches']){
			matchIds[indexed] = listOfMatches['matches'][match];
			indexed++;
		}
		
		// Fail Safe
		if (listOfMatches['matches'][0]==undefined){
			gamesToIndex = false;
			indexed = 0;
		}
	}while(gamesToIndex);
	//}
	
	// Existing Entries - Duplicate Prevention
	var alreadyAdded = {};
	var alreadyAddedMatchIds = matchHistorySheet.getRange(5,55,matchHistorySheet.getLastRow(),1).getValues();
	for (var addedMatchId in alreadyAddedMatchIds){
		alreadyAdded[alreadyAddedMatchIds[addedMatchId]] = alreadyAddedMatchIds[addedMatchId];
	}
	var previousMatchId = alreadyAdded[alreadyAdded.length];
	
	var output = [];
	var outputRow = 0;
	
	// Match Details Loop
	for (var matchId=matchIds.length-1; matchId >= 0; matchId--){
		if (matchIds[matchId]!=undefined & matchIds[matchId]!="" & matchIds[matchId]!=null & matchIds[matchId]!=previousMatchId & alreadyAdded[matchIds[matchId]]!=matchIds[matchId]){
			var matchDetails = matchesById(apiKey,route,matchIds[matchId]);
			output[outputRow] = matchHistoryOutput(matchDetails,outputRow);
			previousMatchId = matchIds[matchId];
			outputRow++;
		}
		if (outputRow >= 10 | matchId <= 0){
      if (output.length>0){
			  matchHistorySheet.getRange(matchHistorySheet.getLastRow()+1, 1, outputRow, 104).setValues(output);
      }
			outputRow = 0;
			output = [];
		}
	}
}

function matchHistoryOutput(match,outputRow){
	// Sheets
	var matchHistorySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Match History');
	
	// Null Match Detection
	var nullMatch = match['info']['gameCreation']+match['info']['gameDuration']+match['info']['gameId']+match['info']['gameStartTimestamp']+match['info']['mapId']+match['info']['queueId'];
	if (nullMatch==0){
		return ['','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','Remake','','','','','','','','','','DNG','Null Match Detected - You can hide this row, DO NOT DELETE IT','','','','','','','','','','',match['metadata']['matchId'],
		'','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','','',''];
	}

	// Get Participant Id
	var participantId = 0;
	var foundParticipant = false;
	while (foundParticipant==false & participantId < 10){
		if (match['metadata']['participants'][participantId] == summoner['puuid']){
			foundParticipant = true;
		}else{
			participantId++;
		}
	}
	
	//{ Team Stats - For Participation & Percent Share Stats
	// Variables
	var teamVisionScore = teamKills = teamDeaths = teamDamage = teamHealed = teamTaken = teamMitigated = teamGold = 0;
	
	// Players Team Id - 100 for Blue or 200 for Red
	var teamId = match['info']['participants'][participantId]['teamId'];

	// "team" is used to loop through the players team
	var team = (teamId==100)?5:10;
	for (var member = team-5; member<team; member++){
		teamVisionScore += match['info']['participants'][member]['visionScore'];
		teamKills += match['info']['participants'][member]['kills'];
		teamDeaths += match['info']['participants'][member]['deaths'];
		teamDamage += match['info']['participants'][member]['totalDamageDealtToChampions'];
		teamHealed += match['info']['participants'][member]['totalHeal'];
		teamTaken += match['info']['participants'][member]['totalDamageTaken'];
		teamMitigated += match['info']['participants'][member]['damageSelfMitigated'];
		teamGold += match['info']['participants'][member]['goldEarned'];
	}
	//}
	
	//{ Played As
	// Champion Id and Name
	var championId = match['info']['participants'][participantId]['championId'];
	
	// Lane
	var lane = match['info']['participants'][participantId]['teamPosition'];
	var lanePlayed = "";
	switch (lane){
		case "TOP":
			lanePlayed = "Top";
			break;
		case "JUNGLE":
			lanePlayed = "Jungle";
			break;
		case "MIDDLE":
			lanePlayed = "Middle";
			break;
		case "BOTTOM":
			lanePlayed = "ADC";
			break;
		case "UTILITY":
			lanePlayed = "Support";
			break;
		default:
			lanePlayed = "";
			break;
	}

    //{    Enemy Team Champions
    var enemyLane = "";
    var enemyChampions = {};
    var firstOpponent = "";
    var secondOpponent = "";

    if(getOpponents){
      for (var enemyMember = team-5; enemyMember<team; enemyMember++){
          enemyLane = match['info']['participants'][enemyMember]['teamPosition'];
          switch(enemyLane){
                case "TOP":
                  enemyLane = "Top";
                  break;
                case "JUNGLE":
                  enemyLane = "Jungle";
                  break;
                case "MIDDLE":
                  enemyLane = "Middle";
                  break;
                case "BOTTOM":
                  enemyLane = "ADC";
                  break;
                case "UTILITY":
                  enemyLane = "Support";
                  break;
                default:
                  enemyLane = "";
                  break;
          }
          enemyChampions[enemyLane] = match['info']['participants'][enemyMember]['championId'];
      }

      // Primary Opponent
      firstOpponent = champions[enemyChampions[lanePlayed]]; //TODO Fix lane matchups

      // Secondary Opponent
      switch(lanePlayed){
          case "Top":
          case "Middle":
              secondOpponent = champions[enemyChampions['Jungle']];
              break;
          case "Jungle":
              secondOpponent = champions[enemyChampions['Middle']];
              break;
          case "ADC":
              secondOpponent = champions[enemyChampions['Support']];
              break;
          case "Support":
              secondOpponent = champions[enemyChampions['ADC']];
              break;
          default:
              secondOpponent = champions[enemyChampions['Jungle']];
              break;
      }
    }
    //}
	
	//}
	
	//{ Performance
	// Score
	var kills = match['info']['participants'][participantId]['kills'];
	var deaths = match['info']['participants'][participantId]['deaths'];
	var assists = match['info']['participants'][participantId]['assists'];
	
	var kda = kills + " / " + deaths + " / " + assists;
	var killParticipation = (kills + assists) / teamKills;
	if (teamKills == 0){
		killParticipation = 0;
	}
	// Calculate KDA Ratio
	// Default is Kills + Assists
	// If Deaths > 0 then (Kills + Assists) / Deaths
	var kdaRatio = kills + assists;
	if (deaths > 0){
		kdaRatio /= deaths;
	}
	
	// Gold & Farm
	var gold = match['info']['participants'][participantId]['goldEarned'];
	var laneCS = match['info']['participants'][participantId]['totalMinionsKilled'];
	var jungleCS = match['info']['participants'][participantId]['neutralMinionsKilled'];
	
	// Damage
	var dealt = match['info']['participants'][participantId]['totalDamageDealtToChampions'];
	var healed = match['info']['participants'][participantId]['totalHeal'];
	var taken = match['info']['participants'][participantId]['totalDamageTaken'];
	var mitigated = match['info']['participants'][participantId]['damageSelfMitigated'];
	
	var turrets = match['info']['participants'][participantId]['damageDealtToTurrets'];
	var objectives = match['info']['participants'][participantId]['damageDealtToObjectives'];
	
	// Support Stats
	var allyHealing = match['info']['participants'][participantId]['totalHealsOnTeammates'];
	var allyShielding = match['info']['participants'][participantId]['totalDamageShieldedOnTeammates'];
	var supportItemQuestA = supportItemQuestB = "";
	
	// Vision
	var wardsPlaced = match['info']['participants'][participantId]['wardsPlaced'];
	var denied = match['info']['participants'][participantId]['wardsKilled'];
	var pinksPurchased = match['info']['participants'][participantId]['visionWardsBoughtInGame'];
	var pinksPlaced = match['info']['participants'][participantId]['detectorWardsPlaced'];
	var visionScore = match['info']['participants'][participantId]['visionScore'];
	var visionShare = visionScore / teamVisionScore;
	//}
	
	//{ Pings / Communication
	// Positional
	var dangerPings = match['info']['participants'][participantId]['dangerPings'];
	var getBackPings = match['info']['participants'][participantId]['getBackPings'];
	var holdPings = match['info']['participants'][participantId]['holdPings'];
	var onMyWayPings = match['info']['participants'][participantId]['onMyWayPings'];
	
	// Strategy
	var allInPings = match['info']['participants'][participantId]['allInPings'];
	var assistMePings = match['info']['participants'][participantId]['assistMePings'];
	var pushPings = match['info']['participants'][participantId]['pushPings'];
	
	// Vision
	var enemyVisionPings = match['info']['participants'][participantId]['enemyVisionPings'];
	var needVisionPings = match['info']['participants'][participantId]['needVisionPings'];
	var visionClearedPings = match['info']['participants'][participantId]['visionClearedPings'];
	
	// Informative
	var basicPings = match['info']['participants'][participantId]['basicPings'];
	var commandPings = match['info']['participants'][participantId]['commandPings'];
	var enemyMissingPings = match['info']['participants'][participantId]['enemyMissingPings'];
	
	// Ping Categories
	var positionalPings = dangerPings + getBackPings + holdPings + onMyWayPings;
	var strategyPings = allInPings + assistMePings + pushPings;
	var visionPings = enemyVisionPings + needVisionPings + visionClearedPings;
	var informativePings = basicPings + enemyMissingPings + commandPings;
	
	var totalPings = positionalPings + strategyPings + visionPings + informativePings;
	//}
	
	//{ Spell Casts
	var qCasts = match['info']['participants'][participantId]['spell1Casts'];
	var wCasts = match['info']['participants'][participantId]['spell2Casts'];
	var eCasts = match['info']['participants'][participantId]['spell3Casts'];
	var rCasts = match['info']['participants'][participantId]['spell4Casts'];
	// Summoner Spells
	var ssACasts = match['info']['participants'][participantId]['summoner1Casts'];
	var ssAId = match['info']['participants'][participantId]['summoner1Id'];
	var ssBCasts = match['info']['participants'][participantId]['summoner2Casts'];
	var ssBId = match['info']['participants'][participantId]['summoner2Id'];
	//}
	
	//{ Multi-Kills
	var doubles = match['info']['participants'][participantId]['doubleKills'];
	var triples = match['info']['participants'][participantId]['tripleKills'];
	var quadras = match['info']['participants'][participantId]['quadraKills'];
	var pentas = match['info']['participants'][participantId]['pentaKills'];
	var highestmulti = match['info']['participants'][participantId]['largestMultiKill'];
	//}
	
	//{ Objective Play
	var dragonKills = match['info']['participants'][participantId]['dragonKills'];
	var baronKills = match['info']['participants'][participantId]['baronKills'];
	
	var turretKills = match['info']['participants'][participantId]['turretKills'];
	var turretAssists = match['info']['participants'][participantId]['turretTakedowns'];
	
	var inhibitorKills = match['info']['participants'][participantId]['inhibitorKills'];
	var inhibitorAssists = match['info']['participants'][participantId]['inhibitorTakedowns'];
	
	var nexusKills = match['info']['participants'][participantId]['nexusKills'];
	var nexusAssists = match['info']['participants'][participantId]['nexusTakedowns'];
	//}
	
	//{ First Blood & First Brick
	var firstBloodKill = match['info']['participants'][participantId]['firstBloodKill'];
	var firstBloodAssist = match['info']['participants'][participantId]['firstBloodAssist'];
	
	var firstBrickKill = match['info']['participants'][participantId]['firstTowerKill'];
	var firstBrickAssist = match['info']['participants'][participantId]['firstTowerAssist'];
	//}
	
	//{ Champion Exp & Level
	var level = match['info']['participants'][participantId]['champLevel'];
	var experience = match['info']['participants'][participantId]['champExperience'];
	//}
	
	//{ Match Details
  var matchId = match['metadata']['matchId'];
	var duration = match['info']['gameDuration'];
	var creation = match['info']['gameCreation'];
	var result = (match['info']['participants'][participantId]['win'])?"Victory":"Defeat";
	
	// Remake Check
  // Determine if the player was active
	var inactivity = (kills + deaths + assists) + dealt + taken + laneCS + jungleCS + qCasts + wCasts + eCasts + ssACasts + ssBCasts + totalPings + dealt + taken + wardsPlaced;
	// if the match was less than 6 minutes and the player was active, then set the result to remake
	if ( duration<360 && inactivity>0){
		result = "Remake"
	// If the match was less than 6 minutes and the player was AFK, then set the result to LEAVE
	}else if (duration<360 && inactivity==0){
		result = "LEAVE";
	}
	//}
	
	//{ Timeline Details
	if (getCSatX=="10 / 20 / 30" | getCSatX=="10 / 15 / 20" | (getSupportQuest==true && lanePlayed=="Support")){
		var timelineObject = timelinesByMatchId(apiKey,route,matchId);
	}
	
	// Support Quest Timers
	if (getSupportQuest==true && lanePlayed=="Support"){
		for (var tFrame in timelineObject['info']['frames']){
			for (var tEvent in timelineObject['info']['frames'][tFrame]['events']){
				if (timelineObject['info']['frames'][tFrame]['events'][tEvent]['type']==="ITEM_DESTROYED" && timelineObject['info']['frames'][tFrame]['events'][tEvent]['participantId']===participantId+1){
					switch (timelineObject['info']['frames'][tFrame]['events'][tEvent]['itemId']){
						// Quest 1 - Base Support Item 500g Warding Quest
						case 3850:
						case 3854:
						case 3858:
						case 3862:
							supportItemQuestA = timelineObject['info']['frames'][tFrame]['events'][tEvent]['timestamp']/86400000;
							break;
						case 3851:
						case 3855:
						case 3859:
						case 3863:
							supportItemQuestB = timelineObject['info']['frames'][tFrame]['events'][tEvent]['timestamp']/86400000;
							break;
					}
				}
			}
		}
	}
	
	// Farm @ 10, 15, 20 & 30 Minutes, TODO combine these
	var farmA, farmB, farmC = "";
	if ( getCSatX=="10 / 20 / 30" ){
    if (duration>=600){
      farmA = (timelineObject['info']['frames']['10']['participantFrames'][participantId+1]['minionsKilled']+timelineObject['info']['frames']['10']['participantFrames'][participantId+1]['jungleMinionsKilled']);
      if (duration>=1200){
        farmB = (timelineObject['info']['frames']['20']['participantFrames'][participantId+1]['minionsKilled']+timelineObject['info']['frames']['20']['participantFrames'][participantId+1]['jungleMinionsKilled']);
        if(duration>=1800){
          farmC = (timelineObject['info']['frames']['30']['participantFrames'][participantId+1]['minionsKilled']+timelineObject['info']['frames']['30']['participantFrames'][participantId+1]['jungleMinionsKilled']);
        }
      }
    }
	}else if ( getCSatX=="10 / 15 / 20" ){
    if (duration>=600){
      farmA = (timelineObject['info']['frames']['10']['participantFrames'][participantId+1]['minionsKilled']+timelineObject['info']['frames']['10']['participantFrames'][participantId+1]['jungleMinionsKilled']);
      if (duration>=900){
        farmB = (timelineObject['info']['frames']['15']['participantFrames'][participantId+1]['minionsKilled']+timelineObject['info']['frames']['15']['participantFrames'][participantId+1]['jungleMinionsKilled']);
        if(duration>=1200){
          farmC = (timelineObject['info']['frames']['20']['participantFrames'][participantId+1]['minionsKilled']+timelineObject['info']['frames']['20']['participantFrames'][participantId+1]['jungleMinionsKilled']);
        }
      }
    }
	}
	
	//}
	
	var currentRow = matchHistorySheet.getLastRow()+1;
	
	// Create Output Array
	var output = [
	(currentRow-4+outputRow),champions[championId],lanePlayed,'',
	kda,kdaRatio,killParticipation,
	gold,laneCS+jungleCS,(laneCS+jungleCS)/(duration/60),farmA,farmB,farmC,
	dealt,healed,taken,mitigated,turrets,objectives,
	allyHealing,allyShielding,supportItemQuestA,supportItemQuestB,
	totalPings,
	wardsPlaced,denied,pinksPurchased,pinksPlaced,visionScore,visionShare,
	(duration/86400),'=EPOCHTODATE('+(creation)+', 2)',result, //Removed timezone, might try and fix later
	rank['beforeLP'],rank['afterLP'],rank['deltaLP'],rank['tier'],rank['division'],
	'','','','',
	'DNG','',
  firstOpponent,secondOpponent,
  '','','','','','',
	rank['ran'],"gpa",matchId,teamId,
	kills,deaths,assists,laneCS,jungleCS,qCasts,wCasts,eCasts,rCasts,ssAId,ssACasts,ssBId,ssBCasts,
	doubles,triples,quadras,pentas,highestmulti,
	turretKills,inhibitorKills,dragonKills,baronKills,nexusKills,turretAssists,inhibitorAssists,nexusAssists,
	firstBloodKill,firstBloodAssist,firstBrickKill,firstBrickAssist,
	level,experience,positionalPings,strategyPings,visionPings,informativePings,'','','','',
	teamDamage,teamHealed,teamTaken,teamMitigated,teamKills,teamDeaths,teamGold,teamVisionScore
	];
	return output;
}
