import * as firebase from '@firebase/testing'
import * as fs from 'fs';

describe('firestore rules', () => {
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

  describe("user rules", () => {
    const aliceClient = newFirebaseApp({uid: 'alice'});

    describe('write', () => {
      test('users can write the user document', async () => {
        const aliceProfile = aliceClient.collection('users').doc('alice');

        await firebase.assertSucceeds(aliceProfile.set({'name': 'alice'}))
      })

      test('users cannot write other user documents', async () => {
        const rabbitProfile = aliceClient.collection('users').doc('rabbit');

        await firebase.assertFails(rabbitProfile.set({'name': 'rabbit'}));
      })
    })

    describe('read', () => {
      test('authed user can read all user documents', async () => {
        aliceClient.collection('users').doc('alice').set({'name': 'alice'});
        const rabbitClient = newFirebaseApp({uid: 'rabbit'});
        const aliceProfile = rabbitClient.collection('users').doc('alice');

        await firebase.assertSucceeds(aliceProfile.get());
      })

      test('not authed user cannot read all user documents', async () => {
        aliceClient.collection('users').doc('alice').set({'name': 'alice'});
        const notAuthedClient = firebase.initializeTestApp({ projectId: projectId }).firestore();

        await firebase.assertFails(
          notAuthedClient.collection('users').doc('alice').get()
        )
      })
    });

    describe('update', () => {
      const aliceProfile = aliceClient.collection('users').doc('alice');

      test('users can update the user document', async () => {
        aliceProfile.set({'name': 'alice'});

        await firebase.assertSucceeds(
          aliceClient.collection('users').doc('alice').update({'name': 'alice'})
        );
      })

      test('users cannot update other user document', async () => {
        aliceProfile.set({'name': 'alice'});

        const rabbitClient = newFirebaseApp({ uid: 'rabbit' });
        await firebase.assertFails(
          rabbitClient.collection('users').doc('alice').update({'name': 'new alice'})
        );
      })
    });

    describe('delete', () => {
      const aliceProfile = aliceClient.collection('users').doc('alice');

      test('users can delete the user document', async () => {
        aliceProfile.set({'name': 'alice'});

        await firebase.assertSucceeds(aliceProfile.delete());
      })

      test('users cannot delete other user documents', async () => {
        aliceProfile.set({'name': 'alice'});

        const rabbitClient = newFirebaseApp({ uid: 'rabbit' });
        await firebase.assertFails(
          rabbitClient.collection('users').doc('alice').delete()
        );
      })
    });
  })
})
