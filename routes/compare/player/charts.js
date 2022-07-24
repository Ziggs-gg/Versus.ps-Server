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
    
        CALL playerChart_indexRadar();
        `
    const PerMinChart =
        `
    SET @selected1:= '${phRole}'; 
        SET @selected2:= '${phRole[1]}'; 
        SET @selected3:= '${phRole[2]}'; 
        SET @selected4:= '${phRole[3]}'; 
        CALL playerChart_PerMin();
        `

    const WardDataChart =
        `
    SET @selected1:= '${phRole}'; 
SET @selected2:= '${phRole[1]}'; 
SET @selected3:= '${phRole[2]}'; 
SET @selected4:= '${phRole[3]}'; 
CALL playerChart_WardData();
        `

    const KDABox =
        `
    SET @selected1:= '${phRole}'; 
SET @selected2:= '${phRole[1]}'; 
SET @selected3:= '${phRole[2]}'; 
SET @selected4:= '${phRole[3]}'; 
CALL playerChart_KDAdonut();
        `

    const TeamPercentageDataChart =
        `
    # Selected Card Data parsing
        SET @selected1:= '${phRole}';
        SET @selected2:= '${phRole[1]}'; 
        SET @selected3:= '${phRole[2]}'; 
        SET @selected4:= '${phRole[3]}'; 
        
        CALL playerChart_TeamPCT();
        `



    const DPGChart =
        `
    # Selected Card Data parsing
        SET @selected1:= '${phRole}';
SET @selected2:= '${phRole[1]}'; 
SET @selected3:= '${phRole[2]}'; 
SET @selected4:= '${phRole[3]}'; 

CALL playerChart_DPG();
        `

    const KPPercentageChart =
        `
    # Selected Card Data parsing
        SET @selected1:= '${phRole}';
SET @selected2:= '${phRole[1]}'; 
SET @selected3:= '${phRole[2]}'; 
SET @selected4:= '${phRole[3]}'; 

CALL playerChart_KP();
        `

    const RoleDifferPercentageDataChart =
        `
            # Selected Card Data parsing
        SET @selected1:= '${phRole}';
SET @selected2:= '${phRole[1]}'; 
SET @selected3:= '${phRole[2]}'; 
SET @selected4:= '${phRole[3]}'; 

CALL playerChart_RoleDiffer();
        `

    const EGPMChart =
        `
            # Selected Card Data parsing
        SET @selected1:= '${phRole}';
SET @selected2:= '${phRole[1]}'; 
SET @selected3:= '${phRole[2]}'; 
SET @selected4:= '${phRole[3]}'; 

CALL playerChart_EGPM();
        `

    const CSPMChart =
        `
                # Selected Card Data parsing
        SET @selected1:= '${phRole}';
SET @selected2:= '${phRole[1]}'; 
SET @selected3:= '${phRole[2]}'; 
SET @selected4:= '${phRole[3]}'; 

CALL playerChart_CSPM();
        `


    con.query(IndexRadarChart + PerMinChart + WardDataChart + KDABox + TeamPercentageDataChart +
        DPGChart + KPPercentageChart + RoleDifferPercentageDataChart + EGPMChart + CSPMChart, [phRole], function (err, results) {
            var IndexRadarChart_result = results[4]
            var PerMinChart_result = results[10]
            var WardDataChart_result = results[16]
            var KDABox_result = results[22]
            var TeamPercentageDataChart_result = results[28]
            var DPGChart_result = results[34]
            var KPPercentageChart_result = results[40]
            var RoleDifferPercentageDataChart_result = results[46]
            var EGPMChart_result = results[52]
            var CSPMChart_result = results[58]

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