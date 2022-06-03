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
			SELECT year, splitSeason, region, pt.ptID, teamFullName, imgPath
			FROM participating_teams AS pt
			INNER JOIN 
				(SELECT leagueID, year, region, splitSeason FROM leagues) AS l
				ON pt.leagueID = l.leagueID
			INNER JOIN
				(SELECT ptID, imgPath FROM teamIMGpath) AS tI
				ON pt.ptID = tI.ptID
			WHERE 
				year = 2022 AND -- 파라미터
				splitSeason = "Spring" AND -- 파라미터
				region REGEXP 'LCK|LPL|LEC|LCS'  -- 파라미터
			ORDER BY teamFullName;   
        `;

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
			SELECT year, splitSeason, region, pt.ptID, teamFullName, imgPath
			FROM participating_teams AS pt
			INNER JOIN 
				(SELECT leagueID, year, region, splitSeason FROM leagues) AS l
				ON pt.leagueID = l.leagueID
			INNER JOIN
				(SELECT ptID, imgPath FROM teamIMGpath) AS tI
				ON pt.ptID = tI.ptID
			WHERE 
				year = ${year} AND -- 파라미터
				splitSeason = "${splitSeason}" AND -- 파라미터
				region REGEXP ' '  -- 파라미터
			ORDER BY teamFullName;   
        `;

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
        SELECT year, splitSeason, region, pt.ptID, teamFullName, imgPath
			FROM participating_teams AS pt
			INNER JOIN 
				(SELECT leagueID, year, region, splitSeason FROM leagues) AS l
				ON pt.leagueID = l.leagueID
			INNER JOIN
				(SELECT ptID, imgPath FROM teamIMGpath) AS tI
				ON pt.ptID = tI.ptID
			WHERE 
				year = ${year} AND -- 파라미터
				splitSeason = "${splitSeason}" AND -- 파라미터
				region REGEXP '${region}'  -- 파라미터
			ORDER BY teamFullName;      
        `;

		con.query(query, [region, year, splitSeason], function (err, results) {
			if
				(err) console.log(err);
			else
				res.json(results);
		});
	}
});

module.exports = router;