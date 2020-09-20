import * as firebase from '@firebase/testing'
import * as fs from 'fs';

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
      await dogReference.set({});
      await catReference.set({});
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
})
