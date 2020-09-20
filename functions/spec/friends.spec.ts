import * as firebase from '@firebase/testing'
import * as fs from 'fs';
import { mockReq, mockRes } from 'sinon-express-mock'
import { addFriend } from '../src/friendFunctions';

const context = describe;

describe('friends', () => {
  const projectId = 'air-memo-app';
  
  const admin = newAdminApp();
  const dog = newFirebaseApp({ uid: 'dog' });
  const cat = newFirebaseApp({ uid: 'cat' });

  const dogReference = dog.collection('users').doc('dog');
  const catReference = cat.collection('users').doc('cat');

  beforeAll(
    () => {
      firebase.loadFirestoreRules({
        projectId: projectId,
        rules: fs.readFileSync('../firestore.rules', 'utf8'),
      });
    }
  )

  beforeEach(
    async () => {
      await dogReference.set({ name: 'dog' });
      await catReference.set({ name: 'cat' });
    }
  )

  afterEach(
    () => {
      firebase.clearFirestoreData({projectId: projectId});
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

  function newAdminApp() {
    return firebase.initializeAdminApp({
       projectId: projectId
      }).firestore();
  }
  
  describe('rules', () => {
    beforeEach(async () => {
      await admin.collection('users').doc('dog').collection('friends').doc('cat').set({ reference: catReference });
    })

    context('the operator is oneself', () => {
      const dogFriendReference = dog.collection('users').doc('dog').collection('friends').doc('cat');

      it('permit read', async (done) => {
        await firebase.assertSucceeds( dogFriendReference.get() )
        done();
      })

      it('prohibit write', async (done) => {
        await firebase.assertFails( dogFriendReference.set({}) )
        done();
      })

      it('prohibit update', async (done) => {
        await firebase.assertFails( dogFriendReference.update({}) )
        done();
      })

      it('prohibit delete', async (done) => {
        await firebase.assertFails( dogFriendReference.delete() )
        done();
      })
    })

    context('the operator is others', () => {
      const dogFriendReference = cat.collection('users').doc('dog').collection('friends').doc('cat');

      it('prohibit all operation', async (done) => {
        await firebase.assertFails( dogFriendReference.get() );
        await firebase.assertFails( dogFriendReference.set({}) );
        await firebase.assertFails( dogFriendReference.update({}) );
        await firebase.assertFails( dogFriendReference.delete() );
        done();
      })
    })
  })

  describe('functions', () => {
    describe('addFriend', () => {
      const contextData = {
        auth: {
          uid: 'dog'
        }
      }

      it('add friend', async (done) => {
        const requestData = { targetId: 'cat' }
        await addFriend.run(mockReq(requestData), mockRes(contextData));

        const dogFriendCat = await admin.collection('users').doc('dog').collection('friends').doc('cat').get();
        const catFriendDog = await admin.collection('users').doc('cat').collection('friends').doc('dog').get();

        expect(dogFriendCat.exists).toBe(true);
        expect(catFriendDog.exists).toBe(true);
        done();
      })

      it('return "ok" if the request was passed', async (done) => {
        await catReference.set({ name: 'cat' });
        const requestData = { targetId: 'cat' }
        const status = await addFriend.run(mockReq(requestData), mockRes(contextData));
        expect(status).toBe('ok');
        done();
      })

      it('return "permission denied" if the client is not authed', async (done) => {
        const requestData = { targetId: 'cat' }
        const status = await addFriend.run(mockReq(requestData), mockRes({}));
        expect(status).toBe('permission denied');
        done();
      })

      it('return "not found target" if the traget was not found', async (done) => {
        const requestData = { targetId: 'Genger' }
        const status = await addFriend.run(mockReq(requestData), mockRes(contextData));
        expect(status).toBe('not found target');
        done();
      })

      it('return "invalid request" if targetId was not setted', async (done) => {
        const status = await addFriend.run(mockReq(), mockRes(contextData));
        expect(status).toBe('invalid request');
        done();
      })
    })
  })
})
