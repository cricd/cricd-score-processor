var debug = require('debug')('score-processor:result');
var _ = require('underscore');
var exports = module.exports = {};

exports.calculateResult = function(score, matchInfo) {
    debug('Calculating match result...');

    // Identify th teams
    var homeTeamId = matchInfo.homeTeam.id;
    var awayTeamId = matchInfo.awayTeam.id;

    // Calculate the runs scored by each team
    var homeTeamRuns = 0, awayTeamRuns = 0;
    for(var i = 0; i < score.innings.length; i++) {
        if(score.innings[i].battingTeam.id == homeTeamId)
            homeTeamRuns += score.innings[i].runs;
        else awayTeamRuns += score.innings[i].runs;
    }

    // Identify the teams batting first and second
    var battingFirstRuns, battingSecondRuns;
    if(score.innings[0].battingTeam.id == homeTeamId) {
        battingFirstRuns = homeTeamRuns;
        battingSecondRuns = awayTeamRuns;
    } else {
        battingFirstRuns = awayTeamRuns;
        battingSecondRuns = homeTeamRuns;
    }

    // Determine result
    var result = {};
    var isTeamBattingSecondAhead = battingSecondRuns > battingFirstRuns;
    var isComplete = isMatchComplete(score, matchInfo, isTeamBattingSecondAhead);
    var difference = Math.abs(battingFirstRuns - battingSecondRuns);

    if(battingFirstRuns > battingSecondRuns) { // Team batting first wins
        result.team = score.innings[0].battingTeam;
        if(isComplete) result.result = 'won by ' + difference + ' runs';
        else result.result = 'leads by ' + difference + ' runs';
    }
    else if(difference == 0 && isComplete) result.result = 'Match was drawn';
    else if(difference == 0 && !isComplete) result.result = 'Scores are tied';
    else { // Team batting second wins
        result.team = score.innings[1].battingTeam;
        var wicketsLeft = 10 - score.innings[matchInfo.numberOfInnings * 2 - 1].wickets; 
        
        if(isComplete) result.result = 'won by ' + wicketsLeft + ' wickets';
        else result.result = 'leads by ' + difference + ' runs';
    } 

    score.result = result;
};

exports.isMatchComplete = function(score, matchInfo, isTeamBattingSecondAhead) {
    var isFollowOn = matchInfo.numberOfInnings == 2 && (score.innings[1] && score.innings[2]) && (score.innings[1].battingTeam.id == score.innings[2].battingTeam.id);

    if(!score.innings[1]) return false; // No match can be complete without the 2nd team batting
    else if(matchInfo.numberOfInnings == 1 && isInningsComplete(score.innings[1])) return true; // 2 innings complete when 1 innings each
    else if(matchInfo.numberOfInnings == 2 && isInningsComplete(score.innings[3])) return true; // 4 innings complete when 2 innings each
    else if(matchInfo.numberOfInnings == 1 && isTeamBattingSecondAhead) return true; // Team batting second is ahead in 1 innings match
    else if(matchInfo.numberOfInnings == 2 && score.innings[3] && isTeamBattingSecondAhead) return true;  // Team batting second is ahead in 4th innings
    else if(isFollowOn && isInningsComplete[2] && !isTeamBattingSecondAhead) return true; // Follow on enforced and 2nd team dismissed without lead
    else return false;
};
var isMatchComplete = exports.isMatchComplete;

exports.isInningsComplete = function(innings, limitedOvers) {
    if(innings.wickets == 10) return true;
    else if(innings.over >= limitedOvers) return true;
    else return false;
};
var isInningsComplete = exports.isInningsComplete;