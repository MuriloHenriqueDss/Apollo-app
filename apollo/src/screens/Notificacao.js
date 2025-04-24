//João Gustavo e Murilo Henrique

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Animated,
} from 'react-native';
import { db } from '../../firebaseConfig';
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const Notificacao = () => {
  const [notifications, setNotifications] = useState([]);
  const auth = getAuth();
  const user = auth.currentUser;

  const scrollY = useRef(new Animated.Value(0)).current;
  const [contentHeight, setContentHeight] = useState(1);
  const [scrollViewHeight, setScrollViewHeight] = useState(1);

  useEffect(() => {
    if (!user) return;

    const unsubscribes = [];

    const fetchPostIds = async () => {
      const postsSnap = await getDocs(
        query(collection(db, 'posts'), where('userId', '==', user.uid))
      );
      const postDocs = postsSnap.docs;
      const postIds = postDocs.map((doc) => doc.id);

      if (postIds.length === 0) return;

      const unsubComments = onSnapshot(
        query(collection(db, 'comments'), where('postId', 'in', postIds)),
        (snapshot) => {
          const comments = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: `comment-${doc.id}`,
              type: 'comment',
              fromUserName: data.userName,
              fromUserId: data.userId,
              createdAt: data.createdAt?.toDate() || new Date(),
            };
          });
          updateNotifications(comments);
        }
      );
      unsubscribes.push(unsubComments);

      postDocs.forEach((doc) => {
        const postId = doc.id;
        const unsubPost = onSnapshot(doc.ref, (docSnap) => {
          const postData = docSnap.data();
          const likes = Array.isArray(postData.likes) ? postData.likes : [];

          const likeNotifications = likes
            .filter((like) => like.userId !== user.uid)
            .map((like) => ({
              id: `like-${postId}-${like.userId}`,
              type: 'like',
              fromUserName: like.userName || 'Alguém',
              fromUserId: like.userId,
              createdAt: like.createdAt?.toDate() || new Date(),
            }));

          updateNotifications(likeNotifications);
        });

        unsubscribes.push(unsubPost);
      });
    };

    fetchPostIds();

    return () => unsubscribes.forEach((unsub) => unsub());
  }, [user]);

  const updateNotifications = (newItems) => {
    setNotifications((prev) => {
      const existingIds = new Set(prev.map((n) => n.id));
      const merged = [...prev];

      newItems.forEach((item) => {
        if (!existingIds.has(item.id)) {
          merged.push(item);
        }
      });

      return merged.sort((a, b) => b.createdAt - a.createdAt);
    });
  };

  const renderMessage = (item) => {
    return (
      <Text style={styles.notificationText}>
        <Text style={styles.userName}>{item.fromUserName}</Text>{' '}
        {item.type === 'like'
          ? 'curtiu sua postagem.'
          : 'comentou em sua postagem.'}
      </Text>
    );
  };

  // Cálculo da barra
  const scrollBarHeight = scrollViewHeight / contentHeight * scrollViewHeight;
  const scrollIndicatorPosition = Animated.multiply(
    scrollY,
    scrollViewHeight / contentHeight
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔔 Notificações</Text>

      <View style={{ flex: 1, flexDirection: 'row' }}>
        <Animated.FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={[
                styles.notificationContainer,
                item.type === 'likes' ? styles.likeBorder : styles.commentBorder,
              ]}
            >
              {renderMessage(item)}
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          onContentSizeChange={(w, h) => setContentHeight(h)}
          onLayout={(e) => setScrollViewHeight(e.nativeEvent.layout.height)}
        />

        {/* Barra de rolagem customizada */}
        <View style={styles.scrollTrack}>
          <Animated.View
            style={[
              styles.scrollBar,
              {
                height: scrollBarHeight,
                transform: [{ translateY: scrollIndicatorPosition }],
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ba9839',
    marginBottom: 20,
    marginTop: 20,
    alignSelf: 'center',
  },
  notificationContainer: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  likeBorder: {
    borderLeftColor: '#e7b02e',
  },
  commentBorder: {
    borderLeftColor: '#51a1ff',
  },
  notificationText: {
    color: '#fff',
    fontSize: 15,
  },
  userName: {
    color: '#ba9839',
    fontWeight: 'bold',
  },
  emptyMessage: {
    color: '#777',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  scrollTrack: {
    width: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    marginLeft: 8,
  },
  scrollBar: {
    width: 6,
    backgroundColor: '#ba9839',
    borderRadius: 3,
  },
});

export default Notificacao;
