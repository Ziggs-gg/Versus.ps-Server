const express = require('express');
const router = express.Router();

const db = require('../../../config/db.js');
var con = db.getConnection;

router.get('/', async (req, res) => {
	let phRole = req.query.phRole;
	const SelectedPlayerBox =
		`
		SELECT
		toCal.phID, role, toCal.phRole, region, teamName, playerIDinGame, imgPath,
		games, winCount, (games - winCount) AS defeatCount,
		CONCAT(ROUND((winCount / games) * 100, 1), '%') AS winRate, 
		totalKills, totalDeaths, totalAssists, most1, most2, most3, most4, most5
	FROM # toCal - 계산용 쿼리
		(SELECT 
			gs.phID, role,
			CONCAT(gs.phID, '-', gs.role) AS phRole,
			SUBSTRING_INDEX(SUBSTRING_INDEX(gs.phID, '-', 2), '-', -1) AS region,
			SUBSTRING_INDEX(SUBSTRING_INDEX(gs.phID, '-', -2), '-', 1) AS teamName,
			SUBSTRING_INDEX(gs.phID, '-', -1) AS playerIDinGame,
			imgPath,
			COUNT(gs.gameID) AS games, 
			COUNT(CASE WHEN SUBSTRING_INDEX(gs.phID, '-', 4) = winningTeam THEN 1 END) AS winCount,
			SUM(kills) AS totalKills, SUM(deaths) AS totalDeaths, SUM(assists) AS totalAssists
		FROM games_stats AS gs
		INNER JOIN (SELECT gameID, winningTeam FROM games) AS g
			ON gs.gameID = g.gameID
		INNER JOIN (SELECT phID, imgPath FROM playerIMGpath) AS pI
			ON gs.phID = pI.phID
		GROUP BY gs.phID, role) AS toCal
	INNER JOIN # most5champ
		(SELECT 
			phRole,
			MIN(CASE WHEN rowNum = 1 THEN DDname END) AS most1,
			MIN(CASE WHEN rowNum = 2 THEN DDname END) AS most2,
			MIN(CASE WHEN rowNum = 3 THEN DDname END) AS most3,
			MIN(CASE WHEN rowNum = 4 THEN DDname END) AS most4,
			MIN(CASE WHEN rowNum = 5 THEN DDname END) AS most5
		FROM 
			(SELECT 
				phRole, DDname, 
				ROW_NUMBER() OVER (ORDER BY games DESC, (winCount / games) DESC, ((kills + assists) / deaths) DESC, kills DESC) AS rowNum, 
				games, winCount, (games - winCount) AS defeatCount,
				ROUND((winCount / games) * 100, 1) AS winRate, ROUND(kills, 1) AS kills, ROUND(deaths, 1) AS deaths, ROUND(assists, 1) AS assists
			FROM # toRank
				(SELECT 
					phID, role, CONCAT(phID, '-', role) AS phRole, DDname, COUNT(gs.gameID) AS games,
					COUNT(CASE WHEN SUBSTRING_INDEX(phID, '-', 4) = winningTeam THEN winningTeam END) AS winCount, 
					AVG(kills) AS kills, AVG(deaths) AS deaths, AVG(assists) AS assists
				FROM (SELECT phID, role, gameID, championID, kills, deaths, assists FROM games_stats) AS gs
				INNER JOIN (SELECT championID, championName, DDname FROM champions) AS c
					ON gs.championID = c.championID
				INNER JOIN (SELECT gameID, winningTeam FROM games) AS g
					ON gs.gameID = g.gameID
				GROUP BY gs.championID, gs.phID
				) AS toRank
			WHERE phRole = '${phRole}' -- 파라미터
			
			GROUP BY phRole, DDname
			) AS rankChamp
		) AS most5Champ
		ON 
		toCal.phRole = most5Champ.phRole;
	`;

	con.query(SelectedPlayerBox, phRole, function (err, results) {
		if
			(err) console.log(err);
		else
			res.json(results[0]);
	});
})

module.exports = router;
