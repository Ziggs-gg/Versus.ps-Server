const express = require('express');
const router = express.Router();

const db = require('../../../config/db.js');
var con = db.getConnection;

router.get('/', async (req, res) => {
	let ptID = req.query.ptID;
	const SelectedTeamRoasterCarousel =
		`
		# 0703 ver
SELECT phID, player, ptID, role, IFNULL(ROUND(((kills + assists) / deaths), 2), 'PERFECT') AS KDA, DPM, GPM, VSPM, playerIMGPath, teamIMGpath
	FROM
	(SELECT gs.phID, SUBSTRING_INDEX(gs.phID, '-', -1) AS player, SUBSTRING_INDEX(gs.phID, '-', 4) AS ptID,
		role, SUM(kills) AS kills, SUM(deaths) AS deaths, SUM(assists) AS assists, 
		ROUND(AVG(DPM), 1) AS DPM, ROUND(AVG(GPM), 1) AS GPM, ROUND(AVG(VSPM), 2) AS VSPM, playerIMGPath, teamIMGPath
		FROM games_stats AS gs
	INNER JOIN
		(SELECT phID, imgPath AS playerIMGpath FROM playerIMGpath) AS pI
        ON gs.phID = pI.phID
        INNER JOIN (SELECT ptID, imgPath AS teamIMGpath FROM teamIMGpath) AS tI
        ON SUBSTRING_INDEX(gs.phID, '-', 4) = tI.ptID
	GROUP BY gs.phID, role
    ) AS toCal
WHERE ptID = '22-LCK-SUM-GEN' -- 파라미터 영역
ORDER BY 
	FIELD (role, 'TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT');
	`;

	con.query(SelectedTeamRoasterCarousel, ptID, function (err, results) {
		if
			(err) console.log(err);
		else
			res.json(results);
	});
})



module.exports = router;