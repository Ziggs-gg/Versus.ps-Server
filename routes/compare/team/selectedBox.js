const express = require('express');
const router = express.Router();

const db = require('../../../config/db.js');
var con = db.getConnection;

router.get('/', async (req, res) => {
	let ptID = req.query.ptID;
	const SelectedTeamBox =
		`
		SELECT
		leagueID, ptID, leagueRank, matchCount, matchWinCount, matchDefeatCount, matchWinRate, gameWinCount, gameDefeatCount
	FROM # leagueRank
		(SELECT
			leagueID, ptID, 
			(CASE 
				WHEN leagueID LIKE '%SPR' OR leagueID LIKE '%SUM' THEN RANK() OVER (PARTITION BY leagueID ORDER BY matchWinCount DESC, (gameWinCount-gameDefeatCount) DESC)
				ELSE '-'
			END) AS leagueRank,
			
			matchCount, matchWinCount, matchDefeatCount, matchWinRate, gameWinCount, gameDefeatCount
		FROM # leagueStats
			(SELECT
				leagueID, ptID,
				SUM(matchCount) AS matchCount, SUM(matchWinCount) AS matchWinCount, SUM(matchCount) - SUM(matchWinCount) AS matchDefeatCount,
				CONCAT(ROUND(SUM(matchWinCount)/SUM(matchCount) * 100, 1), '%')	 AS matchWinRate,
				SUM(SUMgameScore) AS gameWinCount, SUM(gameCount) - SUM(SUMgameScore) AS gameDefeatCount
			FROM # unionMatch
				(# Team1 Match Count
				SELECT
					leagueID, team1 AS ptID, COUNT(team1) AS matchCount, COUNT(CASE WHEN team1 = matchWinTeam THEN 1 END) AS matchWinCount, SUM(team1Score) AS SUMgameScore, SUM(team1Score + team2Score) AS gameCount
				FROM # m
					(SELECT 
						leagueID, matchID, CONCAT(leagueID, '-', SUBSTRING_INDEX(SUBSTRING_INDEX(matchID, '-', 4), '-',-1)) AS team1, CONCAT(leagueID, '-', SUBSTRING_INDEX(SUBSTRING_INDEX(matchID, '-', 5), '-',-1)) AS team2, 
						bestOF, SUBSTRING_INDEX(score, '-', 1) AS team1Score, SUBSTRING_INDEX(score, '-', -1) AS team2Score,
						(CASE 
							WHEN bestOF = 5 AND SUBSTRING_INDEX(score, '-', 1) = 3 THEN CONCAT(leagueID, '-', SUBSTRING_INDEX(SUBSTRING_INDEX(matchID, '-', 4), '-',-1))
							WHEN bestOF = 5 AND SUBSTRING_INDEX(score, '-', -1) = 3 THEN CONCAT(leagueID, '-', SUBSTRING_INDEX(SUBSTRING_INDEX(matchID, '-', 5), '-',-1))
							WHEN bestOF = 3 AND SUBSTRING_INDEX(score, '-', 1) = 2 THEN CONCAT(leagueID, '-', SUBSTRING_INDEX(SUBSTRING_INDEX(matchID, '-', 4), '-',-1))
							WHEN bestOF = 3 AND SUBSTRING_INDEX(score, '-', -1) = 2 THEN CONCAT(leagueID, '-', SUBSTRING_INDEX(SUBSTRING_INDEX(matchID, '-', 5), '-',-1))
							WHEN bestOF = 1 AND SUBSTRING_INDEX(score, '-', 1) = 1 THEN CONCAT(leagueID, '-', SUBSTRING_INDEX(SUBSTRING_INDEX(matchID, '-', 4), '-',-1))
							WHEN bestOF = 1 AND SUBSTRING_INDEX(score, '-', -1) = 1 THEN CONCAT(leagueID, '-', SUBSTRING_INDEX(SUBSTRING_INDEX(matchID, '-', 5), '-',-1))
						END) AS matchWinTeam
					FROM matches
					) AS m 
				GROUP BY team1
				
				
				UNION ALL
				
				# Team2 Match Count
				SELECT 
					leagueID, team2, COUNT(team2) AS matchCount, COUNT(CASE WHEN team2 = matchWinTeam THEN 1 END) AS matchWinCount, SUM(team2Score) AS SUMteam2Score, SUM(team1Score + team2Score) AS gameCount
				FROM # m
					(SELECT 
						leagueID, matchID, CONCAT(leagueID, '-', SUBSTRING_INDEX(SUBSTRING_INDEX(matchID, '-', 4), '-',-1)) AS team1, CONCAT(leagueID, '-', SUBSTRING_INDEX(SUBSTRING_INDEX(matchID, '-', 5), '-',-1)) AS team2, 
						bestOF, SUBSTRING_INDEX(score, '-', 1) AS team1Score, SUBSTRING_INDEX(score, '-', -1) AS team2Score,
						(CASE 
							WHEN bestOF = 5 AND SUBSTRING_INDEX(score, '-', 1) = 3 THEN CONCAT(leagueID, '-', SUBSTRING_INDEX(SUBSTRING_INDEX(matchID, '-', 4), '-',-1))
							WHEN bestOF = 5 AND SUBSTRING_INDEX(score, '-', -1) = 3 THEN CONCAT(leagueID, '-', SUBSTRING_INDEX(SUBSTRING_INDEX(matchID, '-', 5), '-',-1))
							WHEN bestOF = 3 AND SUBSTRING_INDEX(score, '-', 1) = 2 THEN CONCAT(leagueID, '-', SUBSTRING_INDEX(SUBSTRING_INDEX(matchID, '-', 4), '-',-1))
							WHEN bestOF = 3 AND SUBSTRING_INDEX(score, '-', -1) = 2 THEN CONCAT(leagueID, '-', SUBSTRING_INDEX(SUBSTRING_INDEX(matchID, '-', 5), '-',-1))
							WHEN bestOF = 1 AND SUBSTRING_INDEX(score, '-', 1) = 1 THEN CONCAT(leagueID, '-', SUBSTRING_INDEX(SUBSTRING_INDEX(matchID, '-', 4), '-',-1))
							WHEN bestOF = 1 AND SUBSTRING_INDEX(score, '-', -1) = 1 THEN CONCAT(leagueID, '-', SUBSTRING_INDEX(SUBSTRING_INDEX(matchID, '-', 5), '-',-1))
						END) AS matchWinTeam
					FROM matches
					) AS m 
				GROUP BY team2
				) AS unionMatch
			GROUP BY ptID
			ORDER BY leagueID, ptID
			) AS leagueStats
		) AS leagueRank
	WHERE ptID = '${ptID}' -- 파라미터 값
	`;

	con.query(SelectedTeamBox, ptID, function (err, results) {
		if
			(err) console.log(err);
		else
			res.json(results);
	});
})

module.exports = router;