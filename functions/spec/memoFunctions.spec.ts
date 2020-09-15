import * as firebase from '@firebase/testing'
import * as fs from 'fs';
import { mockReq, mockRes } from 'sinon-express-mock'
import { addReadableUser } from '../src/memoFunctions';

jest.setTimeout(30000);

describe('memo functions', () => {
  const projectId = 'air-memo-app';
  const alice = newFirebaseApp({ uid: 'alice' });
  const aliceReference = alice.collection('users').doc('alice');

  const rabbit = newFirebaseApp({ uid: 'rabbit' });
  const rabbitReference = rabbit.collection('users').doc('rabbit');

  beforeAll(
    () => {
      firebase.loadFirestoreRules({
        projectId: projectId,
        rules: fs.readFileSync('../firestore.rules', 'utf8'),
      });
    }
  )

  beforeEach(async () => {
    await aliceReference.set({ name: 'alice' });
    await rabbitReference.set({ name: 'rabbit' });

    await aliceReference.collection('memos').doc('alice-memo').set({
      content: '',
      readable_users: []
    });
  })

  afterEach(
    () => {
      firebase.clearFirestoreData({ projectId: projectId })
    }
  )

  afterAll(
    () => {
      Promise.all(
        firebase.apps().map((app) => app.delete())
      );
    }
  )

  function newFirebaseApp(auth: { uid: string }) {
    return firebase.initializeTestApp({
      projectId: projectId,
      auth: auth
    }).firestore();
  }

  const data = {
    requesterId: 'rabbit',
    memoId: 'alice-memo',
    memoAuthorId: 'alice',
  }

  describe('addReadableUser', () => {
    it('add readable user to a memo', async (done) => {
      const context = {
        auth: {
          uid: 'alice'
        }
      }

      await addReadableUser.run(mockReq(data), mockRes(context));

      const readableUsers = (await aliceReference.collection('memos').doc('alice-memo').get()).data()!.readable_users
      expect(readableUsers[0].isEqual(rabbitReference)).toBeTruthy;
      done();
    })
  })
})
