const express = require('express');
const router = express.Router();

const db = require('../../../config/db.js');
var con = db.getConnection;

router.get('/', async (req, res) => {
	let ptID = req.query.ptID;
	const SelectedTeamBox =
		`
		CALL selectedTeamBox('${ptID}');
		`

	con.query(SelectedTeamBox, ptID, function (err, results) {
		if
			(err) console.log(err);
		else
			res.json(results[0]);
	});
})

module.exports = router;