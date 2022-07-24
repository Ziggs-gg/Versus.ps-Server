const express = require('express');
const router = express.Router();

const db = require('../../../config/db.js');
var con = db.getConnection;

router.get('/', async (req, res) => {
	let ptID = req.query.ptID;
	const SelectedTeamRoasterCarousel =
		`
		CALL selectedTeamRoaster('${ptID}');
		`

	con.query(SelectedTeamRoasterCarousel, ptID, function (err, results) {
		if
			(err) console.log(err);
		else
			res.json(results);
	});
})



module.exports = router;