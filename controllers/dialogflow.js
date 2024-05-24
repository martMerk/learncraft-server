const dialogflow = require("dialogflow");
const config = require("../config/keys");
const { structProtoToJson } = require("pb-util");

const sessionClient = new dialogflow.SessionsClient();
const sessionPath = sessionClient.sessionPath(
  config.googleProjectID,
  config.dialogFlowSessionID
);

// Text query to DialogFlow
const textquery = async (req, res) => {
  const languageCode = req.body.languageCode || config.dialogFlowSessionLanguageCode;

  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: req.body.text,
        languageCode: languageCode,
      },
    },
  };

  try {
    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;
    res.send(result);
  } catch (error) {
    console.error('Error during detectIntent:', error);
    res.status(500).send(error.message);
  }
};

// Event query to DialogFlow
const eventquery = async (req, res) => {
  const languageCode = req.body.languageCode || config.dialogFlowSessionLanguageCode;

  const parameters = req.body.parameters || {};
  const parametersJson = structProtoToJson(parameters) || {};

  const request = {
    session: sessionPath,
    queryInput: {
      event: {
        name: req.body.eventName,
        parameters: parametersJson,
        languageCode: languageCode,
      },
    },
  };

  try {
    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;
    res.send(result);
  } catch (error) {
    console.error('Error during event query:', error);
    res.status(500).send(error.message);
  }
};

module.exports = {
  textquery,
  eventquery,
};
