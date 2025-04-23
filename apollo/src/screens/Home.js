import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image
} from 'react-native';
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  where
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { getAuth } from 'firebase/auth';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [comments, setComments] = useState({});
  const [newComments, setNewComments] = useState({});
  const [following, setFollowing] = useState([]);
  const [userNome, setUserNome] = useState('');

  const auth = getAuth();  
  const user = auth.currentUser;

  const fetchUserNome = async () => {
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserNome(userDoc.data().nome);
      }
    } catch (error) {
      console.error('Erro ao buscar o nome do usuário:', error);
    }
  };

  const fetchFollowing = async () => {
    if (!user) return;
    try {
      const q = collection(db, 'users', user.uid, 'following');
      const snapshot = await getDocs(q);
      const followingIds = snapshot.docs.map(doc => doc.data().userId);
      setFollowing(followingIds);
    } catch (error) {
      console.error('Erro ao carregar seguindo:', error);
    }
  };

  const handleFollow = async (userIdToFollow, userNameToFollow) => {
    if (!user || userIdToFollow === user.uid) return;
    const followRef = doc(db, 'users', user.uid, 'following', userIdToFollow);

    try {
      const docSnap = await getDoc(followRef);

      if (docSnap.exists()) {
        await updateDoc(followRef, { unfollowedAt: new Date() });
        setFollowing(prev => prev.filter(id => id !== userIdToFollow));
      } else {
        await setDoc(followRef, {
          userId: userIdToFollow,
          userName: userNameToFollow,
          followedAt: new Date()
        });
        setFollowing(prev => [...prev, userIdToFollow]);
      }
    } catch (error) {
      console.error('Erro ao seguir usuário:', error);
    }
  };

  const handleNewPost = async () => {
    if (newPost.trim() === '' || !user) return;

    const post = {
      userId: user.uid,
      userName: userNome,
      content: newPost,
      createdAt: new Date(),
      likes: 0,
    };

    try {
      await addDoc(collection(db, 'posts'), post);
      setNewPost('');
      fetchPosts();
    } catch (error) {
      console.error('Erro ao adicionar a postagem:', error);
    }
  };

  const fetchPosts = async () => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const postsList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    setPosts(postsList);

    postsList.forEach(post => fetchComments(post.id));
  };

  const handleLike = async (postId, currentLikes) => {
    const postRef = doc(db, 'posts', postId);
    try {
      await updateDoc(postRef, { likes: currentLikes + 1 });
      fetchPosts();
    } catch (error) {
      console.error('Erro ao dar like:', error);
    }
  };

  const fetchComments = async (postId) => {
    try {
      const q = query(collection(db, 'comments'), where('postId', '==', postId), orderBy('createdAt', 'asc'));
      const snapshot = await getDocs(q);
      const postComments = snapshot.docs.map(doc => doc.data());

      setComments(prev => ({
        ...prev,
        [postId]: postComments,
      }));
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
    }
  };

  const handleAddComment = async (postId) => {
    const content = newComments[postId];
    if (!content || content.trim() === '') return;

    const comment = {
      postId,
      userId: user.uid,
      userName: userNome,
      content,
      createdAt: new Date(),
    };

    try {
      await addDoc(collection(db, 'comments'), comment);
      setNewComments(prev => ({ ...prev, [postId]: '' }));
      fetchComments(postId);
    } catch (error) {
      console.error('Erro ao comentar:', error);
    }
  };

  useEffect(() => {
    fetchUserNome();
    fetchPosts();
    fetchFollowing();
  }, []);

  return (
    <View style={styles.container}>
      <Image 
        source={require('../../assets/img/Apollo.png')}
        style={styles.logo}
      />

      <TextInput
        style={styles.input}
        placeholder="O que você está pensando?"
        placeholderTextColor="#888"
        value={newPost}
        onChangeText={setNewPost}
      />
      <Button title="Postar" onPress={handleNewPost} color="#ba9839" />

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.postContainer}>
            <View style={styles.postHeader}>
              <Text style={styles.postUser}>{item.userName}</Text>
              <TouchableOpacity onPress={() => handleFollow(item.userId, item.userName)}>
                <Text style={styles.followButton}>
                  {following.includes(item.userId) ? 'Seguindo' : 'Seguir'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.postContent}>{item.content}</Text>
            <Text style={styles.postLikes}>{item.likes} curtidas</Text>

            <TouchableOpacity onPress={() => handleLike(item.id, item.likes)}>
              <Text style={styles.likeButton}>Curtir</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.commentInput}
              placeholder="Comente algo..."
              placeholderTextColor="#aaa"
              value={newComments[item.id] || ''}
              onChangeText={(text) => setNewComments(prev => ({ ...prev, [item.id]: text }))}
            />
            <Button title="Comentar" onPress={() => handleAddComment(item.id)} color="#ba9839" />

            <View style={styles.commentList}>
              {(comments[item.id] || []).map((comment, index) => (
                <View key={index} style={styles.commentItem}>
                  <Text style={styles.commentAuthor}>{comment.userName}</Text>
                  <Text style={styles.commentContent}>{comment.content}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    borderRadius: 50,
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: '#ba9839',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
    color: '#fff',
    borderRadius: 6,
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
  postContent: {
    color: '#fff',
    marginTop: 8,
    fontSize: 16,
  },
  postLikes: {
    color: '#888',
    marginTop: 6,
  },
  likeButton: {
    color: '#e7b02e',
    marginTop: 10,
    fontWeight: 'bold',
  },
  commentInput: {
    height: 35,
    borderColor: '#555',
    borderWidth: 1,
    borderRadius: 6,
    paddingLeft: 8,
    color: '#fff',
    marginTop: 10,
  },
  commentList: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 8,
  },
  commentItem: {
    backgroundColor: '#2a2a2a',
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  commentAuthor: {
    color: '#ba9839',
    fontWeight: 'bold',
    fontSize: 13,
  },
  commentContent: {
    color: '#fff',
    fontSize: 14,
  },
});

export default Home;
