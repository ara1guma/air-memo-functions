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

  describe('memo rules', () => {
    const humpty = newFirebaseApp({ uid: 'Humpty Dumpty' });
    humpty.collection('users').doc('Humpty Dumpty').set({ 'name': 'Humpty Dumpty' });
    const king = newFirebaseApp({ uid: 'king' });
    king.collection('users').doc('king').set({ 'name': 'king' });

    describe('write', () => {
      test('users can write a memo under the user document', async () => {
        const memo = humpty.collection('users').doc('Humpty Dumpty').collection('memos').doc('0');
        await firebase.assertSucceeds(memo.set({ 'content': 'memo!' }));
      })

      test('users cannot write a memo under other user document', async () => {
        const memo = king.collection('users').doc('Humpty Dumpty').collection('memos').doc('1');
        await firebase.assertFails(memo.set({ 'content': 'memo!' }))
      })
    })

    describe('read', () => {
      const memo = humpty.collection('users').doc('Humpty Dumpty').collection('memos').doc('0');

      test('who is in a readable_users can read the memo', async () => {
        memo.set({
          content: 'memo!',
          readable_users: [humpty.collection('users').doc('Humpty Dumpty')]
        });

        await firebase.assertSucceeds(
          memo.get()
        );
      });

      test('who is not in a readable_users cannot read the memo', async () => {
        memo.set({ content: 'memo!' });
        await firebase.assertFails(
          memo.get()
        );
      });
    })

    describe('update', () => {
      const memo = humpty.collection('users').doc('Humpty Dumpty').collection('memos').doc('0');

      test('users can update a memo under the user document', async () => {
        memo.set({ content: 'memo!' })
        await firebase.assertSucceeds(memo.update({ content: 'updated memo!' }));
      })

      test('users cannot update a memo under other user document', async () => {
        memo.set({ content: 'memo!' })
        await firebase.assertFails(
          king.collection('users').doc('Humpty Dumpty').collection('memos').doc('0').update({ content: 'new memo!' })
        );
      })
    })

    describe('delete', () => {
      const memo = humpty.collection('users').doc('Humpty Dumpty').collection('memos').doc('0');

      test('users can delete a memo under the user document', async () => {
        memo.set({ content: 'memo!' })
        await firebase.assertSucceeds(memo.delete());
      })

      test('users cannot delete a memo under other user document', async () => {
        memo.set({ content: 'memo!' })
        await firebase.assertFails(
          king.collection('users').doc('Humpty Dumpty').collection('memos').doc('0').delete()
        );
      })
    })
  })
})