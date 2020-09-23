import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp({
  projectId: 'air-memo-app'
})
const firestore = admin.firestore();

export const addFriend = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    return 'permission denied'
  }
  if (!data.targetId) {
    return 'invalid request'
  }

  const targetId = data.targetId;
  const requesterId = context.auth.uid;

  const targetReference = firestore.collection('users').doc(targetId);
  const requesterReference = firestore.collection('users').doc(requesterId);

  if (!((await targetReference.get()).exists)) {
    return 'not found target'
  }
  
  await targetReference.collection('friends').doc(requesterId).set({
    reference: requesterReference
  })
  await requesterReference.collection('friends').doc(targetId).set({
    reference: targetReference
  })

  return 'ok'
})

export const removeFriend = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    return 'permission denied'
  }
  if (!data.targetId) {
    return 'invalid request'
  }

  const targetId = data.targetId as string;
  const requesterId = context.auth.uid;

  const targetReference = firestore.collection('users').doc(targetId);
  const requesterReference = firestore.collection('users').doc(requesterId);

  await targetReference.collection('friends').doc(requesterId).delete();
  await requesterReference.collection('friends').doc(targetId).delete();

  return 'ok'
})
