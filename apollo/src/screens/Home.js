import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, TouchableOpacity, Image } from 'react-native';
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
  deleteDoc,
  where,
  onSnapshot
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

  const fetchFollowing = () => {
    if (!user) return;

    const followingRef = collection(db, 'follows', user.uid, 'following');
    onSnapshot(followingRef, (snapshot) => {
      const followedIds = snapshot.docs.map(doc => doc.id);
      setFollowing(followedIds);
    });
  };

  const handleNewPost = async () => {
    if (newPost.trim() === '' || !user) return;

    const post = {
      userId: user.uid,
      userName: userNome,
      content: newPost,
      createdAt: new Date(),
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
    postsList.forEach(post => fetchComments(post.id));
  };

  const handleLike = async (postId) => {
    if (!user) return;

    const likeRef = doc(db, 'posts', postId, 'likes', user.uid);
    const likeSnap = await getDoc(likeRef);

    if (likeSnap.exists()) {
      await deleteDoc(likeRef);
    } else {
      await setDoc(likeRef, {
        userId: user.uid,
        userName: userNome,
        createdAt: new Date()
      });
    }

    fetchPosts();
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

  const handleFollow = async (userIdToFollow) => {
    if (!user) return;

    const followRef = doc(db, 'follows', user.uid, 'following', userIdToFollow);
    const docSnap = await getDoc(followRef);

    try {
      if (docSnap.exists()) {
        // Deixar de seguir
        await deleteDoc(followRef);
      } else {
        // Começar a seguir
        await setDoc(followRef, {
          followedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Erro ao seguir/desseguir:', error);
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
      <TouchableOpacity style={styles.postButton} onPress={handleNewPost}>
        <Text style={styles.postButtonText}>Postar</Text>
      </TouchableOpacity>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.postContainer}>
            <View style={styles.postHeader}>
              <Text style={styles.postUser}>{item.userName}</Text>
              <TouchableOpacity onPress={() => handleFollow(item.userId)}>
                <Text style={styles.followButton}>
                  {following.includes(item.userId) ? 'Seguindo' : 'Seguir'}
                </Text>
              </TouchableOpacity>
            </View>

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
    height: 50,
    borderColor: '#ba9839',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
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
  commentList: {
    marginTop: 10,
  },
  commentItem: {
    backgroundColor: '#2a2a2a',
    padding: 8,
    borderRadius: 6,
    marginBottom: 5,
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
});

export default Home;

