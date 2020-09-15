import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp({
  projectId: 'air-memo-app'
})
const firestore = admin.firestore();

export const addReadableUser = functions.https.onCall(async (data, context) => {
  const memoId = data.memoId as string
  const memoAuthorId = data.memoAuthorId as string
  const requesterId = data.requesterId as string

  const memoReference = await firestore.collection('users').doc(memoAuthorId).collection('memos').doc(memoId);
  const requesterReference = await firestore.collection('users').doc(requesterId);

  const memo = await memoReference.get();

  await memoReference.update({
    readable_users: memo.get('readable_users').concat([requesterReference])
  })

  return 'ok'
});
