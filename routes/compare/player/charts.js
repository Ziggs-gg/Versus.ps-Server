const express = require('express');
const router = express.Router();

const db = require('../../../config/db.js');
var con = db.getConnection;

router.get('/', async (req, res) => {
    let phRole = req.query.phRole;

    const IndexRadarChart =
        `
        # Selected Card Data parsing
        SET @selected1:= '${phRole}'; 
        SET @selected2:= '${phRole[1]}'; 
        SET @selected3:= '${phRole[2]}'; 
        SET @selected4:= '${phRole[3]}'; 
    
        
        # Index Radar Chart // 0710ver
SELECT leagueID, phRole, AVG_CP, AVG_SA, AVG_EP, AVG_VC
FROM
	(SELECT leagueID, CONCAT(phID, '-', role) AS phRole,
	 ROUND(AVG(CPnorm), 2) AS AVG_CP,
	 ROUND(AVG(SAnorm), 2) AS AVG_SA,
	 ROUND(AVG(EPnorm), 2) AS AVG_EP,
	 ROUND(AVG(VCnorm), 2) AS AVG_VC
		FROM indexNorm
	GROUP BY phRole) AS subt
WHERE 
		FIND_IN_SET(phRole, @selected1) OR
		FIND_IN_SET(phRole, @selected2) OR
		FIND_IN_SET(phRole, @selected3) OR
		FIND_IN_SET(phRole, @selected4)
ORDER BY FIELD(phRole, @selected1, @selected2, @selected3, @selected4);
`;

    const PerMinChart =
        `
        # Selected Card Data parsing
        SET @selected1:= '${phRole}'; 
        SET @selected2:= '${phRole[1]}'; 
        SET @selected3:= '${phRole[2]}'; 
        SET @selected4:= '${phRole[3]}'; 
        
        # PerMinchart
        SELECT phRole, GROUP_CONCAT(DPM) AS DPM, GROUP_CONCAT(DTPM) AS DTPM, GROUP_CONCAT(GPM) AS GPM
            FROM
            (SELECT CONCAT(phID, '-', role) AS phRole, ROUND(AVG(subt.DPM), 0) AS DPM, ROUND(AVG(subt.DTPM), 0) AS DTPM, ROUND(AVG(subt.GPM), 0) AS GPM
                FROM
                (SELECT gs.gsID, gs.phID, role, gs.gameID, gs.DPM, 
                        (gs.totalDamageTaken / (TIME_TO_SEC(g.gameTime) / 60)) AS DTPM, gs.GPM
                    FROM games_stats AS gs
                INNER JOIN (SELECT gameID, gameTime FROM games) AS g
                    ON gs.gameID = g.gameID
                ) AS subt
            GROUP BY gsID) AS subt2
        WHERE 
                FIND_IN_SET(phRole, @selected1) OR
                FIND_IN_SET(phRole, @selected2) OR
                FIND_IN_SET(phRole, @selected3) OR
                FIND_IN_SET(phRole, @selected4)
        GROUP BY phRole
        ORDER BY FIELD(phRole, @selected1, @selected2, @selected3, @selected4);
`;

    const WardDataChart =
        `
# Selected Card Data parsing
SET @selected1:= '${phRole}'; 
SET @selected2:= '${phRole[1]}'; 
SET @selected3:= '${phRole[2]}'; 
SET @selected4:= '${phRole[3]}'; 

# Ward Data Chart
SELECT phRole, visionScore, wardsPlaced, controlWardsPurchased, wardsDestroyed
FROM
(SELECT gs.phID, role, CONCAT(phID, '-', role) AS phRole, ROUND(AVG(gs.visionScore)/(TIME_TO_SEC(gameTime)/60), 2) AS visionScore, 
        ROUND(AVG(gs.wardsPlaced)/(TIME_TO_SEC(gameTime)/60), 2) AS wardsPlaced, 
        ROUND(AVG(gs.controlWardsPurchased)/(TIME_TO_SEC(gameTime)/60), 2) AS controlWardsPurchased, 
        ROUND(AVG(gs.wardsDestroyed)/(TIME_TO_SEC(gameTime)/60), 2) AS wardsDestroyed
    FROM games_stats AS gs
INNER JOIN (SELECT gameID, gameTime FROM games) AS g
    ON gs.gameID = g.gameID
INNER JOIN (SELECT championID FROM champions) AS c
    ON gs.championID = c.championID
GROUP BY phID, role) AS subt
WHERE 
FIND_IN_SET(phRole, @selected1) OR
FIND_IN_SET(phRole, @selected2) OR
FIND_IN_SET(phRole, @selected3) OR
FIND_IN_SET(phRole, @selected4)
GROUP BY phRole
ORDER BY FIELD(phRole, @selected1, @selected2, @selected3, @selected4);
`;

    const KDABox =
        `
# Selected Card Data parsing
SET @selected1:= '${phRole}'; 
SET @selected2:= '${phRole[1]}'; 
SET @selected3:= '${phRole[2]}'; 
SET @selected4:= '${phRole[3]}'; 

# KDAchart 7.3 ver
SELECT
	phRole, ROUND(AVG(kills), 2) AS AVGkills, ROUND(AVG(assists), 2) AS AVGassists, ROUND(AVG(deaths), 2) AS AVGdeaths, IFNULL(ROUND((SUM(kills + assists))/SUM(deaths), 2), 'PERFECT') AS KDA
FROM (SELECT phID, role, CONCAT(phID, '-', role) AS phRole, kills, assists, deaths FROM games_stats) AS gs
WHERE 
	FIND_IN_SET(phRole, @selected1) OR
    FIND_IN_SET(phRole, @selected2) OR
    FIND_IN_SET(phRole, @selected3) OR
    FIND_IN_SET(phRole, @selected4)
GROUP BY phRole
ORDER BY FIELD(phRole, @selected1, @selected2, @selected3, @selected4);
`;

    const TeamPercentageDataChart =
        `
        # Selected Card Data parsing
        SET @selected1:= '${phRole}';
        SET @selected2:= '${phRole[1]}'; 
        SET @selected3:= '${phRole[2]}'; 
        SET @selected4:= '${phRole[3]}'; 

# Average Percentage Data Chart
SELECT phRole, ROUND(AVG(DMGPCT), 1) AS DMGPCT, 
            ROUND(AVG(DTPMPCT), 1) AS DTPMPCT, 
    ROUND(AVG(goldPCT), 1) AS goldPCT, 
    ROUND(AVG(VSPCT), 1) AS VSPCT	
FROM
(SELECT gs2.phID, CONCAT(gs2.phID, '-', role) AS phRole, 
        gs2.DMGPCT, gs2.totalDamageTaken/teamtotalDamageTaken*100 AS DTPMPCT, gs2.goldPCT, gs2.VSPCT
    FROM games_stats AS gs2
    INNER JOIN
    (SELECT gsID, gs.gameID, gs.phID, totalDamageTaken, 
            SUM(totalDamageTaken) AS teamtotalDamageTaken, DMGPCT, goldPCT, VSPCT
        FROM games_stats AS gs
    INNER JOIN (SELECT gameID FROM games) AS g
        ON gs.gameID = g.gameID
    GROUP BY gameID, SUBSTRING_INDEX(phID, '-', 4)
    ) AS toCal
    ON gs2.gameID = toCal.gameID
) AS subt
WHERE 
FIND_IN_SET(phRole, @selected1) OR
FIND_IN_SET(phRole, @selected2) OR
FIND_IN_SET(phRole, @selected3) OR
FIND_IN_SET(phRole, @selected4)
GROUP BY phRole
ORDER BY FIELD(phRole, @selected1, @selected2, @selected3, @selected4);
`;



    const DPGChart =
        `
        # Selected Card Data parsing
        SET @selected1:= '${phRole}';
SET @selected2:= '${phRole[1]}'; 
SET @selected3:= '${phRole[2]}'; 
SET @selected4:= '${phRole[3]}'; 
        
        # DPGchart
        SELECT 
phRole, 
GROUP_CONCAT(CASE WHEN SUBSTRING_INDEX(phRole, '-', 4) = team1 THEN CONCAT('vs ', SUBSTRING_INDEX(team2, '-', -1)) 
ELSE CONCAT('vs ', SUBSTRING_INDEX(team1, '-', -1)) END) AS matches,
GROUP_CONCAT(AVG_DPM) AS DPM, GROUP_CONCAT(AVG_GPM) AS GPM, GROUP_CONCAT(AVG_DPG) AS DPG
FROM
(SELECT 
    gs.phID, 
    CONCAT(phID, '-', role) AS phRole, 
    team1, team2, 
    ROUND(AVG(DPM), 2) AS AVG_DPM,
    ROUND(AVG(GPM), 2) AVG_GPM, 
    ROUND(AVG(gs.DPM/gs.GPM), 2) AS AVG_DPG
FROM games_stats AS gs
INNER JOIN 
    (SELECT gameID, matchID, team1,team2 FROM games) AS g
ON gs.gameID = g.gameID
GROUP BY phRole, matchID) AS subt
WHERE 
FIND_IN_SET(phRole, @selected1) OR
FIND_IN_SET(phRole, @selected2) OR
FIND_IN_SET(phRole, @selected3) OR
FIND_IN_SET(phRole, @selected4)
GROUP BY phRole
ORDER BY FIELD(phRole, @selected1, @selected2, @selected3, @selected4);
`;

    const KPPercentageChart =
        `
        # Selected Card Data parsing
        SET @selected1:= '${phRole}';
SET @selected2:= '${phRole[1]}'; 
SET @selected3:= '${phRole[2]}'; 
SET @selected4:= '${phRole[3]}'; 

        
        # Average Percentage Data Chart
        SELECT phRole, ROUND(AVG(KPPCT), 1) AS KPPCT	
            FROM
            (SELECT gs2.phID, CONCAT(gs2.phID, '-', role) AS phRole, 
                    gs2.KPPCT
                FROM games_stats AS gs2
                INNER JOIN
                (SELECT gsID, gs.gameID, gs.phID
                        KPPCT
                    FROM games_stats AS gs
                INNER JOIN (SELECT gameID FROM games) AS g
                    ON gs.gameID = g.gameID
                GROUP BY gameID, SUBSTRING_INDEX(phID, '-', 4)
                ) AS toCal
                ON gs2.gameID = toCal.gameID
            ) AS subt
        WHERE 
            FIND_IN_SET(phRole, @selected1) OR
            FIND_IN_SET(phRole, @selected2) OR
            FIND_IN_SET(phRole, @selected3) OR
            FIND_IN_SET(phRole, @selected4)
        GROUP BY phRole
        ORDER BY FIELD(phRole, @selected1, @selected2, @selected3, @selected4);
`;

    const RoleDifferPercentageDataChart =
        `
        # Selected Card Data parsing
        SET @selected1:= '${phRole}';
SET @selected2:= '${phRole[1]}'; 
SET @selected3:= '${phRole[2]}'; 
SET @selected4:= '${phRole[3]}'; 
        # Role Differ % Data Chart
        SELECT phRole, 
                        ROUND(AVG(DR) * 100, 1) AS DR, 
                        ROUND(AVG(DTR) * 100, 1) AS DTR, 
                      ROUND(AVG(GR) * 100, 1) AS GR, 
                        ROUND(AVG(VSR) * 100, 1) AS VSR
                FROM
            (SELECT gs2.gameID, gs2.phID, gs2.role, CONCAT(gs2.phID, '-', gs2.role) AS phRole, 
                (totalDamageToChampion / totalDamageToChampionSR) AS DR,  
                (totalDamageTaken / totalDamageTakenSR) AS DTR, 
                (golds / goldsSR) AS GR, 
                (visionScore / visionScoreSR) AS VSR
                FROM games_stats AS gs2
                INNER JOIN
                (SELECT gs.gsID, gs.gameID, gs.phID, gs.role, SUM(totalDamageToChampion) AS totalDamageToChampionSR,
                    SUM(totalDamageTaken) AS totalDamageTakenSR, SUM(golds) AS goldsSR, SUM(visionScore) AS visionScoreSR
                    FROM games_stats AS gs
                GROUP BY gameID, role) AS SR
                ON gs2.gameID = SR.gameID AND
                    gs2.role = SR.role)
            AS toCal
        WHERE 
            FIND_IN_SET(phRole, @selected1) OR
            FIND_IN_SET(phRole, @selected2) OR
            FIND_IN_SET(phRole, @selected3) OR
            FIND_IN_SET(phRole, @selected4)
        GROUP BY phRole
        ORDER BY FIELD(phRole, @selected1, @selected2, @selected3, @selected4);
`;

    const EGPMChart =
        `
# Selected Card Data parsing
SET @selected1:= '${phRole}';
SET @selected2:= '${phRole[1]}'; 
SET @selected3:= '${phRole[2]}'; 
SET @selected4:= '${phRole[3]}'; 

# EGPM Chart
SELECT phRole, ROUND(AVG(EGPM), 2) AS EGPM	
FROM
(SELECT phID, role, CONCAT(phID, '-', role) AS phRole, golds, gameTime, 
    (golds - 500 - 122.4 * ((Time_TO_SEC(gameTime)/60) - 1.84)) / (Time_TO_SEC(gameTime)/60)  AS EGPM
    FROM games_stats AS gs
INNER JOIN (SELECT gameID, gameTime FROM games) AS g
    ON gs.gameID = g.gameID) AS toCal
WHERE 
FIND_IN_SET(phRole, @selected1) OR
FIND_IN_SET(phRole, @selected2) OR
FIND_IN_SET(phRole, @selected3) OR
FIND_IN_SET(phRole, @selected4)
GROUP BY phRole
ORDER BY FIELD(phRole, @selected1, @selected2, @selected3, @selected4);
`;

    const CSPMChart =
        `
# Selected Card Data parsing
SET @selected1:= '${phRole}';
SET @selected2:= '${phRole[1]}'; 
SET @selected3:= '${phRole[2]}'; 
SET @selected4:= '${phRole[3]}'; 

# CSPM chart
SELECT
phRole, ROUND(AVG(CSM), 2) AS CSM
FROM (SELECT phID, role, CONCAT(phID, '-', role) AS phRole, CSM FROM games_stats) AS gs
WHERE 
FIND_IN_SET(phRole, @selected1) OR
FIND_IN_SET(phRole, @selected2) OR
FIND_IN_SET(phRole, @selected3) OR
FIND_IN_SET(phRole, @selected4)
GROUP BY phRole
ORDER BY FIELD(phRole, @selected1, @selected2, @selected3, @selected4);
`;


    con.query(IndexRadarChart + PerMinChart + WardDataChart + KDABox + TeamPercentageDataChart +
        DPGChart + KPPercentageChart + RoleDifferPercentageDataChart + EGPMChart + CSPMChart, [phRole], function (err, results) {
            var IndexRadarChart_result = results[4]
            var PerMinChart_result = results[9]
            var WardDataChart_result = results[14]
            var KDABox_result = results[19]
            var TeamPercentageDataChart_result = results[24]
            var DPGChart_result = results[29]
            var KPPercentageChart_result = results[34]
            var RoleDifferPercentageDataChart_result = results[39]
            var EGPMChart_result = results[44]
            var CSPMChart_result = results[49]

            if
                (err) console.log(err);
            else
                res.json({
                    IndexRadarChart: IndexRadarChart_result,
                    PerMinChart: PerMinChart_result,
                    WardDataChart: WardDataChart_result,
                    KDABox: KDABox_result,
                    TeamPercentageDataChart: TeamPercentageDataChart_result,
                    DPGChart: DPGChart_result,
                    KPPercentageChart: KPPercentageChart_result,
                    RoleDifferPercentageDataChart: RoleDifferPercentageDataChart_result,
                    EGPMChart: EGPMChart_result,
                    CSPMChart: CSPMChart_result
                });
        });
});

module.exports = router;