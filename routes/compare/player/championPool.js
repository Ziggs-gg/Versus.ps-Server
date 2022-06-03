const express = require('express');
const router = express.Router();

const db = require('../../../config/db.js');
var con = db.getConnection;

router.get('/', async (req, res) => {
	let phRole = req.query.phRole;

	const ChampionPool =
		`
    # Selected Card Data parsing
	SET @selected1:= '${phRole}';
    SET @selected2:= '${phRole[1]}'; 
    SET @selected3:= '${phRole[2]}'; 
    SET @selected4:= '${phRole[3]}';

# Champion Pool
SELECT phRole, championName, DDname, games, winRate, kills, deaths, assists, DPM, GPM, VSPM
	FROM
	(SELECT phRole, championName, DDname, games, Concat(winRate, '%') AS winRate, kills, deaths, assists, DPM, GPM, VSPM	
		FROM
		(SELECT phRole, championName, DDname, games, winCount, (games - winCount) AS defeatCount,
			ROUND((winCount / games) * 100, 1) AS winRate, ROUND(kills, 1) AS kills, ROUND(deaths, 1) AS deaths, ROUND(assists, 1) AS assists, DPM, GPM, VSPM
			FROM
			(SELECT phID, role, CONCAT(phID, '-', role) AS phRole, championName, DDname, COUNT(gs.gameID) AS games,
					COUNT(CASE WHEN SUBSTRING_INDEX(phID, '-', 4) = winningTeam THEN winningTeam END) AS winCount, AVG(kills) AS kills,
					AVG(deaths) AS deaths, AVG(assists) AS assists, ROUND(AVG(DPM), 1) AS DPM, ROUND(AVG(GPM), 1) AS GPM, ROUND(AVG(VSPM), 2) AS VSPM
					FROM games_stats AS gs
				INNER JOIN (SELECT championID, championName, DDname FROM champions) AS c
					ON gs.championID = c.championID
				INNER JOIN (SELECT gameID, winningTeam FROM games) AS g
					ON gs.gameID = g.gameID
				GROUP BY gs.championID, gs.phID
				) AS toRank
                WHERE 
				FIND_IN_SET(phRole, @selected1) OR
				FIND_IN_SET(phRole, @selected2) OR
				FIND_IN_SET(phRole, @selected3) OR
				FIND_IN_SET(phRole, @selected4)
				ORDER BY FIELD(phRole, @selected1, @selected2, @selected3, @selected4), 
                games DESC, winRate DESC, (kills + assists) / deaths DESC, kills DESC
			) AS toCal
	) AS subt;
    `;

	con.query(ChampionPool, phRole, function (err, results) {
		let ChampionPool_result = results[4]

		if
			(err) console.log(err);
		else
			res.json({
				ChampionPool: ChampionPool_result
				// results
			});
	});
});

module.exports = router;