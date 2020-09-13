import * as functions from 'firebase-functions';
import * as memoFunctions from './memoFunctions';

export const helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

export const addReadableUser = memoFunctions.addReadableUser;
