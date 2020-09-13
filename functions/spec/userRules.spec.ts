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
    const alice_client = newFirebaseApp({uid: 'alice'});

    describe('write', () => {
      test('users can write the user document', async () => {
        const alice_profile = alice_client.collection('users').doc('alice');

        await firebase.assertSucceeds(alice_profile.set({'name': 'alice'}))
      })

      test('users cannot write other user documents', async () => {
        const rabbit_profile = alice_client.collection('users').doc('rabbit');

        await firebase.assertFails(rabbit_profile.set({'name': 'rabbit'}));
      })
    })

    describe('read', () => {
      test('all user can read all user documents', async () => {
        alice_client.collection('users').doc('alice').set({'name': 'alice'});
        const rabbit_client = newFirebaseApp({uid: 'rabbit'});
        const alice_profile = rabbit_client.collection('users').doc('alice');

        await firebase.assertSucceeds(alice_profile.get());
      })
    });

    describe('update', () => {
      const alice_profile = alice_client.collection('users').doc('alice');

      test('users can update the user document', async () => {
        alice_profile.set({'name': 'alice'});

        await firebase.assertSucceeds(
          alice_client.collection('users').doc('alice').update({'name': 'alice'})
        );
      })

      test('users cannot update other user document', async () => {
        alice_profile.set({'name': 'alice'});

        const rabbit_client = newFirebaseApp({ uid: 'rabbit' });
        await firebase.assertFails(
          rabbit_client.collection('users').doc('alice').update({'name': 'new alice'})
        );
      })
    });

    describe('delete', () => {
      const alice_profile = alice_client.collection('users').doc('alice');

      test('users can delete the user document', async () => {
        alice_profile.set({'name': 'alice'});

        await firebase.assertSucceeds(alice_profile.delete());
      })

      test('users cannot delete other user documents', async () => {
        alice_profile.set({'name': 'alice'});

        const rabbit_client = newFirebaseApp({ uid: 'rabbit' });
        await firebase.assertFails(
          rabbit_client.collection('users').doc('alice').delete()
        );
      })
    });
  })
})
