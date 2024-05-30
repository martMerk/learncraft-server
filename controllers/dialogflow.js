//const { structProtoToJson } = require("pb-util");
const dialogflow = require("dialogflow");
const config = require("../config/keys");
//const mongoose = require('mongoose');
const Post = require("../models/post");

const sessionClient = new dialogflow.SessionsClient();
const sessionPath = sessionClient.sessionPath(
  config.googleProjectID,
  config.dialogFlowSessionID
);

//conversion function or use an alternative method
//manual way to convert a Proto struct to JSON:
// Manual conversion function with added checks
const structProtoToJson = (proto) => {
  if (!proto || !proto.fields) {
    return {};
  }

  const json = {};
  for (const [key, value] of Object.entries(proto.fields)) {
    if (value.kind === "structValue") {
      json[key] = structProtoToJson(value.structValue);
    } else if (value.kind === "listValue") {
      json[key] = value.listValue.values.map((v) =>
        v.kind === "structValue" ? structProtoToJson(v.structValue) : v[v.kind]
      );
    } else {
      json[key] = value[value.kind];
    }
  }
  return json;
};

// Text query to DialogFlow
//this webhook handles the "recommend posts" intent from dialogflow
//and fetch the best posts from the database when the named intent is triggered.
// const textquery = async (req, res) => {
//   const languageCode =
//     req.body.languageCode || config.dialogFlowSessionLanguageCode;

//   const request = {
//     session: sessionPath,
//     queryInput: {
//       text: {
//         text: req.body.text,
//         languageCode: languageCode,
//       },
//     },
//   };

//   try {
//     const responses = await sessionClient.detectIntent(request);
//     const intentName = responses[0].queryResult.intent.displayName;
//     //console.log(intentName);
//       if (intentName === "recommend posts") {
//       try {
//         const bestPosts = await Post.find().sort({ likes: -1 }).limit(1).exec();
//         if (bestPosts.length > 0) {
//           const post = bestPosts[0];
//           const responseText = `The best post is "${post.name}" with ${post.likes.length} likes. Here is the content: ${post.content}`;

//           res.json({
//             fulfillmentMessages: [
//               {
//                 text: {
//                   text: [responseText],
//                 },
//               },
//             ],
//           });
//         } else {
//           res.json({
//             fulfillmentMessages: [
//               {
//                 text: {
//                   text: ["Sorry, I couldn't find any posts."],
//                 },
//               },
//             ],
//           });
//         }
//       } catch (error) {
//         console.error("Error fetching the best post:", error);
//         res.json({
//           fulfillmentMessages: [
//             {
//               text: {
//                 text: [
//                   "Sorry, something went wrong while fetching the best post.",
//                 ],
//               },
//             },
//           ],
//         });
//       }
//     } 
//     else if (intentName !== "recommend posts")
//      { const result = responses[0].queryResult;
//       res.send(result);}
//     else{
//       res.json({
//         fulfillmentMessages: [
//           {
//             text: {
//               text: ["Sorry, I didn't understand that request."],
//             },
//           },
//         ],
//       });
//     }
   
//   } catch (error) {
//     console.error("Error during detectIntent:", error);
//     res.status(500).send(error.message);
//   }
// };

// const textquery = async (req, res) => {
//   const languageCode = req.body.languageCode || config.dialogFlowSessionLanguageCode;

//   const queryText=req.body.text;
//   const request = {
//     session: sessionPath,
//     queryInput: {
//       text: {
//         text: req.body.text,
//         languageCode: languageCode,
//       },
//     },
//   };

//   try {
//     const responses = await sessionClient.detectIntent(request);
//     const queryResult = responses[0].queryResult;

//     if (queryResult.intent && queryResult.intent.displayName) {
//       const intentName = queryResult.intent.displayName;
//       console.log("intent name",intentName);
//       if (intentName === "recommend posts") {
//         try {
//           const bestPosts = await Post.find().sort({ likes: -1 }).limit(1).exec();
          
//           if (bestPosts.length > 0) {
//             const post = bestPosts[0];

//             const responseCard = {
//               title: post.name,
//               content: post.content,
//               likes: post.likes.length,
//               link: `${process.env.CLIENT_URL}/post/view/${post._id}`, // Corrected string interpolation
//             };
//             //console.log("responseCard",responseCard);
//             res.json({
//               fulfillmentMessages: [
//                 {
//                   card: responseCard,
//                 },
//               ],
//             });
//           } else {
//             res.json({
//               fulfillmentMessages: [
//                 {
//                   text: {
//                     text: ["Sorry, I couldn't find any posts."],
//                   },
//                 },
//               ],
//             });
//           }
//         } catch (error) {
//           console.error("Error fetching the best post:", error);
//           res.json({
//             fulfillmentMessages: [
//               {
//                 text: {
//                   text: ["Sorry, something went wrong while fetching the best post."],
//                 },
//               },
//             ],
//           });
//         }
//       } else {
//         res.json({
//           fulfillmentMessages: [
//             {
//               text: {
//                 text: [queryResult.fulfillmentText],
//               },
//             },
//           ],
//         });
//       }
//     } else {
//       res.json({
//         fulfillmentMessages: [
//           {
//             text: {
//               text: ["Sorry, I didn't understand that request."],
//             },
//           },
//         ],
//       });
//     }
//   } catch (error) {
//     console.error("Error during detectIntent:", error);
//     res.status(500).send(error.message);
//   }
// };



// Event query to DialogFlow




const textquery = async (req, res) => {
  const languageCode = req.body.languageCode || config.dialogFlowSessionLanguageCode;
  const queryText = req.body.text;

  const request = {
    session: sessionPath, // Assuming sessionPath is defined elsewhere
    queryInput: {
      text: {
        text: queryText,
        languageCode: languageCode,
      },
    },
  };

  try {
    const responses = await sessionClient.detectIntent(request);
    const queryResult = responses[0].queryResult;

    // Check if the intent is "recommend posts"
    if (queryResult.intent && queryResult.intent.displayName === "recommend posts") {
      // Extract subjects from the query text
      const detectedSubjects = extractSubjectsFromQuery(queryText);

      // Ensure that at least one subject was detected
      if (detectedSubjects.length === 0) {
        console.error("No subjects detected in the query.");
        return res.json({
          fulfillmentMessages: [
            {
              text: {
                text: ["Sorry, I didn't understand the subjects you are interested in."]
              }
            }
          ]
        });
      }

      try {
        // Query the database using Mongoose to find the best post by any of the subjects
        let bestPost = null;
        for (const subject of detectedSubjects) {
          const post = await Post.findOne({ subject: new RegExp(`^${subject}$`, 'i') }).sort({ likes: -1 }).exec();
          
          if (post) {
            bestPost = post;
            break; // Exit loop once a post is found for any subject
          }
        }

        if (bestPost) {
          const responseText = `The best post is "${bestPost.name}" with ${bestPost.likes.length} likes. Here is the content: ${bestPost.content}`;
          res.json({
            fulfillmentMessages: [
              {
                text: {
                  text: [`Here is the best post about ${bestPost.subject}: ${responseText}`]
                }
              }
            ]
          });
        } else {
          res.json({
            fulfillmentMessages: [
              {
                text: {
                  text: [`Sorry, I couldn't find any posts related to the subjects mentioned.`]
                }
              }
            ]
          });
        }
      } catch (error) {
        console.error("Error while querying database:", error);
        res.status(500).json({
          fulfillmentMessages: [
            {
              text: {
                text: ["Sorry, there was an issue while searching for posts."]
              }
            }
          ]
        });
      }
    } else {
      // Handle non-"recommend posts" intent
      res.json({
        fulfillmentMessages: [
          {
            text: {
              text: [queryResult.fulfillmentText]
            }
          }
        ]
      });
    }
  } catch (error) {
    // Handle errors from detectIntent or other async operations
    console.error("Error during detectIntent:", error);
    res.status(500).send(error.message);
  }
};

// Function to extract subjects from the query text
function extractSubjectsFromQuery(queryText) {
  const subjects = ["art", "maths", "geometry", "english", "french", "literature", "science"];
  const detectedSubjects = [];

  // Normalize query text and check against subjects
  const normalizedQuery = queryText.toLowerCase();

  for (const subject of subjects) {
    if (normalizedQuery.includes(subject)) {
      detectedSubjects.push(subject);
    }
  }

  return detectedSubjects;
}














const eventquery = async (req, res) => {
  //console.log("requete",req.body);
  const languageCode =
    req.body.languageCode || config.dialogFlowSessionLanguageCode;

  const request = {
    session: sessionPath,
    queryInput: {
      event: {
        name: req.body.event.name,
        languageCode: languageCode,
      },
    },
  };

  try {
    const responses = await sessionClient.detectIntent(request);
    res.send(responses[0].queryResult);
  } catch (error) {
    console.error("Error during event query:", error);
    res.status(500).send(error.message);
  }
};

//webhook handles the "recommend posts" intent from dialogflow
//and fetch the best posts from the database when this intent is triggered.
// const handleWebhook = async (req, res) => {
//   //console.log(req);
//   const languageCode =
//     req.body.languageCode || config.dialogFlowSessionLanguageCode;

//   const parameters = req.body.parameters || {};
//   const parametersJson = structProtoToJson(parameters) || {}; // Convert parameters to JSON
//   console.log("text",req.body.text );
//   const request = {
//     session: sessionPath,
//     queryInput: {
//       text: {
//         text: req.body.text,
//         languageCode: languageCode,
//       },
//     },
//   };

//   try {
//     const responses = await sessionClient.detectIntent(request);
//     const intentName = responses[0].queryResult.intent.displayName;
//     console.log(intentName);
//     if (intentName === "recommend posts") {
//       try {
//         const bestPosts = await Post.find().sort({ likes: -1 }).limit(1).exec();
//         if (bestPosts.length > 0) {
//           const post = bestPosts[0];
//           const responseText = `The best post is "${post.name}" with ${post.likes.length} likes. Here is the content: ${post.content}`;

//           res.json({
//             fulfillmentMessages: [
//               {
//                 text: {
//                   text: [responseText],
//                 },
//               },
//             ],
//           });
//         } else {
//           res.json({
//             fulfillmentMessages: [
//               {
//                 text: {
//                   text: ["Sorry, I couldn't find any posts."],
//                 },
//               },
//             ],
//           });
//         }
//       } catch (error) {
//         console.error("Error fetching the best post:", error);
//         res.json({
//           fulfillmentMessages: [
//             {
//               text: {
//                 text: [
//                   "Sorry, something went wrong while fetching the best post.",
//                 ],
//               },
//             },
//           ],
//         });
//       }
//     } else {
//       res.json({
//         fulfillmentMessages: [
//           {
//             text: {
//               text: ["Sorry, I didn't understand that request."],
//             },
//           },
//         ],
//       });
//     }
//   } catch (error) {
//     console.error("Error during detectIntent:", error);
//     res.status(500).send(error.message);
//   }
// };

module.exports = {
  textquery,
  eventquery,
 
};
