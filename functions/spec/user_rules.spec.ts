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
      test('users can write the user document', () => {
        const alice_profile = alice_client.collection('users').doc('alice');

        firebase.assertSucceeds(alice_profile.set({'name': 'alice'}))
      })

      test('users cannot write other user documents', () => {
        const rabbit_profile = alice_client.collection('users').doc('rabbit');

        firebase.assertFails(rabbit_profile.set({'name': 'rabbit'}));
      })
    })

    describe('read', () => {
       alice_client.collection('users').doc('alice').set({'name': 'alice'});

      test('all user can read all user documents', () => {
        const rabbit_client = newFirebaseApp({uid: 'rabbit'});
        const alice_profile = rabbit_client.collection('users').doc('alice');

        firebase.assertSucceeds(alice_profile.get());
      })
    })

    describe('update', () => {
      const alice_profile = alice_client.collection('users').doc('alice');
      alice_profile.set({'name': 'alice'});

      test('users can update the user document', () => {
        firebase.assertSucceeds(alice_profile.update({'name': 'new alice'}));
      })

      test('users cannot update other user document', () => {
        const rabbit_client = newFirebaseApp({ uid: 'rabbit' });
        firebase.assertFails(
          rabbit_client.collection('users').doc('alice').get()
        );
      })
    })

    describe('delete', () => {
      const alice_profile = alice_client.collection('users').doc('alice');

      test('users can delete the user document', () => {
        alice_profile.set({'name': 'alice'});

        firebase.assertSucceeds(alice_profile.delete());
      })

      test('users cannot delete other user documents', () => {
        alice_profile.set({'name': 'alice'});

        const rabbit_client = newFirebaseApp({ uid: 'rabbit' });
        firebase.assertFails(
          rabbit_client.collection('users').doc('alice').delete()
        );
      })
    })
  })
})
