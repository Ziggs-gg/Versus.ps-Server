const express = require('express');
const router = express.Router();

const db = require('../../../config/db.js');
var con = db.getConnection;

// 		SET @selected1 := '${ptID}';
//         SET @selected2 := '${ptID[1]}';

router.get('/', async (req, res) => {
	let ptID = req.query.ptID;

	const ChampionPool =
		`
		SET @selected1 := '${ptID}';
        SET @selected2 := '${ptID[1]}';
		
		# 0612_1role1row_ver
SELECT 
	rowNumQuery.ptID, teamABBR, role, championName, DDname, gameCount, winRate, AVG_KDA, AVG_DPM, AVG_GPM, AVG_VSPM, rowNum, imgPath
FROM # rowNumQuery
	(SELECT
		ptID, SUBSTRING_INDEX(ptID, '-', -1) AS teamABBR,
		role, ROW_NUMBER() OVER (PARTITION BY ptID, role) AS rowNum,
		championName, DDname, gameCount, winRate, AVG_KDA, AVG_DPM, AVG_GPM, AVG_VSPM
	FROM # statsCal
		(SELECT
			ptID, role, championName, DDname,
			COUNT(c.championID) AS gameCount, CONCAT(ROUND((SUM(win) / COUNT(c.championID)) * 100, 1), '%') AS winRate,
			CONCAT(ROUND(AVG(kills), 1), ' / ', ROUND(AVG(deaths), 1), ' / ', ROUND(AVG(assists), 1)) AS AVG_KDA,
			ROUND(AVG(DPM), 1) AS AVG_DPM, ROUND(AVG(GPM), 1) AS AVG_GPM, ROUND(AVG(VSPM), 2) AS AVG_VSPM
		FROM # gs
			(SELECT	gs.gameID, SUBSTRING_INDEX(phID, '-', 4) AS ptID, role, championID, kills, deaths, assists, DPM, GPM, VSPM, SUBSTRING_INDEX(phID, '-', 4) = winningTeam AS win
			FROM	games_stats AS gs
			INNER JOIN (SELECT gameID, winningTeam FROM games) AS g
				ON gs.gameID = g.gameID
			) AS gs
		INNER JOIN (SELECT championID, championName, DDname FROM champions) AS c
			ON gs.championID = c.championID
		GROUP BY ptID, role, c.championID
		ORDER BY ptID,
			FIELD(role, 'TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'),
			gameCount DESC, winRate DESC, AVG((kills + assists) / deaths) DESC
		) AS statsCal
	ORDER BY ptID, 
		FIELD(role, 'TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT')
	) AS rowNumQuery
INNER JOIN teamIMGpath AS tip
	ON rowNumQuery.ptID = tip.ptID
WHERE 
	rowNum <= 3 AND
	FIND_IN_SET(rowNumQuery.ptID, @selected1) OR
	rowNum <= 3 AND
	FIND_IN_SET(rowNumQuery.ptID, @selected2)
ORDER BY FIELD(rowNumQuery.ptID, @selected1, @selected2), FIELD(role, 'TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'), rowNum;
	`;

	con.query(ChampionPool, ptID, function (err, results) {
		let ChampionPool_result = results[2]
		// let dataList = []
		// let roleObj = JSON.parse(results[2][0].role)
		// for (let obj of roleObj) {
		// 	obj.rowNum
		// }
		// for (let data of results[2]) {
		// 	dataList.push(JSON.parse(data.role).ADC.DDname)
		// }

		if
			(err) console.log(err);
		else
			// console.log(ChampionPool_result)

		res.json({
			ChampionPool: ChampionPool_result
		});
	});
})



module.exports = router;