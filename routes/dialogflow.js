const express = require("express");
const router = express.Router();
const { textquery, eventquery } = require("../controllers/dialogflow");

router.post("/df_text_query", textquery);
router.post("/df_event_query", eventquery);

//exports module for the router object
module.exports = router;
