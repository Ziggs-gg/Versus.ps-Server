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
	let role = req.query.role;

	if (isEmpty(region) && isEmpty(year) && isEmpty(splitSeason) && isEmpty(role)) {
		let query =	
			`
			CALL playerFilteringList(2022, 'Summer', 'LCK|LPL|LEC|LCS', 'TOP|JUNGLE|MID|ADC|SUPPORT');
			`

		con.query(query, function (err, results) {
			if
				(err) console.log(err);
			else
				res.json(results[0]);
		})
	}

	else if (isEmpty(region)) {
		let query =			
			`
			CALL playerFilteringList(${year},  '${splitSeason}', ' ', '${role}');
			`

		con.query(query, [year, splitSeason, role], function (err, results) {
			if
				(err) console.log(err);
			else
				res.json(results[0]);
		});

	}

	else if (isEmpty(role)) {
		let query =			
			`
			CALL playerFilteringList(${year},  '${splitSeason}', '${region}', ' ');
			`

		con.query(query, [region, year, splitSeason], function (err, results) {
			if
				(err) console.log(err);
			else
				res.json(results[0]);
		});

	}

	else {
		let query =
			`
			CALL playerFilteringList(${year},  '${splitSeason}', '${region}', '${role}');
			`

		con.query(query, [region, year, splitSeason, role], function (err, results) {
			if
				(err) console.log(err);
			else
				res.json(results[0]);
		});
	}
});

module.exports = router;