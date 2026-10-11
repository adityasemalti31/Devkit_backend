const express = require('express');
const router = express.Router();
const {
  getSnippets,
  getFlowSteps,
  getResources,
  getPlanDetails,
  getProContent,
} = require('../controllers/mern.controller');

router.get('/snippets', getSnippets);
router.get('/flow', getFlowSteps);
router.get('/resources', getResources);
router.get('/plan', getPlanDetails);
router.get('/pro-content', getProContent);

module.exports = router;
