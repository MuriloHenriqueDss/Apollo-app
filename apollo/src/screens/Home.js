import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, FlatList, Animated, Dimensions, ScrollView
} from 'react-native';
import {
  collection, getDocs, addDoc, query, orderBy, doc, getDoc,
  updateDoc, setDoc, deleteDoc, where, onSnapshot
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { getAuth } from 'firebase/auth';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const Home = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newPost, setNewPost] = useState('');
  const [comments, setComments] = useState({});
  const [newComments, setNewComments] = useState({});
  const [following, setFollowing] = useState([]);
  const [userNome, setUserNome] = useState('');

  const auth = getAuth();
  const user = auth.currentUser;

  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewHeight = useRef(1);
  const contentHeight = useRef(1);

  const indicatorSize = scrollY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_HEIGHT * 0.5],
    extrapolate: 'clamp',
  });

  const translateY = Animated.multiply(scrollY, SCREEN_HEIGHT / contentHeight.current).interpolate({
    inputRange: [0, SCREEN_HEIGHT - 100],
    outputRange: [0, SCREEN_HEIGHT - 150],
    extrapolate: 'clamp',
  });

  const fetchUserNome = async () => {
    if (!user) return;
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) setUserNome(userDoc.data().nome);
  };

  const fetchFollowing = () => {
    if (!user) return;
    const followingRef = collection(db, 'follows', user.uid, 'following');
    onSnapshot(followingRef, (snapshot) => {
      setFollowing(snapshot.docs.map(doc => doc.id));
    });
  };

  const handleNewPost = async () => {
    if (newPost.trim() === '' || newTitle.trim() === '' || !user) return;
    const post = {
      userId: user.uid,
      userName: userNome,
      title: newTitle,
      content: newPost,
      createdAt: new Date(),
    };
    await addDoc(collection(db, 'posts'), post);
    setNewPost('');
    setNewTitle('');
  };

  const fetchPosts = () => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, async (querySnapshot) => {
      const postsList = await Promise.all(
        querySnapshot.docs.map(async docSnap => {
          const post = { id: docSnap.id, ...docSnap.data(), likes: 0, likedByCurrentUser: false };
          const likesSnapshot = await getDocs(collection(db, 'posts', post.id, 'likes'));
          post.likes = likesSnapshot.size;
          const userLikeDoc = await getDoc(doc(db, 'posts', post.id, 'likes', user.uid));
          post.likedByCurrentUser = userLikeDoc.exists();
          return post;
        })
      );
      setPosts(postsList);
      postsList.forEach(post => listenToComments(post.id));
    });
  };

  const handleLike = async (postId) => {
    const likeRef = doc(db, 'posts', postId, 'likes', user.uid);
    const likeSnap = await getDoc(likeRef);
    likeSnap.exists() ? await deleteDoc(likeRef) : await setDoc(likeRef, {
      userId: user.uid,
      userName: userNome,
      createdAt: new Date()
    });
    fetchPosts();
  };

  const listenToComments = (postId) => {
    const q = query(collection(db, 'comments'), where('postId', '==', postId), orderBy('createdAt', 'asc'));
    onSnapshot(q, (snapshot) => {
      setComments(prev => ({ ...prev, [postId]: snapshot.docs.map(doc => doc.data()) }));
    });
  };

  const handleAddComment = async (postId) => {
    const content = newComments[postId];
    if (!content || content.trim() === '') return;
    await addDoc(collection(db, 'comments'), {
      postId, userId: user.uid, userName: userNome, content, createdAt: new Date()
    });
    setNewComments(prev => ({ ...prev, [postId]: '' }));
  };

  const handleFollow = async (userIdToFollow) => {
    const followRef = doc(db, 'follows', user.uid, 'following', userIdToFollow);
    const docSnap = await getDoc(followRef);
    docSnap.exists() ? await deleteDoc(followRef) : await setDoc(followRef, { followedAt: new Date() });
  };

  const handleNavigateToProfile = (userId) => {
    navigation.navigate('Perfil', { userId });
  };

  useEffect(() => {
    fetchUserNome();
    const unsubscribe = fetchPosts();
    fetchFollowing();
    return () => unsubscribe();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onLayout={(e) => scrollViewHeight.current = e.nativeEvent.layout.height}
        onContentSizeChange={(_, contentH) => contentHeight.current = contentH}
      >
        <Image source={require('../assets/img/logo-sem-fundo.png')} style={styles.logo} />
        
        {/* Label para a área de postagem */}
        <Text style={styles.postLabel}>Crie sua postagem</Text>

        <TextInput
          style={styles.input}
          placeholder="Título da postagem"
          placeholderTextColor="#888"
          value={newTitle}
          onChangeText={setNewTitle}
        />
        <TextInput
          style={styles.inputtext}
          placeholder="O que você está pensando?"
          placeholderTextColor="#888"
          value={newPost}
          onChangeText={setNewPost}
        />
        <TouchableOpacity style={styles.postButton} onPress={handleNewPost}>
          <Text style={styles.postButtonText}>Postar</Text>
        </TouchableOpacity>

        {posts.map((item) => (
          <View key={item.id} style={styles.postContainer}>
            <View style={styles.postHeader}>
              <TouchableOpacity onPress={() => handleNavigateToProfile(item.userId)}>
                <Text style={styles.postUser}>{item.userName}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleFollow(item.userId)}>
                <Text style={styles.followButton}>
                  {following.includes(item.userId) ? 'Seguindo' : 'Seguir'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.postTitle}>{item.title}</Text>
            <Text style={styles.postContent}>{item.content}</Text>
            <Text style={styles.postLikes}>{item.likes} curtidas</Text>

            <TouchableOpacity onPress={() => handleLike(item.id)}>
              <Text style={[styles.likeButton, item.likedByCurrentUser && { color: '#888' }]}>
                {item.likedByCurrentUser ? 'Curtido' : 'Curtir'}
              </Text>
            </TouchableOpacity>

            <TextInput
              style={styles.commentInput}
              placeholder="Comente algo..."
              placeholderTextColor="#aaa"
              value={newComments[item.id] || ''}
              onChangeText={(text) => setNewComments(prev => ({ ...prev, [item.id]: text }))}
            />
            <TouchableOpacity style={styles.commentButton} onPress={() => handleAddComment(item.id)}>
              <Text style={styles.commentButtonText}>Comentar</Text>
            </TouchableOpacity>

            {(comments[item.id] || []).map((comment, index) => (
              <View key={index} style={styles.commentItem}>
                <Text style={styles.commentAuthor}>{comment.userName}</Text>
                <Text style={styles.commentContent}>{comment.content}</Text>
              </View>
            ))}
          </View>
        ))}
      </Animated.ScrollView>

      {/* Barra de rolagem animada na lateral direita */}
      <View style={styles.scrollIndicatorContainer}>
        <Animated.View style={[styles.scrollIndicator, { height: indicatorSize, transform: [{ translateY }] }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  logo: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    borderRadius: 50,
    marginBottom: 20,
  },
  postLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  input: {
    borderColor: '#ba9839',
    borderWidth: 1,
    padding: 10,
    color: '#fff',
    borderRadius: 6,
    marginBottom: 10,
    fontSize: 16,
  },
  inputtext: {
    borderColor: '#ba9839',
    borderWidth: 1,
    padding: 10,
    color: '#fff',
    borderRadius: 6,
    marginBottom: 20,
    fontSize: 16,
  },
  postButton: {
    backgroundColor: '#ba9839',
    padding: 15,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 20,
  },
  postButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  postContainer: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postUser: {
    color: '#ba9839',
    fontWeight: 'bold',
    fontSize: 14,
  },
  followButton: {
    color: '#ffffac',
    fontSize: 13,
  },
  postTitle: {
    color: '#fff',
    marginTop: 10,
    fontSize: 18,
    fontWeight: 'bold',
  },
  postContent: {
    color: '#fff',
    marginTop: 10,
    fontSize: 15,
  },
  postLikes: {
    color: '#aaa',
    marginTop: 5,
    fontSize: 13,
  },
  likeButton: {
    color: '#ba9839',
    marginTop: 5,
    fontWeight: 'bold',
    fontSize: 14,
  },
  commentInput: {
    height: 40,
    borderColor: '#555',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    marginTop: 10,
    color: '#fff',
    fontSize: 14,
  },
  commentButton: {
    backgroundColor: '#ba9839',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 5,
  },
  commentButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  commentItem: {
    backgroundColor: '#2a2a2a',
    padding: 8,
    borderRadius: 6,
    marginTop: 5,
  },
  commentAuthor: {
    color: '#ba9839',
    fontWeight: 'bold',
    fontSize: 13,
  },
  commentContent: {
    color: '#fff',
    fontSize: 13,
  },
  scrollIndicatorContainer: {
    position: 'absolute',
    right: 4,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: '#333',
    borderRadius: 10,
  },
  scrollIndicator: {
    width: 6,
    backgroundColor: '#ba9839',
    borderRadius: 10,
  },
});

export default Home;
