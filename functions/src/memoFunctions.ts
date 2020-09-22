import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp({
  projectId: 'air-memo-app'
})
const firestore = admin.firestore();

export const addReadableUser = functions.https.onCall(async (data, context) => {
  const memoId = data.memoId as string
  const memoAuthorId = data.memoAuthorId as string
  const requesterId = context.auth?.uid as string

  if (!context.auth) {
    return 'permission denied'
  } else if (!(memoId && memoAuthorId)) {
    return 'invalid request'
  }

  const memoReference = await firestore.collection('users').doc(memoAuthorId).collection('memos').doc(memoId);
  const requesterReference = await firestore.collection('users').doc(requesterId);

  const memo = await memoReference.get();

  if (!memo.exists) {
    return 'not found memo'
  }

  await memoReference.update({
    readableUsers: memo.get('readableUsers').concat([requesterReference])
  })

  return 'ok'
});

export const removeReadableUser = functions.https.onCall(async (data, context) => {
  const memoId = data.memoId as string
  const memoAuthorId = data.memoAuthorId as string
  const removedUserId = data.removedUserId as string;

  if (!(memoId && memoAuthorId && removedUserId)) {
    return 'invalid request'
  }
  if (!(context.auth!.uid == memoAuthorId || context.auth!.uid == removedUserId)) {
    return 'permission denied'
  }

  const memoReference = await firestore.collection('users').doc(memoAuthorId).collection('memos').doc(memoId);
  const removedUserReference = await firestore.collection('users').doc(removedUserId);

  const memo = await memoReference.get();

  if (!(memo.exists)) {
    return 'not found memo'
  }

  await memoReference.update({
    readableUsers: memo.get('readableUsers').filter(
      (user: FirebaseFirestore.DocumentReference) => user.isEqual(removedUserReference)
    )
  })

  return 'ok';
})
