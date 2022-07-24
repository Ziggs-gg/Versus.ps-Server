const express = require('express');
const router = express.Router();

const db = require('../../../config/db.js');
var con = db.getConnection;

const isEmpty = (value) => {
	if (value === null)
		return true
	if (typeof value === 'undefined')
		return true
	if (typeof value === 'string' && value === '')
		return true
	if (Array.isArray(value) && value.length < 1)
		return true
	if (typeof value === 'object' && value.constructor.name === 'Object' && Object.keys(value).length < 1 && Object.getOwnPropertyNames(value) < 1)
		return true
	if (typeof value === 'object' && value.constructor.name === 'String' && Object.keys(value).length < 1)
		return true
	else
		return false
}

router.get('/', async (req, res) => {
	let region = req.query.region;
	let year = req.query.year;
	let splitSeason = req.query.splitSeason;
	if (isEmpty(region) && isEmpty(year) && isEmpty(splitSeason)) {
		let query =
			`
			CALL teamFilteringList(2022, 'Summer', 'LCK|LPL|LEC|LCS');
			`

		con.query(query, function (err, results) {
			if
				(err) console.log(err);
			else
				res.json(results);
		});
	}

	else if (isEmpty(region)) {
		let query =
			`
			CALL teamFilteringList(${year}, '${splitSeason}', ' ');
			`

		con.query(query, [year, splitSeason], function (err, results) {
			if
				(err) console.log(err);
			else
				res.json(results);
		});
	}

	else {
		let query =
			`
			CALL teamFilteringList(${year}, '${splitSeason}', '${region}');
			`

		con.query(query, [region, year, splitSeason], function (err, results) {
			if
				(err) console.log(err);
			else
				res.json(results);
		});
	}
});

module.exports = router;