const express = require('express');
const router = express.Router();

const db = require('../../../config/db.js');
var con = db.getConnection;

router.get('/', async (req, res) => {
	let ptID = req.query.ptID;

	const ChampionPool =
		`
	SET @selected1 := '${ptID}';
        SET @selected2 := '${ptID[1]}';

		CALL teamChampionPool();
	`

	con.query(ChampionPool, ptID, function (err, results) {
		let ChampionPool_result = results[2]

		if
			(err) console.log(err);
		else
			res.json({
				ChampionPool: ChampionPool_result
			});
	});
})



module.exports = router;