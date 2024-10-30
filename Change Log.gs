/*
--  Automated League of Legends Spreadsheet
--  Version - v7.0.0
--  Current League Patch: 14.21
--  Developers:	Lucas Nagy
--  Edited and updated for s14 and new riot API by Cathal O'Connor
--
--  
--  File: Change Log.gs
--  Last Updated: 2024-10-29 v7.0.0
*/

/*
-- 7.0.0
-- Created tagline input for new naming system
-- Modifyed API calls to match new Riot ID system
-- Removed bait ping counter to total as it was removed from gmae
-- Updated season start timing to match s13
-- Corrected epoch conversion for game date a time
-- Used new API call to get updated list of champions on profile update
*/

/*
-- 6.1.0
--
-- Added Menu Options for Adding Time-Driven Triggers
-- (Time-Driven Triggers automatically update the sheet at a given interval)
-- Fixed Rank @ 100, 250, 500, and 1,000 Not Displaying Correctly
-- Fixed Ranked Goal Estimation not working correctly
-- Fixed Negative LP Change on Promotion
-- Fixed Positive LP Change on Demotion
-- Fixed Second Placement not being detected
-- Added Emerald to the tier list
-- Improved Remake Detection.  There will be far less LEAVE false positives, however there may still be some.
-- Fixed the Ping Stats being blank in the Ranked Sheet filters
-- Fixed Timezones not impacting Date/Time of the Matches
-- Fixed Null Match Detection not working correctly (all Null Matches were being added on every update)
-- Added Opt-in Primary & Secondary Matchup Automation
-- Added Opt-in Advanced Champion Sheet
-- Added the ability to Migrate Data from Old Versions
--
*/

/*
-- 6.0.0b
--
-- The script now only has authorization for the single spreadsheet, rather than ALL spreadsheets
-- Corrected the Start Times for all regions
-- Added SEA Region Support
--
*/

/*
-- 6.0.0
--
-- Basically 5.1.0
-- Added Null Match Detection.  This will prevent the sheet from breaking if Riot lets a bad match through
-- Added Pings
-- Added Second Placement to the Ranked Info Sheet
-- Fixed the Date & Champion Filter in the Stats Sheet
-- Fixed the Rank @ 100, 250, 500, 1000 games showing only the Tier
-- Fixed various incorrect filters in the Stats and Ranked Info sheets
-- Fixed an issue that caused Middle to show as Blank in the Role column
--
*/

/*
-- 5.0.0c
--
-- The sheet will no longer fail to update due to SSL Errors
-- Fixed Several Optional Conditional Formatting Errors
-- Re-Added Before LP Automation
-- Fixed the K / D / A for the Lane & Role Filter
--
*/

/*
-- 5.0.0b
--
-- Fixed "Summoner or Queue has changed" on every update
-- Changed how Champion names are fetched, fixing spacing and formating with some names
-- Stopped the sheet from displayed "The number of rows in the range must be at least 1", when the sheet had nothing to update
/*

/* v5+ Changes since V4

The Spreadsheet no longer uses math for a crude understanding of which games to add.  It now CHECKS if the matchId already exists in the sheet.  This means the sheet can now technically be used for multiple accounts, queues or multiple seasons without any problems.  The check is also pretty rapid, so it doesn't add any significant time.

The Match History links on Column A have been removed, since the Match History site no longer exists.

User Opt-in stats for Timeline API Call.  The user decides if they want: Support Quest Times True/False, or CS @ 10/20/30, 10,15,20, or Disabled.  The Support Quest Timers are the most compute intensive, but they're still quick enough for it to be an option.  CS @ X time is super fast, but they just require the extra API Call so the feature is opt-in.

Virtually no Formula output into the Match History sheet.  Formulas are compute intensive, so using fewer of them per match is prefered.

*/
