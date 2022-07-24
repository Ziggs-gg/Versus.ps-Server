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

	CALL playerChampionPool();
		`
	con.query(ChampionPool, phRole, function (err, results) {
		let ChampionPool_result = results[4]

		if
			(err) console.log(err);
		else
			res.json({
				ChampionPool: ChampionPool_result
			});
	});
});

module.exports = router;