const express = require('express');
const router = express.Router();

const db = require('../../../config/db.js');
var con = db.getConnection;

router.get('/', async (req, res) => {
	let phRole = req.query.phRole

	if (typeof (phRole) == 'string') {
		const Heatmap = `
		# Selected Card Data parsing
		SET @selected1:= '${phRole}'; 
	
		# 0614
SELECT
	yy, splitSeason, region, phID, role, gameCount,
	AVG_kills,AVG_deaths,AVG_assists,AVG_KDA,AVG_KPPCT,AVG_DTHPCT,
	AVG_CSM,AVG_GPM,AVG_goldPCT,
	AVG_VSPM,AVG_WPM,AVG_WCPM,AVG_VSPCT,
	AVG_DPM,AVG_DMGPCT,AVG_DPG,AVG_DTPM,AVG_DTPCT,
	AVG_GDat15,AVG_CSDat15,AVG_XPDat15
FROM # heatmap
	(# Major Total AVG Stats by Position 
	SELECT
		yy, splitSeason, region, phID, role, gameCount,
		AVG_kills, AVG_deaths, AVG_assists, AVG_KDA, AVG_KPPCT, AVG_DTHPCT, 
		AVG_CSM, AVG_GPM, AVG_goldPCT, 
		AVG_VSPM, AVG_WPM, AVG_WCPM, AVG_VSPCT, 
		AVG_DPM, AVG_DMGPCT, AVG_DPG, AVG_DTPM, AVG_DTPCT,
		AVG_GDat15, AVG_CSDat15, AVG_XPDat15
	FROM # majorAVG
		(SELECT
			RIGHT(year, 2) AS yy, splitSeason, '4대 리그' AS region, '4대 리그 평균' AS phID, role, CONCAT('4대 리그 ', role, ' 평균') AS phRole, COUNT(phID) AS gameCount,
			ROUND(AVG(kills),2) AS AVG_kills, ROUND(AVG(deaths),2) AS AVG_deaths, ROUND(AVG(assists),2) AS AVG_assists, 
			ROUND(AVG(KDA),2) AS AVG_KDA, CONCAT(ROUND(AVG(KPPCT),1), '%') AS AVG_KPPCT, CONCAT(ROUND(AVG(DTHPCT),1), '%') AS AVG_DTHPCT,
			ROUND(AVG(CSM),1) AS AVG_CSM, ROUND(AVG(GPM),2) AS AVG_GPM, CONCAT(ROUND(AVG(goldPCT),1), '%') AS AVG_goldPCT,
			ROUND(AVG(VSPM),2) AS AVG_VSPM, ROUND(AVG(WPM),2) AS AVG_WPM, ROUND(AVG(WCPM),2) AS AVG_WCPM, CONCAT(ROUND(AVG(VSPCT),1), '%') AS AVG_VSPCT,
			ROUND(AVG(DPM),2) AS AVG_DPM, CONCAT(ROUND(AVG(DMGPCT),1), '%') AS AVG_DMGPCT, ROUND(AVG(DPG),2) AS AVG_DPG, ROUND(AVG(DTPM),2) AS AVG_DTPM, CONCAT(ROUND(AVG(DTPCT),1), '%') AS AVG_DTPCT,
			ROUND(AVG(GDat15),0) AS AVG_GDat15, ROUND(AVG(CSDat15),1) AS AVG_CSDat15, ROUND(AVG(XPDat15),1) AS AVG_XPDat15
		
		FROM # baseQuery
			(SELECT 
				region, year, splitSeason, 
				(CASE # LCS phID 양식 통일하기
					WHEN SUBSTRING_INDEX(SUBSTRING_INDEX(phID, '-', 3), '-', -1) = 'MSS' THEN REPLACE(phID, 'MSS', 'SPR_PO')
					WHEN SUBSTRING_INDEX(SUBSTRING_INDEX(phID, '-', 3), '-', -1) = 'CHA' THEN REPLACE(phID, 'CHA', 'SUM_PO')
					ELSE phID 
				END) AS phID, 
				role, 
				kills, deaths, assists, IF(deaths != 0, (kills + assists) / deaths, 1.2*(kills+assists)) AS KDA, ((kills + assists) / K_t) * 100 AS KPPCT, (deaths / D_t) * 100 AS DTHPCT,
				CS / min AS CSM, golds / min AS GPM, (golds / G_t) * 100 AS goldPCT,
				visionScore / min AS VSPM, wardsPlaced / min AS WPM, wardsDestroyed / min AS WCPM, (visionScore / VS_t) * 100 AS VSPCT,
				totalDamageToChampion / min AS DPM, (totalDamageToChampion / DMG_t) * 100 AS DMGPCT, totalDamageToChampion / golds AS DPG,
				totalDamageTaken / min AS DTPM, (totalDamageTaken / DT_t) * 100 AS DTPCT, 
				GDat15, CSDat15, XPDat15
			FROM games_stats AS gs
			# 팀 데이터 불러오기
			INNER JOIN
				(SELECT
					gameID, ptID, kills AS K_t, deaths AS D_t, golds AS G_t, visionScore AS VS_t, totalDamageToChampion AS DMG_t, totalDamageTaken AS DT_t 
				FROM gs_teams) AS gt
				ON gs.gameID = gt.gameID AND
				SUBSTRING_INDEX(phID, '-', 4) = ptID
			# gameTime 불러오기
			INNER JOIN 
				(SELECT gameID, TIME_TO_SEC(gameTime)/60 AS min FROM games) AS g
				ON gs.gameID = g.gameID 
			# 리그 정보 불러오기
			INNER JOIN
				(SELECT 
					leagueID, region, year, (CASE 
									WHEN splitSeason = 'Spring' THEN 'SPR'
									WHEN splitSeason = 'Spring Playoffs' THEN 'SPR_PO'
									WHEN splitSeason = 'Summer' THEN 'SUM'
									WHEN splitSeason = 'Summer Playoffs' THEN 'SUM_PO'
								END) AS splitSeason
				FROM leagues) AS l
				ON SUBSTRING_INDEX(phID, '-', 3) = leagueID
			) AS baseQuery
		GROUP BY year, splitSeason, role 
		ORDER BY 
			FIELD(
			CONCAT(yy, '-', splitSeason, '-', role),
			CONCAT(SUBSTRING_INDEX(@selected1, '-', 1), '-', SUBSTRING_INDEX(SUBSTRING_INDEX(@selected1, '-', 3),'-', -1), '-', SUBSTRING_INDEX(@selected1, '-', -1)),
			CONCAT(SUBSTRING_INDEX(@selected2, '-', 1), '-', SUBSTRING_INDEX(SUBSTRING_INDEX(@selected2, '-', 3),'-', -1), '-', SUBSTRING_INDEX(@selected2, '-', -1)),
			CONCAT(SUBSTRING_INDEX(@selected3, '-', 1), '-', SUBSTRING_INDEX(SUBSTRING_INDEX(@selected3, '-', 3),'-', -1), '-', SUBSTRING_INDEX(@selected3, '-', -1)),
			CONCAT(SUBSTRING_INDEX(@selected4, '-', 1), '-', SUBSTRING_INDEX(SUBSTRING_INDEX(@selected4, '-', 3),'-', -1), '-', SUBSTRING_INDEX(@selected4, '-', -1))
			)
		) AS majorAVG
	WHERE 
		# @selected1에 해당하는 시즌, 포지션 평균
		yy = LEFT(@selected1, 2) AND
		splitSeason = SUBSTRING_INDEX(SUBSTRING_INDEX(@selected1, '-', 3), '-', -1) AND
		role = SUBSTRING_INDEX(@selected1, '-', -1) OR
		
		# @selected2에 해당하는 시즌, 포지션 평균
		yy = LEFT(@selected2, 2) AND
		splitSeason = SUBSTRING_INDEX(SUBSTRING_INDEX(@selected2, '-', 3), '-', -1) AND
		role = SUBSTRING_INDEX(@selected2, '-', -1) OR
	
		# @selected3에 해당하는 시즌, 포지션 평균
		yy = LEFT(@selected3, 2) AND
		splitSeason = SUBSTRING_INDEX(SUBSTRING_INDEX(@selected3, '-', 3), '-', -1) AND
		role = SUBSTRING_INDEX(@selected3, '-', -1) OR
	
		# @selected4에 해당하는 시즌, 포지션 평균
		yy = LEFT(@selected4, 2) AND
		splitSeason = SUBSTRING_INDEX(SUBSTRING_INDEX(@selected4, '-', 3), '-', -1) AND
		role = SUBSTRING_INDEX(@selected4, '-', -1) 
	####################################################################################################################################################
	UNION ALL # League AVG Stats 
	SELECT
		yy, splitSeason, region, phID, role, gameCount,
		AVG_kills, AVG_deaths, AVG_assists, AVG_KDA, AVG_KPPCT, AVG_DTHPCT, 
		AVG_CSM, AVG_GPM, AVG_goldPCT, 
		AVG_VSPM, AVG_WPM, AVG_WCPM, AVG_VSPCT, 
		AVG_DPM, AVG_DMGPCT, AVG_DPG, AVG_DTPM, AVG_DTPCT,
		AVG_GDat15, AVG_CSDat15, AVG_XPDat15
	FROM # leaguesAVG
		(SELECT
			RIGHT(year, 2) AS yy, splitSeason, region, CONCAT(region, ' 평균') AS phID, role, CONCAT(region, ' ', role, ' 평균') AS phRole, COUNT(phID) AS gameCount,
			ROUND(AVG(kills),2) AS AVG_kills, ROUND(AVG(deaths),2) AS AVG_deaths, ROUND(AVG(assists),2) AS AVG_assists, 
			ROUND(AVG(KDA),2) AS AVG_KDA, CONCAT(ROUND(AVG(KPPCT),1), '%') AS AVG_KPPCT, CONCAT(ROUND(AVG(DTHPCT),1), '%') AS AVG_DTHPCT,
			ROUND(AVG(CSM),1) AS AVG_CSM, ROUND(AVG(GPM),2) AS AVG_GPM, CONCAT(ROUND(AVG(goldPCT),1), '%') AS AVG_goldPCT,
			ROUND(AVG(VSPM),2) AS AVG_VSPM, ROUND(AVG(WPM),2) AS AVG_WPM, ROUND(AVG(WCPM),2) AS AVG_WCPM, CONCAT(ROUND(AVG(VSPCT),1), '%') AS AVG_VSPCT,
			ROUND(AVG(DPM),2) AS AVG_DPM, CONCAT(ROUND(AVG(DMGPCT),1), '%') AS AVG_DMGPCT, ROUND(AVG(DPG),2) AS AVG_DPG, ROUND(AVG(DTPM),2) AS AVG_DTPM, CONCAT(ROUND(AVG(DTPCT),1), '%') AS AVG_DTPCT,
			ROUND(AVG(GDat15),0) AS AVG_GDat15, ROUND(AVG(CSDat15),1) AS AVG_CSDat15, ROUND(AVG(XPDat15),1) AS AVG_XPDat15
		
		FROM # baseQuery
			(SELECT 
				region, year, splitSeason, 
				(CASE # LCS phID 양식 통일하기
					WHEN SUBSTRING_INDEX(SUBSTRING_INDEX(phID, '-', 3), '-', -1) = 'MSS' THEN REPLACE(phID, 'MSS', 'SPR_PO')
					WHEN SUBSTRING_INDEX(SUBSTRING_INDEX(phID, '-', 3), '-', -1) = 'CHA' THEN REPLACE(phID, 'CHA', 'SUM_PO')
					ELSE phID 
				END) AS phID, 
				role, 
				kills, deaths, assists, IF(deaths != 0, (kills + assists) / deaths, 1.2*(kills+assists)) AS KDA, ((kills + assists) / K_t) * 100 AS KPPCT, (deaths / D_t) * 100 AS DTHPCT,
				CS / min AS CSM, golds / min AS GPM, (golds / G_t) * 100 AS goldPCT,
				visionScore / min AS VSPM, wardsPlaced / min AS WPM, wardsDestroyed / min AS WCPM, (visionScore / VS_t) * 100 AS VSPCT,
				totalDamageToChampion / min AS DPM, (totalDamageToChampion / DMG_t) * 100 AS DMGPCT, totalDamageToChampion / golds AS DPG,
				totalDamageTaken / min AS DTPM, (totalDamageTaken / DT_t) * 100 AS DTPCT, 
				GDat15, CSDat15, XPDat15
			FROM games_stats AS gs
			# 팀 데이터 불러오기
			INNER JOIN
				(SELECT
					gameID, ptID, kills AS K_t, deaths AS D_t, golds AS G_t, visionScore AS VS_t, totalDamageToChampion AS DMG_t, totalDamageTaken AS DT_t 
				FROM gs_teams) AS gt
				ON gs.gameID = gt.gameID AND
				SUBSTRING_INDEX(phID, '-', 4) = ptID
			# gameTime 불러오기
			INNER JOIN 
				(SELECT gameID, TIME_TO_SEC(gameTime)/60 AS min FROM games) AS g
				ON gs.gameID = g.gameID 
			# 리그 정보 불러오기
			INNER JOIN
				(SELECT 
					leagueID, region, year, (CASE 
									WHEN splitSeason = 'Spring' THEN 'SPR'
									WHEN splitSeason = 'Spring Playoffs' THEN 'SPR_PO'
									WHEN splitSeason = 'Summer' THEN 'SUM'
									WHEN splitSeason = 'Summer Playoffs' THEN 'SUM_PO'
								END) AS splitSeason
				FROM leagues) AS l
				ON SUBSTRING_INDEX(phID, '-', 3) = leagueID
			) AS baseQuery
		GROUP BY region, year, splitSeason, ROLE
		ORDER BY 
			FIELD(
			CONCAT(yy, '-', region, '-', splitSeason, '-', role),
			CONCAT(SUBSTRING_INDEX(@selected1, '-', 3), '-', SUBSTRING_INDEX(@selected1, '-', -1)),
			CONCAT(SUBSTRING_INDEX(@selected2, '-', 3), '-', SUBSTRING_INDEX(@selected2, '-', -1)),
			CONCAT(SUBSTRING_INDEX(@selected3, '-', 3), '-', SUBSTRING_INDEX(@selected3, '-', -1)),
			CONCAT(SUBSTRING_INDEX(@selected4, '-', 3), '-', SUBSTRING_INDEX(@selected4, '-', -1))
			)
		) AS leaguesAVG
	WHERE 
		# @selected1에 해당하는 시즌, 포지션 평균
		region = SUBSTRING_INDEX(SUBSTRING_INDEX(@selected1, '-', 2), '-', -1) AND
		yy = LEFT(@selected1, 2) AND
		splitSeason = SUBSTRING_INDEX(SUBSTRING_INDEX(@selected1, '-', 3), '-', -1) AND
		role = SUBSTRING_INDEX(@selected1, '-', -1) OR
		
		# @selected2에 해당하는 시즌, 포지션 평균
		region = SUBSTRING_INDEX(SUBSTRING_INDEX(@selected2, '-', 2), '-', -1) AND
		yy = LEFT(@selected2, 2) AND
		splitSeason = SUBSTRING_INDEX(SUBSTRING_INDEX(@selected2, '-', 3), '-', -1) AND
		role = SUBSTRING_INDEX(@selected2, '-', -1) OR
	
		# @selected3에 해당하는 시즌, 포지션 평균
		region = SUBSTRING_INDEX(SUBSTRING_INDEX(@selected3, '-', 2), '-', -1) AND
		yy = LEFT(@selected3, 2) AND
		splitSeason = SUBSTRING_INDEX(SUBSTRING_INDEX(@selected3, '-', 3), '-', -1) AND
		role = SUBSTRING_INDEX(@selected3, '-', -1) OR
	
		# @selected4에 해당하는 시즌, 포지션 평균
		region = SUBSTRING_INDEX(SUBSTRING_INDEX(@selected4, '-', 2), '-', -1) AND
		yy = LEFT(@selected4, 2) AND
		splitSeason = SUBSTRING_INDEX(SUBSTRING_INDEX(@selected4, '-', 3), '-', -1) AND
		role = SUBSTRING_INDEX(@selected4, '-', -1)
	####################################################################################################################################################
	UNION ALL # Player AVG Stats
	SELECT
		yy, splitSeason, region, phID, role, 
		CONCAT(gameCount, '/', RANK() OVER (ORDER BY gameCount DESC)),
		CONCAT(AVG_kills, '/', RANK() OVER (ORDER BY AVG_kills DESC)),
		CONCAT(AVG_deaths, '/', RANK() OVER (ORDER BY AVG_deaths DESC)),
		CONCAT(AVG_assists, '/', RANK() OVER (ORDER BY AVG_assists DESC)),
		CONCAT(AVG_KDA, '/', RANK() OVER (ORDER BY AVG_KDA DESC)),
		CONCAT(AVG_KPPCT, '/', RANK() OVER (ORDER BY AVG_KPPCT DESC)),
		CONCAT(AVG_DTHPCT, '/', RANK() OVER (ORDER BY AVG_DTHPCT DESC)),
		CONCAT(AVG_CSM, '/', RANK() OVER (ORDER BY AVG_CSM DESC)),
		CONCAT(AVG_GPM, '/', RANK() OVER (ORDER BY AVG_GPM DESC)),
		CONCAT(AVG_goldPCT, '/', RANK() OVER (ORDER BY AVG_goldPCT DESC)),
		CONCAT(AVG_VSPM, '/', RANK() OVER (ORDER BY AVG_VSPM DESC)),
		CONCAT(AVG_WPM, '/', RANK() OVER (ORDER BY AVG_WPM DESC)),
		CONCAT(AVG_WCPM, '/', RANK() OVER (ORDER BY AVG_WCPM DESC)),
		CONCAT(AVG_VSPCT, '/', RANK() OVER (ORDER BY AVG_VSPCT DESC)),
		CONCAT(AVG_DPM, '/', RANK() OVER (ORDER BY AVG_DPM DESC)),
		CONCAT(AVG_DMGPCT, '/', RANK() OVER (ORDER BY AVG_DMGPCT DESC)),
		CONCAT(AVG_DPG, '/', RANK() OVER (ORDER BY AVG_DPG DESC)),
		CONCAT(AVG_DTPM, '/', RANK() OVER (ORDER BY AVG_DTPM DESC)),
		CONCAT(AVG_DTPCT, '/', RANK() OVER (ORDER BY AVG_DTPCT DESC)),
		CONCAT(AVG_GDat15, '/', RANK() OVER (ORDER BY AVG_GDat15 DESC)),
		CONCAT(AVG_CSDat15, '/', RANK() OVER (ORDER BY AVG_CSDat15 DESC)),
		CONCAT(AVG_XPDat15, '/', RANK() OVER (ORDER BY AVG_XPDat15 DESC))
	-- 	gameCount, AVG_kills, AVG_deaths, AVG_assists, AVG_KDA, AVG_KPPCT, AVG_DTHPCT, 
	-- 	AVG_CSM, AVG_GPM, AVG_goldPCT, 
	-- 	AVG_VSPM, AVG_WPM, AVG_WCPM, AVG_VSPCT, 
	-- 	AVG_DPM, AVG_DMGPCT, AVG_DPG, AVG_DTPM, AVG_DTPCT,
	-- 	AVG_GDat15, AVG_CSDat15, AVG_XPDat15
		
	FROM # playerStats : select순으로 정렬하기 위해 서브쿼리로 둠 
		(SELECT
			RIGHT(year, 2) AS yy, splitSeason, region, phID, role, CONCAT(phID, '-', role) AS phRole, COUNT(phID) AS gameCount,
	-- 		region, year, splitSeason, phID, role, CONCAT(phID, '-', role) AS phRole, COUNT(phID) AS gameCount,
			ROUND(AVG(kills),2) AS AVG_kills, ROUND(AVG(deaths),2) AS AVG_deaths, ROUND(AVG(assists),2) AS AVG_assists, 
			ROUND(AVG(KDA),2) AS AVG_KDA, CONCAT(ROUND(AVG(KPPCT),1), '%') AS AVG_KPPCT, CONCAT(ROUND(AVG(DTHPCT),1), '%') AS AVG_DTHPCT,
			ROUND(AVG(CSM),1) AS AVG_CSM, ROUND(AVG(GPM),2) AS AVG_GPM, CONCAT(ROUND(AVG(goldPCT),1), '%') AS AVG_goldPCT,
			ROUND(AVG(VSPM),2) AS AVG_VSPM, ROUND(AVG(WPM),2) AS AVG_WPM, ROUND(AVG(WCPM),2) AS AVG_WCPM, CONCAT(ROUND(AVG(VSPCT),1), '%') AS AVG_VSPCT,
			ROUND(AVG(DPM),2) AS AVG_DPM, CONCAT(ROUND(AVG(DMGPCT),1), '%') AS AVG_DMGPCT, ROUND(AVG(DPG),2) AS AVG_DPG, ROUND(AVG(DTPM),2) AS AVG_DTPM, CONCAT(ROUND(AVG(DTPCT),1), '%') AS AVG_DTPCT,
			ROUND(AVG(GDat15),0) AS AVG_GDat15, ROUND(AVG(CSDat15),1) AS AVG_CSDat15, ROUND(AVG(XPDat15),1) AS AVG_XPDat15
		
		FROM # baseQuery
			(SELECT 
				region, year, splitSeason, 
				(CASE # LCS phID 양식 통일하기
					WHEN SUBSTRING_INDEX(SUBSTRING_INDEX(phID, '-', 3), '-', -1) = 'MSS' THEN REPLACE(phID, 'MSS', 'SPR_PO')
					WHEN SUBSTRING_INDEX(SUBSTRING_INDEX(phID, '-', 3), '-', -1) = 'CHA' THEN REPLACE(phID, 'CHA', 'SUM_PO')
					ELSE phID 
				END) AS phID, 
				role, 
				kills, deaths, assists, IF(deaths != 0, (kills + assists) / deaths, 1.2*(kills+assists)) AS KDA, ((kills + assists) / K_t) * 100 AS KPPCT, (deaths / D_t) * 100 AS DTHPCT,
				CS / min AS CSM, golds / min AS GPM, (golds / G_t) * 100 AS goldPCT,
				visionScore / min AS VSPM, wardsPlaced / min AS WPM, wardsDestroyed / min AS WCPM, (visionScore / VS_t) * 100 AS VSPCT,
				totalDamageToChampion / min AS DPM, (totalDamageToChampion / DMG_t) * 100 AS DMGPCT, totalDamageToChampion / golds AS DPG,
				totalDamageTaken / min AS DTPM, (totalDamageTaken / DT_t) * 100 AS DTPCT, 
				GDat15, CSDat15, XPDat15
			FROM games_stats AS gs
			# 팀 데이터 불러오기
			INNER JOIN
				(SELECT
					gameID, ptID, kills AS K_t, deaths AS D_t, golds AS G_t, visionScore AS VS_t, totalDamageToChampion AS DMG_t, totalDamageTaken AS DT_t 
				FROM gs_teams) AS gt
				ON gs.gameID = gt.gameID AND
				SUBSTRING_INDEX(phID, '-', 4) = ptID
			# gameTime 불러오기
			INNER JOIN 
				(SELECT gameID, TIME_TO_SEC(gameTime)/60 AS min FROM games) AS g
				ON gs.gameID = g.gameID 
			# 리그 정보 불러오기
			INNER JOIN
				(SELECT 
					leagueID, region, year, (CASE 
									WHEN splitSeason = 'Spring' THEN 'SPR'
									WHEN splitSeason = 'Spring Playoffs' THEN 'SPR_PO'
									WHEN splitSeason = 'Summer' THEN 'SUM'
									WHEN splitSeason = 'Summer Playoffs' THEN 'SUM_PO'
								END) AS splitSeason
				FROM leagues) AS l
				ON SUBSTRING_INDEX(phID, '-', 3) = leagueID
			) AS baseQuery
		WHERE
			FIND_IN_SET(CONCAT(phID, '-', role), @selected1) OR
			FIND_IN_SET(CONCAT(phID, '-', role), @selected2) OR
			FIND_IN_SET(CONCAT(phID, '-', role), @selected3) OR
			FIND_IN_SET(CONCAT(phID, '-', role), @selected4)
		GROUP BY phRole 
		ORDER BY
			# 선택된 yy 순서
			FIELD(yy, SUBSTRING_INDEX(@selected1, '-', 1), SUBSTRING_INDEX(@selected2, '-', 1), SUBSTRING_INDEX(@selected3, '-', 1), SUBSTRING_INDEX(@selected4, '-', 1)),
			# 선택된 splitSeason 순서
			FIELD(splitSeason, SUBSTRING_INDEX(SUBSTRING_INDEX(@selected1, '-', 3), '-', -1), SUBSTRING_INDEX(SUBSTRING_INDEX(@selected2, '-', 3), '-', -1), SUBSTRING_INDEX(SUBSTRING_INDEX(@selected3, '-', 3), '-', -1), SUBSTRING_INDEX(SUBSTRING_INDEX(@selected4, '-', 3), '-', -1)),
			# 선택된 region 순서
			FIELD(region, SUBSTRING_INDEX(SUBSTRING_INDEX(@selected1, '-', 2), '-', -1), SUBSTRING_INDEX(SUBSTRING_INDEX(@selected2, '-', 2), '-', -1), SUBSTRING_INDEX(SUBSTRING_INDEX(@selected3, '-', 2), '-', -1), SUBSTRING_INDEX(SUBSTRING_INDEX(@selected4, '-', 2), '-', -1)),
			# 선택된 role 순서
			FIELD(role, SUBSTRING_INDEX(@selected1, '-', -1), SUBSTRING_INDEX(@selected2, '-', -1), SUBSTRING_INDEX(@selected3, '-', -1), SUBSTRING_INDEX(@selected4, '-', -1)),
			FIELD(phRole, @selected1, @selected2, @selected3, @selected4)
		) AS playerStats
	ORDER BY
		FIELD(CONCAT(phID, '-', role), @selected1, @selected2, @selected3, @selected4)
	)AS heatmap;
    `;

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

			# 0614
			SELECT
				yy, splitSeason, region, phID, role, gameCount,
				AVG_kills,AVG_deaths,AVG_assists,AVG_KDA,AVG_KPPCT,AVG_DTHPCT,
				AVG_CSM,AVG_GPM,AVG_goldPCT,
				AVG_VSPM,AVG_WPM,AVG_WCPM,AVG_VSPCT,
				AVG_DPM,AVG_DMGPCT,AVG_DPG,AVG_DTPM,AVG_DTPCT,
				AVG_GDat15,AVG_CSDat15,AVG_XPDat15
			FROM # heatmap
				(# Major Total AVG Stats by Position 
				SELECT
					yy, splitSeason, region, phID, role, gameCount,
					AVG_kills, AVG_deaths, AVG_assists, AVG_KDA, AVG_KPPCT, AVG_DTHPCT, 
					AVG_CSM, AVG_GPM, AVG_goldPCT, 
					AVG_VSPM, AVG_WPM, AVG_WCPM, AVG_VSPCT, 
					AVG_DPM, AVG_DMGPCT, AVG_DPG, AVG_DTPM, AVG_DTPCT,
					AVG_GDat15, AVG_CSDat15, AVG_XPDat15
				FROM # majorAVG
					(SELECT
						RIGHT(year, 2) AS yy, splitSeason, '4대 리그' AS region, '4대 리그 평균' AS phID, role, CONCAT('4대 리그 ', role, ' 평균') AS phRole, COUNT(phID) AS gameCount,
						ROUND(AVG(kills),2) AS AVG_kills, ROUND(AVG(deaths),2) AS AVG_deaths, ROUND(AVG(assists),2) AS AVG_assists, 
						ROUND(AVG(KDA),2) AS AVG_KDA, CONCAT(ROUND(AVG(KPPCT),1), '%') AS AVG_KPPCT, CONCAT(ROUND(AVG(DTHPCT),1), '%') AS AVG_DTHPCT,
						ROUND(AVG(CSM),1) AS AVG_CSM, ROUND(AVG(GPM),2) AS AVG_GPM, CONCAT(ROUND(AVG(goldPCT),1), '%') AS AVG_goldPCT,
						ROUND(AVG(VSPM),2) AS AVG_VSPM, ROUND(AVG(WPM),2) AS AVG_WPM, ROUND(AVG(WCPM),2) AS AVG_WCPM, CONCAT(ROUND(AVG(VSPCT),1), '%') AS AVG_VSPCT,
						ROUND(AVG(DPM),2) AS AVG_DPM, CONCAT(ROUND(AVG(DMGPCT),1), '%') AS AVG_DMGPCT, ROUND(AVG(DPG),2) AS AVG_DPG, ROUND(AVG(DTPM),2) AS AVG_DTPM, CONCAT(ROUND(AVG(DTPCT),1), '%') AS AVG_DTPCT,
						ROUND(AVG(GDat15),0) AS AVG_GDat15, ROUND(AVG(CSDat15),1) AS AVG_CSDat15, ROUND(AVG(XPDat15),1) AS AVG_XPDat15
					
					FROM # baseQuery
						(SELECT 
							region, year, splitSeason, 
							(CASE # LCS phID 양식 통일하기
								WHEN SUBSTRING_INDEX(SUBSTRING_INDEX(phID, '-', 3), '-', -1) = 'MSS' THEN REPLACE(phID, 'MSS', 'SPR_PO')
								WHEN SUBSTRING_INDEX(SUBSTRING_INDEX(phID, '-', 3), '-', -1) = 'CHA' THEN REPLACE(phID, 'CHA', 'SUM_PO')
								ELSE phID 
							END) AS phID, 
							role, 
							kills, deaths, assists, IF(deaths != 0, (kills + assists) / deaths, 1.2*(kills+assists)) AS KDA, ((kills + assists) / K_t) * 100 AS KPPCT, (deaths / D_t) * 100 AS DTHPCT,
							CS / min AS CSM, golds / min AS GPM, (golds / G_t) * 100 AS goldPCT,
							visionScore / min AS VSPM, wardsPlaced / min AS WPM, wardsDestroyed / min AS WCPM, (visionScore / VS_t) * 100 AS VSPCT,
							totalDamageToChampion / min AS DPM, (totalDamageToChampion / DMG_t) * 100 AS DMGPCT, totalDamageToChampion / golds AS DPG,
							totalDamageTaken / min AS DTPM, (totalDamageTaken / DT_t) * 100 AS DTPCT, 
							GDat15, CSDat15, XPDat15
						FROM games_stats AS gs
						# 팀 데이터 불러오기
						INNER JOIN
							(SELECT
								gameID, ptID, kills AS K_t, deaths AS D_t, golds AS G_t, visionScore AS VS_t, totalDamageToChampion AS DMG_t, totalDamageTaken AS DT_t 
							FROM gs_teams) AS gt
							ON gs.gameID = gt.gameID AND
							SUBSTRING_INDEX(phID, '-', 4) = ptID
						# gameTime 불러오기
						INNER JOIN 
							(SELECT gameID, TIME_TO_SEC(gameTime)/60 AS min FROM games) AS g
							ON gs.gameID = g.gameID 
						# 리그 정보 불러오기
						INNER JOIN
							(SELECT 
								leagueID, region, year, (CASE 
												WHEN splitSeason = 'Spring' THEN 'SPR'
												WHEN splitSeason = 'Spring Playoffs' THEN 'SPR_PO'
												WHEN splitSeason = 'Summer' THEN 'SUM'
												WHEN splitSeason = 'Summer Playoffs' THEN 'SUM_PO'
											END) AS splitSeason
							FROM leagues) AS l
							ON SUBSTRING_INDEX(phID, '-', 3) = leagueID
						) AS baseQuery
					GROUP BY year, splitSeason, role 
					ORDER BY 
						FIELD(
						CONCAT(yy, '-', splitSeason, '-', role),
						CONCAT(SUBSTRING_INDEX(@selected1, '-', 1), '-', SUBSTRING_INDEX(SUBSTRING_INDEX(@selected1, '-', 3),'-', -1), '-', SUBSTRING_INDEX(@selected1, '-', -1)),
						CONCAT(SUBSTRING_INDEX(@selected2, '-', 1), '-', SUBSTRING_INDEX(SUBSTRING_INDEX(@selected2, '-', 3),'-', -1), '-', SUBSTRING_INDEX(@selected2, '-', -1)),
						CONCAT(SUBSTRING_INDEX(@selected3, '-', 1), '-', SUBSTRING_INDEX(SUBSTRING_INDEX(@selected3, '-', 3),'-', -1), '-', SUBSTRING_INDEX(@selected3, '-', -1)),
						CONCAT(SUBSTRING_INDEX(@selected4, '-', 1), '-', SUBSTRING_INDEX(SUBSTRING_INDEX(@selected4, '-', 3),'-', -1), '-', SUBSTRING_INDEX(@selected4, '-', -1))
						)
					) AS majorAVG
				WHERE 
					# @selected1에 해당하는 시즌, 포지션 평균
					yy = LEFT(@selected1, 2) AND
					splitSeason = SUBSTRING_INDEX(SUBSTRING_INDEX(@selected1, '-', 3), '-', -1) AND
					role = SUBSTRING_INDEX(@selected1, '-', -1) OR
					
					# @selected2에 해당하는 시즌, 포지션 평균
					yy = LEFT(@selected2, 2) AND
					splitSeason = SUBSTRING_INDEX(SUBSTRING_INDEX(@selected2, '-', 3), '-', -1) AND
					role = SUBSTRING_INDEX(@selected2, '-', -1) OR
				
					# @selected3에 해당하는 시즌, 포지션 평균
					yy = LEFT(@selected3, 2) AND
					splitSeason = SUBSTRING_INDEX(SUBSTRING_INDEX(@selected3, '-', 3), '-', -1) AND
					role = SUBSTRING_INDEX(@selected3, '-', -1) OR
				
					# @selected4에 해당하는 시즌, 포지션 평균
					yy = LEFT(@selected4, 2) AND
					splitSeason = SUBSTRING_INDEX(SUBSTRING_INDEX(@selected4, '-', 3), '-', -1) AND
					role = SUBSTRING_INDEX(@selected4, '-', -1) 
				####################################################################################################################################################
				UNION ALL # League AVG Stats 
				SELECT
					yy, splitSeason, region, phID, role, gameCount,
					AVG_kills, AVG_deaths, AVG_assists, AVG_KDA, AVG_KPPCT, AVG_DTHPCT, 
					AVG_CSM, AVG_GPM, AVG_goldPCT, 
					AVG_VSPM, AVG_WPM, AVG_WCPM, AVG_VSPCT, 
					AVG_DPM, AVG_DMGPCT, AVG_DPG, AVG_DTPM, AVG_DTPCT,
					AVG_GDat15, AVG_CSDat15, AVG_XPDat15
				FROM # leaguesAVG
					(SELECT
						RIGHT(year, 2) AS yy, splitSeason, region, CONCAT(region, ' 평균') AS phID, role, CONCAT(region, ' ', role, ' 평균') AS phRole, COUNT(phID) AS gameCount,
						ROUND(AVG(kills),2) AS AVG_kills, ROUND(AVG(deaths),2) AS AVG_deaths, ROUND(AVG(assists),2) AS AVG_assists, 
						ROUND(AVG(KDA),2) AS AVG_KDA, CONCAT(ROUND(AVG(KPPCT),1), '%') AS AVG_KPPCT, CONCAT(ROUND(AVG(DTHPCT),1), '%') AS AVG_DTHPCT,
						ROUND(AVG(CSM),1) AS AVG_CSM, ROUND(AVG(GPM),2) AS AVG_GPM, CONCAT(ROUND(AVG(goldPCT),1), '%') AS AVG_goldPCT,
						ROUND(AVG(VSPM),2) AS AVG_VSPM, ROUND(AVG(WPM),2) AS AVG_WPM, ROUND(AVG(WCPM),2) AS AVG_WCPM, CONCAT(ROUND(AVG(VSPCT),1), '%') AS AVG_VSPCT,
						ROUND(AVG(DPM),2) AS AVG_DPM, CONCAT(ROUND(AVG(DMGPCT),1), '%') AS AVG_DMGPCT, ROUND(AVG(DPG),2) AS AVG_DPG, ROUND(AVG(DTPM),2) AS AVG_DTPM, CONCAT(ROUND(AVG(DTPCT),1), '%') AS AVG_DTPCT,
						ROUND(AVG(GDat15),0) AS AVG_GDat15, ROUND(AVG(CSDat15),1) AS AVG_CSDat15, ROUND(AVG(XPDat15),1) AS AVG_XPDat15
					
					FROM # baseQuery
						(SELECT 
							region, year, splitSeason, 
							(CASE # LCS phID 양식 통일하기
								WHEN SUBSTRING_INDEX(SUBSTRING_INDEX(phID, '-', 3), '-', -1) = 'MSS' THEN REPLACE(phID, 'MSS', 'SPR_PO')
								WHEN SUBSTRING_INDEX(SUBSTRING_INDEX(phID, '-', 3), '-', -1) = 'CHA' THEN REPLACE(phID, 'CHA', 'SUM_PO')
								ELSE phID 
							END) AS phID, 
							role, 
							kills, deaths, assists, IF(deaths != 0, (kills + assists) / deaths, 1.2*(kills+assists)) AS KDA, ((kills + assists) / K_t) * 100 AS KPPCT, (deaths / D_t) * 100 AS DTHPCT,
							CS / min AS CSM, golds / min AS GPM, (golds / G_t) * 100 AS goldPCT,
							visionScore / min AS VSPM, wardsPlaced / min AS WPM, wardsDestroyed / min AS WCPM, (visionScore / VS_t) * 100 AS VSPCT,
							totalDamageToChampion / min AS DPM, (totalDamageToChampion / DMG_t) * 100 AS DMGPCT, totalDamageToChampion / golds AS DPG,
							totalDamageTaken / min AS DTPM, (totalDamageTaken / DT_t) * 100 AS DTPCT, 
							GDat15, CSDat15, XPDat15
						FROM games_stats AS gs
						# 팀 데이터 불러오기
						INNER JOIN
							(SELECT
								gameID, ptID, kills AS K_t, deaths AS D_t, golds AS G_t, visionScore AS VS_t, totalDamageToChampion AS DMG_t, totalDamageTaken AS DT_t 
							FROM gs_teams) AS gt
							ON gs.gameID = gt.gameID AND
							SUBSTRING_INDEX(phID, '-', 4) = ptID
						# gameTime 불러오기
						INNER JOIN 
							(SELECT gameID, TIME_TO_SEC(gameTime)/60 AS min FROM games) AS g
							ON gs.gameID = g.gameID 
						# 리그 정보 불러오기
						INNER JOIN
							(SELECT 
								leagueID, region, year, (CASE 
												WHEN splitSeason = 'Spring' THEN 'SPR'
												WHEN splitSeason = 'Spring Playoffs' THEN 'SPR_PO'
												WHEN splitSeason = 'Summer' THEN 'SUM'
												WHEN splitSeason = 'Summer Playoffs' THEN 'SUM_PO'
											END) AS splitSeason
							FROM leagues) AS l
							ON SUBSTRING_INDEX(phID, '-', 3) = leagueID
						) AS baseQuery
					GROUP BY region, year, splitSeason, ROLE
					ORDER BY 
						FIELD(
						CONCAT(yy, '-', region, '-', splitSeason, '-', role),
						CONCAT(SUBSTRING_INDEX(@selected1, '-', 3), '-', SUBSTRING_INDEX(@selected1, '-', -1)),
						CONCAT(SUBSTRING_INDEX(@selected2, '-', 3), '-', SUBSTRING_INDEX(@selected2, '-', -1)),
						CONCAT(SUBSTRING_INDEX(@selected3, '-', 3), '-', SUBSTRING_INDEX(@selected3, '-', -1)),
						CONCAT(SUBSTRING_INDEX(@selected4, '-', 3), '-', SUBSTRING_INDEX(@selected4, '-', -1))
						)
					) AS leaguesAVG
				WHERE 
					# @selected1에 해당하는 시즌, 포지션 평균
					region = SUBSTRING_INDEX(SUBSTRING_INDEX(@selected1, '-', 2), '-', -1) AND
					yy = LEFT(@selected1, 2) AND
					splitSeason = SUBSTRING_INDEX(SUBSTRING_INDEX(@selected1, '-', 3), '-', -1) AND
					role = SUBSTRING_INDEX(@selected1, '-', -1) OR
					
					# @selected2에 해당하는 시즌, 포지션 평균
					region = SUBSTRING_INDEX(SUBSTRING_INDEX(@selected2, '-', 2), '-', -1) AND
					yy = LEFT(@selected2, 2) AND
					splitSeason = SUBSTRING_INDEX(SUBSTRING_INDEX(@selected2, '-', 3), '-', -1) AND
					role = SUBSTRING_INDEX(@selected2, '-', -1) OR
				
					# @selected3에 해당하는 시즌, 포지션 평균
					region = SUBSTRING_INDEX(SUBSTRING_INDEX(@selected3, '-', 2), '-', -1) AND
					yy = LEFT(@selected3, 2) AND
					splitSeason = SUBSTRING_INDEX(SUBSTRING_INDEX(@selected3, '-', 3), '-', -1) AND
					role = SUBSTRING_INDEX(@selected3, '-', -1) OR
				
					# @selected4에 해당하는 시즌, 포지션 평균
					region = SUBSTRING_INDEX(SUBSTRING_INDEX(@selected4, '-', 2), '-', -1) AND
					yy = LEFT(@selected4, 2) AND
					splitSeason = SUBSTRING_INDEX(SUBSTRING_INDEX(@selected4, '-', 3), '-', -1) AND
					role = SUBSTRING_INDEX(@selected4, '-', -1)
				####################################################################################################################################################
				UNION ALL # Player AVG Stats
				SELECT
					yy, splitSeason, region, phID, role, 
					CONCAT(gameCount, '/', RANK() OVER (ORDER BY gameCount DESC)),
					CONCAT(AVG_kills, '/', RANK() OVER (ORDER BY AVG_kills DESC)),
					CONCAT(AVG_deaths, '/', RANK() OVER (ORDER BY AVG_deaths DESC)),
					CONCAT(AVG_assists, '/', RANK() OVER (ORDER BY AVG_assists DESC)),
					CONCAT(AVG_KDA, '/', RANK() OVER (ORDER BY AVG_KDA DESC)),
					CONCAT(AVG_KPPCT, '/', RANK() OVER (ORDER BY AVG_KPPCT DESC)),
					CONCAT(AVG_DTHPCT, '/', RANK() OVER (ORDER BY AVG_DTHPCT DESC)),
					CONCAT(AVG_CSM, '/', RANK() OVER (ORDER BY AVG_CSM DESC)),
					CONCAT(AVG_GPM, '/', RANK() OVER (ORDER BY AVG_GPM DESC)),
					CONCAT(AVG_goldPCT, '/', RANK() OVER (ORDER BY AVG_goldPCT DESC)),
					CONCAT(AVG_VSPM, '/', RANK() OVER (ORDER BY AVG_VSPM DESC)),
					CONCAT(AVG_WPM, '/', RANK() OVER (ORDER BY AVG_WPM DESC)),
					CONCAT(AVG_WCPM, '/', RANK() OVER (ORDER BY AVG_WCPM DESC)),
					CONCAT(AVG_VSPCT, '/', RANK() OVER (ORDER BY AVG_VSPCT DESC)),
					CONCAT(AVG_DPM, '/', RANK() OVER (ORDER BY AVG_DPM DESC)),
					CONCAT(AVG_DMGPCT, '/', RANK() OVER (ORDER BY AVG_DMGPCT DESC)),
					CONCAT(AVG_DPG, '/', RANK() OVER (ORDER BY AVG_DPG DESC)),
					CONCAT(AVG_DTPM, '/', RANK() OVER (ORDER BY AVG_DTPM DESC)),
					CONCAT(AVG_DTPCT, '/', RANK() OVER (ORDER BY AVG_DTPCT DESC)),
					CONCAT(AVG_GDat15, '/', RANK() OVER (ORDER BY AVG_GDat15 DESC)),
					CONCAT(AVG_CSDat15, '/', RANK() OVER (ORDER BY AVG_CSDat15 DESC)),
					CONCAT(AVG_XPDat15, '/', RANK() OVER (ORDER BY AVG_XPDat15 DESC))
				-- 	gameCount, AVG_kills, AVG_deaths, AVG_assists, AVG_KDA, AVG_KPPCT, AVG_DTHPCT, 
				-- 	AVG_CSM, AVG_GPM, AVG_goldPCT, 
				-- 	AVG_VSPM, AVG_WPM, AVG_WCPM, AVG_VSPCT, 
				-- 	AVG_DPM, AVG_DMGPCT, AVG_DPG, AVG_DTPM, AVG_DTPCT,
				-- 	AVG_GDat15, AVG_CSDat15, AVG_XPDat15
					
				FROM # playerStats : select순으로 정렬하기 위해 서브쿼리로 둠 
					(SELECT
						RIGHT(year, 2) AS yy, splitSeason, region, phID, role, CONCAT(phID, '-', role) AS phRole, COUNT(phID) AS gameCount,
				-- 		region, year, splitSeason, phID, role, CONCAT(phID, '-', role) AS phRole, COUNT(phID) AS gameCount,
						ROUND(AVG(kills),2) AS AVG_kills, ROUND(AVG(deaths),2) AS AVG_deaths, ROUND(AVG(assists),2) AS AVG_assists, 
						ROUND(AVG(KDA),2) AS AVG_KDA, CONCAT(ROUND(AVG(KPPCT),1), '%') AS AVG_KPPCT, CONCAT(ROUND(AVG(DTHPCT),1), '%') AS AVG_DTHPCT,
						ROUND(AVG(CSM),1) AS AVG_CSM, ROUND(AVG(GPM),2) AS AVG_GPM, CONCAT(ROUND(AVG(goldPCT),1), '%') AS AVG_goldPCT,
						ROUND(AVG(VSPM),2) AS AVG_VSPM, ROUND(AVG(WPM),2) AS AVG_WPM, ROUND(AVG(WCPM),2) AS AVG_WCPM, CONCAT(ROUND(AVG(VSPCT),1), '%') AS AVG_VSPCT,
						ROUND(AVG(DPM),2) AS AVG_DPM, CONCAT(ROUND(AVG(DMGPCT),1), '%') AS AVG_DMGPCT, ROUND(AVG(DPG),2) AS AVG_DPG, ROUND(AVG(DTPM),2) AS AVG_DTPM, CONCAT(ROUND(AVG(DTPCT),1), '%') AS AVG_DTPCT,
						ROUND(AVG(GDat15),0) AS AVG_GDat15, ROUND(AVG(CSDat15),1) AS AVG_CSDat15, ROUND(AVG(XPDat15),1) AS AVG_XPDat15
					
					FROM # baseQuery
						(SELECT 
							region, year, splitSeason, 
							(CASE # LCS phID 양식 통일하기
								WHEN SUBSTRING_INDEX(SUBSTRING_INDEX(phID, '-', 3), '-', -1) = 'MSS' THEN REPLACE(phID, 'MSS', 'SPR_PO')
								WHEN SUBSTRING_INDEX(SUBSTRING_INDEX(phID, '-', 3), '-', -1) = 'CHA' THEN REPLACE(phID, 'CHA', 'SUM_PO')
								ELSE phID 
							END) AS phID, 
							role, 
							kills, deaths, assists, IF(deaths != 0, (kills + assists) / deaths, 1.2*(kills+assists)) AS KDA, ((kills + assists) / K_t) * 100 AS KPPCT, (deaths / D_t) * 100 AS DTHPCT,
							CS / min AS CSM, golds / min AS GPM, (golds / G_t) * 100 AS goldPCT,
							visionScore / min AS VSPM, wardsPlaced / min AS WPM, wardsDestroyed / min AS WCPM, (visionScore / VS_t) * 100 AS VSPCT,
							totalDamageToChampion / min AS DPM, (totalDamageToChampion / DMG_t) * 100 AS DMGPCT, totalDamageToChampion / golds AS DPG,
							totalDamageTaken / min AS DTPM, (totalDamageTaken / DT_t) * 100 AS DTPCT, 
							GDat15, CSDat15, XPDat15
						FROM games_stats AS gs
						# 팀 데이터 불러오기
						INNER JOIN
							(SELECT
								gameID, ptID, kills AS K_t, deaths AS D_t, golds AS G_t, visionScore AS VS_t, totalDamageToChampion AS DMG_t, totalDamageTaken AS DT_t 
							FROM gs_teams) AS gt
							ON gs.gameID = gt.gameID AND
							SUBSTRING_INDEX(phID, '-', 4) = ptID
						# gameTime 불러오기
						INNER JOIN 
							(SELECT gameID, TIME_TO_SEC(gameTime)/60 AS min FROM games) AS g
							ON gs.gameID = g.gameID 
						# 리그 정보 불러오기
						INNER JOIN
							(SELECT 
								leagueID, region, year, (CASE 
												WHEN splitSeason = 'Spring' THEN 'SPR'
												WHEN splitSeason = 'Spring Playoffs' THEN 'SPR_PO'
												WHEN splitSeason = 'Summer' THEN 'SUM'
												WHEN splitSeason = 'Summer Playoffs' THEN 'SUM_PO'
											END) AS splitSeason
							FROM leagues) AS l
							ON SUBSTRING_INDEX(phID, '-', 3) = leagueID
						) AS baseQuery
					WHERE
						FIND_IN_SET(CONCAT(phID, '-', role), @selected1) OR
						FIND_IN_SET(CONCAT(phID, '-', role), @selected2) OR
						FIND_IN_SET(CONCAT(phID, '-', role), @selected3) OR
						FIND_IN_SET(CONCAT(phID, '-', role), @selected4)
					GROUP BY phRole 
					ORDER BY
						# 선택된 yy 순서
						FIELD(yy, SUBSTRING_INDEX(@selected1, '-', 1), SUBSTRING_INDEX(@selected2, '-', 1), SUBSTRING_INDEX(@selected3, '-', 1), SUBSTRING_INDEX(@selected4, '-', 1)),
						# 선택된 splitSeason 순서
						FIELD(splitSeason, SUBSTRING_INDEX(SUBSTRING_INDEX(@selected1, '-', 3), '-', -1), SUBSTRING_INDEX(SUBSTRING_INDEX(@selected2, '-', 3), '-', -1), SUBSTRING_INDEX(SUBSTRING_INDEX(@selected3, '-', 3), '-', -1), SUBSTRING_INDEX(SUBSTRING_INDEX(@selected4, '-', 3), '-', -1)),
						# 선택된 region 순서
						FIELD(region, SUBSTRING_INDEX(SUBSTRING_INDEX(@selected1, '-', 2), '-', -1), SUBSTRING_INDEX(SUBSTRING_INDEX(@selected2, '-', 2), '-', -1), SUBSTRING_INDEX(SUBSTRING_INDEX(@selected3, '-', 2), '-', -1), SUBSTRING_INDEX(SUBSTRING_INDEX(@selected4, '-', 2), '-', -1)),
						# 선택된 role 순서
						FIELD(role, SUBSTRING_INDEX(@selected1, '-', -1), SUBSTRING_INDEX(@selected2, '-', -1), SUBSTRING_INDEX(@selected3, '-', -1), SUBSTRING_INDEX(@selected4, '-', -1)),
						FIELD(phRole, @selected1, @selected2, @selected3, @selected4)
					) AS playerStats
				ORDER BY
					FIELD(CONCAT(phID, '-', role), @selected1, @selected2, @selected3, @selected4)
				)AS heatmap;
    `;

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