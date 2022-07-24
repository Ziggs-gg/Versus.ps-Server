const express = require('express');
const router = express.Router();

const db = require('../../../config/db.js');
var con = db.getConnection;

router.get('/', async (req, res) => {
	let phRole = req.query.phRole;
	const SelectedPlayerBox =
		`
		CALL selectedPlayerBox('${phRole}');
		`

	con.query(SelectedPlayerBox, phRole, function (err, results) {
		if
			(err) console.log(err);
		else
			res.json(results);
	});
})

module.exports = router;
