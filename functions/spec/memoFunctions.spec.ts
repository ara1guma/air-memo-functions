import * as firebase from '@firebase/testing'
import * as fs from 'fs';
import { mockReq, mockRes } from 'sinon-express-mock'
import { addReadableUser } from '../src/memoFunctions';

jest.setTimeout(30000);

describe('memo functions', () => {
  const projectId = 'air-memo-app';

  beforeAll(
    () => {
      firebase.loadFirestoreRules({
        projectId: projectId,
        rules: fs.readFileSync('../firestore.rules', 'utf8'),
      });
    }
  )

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

  describe('addReadableUser', () => {
      beforeEach(async () => {
        const alice = newFirebaseApp({ uid: 'alice' });
        await alice.collection('users').doc('alice').set({ name: 'alice' });
        await alice.collection('users').doc('alice').collection('memos').doc('alice-memo').set({
          content: '',
          readable_users: [alice.collection('users').doc('alice')]
        });

        const rabbit = newFirebaseApp({ uid: 'rabbit' });
        await rabbit.collection('users').doc('rabbit').set({ name: 'rabbit' });
      })

      it('add readable user to a memo', async (done) => {
        const request = {
          query: {
            requesterId: 'rabbit',
            memoId: 'alice-memo',
            memoAuthorId: 'alice'
          }
        }
        const alice = newFirebaseApp({ uid: 'alice' })

        const response = {
          send: async () => {
            const memoReference = alice.collection('users').doc('alice').collection('memos').doc('alice-memo');
            const memo = await memoReference.get()

            expect(
              memo.get('readable_users')[1].isEqual(
                alice.collection('users').doc('rabbit')
              )
            ).toBeTruthy
            done();
          }
        }

        await addReadableUser(mockReq(request), mockRes(response));
      })
  })
})
