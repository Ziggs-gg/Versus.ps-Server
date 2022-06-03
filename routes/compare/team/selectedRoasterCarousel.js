const express = require('express');
const router = express.Router();

const db = require('../../../config/db.js');
var con = db.getConnection;

router.get('/', async (req, res) => {
	let ptID = req.query.ptID;
	const SelectedTeamRoasterCarousel =
		`
		SELECT phID, player, ptID, role, ROUND(((kills + assists) / deaths), 2) AS KDA, DPM, GPM, VSPM, imgPath
	FROM
	(SELECT gs.phID, SUBSTRING_INDEX(gs.phID, '-', -1) AS player, SUBSTRING_INDEX(gs.phID, '-', 4) AS ptID,
		role, SUM(kills) AS kills, SUM(deaths) AS deaths, SUM(assists) AS assists, 
		ROUND(AVG(DPM), 1) AS DPM, ROUND(AVG(GPM), 1) AS GPM, ROUND(AVG(VSPM), 2) AS VSPM, imgPath
		FROM games_stats AS gs
	INNER JOIN
		(SELECT phID, imgPath FROM playerIMGpath) AS pI
        ON gs.phID = pI.phID
	GROUP BY gs.phID, role
    ) AS toCal
WHERE ptID = '${ptID}'
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