const express = require('express');
const router = express.Router();

const db = require('../../../config/db.js');
var con = db.getConnection;

router.get('/', async (req, res) => {
	let phRole = req.query.phRole

	if (typeof (phRole) == 'string') {
		const Heatmap =
			`
		SET @selected1:= '${phRole}'; 
			CALL playerChart_heatmap();
			`

		con.query(Heatmap, phRole, function (err, results) {
			let Heatmap_result = results[1]

			if
				(err) console.log(err);
			else
				res.json({
					Heatmap: Heatmap_result
				});
		});

	}
	else {
		const Heatmap =
			`
			# Selected Card Data parsing
		SET @selected1:= '${phRole[0]}'; 
			SET @selected2:= '${phRole[1]}'; 
			SET @selected3:= '${phRole[2]}'; 
			SET @selected4:= '${phRole[3]}'; 

			CALL playerChart_heatmap();
			`

		con.query(Heatmap, phRole, function (err, results) {
			let Heatmap_result = results[4]

			if
				(err) console.log(err);
			else
				res.json({
					Heatmap: Heatmap_result
				});
		});

	}
});





module.exports = router;