import * as firebase from '@firebase/testing'
import * as fs from 'fs';
import { mockReq, mockRes } from 'sinon-express-mock'
import { addReadableUser, removeReadableUser } from '../src/memoFunctions';

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
      readableUsers: []
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

  const requestData = {
    memoId: 'alice-memo',
    memoAuthorId: 'alice',
  }

  const authData = { auth: { uid: 'alice' } }

  describe('addReadableUser', () => {
    it('add readable user to a memo', async (done) => {
      await addReadableUser.run(mockReq(requestData), mockRes(authData));

      const readableUsers = (await aliceReference.collection('memos').doc('alice-memo').get()).data()!.readableUsers
      expect(readableUsers[0].isEqual(rabbitReference)).toBeTruthy;
      done();
    })

    it('return "ok" when error was not happend', async (done) => {
      const status = await addReadableUser.run(mockReq(requestData), mockRes(authData));

      expect(status).toBe('ok');
      done();
    })

    it('return "permission denied" when the requester is not authed', async (done) => {
      const status = await addReadableUser.run(mockReq(requestData), mockRes());
      expect(status).toBe('permission denied')
      done();
    })

    it('return "invalid request" when the memo is not found', async (done) => {
      const status = await addReadableUser.run(mockReq(), mockRes(authData));
      expect(status).toBe('invalid request');
      done();
    })

    it('return "not found memo"', async (done) => {
      const notExistMemo = {
        memoId: 'to-do-list',
        memoAuthorId: 'genger'
      }

      const status = await addReadableUser.run(mockReq(notExistMemo), mockRes(authData));
      expect(status).toBe('not found memo');
      done();
    })
  })

  describe('removeReadableUser', async () => {
    beforeEach(async () => {
      await addReadableUser.run(mockRes(requestData), mockRes({ auth: { uid: 'rabbit' } }))
    })

    const data = {
      memoId: 'alice-memo',
      memoAuthorId: 'alice',
      removedUserId: 'rabbit'
    }

    it('remove from readable users if the requester is the author', async (done) => {
      await removeReadableUser.run(mockReq(data), mockRes({ auth: { uid: 'alice' } }));

      const readableUsers = (await aliceReference.collection('memos').doc('alice-memo').get()).data()!.readableUsers
      expect(readableUsers).toBeFalsy;
      done();      
    })

    it('remove if the requester is the removed user', async (done) => {
      await removeReadableUser.run(mockReq(data), mockRes({ auth: { uid: 'rabbit' }}))

      const readableUsers = (await aliceReference.collection('memos').doc('alice-memo').get()).data()!.readableUsers
      expect(readableUsers).toBeFalsy;
      done();
    })

    it("don't remove in other cases", async (done) => {
      await removeReadableUser.run(mockReq(data), mockRes({ auth: { uid: 'cat' }}))

      const readableUsers = (await aliceReference.collection('memos').doc('alice-memo').get()).data()!.readableUsers
      expect(readableUsers[0].isEqual(rabbitReference)).toBeTruthy
      done();
    })
  })
})
