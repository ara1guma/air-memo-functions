import * as functions from 'firebase-functions';
import * as memoFunctions from './memoFunctions';
import * as friendFunctions from './friendFunctions';

export const helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

export const addReadableUser = memoFunctions.addReadableUser;
export const removeReadableUser = memoFunctions.removeReadableUser;
export const addFriend = friendFunctions.addFriend;
export const removeFriend = friendFunctions.removeFriend;
