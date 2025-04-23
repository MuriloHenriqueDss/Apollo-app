import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { db } from '../../firebaseConfig';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const Notificacao = () => {
  const [notifications, setNotifications] = useState([]);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const unsubscribes = [];

    const fetchPostIds = async () => {
      const postsSnap = await getDocs(query(collection(db, 'posts'), where('userId', '==', user.uid)));
      const postDocs = postsSnap.docs;
      const postIds = postDocs.map(doc => doc.id);

      if (postIds.length === 0) return;

      const unsubComments = onSnapshot(
        query(collection(db, 'comments'), where('postId', 'in', postIds)),
        (snapshot) => {
          const comments = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: `comment-${doc.id}`,
              type: 'comment',
              fromUserName: data.userName,
              createdAt: data.createdAt?.toDate() || new Date(),
            };
          });
          updateNotifications(comments);
        }
      );
      unsubscribes.push(unsubComments);

      postDocs.forEach(doc => {
        const postId = doc.id;
        const unsubPost = onSnapshot(doc.ref, (docSnap) => {
          const postData = docSnap.data();
          const likes = Array.isArray(postData.likes) ? postData.likes : [];

          const likeNotifications = likes
            .filter(like => like.userId !== user.uid)
            .map(like => ({
              id: `like-${postId}-${like.userId}`,
              type: 'like',
              fromUserName: like.userName || 'Someone',
              createdAt: like.createdAt?.toDate() || new Date(),
            }));

          updateNotifications(likeNotifications);
        });

        unsubscribes.push(unsubPost);
      });
    };

    fetchPostIds();

    return () => unsubscribes.forEach(unsub => unsub());
  }, [user]);

  const updateNotifications = (newItems) => {
    setNotifications(prev => {
      const existingIds = new Set(prev.map(n => n.id));
      const merged = [...prev];

      newItems.forEach(item => {
        if (!existingIds.has(item.id)) {
          merged.push(item);
        }
      });

      return merged.sort((a, b) => b.createdAt - a.createdAt);
    });
  };

  const renderMessage = (item) => {
    switch (item.type) {
      case 'like':
        return `${item.fromUserName} curtiu sua postagem`;
      case 'comment':
        return `${item.fromUserName} comentou em sua postagem`;
      default:
        return '';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notificações</Text>
      {notifications.length === 0 ? (
        <Text>Não houve nenhuma notificação</Text>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.notificationContainer}>
              <Text>{renderMessage(item)}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  notificationContainer: {
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#f4f4f4',
    borderRadius: 8,
  },
});

export default Notificacao;
