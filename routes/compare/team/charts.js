const express = require('express');
const router = express.Router();

const db = require('../../../config/db.js');
var con = db.getConnection;

router.get('/', async (req, res) => {
	let ptID = req.query.ptID;

	const WinRatebySide =
		`
		SET @selected1 := '${ptID}';
		SET @selected2 := '${ptID[1]}';
		
SELECT
	team1 AS ptID, SUBSTRING_INDEX(team1, '-', -1) AS teamABBR ,GROUP_CONCAT(WRBlue.minutes) AS yAxis, 
	GROUP_CONCAT(gameCount_Blue) AS gameCount_Blue, GROUP_CONCAT(winCount_Blue) AS winCount_Blue, GROUP_CONCAT(ROUND((winCount_Blue / gameCount_Blue) * 100, 1)) AS WR_Blue, 
	GROUP_CONCAT(gameCount_Red) AS gameCount_Red, GROUP_CONCAT(winCount_Red) AS winCount_Red, GROUP_CONCAT(ROUND((winCount_Red / gameCount_Red) * 100, 1)) AS WR_Red
FROM
	(SELECT
		team1 , minutes, gameCount_Blue, winCount_Blue
	FROM 
		# totalBlue 
		(SELECT
			team1, 'end' AS minutes,COUNT(gameID) AS gameCount_Blue, COUNT(CASE WHEN team1 = winningTeam THEN 1 END) AS winCount_Blue
		FROM
			games AS g
		WHERE team1 = @selected1 OR
			team1 = @selected2
		GROUP BY team1) AS totalBlue
		
		UNION ALL
		
		# GL Blue Side
		(SELECT
			team1, minutes, 
			COUNT(CASE WHEN totalGolds_blue - totalGolds_red > 0 THEN team1 END) AS GL_gameCount_Blue, 
			COUNT(CASE WHEN totalGolds_blue - totalGolds_red > 0 AND team1 = winningTeam THEN 1 END) AS GL_winCount_Blue
		FROM
			games AS g
		
		INNER JOIN 
			games_gold_difference AS gd
			ON g.gameID = gd.gameID
		
		WHERE team1 = @selected1 OR
			team1 = @selected2
		GROUP BY team1, minutes
		HAVING 
			minutes = 15 OR 
			minutes = 20 OR 
			minutes = 25)
	ORDER BY FIELD(team1, @selected1, @selected2), FIELD(minutes, 15, 20, 25, 'end')
	) AS WRBlue

INNER JOIN # redSide
	(SELECT 
		team2, minutes, GameCount_Red, WinCount_Red
	FROM # totalRed
		(SELECT
			team2, 'end' AS minutes, COUNT(gameID) AS GameCount_Red, COUNT(CASE WHEN team2 = winningTeam THEN 1 END) AS WinCount_Red
		FROM
			games AS g
		WHERE team2 = @selected1 OR
			team2 = @selected2
		GROUP BY team2) AS totalRed
		
		UNION ALL
		
		# GL Red Side
		(SELECT
			team2, minutes, 
			COUNT(CASE WHEN totalGolds_red - totalGolds_blue > 0 THEN team2 END) AS GL_gameCount_Red, 
			COUNT(CASE WHEN totalGolds_red - totalGolds_blue > 0 AND team2 = winningTeam THEN 1 END) AS GL_winCount_Red
		FROM
			games AS g
		
		INNER JOIN 
			games_gold_difference AS gd
			ON g.gameID = gd.gameID
		
		WHERE team2 = @selected1 OR
			team2 = @selected2
		GROUP BY team2, minutes
		HAVING 
			minutes = 15 OR 
			minutes = 20 OR 
			minutes = 25)
		
	ORDER BY FIELD(team2, @selected1, @selected2), FIELD(minutes, 15, 20, 25, 'end')
	) AS WRRed
	ON team1 = team2 AND
	WRBlue.minutes = WRRed.minutes
GROUP BY ptID;
	`;

	const GoldDifferbyGameTime =
		`
		SET @selected1 := '${ptID}';
		SET @selected2 := '${ptID[1]}';
		
		SELECT
	ptID, GROUP_CONCAT(minutes) AS minutes, GROUP_CONCAT(AVG_GD) AS AVG_GD, GROUP_CONCAT(gameCount) AS gameCount
FROM # timeSeries 
	(SELECT
		ptID, minutes, ROUND(SUM(sum_GD) / SUM(count_GD), 2) AS AVG_GD, SUM(count_GD) AS gameCount
	FROM # unionGD
		(# AVG_blueGD
		SELECT 
			team1 AS ptID, minutes, SUM(totalGolds_blue - totalGolds_red) AS sum_GD, COUNT(totalGolds_blue - totalGolds_red) AS count_GD
		FROM 
			(SELECT	gameID, ROUND(minutes) AS minutes, totalGolds_blue, totalGolds_red
			FROM	games_gold_difference) AS gd
		INNER JOIN
			(SELECT gameID, team1 FROM games) AS g
			ON gd.gameID = g.gameID
		GROUP BY team1, minutes
		
		UNION ALL
		
		# AVG_redGD
		SELECT 
			team2, minutes, SUM(totalGolds_red - totalGolds_blue) AS sum_GD, COUNT(totalGolds_red - totalGolds_blue) AS count_GD
		FROM 
			(SELECT	gameID, ROUND(minutes) AS minutes, totalGolds_blue, totalGolds_red
			FROM	games_gold_difference) AS gd
		INNER JOIN
			(SELECT gameID, team2 FROM games) AS g
			ON gd.gameID = g.gameID
		GROUP BY team2, minutes
		) AS unionGD
	
	WHERE
		FIND_IN_SET(ptID, @selected1) OR
		FIND_IN_SET(ptID, @selected2) 
	GROUP BY ptID, minutes
	ORDER BY FIELD(ptID, @selected1, @selected2), minutes
	) AS timeSeries
GROUP BY ptID;
	`;

	const TeamStatsbyGames =
		`
		SET @selected1 := '${ptID}';
		SET @selected2 := '${ptID[1]}';
		
		SELECT ptID, SUBSTRING_INDEX(ptID, '-', -1) AS team, SEC_TO_TIME(ROUND((AVG(TIME_TO_SEC(gameTime))))) AS gameTime, 
			ROUND(AVG(kills), 2) AS kills, ROUND(AVG(deaths), 2) AS deaths, ROUND(AVG(countTurretDestroy), 1) AS countTurretDestroy,
			ROUND(AVG(golds), 2) AS golds, ROUND(AVG(visionScore), 2) AS visionScore, ROUND(AVG(countDrake), 2) AS countDrake,
			ROUND(AVG(countHerald), 2) AS countHerald, ROUND(AVG(countNashor), 2) AS countNashor, ROUND(AVG(countInhibitDestroy), 2) AS countInhibitDestroy
			FROM gs_teams AS gt
		INNER JOIN 
			(SELECT gameID, gameTime FROM games) AS g
			ON gt.gameID = g.gameID
		WHERE FIND_IN_SET(ptID, @selected1) OR
			FIND_IN_SET(ptID, @selected2) 
		GROUP BY ptID
		ORDER BY FIELD(ptID, @selected1, @selected2);
	`;

	const FirstObjectRateAndWR =
		`
		SET @selected1 := '${ptID}';
		SET @selected2 := '${ptID[1]}';

		SELECT
		ptID, COUNT(ptID) AS gameCount, 
		# FO count
		SUM(FK) AS countFK, SUM(FT) AS countFT, SUM(FH) AS countFH, SUM(FD) AS countFD, SUM(FN) AS countFN,
		# FO winCount
		SUM(FKwin) AS countFKwin, SUM(FTwin) AS countFTwin, SUM(FHwin) AS countFHwin, SUM(FDwin) AS countFDwin, SUM(FNwin) AS countFNwin,
		# FO %
		SUM(FK) / COUNT(ptID) AS FKpct, SUM(FT) / COUNT(ptID) AS FTpct, SUM(FH) / COUNT(ptID) AS FHpct, SUM(FD) / COUNT(ptID) AS FDpct, SUM(FN) / COUNT(ptID) FNpct,
		# FO_WR
		SUM(FKwin) / SUM(FK) AS FKwinPCT, SUM(FTwin) / SUM(FT) AS FTwinPCT, SUM(FHwin) / SUM(FH) AS FHwinPCT, SUM(FDwin) / SUM(FD) AS FDwinPCT, SUM(FNwin) / SUM(FN) AS FNwinPCT
	FROM # foUnion
		(# Blue Side Team First Object Query
		(SELECT 
			g.gameID, team1 AS ptID, winningTeam, FK, FT, FH, FN, FD,
			FK = winGame AS FKwin,
			FT = winGame AS FTwin,
			FH = winGame AS FHwin,
			FN = winGame AS FNwin,
			FD = winGame AS FDwin
		FROM # g
			(SELECT
				gameID, team1, winningTeam, winningTeam = team1 AS winGame
			FROM
				games
			GROUP BY gameID
			) AS g
		LEFT JOIN # firstObject2
			(# Earend First Object Query
			SELECT
				gameID, earningTeamID, MIN(FK) AS FK, MIN(FT) AS FT, MIN(FH) AS FH, MIN(FN) AS FN
			FROM # firstObject1
				(SELECT
					gameID, earningTeamID,
					(CASE WHEN objectID = 10 THEN 1 END) AS FK, -- First Kill
					(CASE WHEN objectID = 11 THEN 1 END) AS FT, -- First Tower
					(CASE WHEN objectID = 08 THEN 1 END) AS FH, -- First Herald
					(CASE WHEN objectID = 09 THEN 1 END) AS FN -- First Nashor
				FROM
					game_time_table
				GROUP BY gameID, objectID
				HAVING objectID REGEXP ('08|09|10|11')
				) AS firstObject1
			GROUP BY gameID, earningTeamID
			) AS firstObject2
			ON g.gameID = firstObject2.gameID AND
			team1 = firstObject2.earningTeamID
			
		LEFT JOIN # firstDragon
			(SELECT
				gameID, earningTeamID, target, 1 AS FD
			FROM
				game_time_table
			GROUP BY gameID, target LIKE '%Drake'
			HAVING target LIKE '%Drake'
			ORDER BY gameID
			) AS firstDragon
			ON g.gameID = firstDragon.gameID AND
			team1 = firstDragon.earningTeamID
		)
		
		UNION ALL
		
		# Red Side Team First Object Query
		(SELECT 
			g.gameID, team2, winningTeam, FK, FT, FH, FN, FD,
			FK = winGame AS FKwin,
			FT = winGame AS FTwin,
			FH = winGame AS FHwin,
			FN = winGame AS FNwin,
			FD = winGame AS FDwin
		FROM # g
			(SELECT
				gameID, team2, winningTeam, winningTeam = team2 AS winGame
			FROM
				games
			GROUP BY gameID
			) AS g
		LEFT JOIN # firstObject2
			(# Earend First Object Query
			SELECT
				gameID, earningTeamID, MIN(FK) AS FK, MIN(FT) AS FT, MIN(FH) AS FH, MIN(FN) AS FN
			FROM # firstObject1
				(SELECT
					gameID, earningTeamID,
					(CASE WHEN objectID = 10 THEN 1 END) AS FK, -- First Kill
					(CASE WHEN objectID = 11 THEN 1 END) AS FT, -- First Tower
					(CASE WHEN objectID = 08 THEN 1 END) AS FH, -- First Herald
					(CASE WHEN objectID = 09 THEN 1 END) AS FN -- First Nashor
				FROM
					game_time_table
				GROUP BY gameID, objectID
				HAVING objectID REGEXP ('08|09|10|11')
				) AS firstObject1
			GROUP BY gameID, earningTeamID
			) AS firstObject2
			ON g.gameID = firstObject2.gameID AND
			team2 = firstObject2.earningTeamID
			
		LEFT JOIN # firstDragon
			(SELECT
				gameID, earningTeamID, target, 1 AS FD
			FROM
				game_time_table
			GROUP BY gameID, target LIKE '%Drake'
			HAVING target LIKE '%Drake'
			ORDER BY gameID
			) AS firstDragon
			ON g.gameID = firstDragon.gameID AND
			team2 = firstDragon.earningTeamID
		)
		ORDER BY gameID
		) AS foUnion
	GROUP BY ptID
	HAVING ptID = @selected1 OR
		ptID = @selected2
	ORDER BY FIELD(ptID, @selected1, @selcted2);
	`;

	const FirstObjectTime =
		`
		SET @selected1 := '${ptID}';
		SET @selected2 := '${ptID[1]}';

		SELECT
		FOtime.earningTeamID AS ptID, AVG_FKtime, AVG_FTtime, AVG_FHtime, AVG_FDtime
	FROM # FOtime
		(SELECT
			earningTeamID, SEC_TO_TIME(ROUND(AVG(TIME_TO_SEC(FKtime)))) AS AVG_FKtime, SEC_TO_TIME(ROUND(AVG(TIME_TO_SEC(FTtime)))) AS AVG_FTtime, SEC_TO_TIME(ROUND(AVG(TIME_TO_SEC(FHtime)))) AS AVG_FHtime
		FROM # firstObject
			(SELECT
				gameID, earningTeamID, MIN(FK) AS FKtime, MIN(FT) AS FTtime, MIN(FH) AS FHtime
			FROM # firstObject1
				(SELECT
					gameID, earningTeamID,
					(CASE WHEN objectID = 10 THEN time END) AS FK, -- First Kill
					(CASE WHEN objectID = 11 THEN time END) AS FT, -- First Tower
					(CASE WHEN objectID = 08 THEN time END) AS FH -- First Herald
				FROM
					game_time_table
				GROUP BY gameID, objectID
				HAVING objectID REGEXP ('08|10|11')
				) AS firstObject1
			GROUP BY gameID, earningTeamID
			) AS firstObject
		GROUP BY earningTeamID
		) AS FOtime
	
	LEFT JOIN # FDtime
		(SELECT
			earningTeamID, SEC_TO_TIME(ROUND(AVG(TIME_TO_SEC(FDtime)))) AS AVG_FDtime
		FROM # firstDragon
			(SELECT
				gameID, earningTeamID, target, time AS FDtime
			FROM
				game_time_table
			GROUP BY gameID, target LIKE '%Drake'
			HAVING target LIKE '%Drake'
			) AS firstDragon
		GROUP BY earningTeamID
		) AS FDtime
		ON FOtime.earningTeamID = FDtime.earningTeamID
	WHERE FOtime.earningTeamID = @selected1 OR
		FOtime.earningTeamID = @selected2;
	`;

	const IndexHeatmapbyPosition =
		`
		SET @selected1 := '${ptID}';
		SET @selected2 := '${ptID[1]}';
		
		SELECT ptID, role, AVG_CP, AVG_SA, AVG_EP, AVG_VC
			FROM
			(SELECT SUBSTRING_INDEX(phID, '-', 4) AS ptID, role, ROUND(AVG(CPnorm), 2) AS AVG_CP, 
				ROUND(AVG(SAnorm), 2) AS AVG_SA, ROUND(AVG(EPnorm), 2) AS AVG_EP, ROUND(AVG(VCnorm), 2) AS AVG_VC
				FROM games_index
			GROUP BY SUBSTRING_INDEX(phID, '-', 4), role)
			AS toCal
		WHERE FIND_IN_SET(ptID, @selected1) OR
			FIND_IN_SET(ptID, @selected2)
		ORDER BY FIELD(ptID, @selected1, @selected2),
				FIELD (role, 'TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT');
	`;

	const TeamPercentDatabyPosition =
		`
		SET @selected1 := '${ptID}';
		SET @selected2 := '${ptID[1]}';

		SELECT 
	SUBSTRING_INDEX(phID, '-', 4) AS ptID,SUBSTRING_INDEX(SUBSTRING_INDEX(phID, '-', 4), '-', -1) AS teamABBR, 
    (CASE # role 한글화
		WHEN role = 'TOP' THEN '탑'
        WHEN role = 'JUNGLE' THEN '정글'
        WHEN role = 'MID' THEN '미드'
        WHEN role = 'ADC' THEN '원딜'
        WHEN role = 'SUPPORT' THEN '서폿'
	END) AS role,
	(AVG(gs.totalDamageToChampion) / gt.totalDamageToChampion) * 100 AS DMGPCT ,
	(AVG(gs.totalDamageTaken) / gt.totalDamageTaken) * 100 AS DTPCT,
	(AVG(gs.CS) / gt.CS) * 100 AS CS, 
	(AVG(gs.golds) / gt.golds) * 100 AS golds, 
	(AVG(gs.visionScore) / gt.visionScore) * 100 AS visionScore
FROM 
	games_stats AS gs
INNER JOIN 
	(SELECT 
		ptID, AVG(totalDamageToChampion) AS totalDamageToChampion, AVG(totalDamageTaken) AS totalDamageTaken, 
		AVG(CS) AS CS, AVG(golds) AS golds, AVG(visionScore) AS visionScore 
	FROM gs_teams
	GROUP BY ptID) AS gt
	ON SUBSTRING_INDEX(phID, '-', 4) = gt.ptID
WHERE FIND_IN_SET(ptID, @selected1) OR
	FIND_IN_SET(ptID, @selected2) 
GROUP BY SUBSTRING_INDEX(phID, '-', 4), role
ORDER BY FIELD(ptID, @selected1, @selected2),
	FIELD (role, 'TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT');
	`;

	con.query(WinRatebySide + GoldDifferbyGameTime + TeamStatsbyGames + FirstObjectRateAndWR + FirstObjectTime +
		IndexHeatmapbyPosition + TeamPercentDatabyPosition, [ptID], function (err, results) {

			var WinRatebySide_result = results[2]
			var GoldDifferbyGameTime_result = results[5]
			var TeamStatsbyGames_result = results[8]
			var FirstObjectRateAndWR_result = results[11]
			var FirstObjectTime_result = results[14]
			var IndexHeatmapbyPosition_result = results[17]
			var TeamPercentDatabyPosition_result = results[20]
						
			if
				(err) console.log(err);
			else
				res.json({
					WinRatebySide: WinRatebySide_result,
					GoldDifferbyGameTime: GoldDifferbyGameTime_result,
					TeamStatsbyGames: TeamStatsbyGames_result,
					FirstObjectRateAndWR_result: FirstObjectRateAndWR_result,
					FirstObjectTime: FirstObjectTime_result,
					IndexHeatmapbyPosition: IndexHeatmapbyPosition_result,
					TeamPercentDatabyPosition: TeamPercentDatabyPosition_result					
				});
		});
})

module.exports = router;