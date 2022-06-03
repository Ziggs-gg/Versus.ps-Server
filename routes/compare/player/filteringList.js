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
        # Player Filtering List
        SELECT 
            year, splitSeason, region, role, gs.phID, CONCAT(gs.phID, '-', role) AS phRole, ImgPath 
        FROM 
            games_stats AS gs
        INNER JOIN 
            (SELECT leagueID, year, region, splitSeason FROM leagues) AS l
            ON SUBSTRING_INDEX(phID, '-', 3) = leagueID
        INNER JOIN
            (SELECT phID, ImgPath FROM playerIMGpath) AS pI
            ON gs.phID = pI.phID
        WHERE 
            year = 2022 AND -- 파라미터
            splitSeason = "Spring" AND -- 파라미터
            region REGEXP 'LCK|LPL|LEC|LCS' AND -- 파라미터
            role REGEXP 'TOP|JUNGLE|MID|ADC|SUPPORT' -- 파라미터
        GROUP BY gs.phID, role
        ORDER BY SUBSTRING_INDEX(gs.phID, '-', -1);
        `;

		con.query(query, function (err, results) {
			if
				(err) console.log(err);
			else
				res.json(results);
		})
	}

	else if (isEmpty(region)) {
		let query =
			`
        # Player Filtering List
SELECT 
	year, splitSeason, region, role, gs.phID, CONCAT(gs.phID, '-', role) AS phRole, ImgPath 
FROM 
	games_stats AS gs
INNER JOIN 
	(SELECT leagueID, year, region, splitSeason FROM leagues) AS l
	ON SUBSTRING_INDEX(phID, '-', 3) = leagueID
INNER JOIN
	(SELECT phID, ImgPath FROM playerIMGpath) AS pI
    ON gs.phID = pI.phID
WHERE 
	year = ${year} AND -- 파라미터
	splitSeason = "${splitSeason}" AND -- 파라미터
	region REGEXP ' ' AND -- 파라미터
	role REGEXP '${role} ' -- 파라미터
GROUP BY gs.phID, role
ORDER BY SUBSTRING_INDEX(gs.phID, '-', -1);
        `;

		con.query(query, [year, splitSeason, role], function (err, results) {
			if
				(err) console.log(err);
			else
				res.json(results);
		});

	}

	else if (isEmpty(role)) {
		let query =
			`
        # Player Filtering List
SELECT 
	year, splitSeason, region, role, gs.phID, CONCAT(gs.phID, '-', role) AS phRole, ImgPath 
FROM 
	games_stats AS gs
INNER JOIN 
	(SELECT leagueID, year, region, splitSeason FROM leagues) AS l
	ON SUBSTRING_INDEX(phID, '-', 3) = leagueID
INNER JOIN
	(SELECT phID, ImgPath FROM playerIMGpath) AS pI
    ON gs.phID = pI.phID
WHERE 
	year = ${year} AND -- 파라미터
	splitSeason = "${splitSeason}" AND -- 파라미터
	region REGEXP '${region}' AND -- 파라미터
	role REGEXP ' ' -- 파라미터
GROUP BY gs.phID, role
ORDER BY SUBSTRING_INDEX(gs.phID, '-', -1);
        `;

		con.query(query, [region, year, splitSeason], function (err, results) {
			if
				(err) console.log(err);
			else
				res.json(results);
		});

	}

	else {
		let query =
			`
        # Player Filtering List
SELECT 
	year, splitSeason, region, role, gs.phID, CONCAT(gs.phID, '-', role) AS phRole, ImgPath 
FROM 
	games_stats AS gs
INNER JOIN 
	(SELECT leagueID, year, region, splitSeason FROM leagues) AS l
	ON SUBSTRING_INDEX(phID, '-', 3) = leagueID
INNER JOIN
	(SELECT phID, ImgPath FROM playerIMGpath) AS pI
    ON gs.phID = pI.phID
WHERE 
	year = ${year} AND -- 파라미터
	splitSeason = "${splitSeason}" AND -- 파라미터
	region REGEXP '${region}' AND -- 파라미터
	role REGEXP '${role}' -- 파라미터
GROUP BY gs.phID, role
ORDER BY SUBSTRING_INDEX(gs.phID, '-', -1);
        `;

		con.query(query, [region, year, splitSeason, role], function (err, results) {
			if
				(err) console.log(err);
			else
				res.json(results);
		});
	}
});

module.exports = router;