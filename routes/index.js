const express = require('express');
const router = express.Router();

const comparePlayerFilteringList = require('./compare/player/filteringList');
const comparePlayerSelectedBox = require('./compare/player/selectedBox');
const comparePlayerCharts = require('./compare/player/charts');
const comparePlayerHeatmap = require('./compare/player/heatmap');
const comparePlayerChampionPool = require('./compare/player/championPool');

const compareTeamFilteringList = require('./compare/team/filteringList');
const compareTeamSelectedBox = require('./compare/team/selectedBox');
const compareTeamSelectedRoasterCarousel = require('./compare/team/selectedRoasterCarousel');
const compareTeamCharts = require('./compare/team/charts');
// const compareTeamChampionPool = require('./compare/team/championPool');


router.use('/compare/player', comparePlayerFilteringList);
router.use('/compare/player/SelectedPlayerBox', comparePlayerSelectedBox);
router.use('/compare/player/Chart', comparePlayerCharts);
router.use('/compare/player/Heatmap', comparePlayerHeatmap);
router.use('/compare/player/ChampionPool', comparePlayerChampionPool);

router.use('/compare/team', compareTeamFilteringList);
router.use('/compare/team/SelectedTeamBox', compareTeamSelectedBox);
router.use('/compare/team/SelectedTeamRoasterCarousel', compareTeamSelectedRoasterCarousel);
router.use('/compare/team/Chart', compareTeamCharts);
// app.use('/compare/team/ChampionPool', compareTeamChampionPool);


module.exports = router;