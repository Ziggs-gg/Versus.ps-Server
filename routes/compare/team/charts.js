const express = require('express');
const router = express.Router();

const db = require('../../../config/db.js');
var con = db.getConnection;

router.get('/', async (req, res) => {
	let ptID = req.query.ptID;

	let WinRatebySide
	let FirstObjectRateAndWR
	let FirstObjectTime

	if (typeof (ptID) == 'string') {
		WinRatebySide =
			`
			SET @selected1 := '${ptID}';
		SET @selected2 := '';

		CALL teamChart_WinRateBySide();
			`
	}

	else {
		WinRatebySide =
			`
			SET @selected1 := '${ptID[0]}';
		SET @selected2 := '${ptID[1]}';

		CALL teamChart_WinRateBySide();
			`
	}

	const GoldDifferbyGameTime =
		`
	SET @selected1 := '${ptID}';
		SET @selected2 := '${ptID[1]}';

		CALL teamChart_GoldDiffer();
		`

	const TeamStatsbyGames =
		`
		SET @selected1 := '${ptID}';
	SET @selected2 := '${ptID[1]}';
	
	CALL teamChart_TeamStats();
		`

	if (typeof (ptID) == 'string') {
		FirstObjectRateAndWR =
			`
			SET @selected1 := '${ptID}';
		SET @selected2 := '';

		CALL teamChart_FORate();
			`
	}
	else {
		FirstObjectRateAndWR =
			`
SET @selected1 := '${ptID[0]}';
SET @selected2 := '${ptID[1]}';

CALL teamChart_FORate();
		`
	}

	if (typeof (ptID) == 'string') {
		FirstObjectTime =
			`
			SET @selected1 := '${ptID}';
			SET @selected2 := '';

		CALL teamChart_FOTime();
			`
	}
	else {
		FirstObjectTime =
			`
			SET @selected1 := '${ptID[0]}';
			SET @selected2 := '${ptID[1]}';

			CALL teamChart_FOTime();
			`
	}

	const IndexHeatmapbyPosition =
		`
			SET @selected1 := '${ptID}';
			SET @selected2 := '${ptID[1]}';

		CALL teamChart_VERSUSIndexHeatmap();
			`


	const TeamPercentDatabyPosition =
		`
		SET @selected1 := '${ptID}';
SET @selected2 := '${ptID[1]}';

CALL teamChart_TeamPCT();
		`

	con.query(WinRatebySide + GoldDifferbyGameTime + TeamStatsbyGames + FirstObjectRateAndWR + FirstObjectTime +
		IndexHeatmapbyPosition + TeamPercentDatabyPosition, [ptID], function (err, results) {

			var WinRatebySide_result = results[2]
			var GoldDifferbyGameTime_result = results[6]
			var TeamStatsbyGames_result = results[10]
			var FirstObjectRateAndWR_result = results[14]
			var FirstObjectTime_result = results[18]
			var IndexHeatmapbyPosition_result = results[22]
			var TeamPercentDatabyPosition_result = results[26]

			if
				(err) console.log(err);
			else
				res.json({
					WinRatebySide: WinRatebySide_result,
					GoldDifferbyGameTime: GoldDifferbyGameTime_result,
					TeamStatsbyGames: TeamStatsbyGames_result,
					FirstObjectRateAndWR_result: FirstObjectRateAndWR_result,
					FirstObjectTime: FirstObjectTime_result,
					IndexHeatmapbyPosition: IndexHeatmapbyPosition_result,
					TeamPercentDatabyPosition: TeamPercentDatabyPosition_result
				});
		});
})


module.exports = router;