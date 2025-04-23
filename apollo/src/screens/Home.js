import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { db, collection, getDocs, addDoc, query, orderBy, doc, updateDoc } from '../../firebaseConfig'; // Correção da importação
import { getAuth } from 'firebase/auth'; // Importando autenticação

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');

  // Função para criar nova postagem
  const handleNewPost = async () => {
    if (newPost.trim() === '') return;

    const auth = getAuth();  
    const user = auth.currentUser;  

    if (user) {
      const post = {
        userId: user.uid,
        userName: user.email,
        content: newPost,
        createdAt: new Date(),
        likes: 0,  // Iniciar com 0 likes
      };

      try {
        await addDoc(collection(db, 'posts'), post); // Corrigido: Adicionando a postagem
        setNewPost(''); // Limpar o campo de input
        fetchPosts(); // Atualizar a lista de postagens
      } catch (error) {
        console.error('Erro ao adicionar a postagem:', error);
      }
    } else {
      console.log("Usuário não autenticado");
    }
  };

  // Função para carregar as postagens
  const fetchPosts = async () => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const postsList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    setPosts(postsList);
  };

  const handleLike = async (postId, currentLikes) => {
    const postRef = doc(db, 'posts', postId); // Obtendo a referência do documento
  
    try {
      // Atualizando o número de likes, somando 1 ao valor atual
      await updateDoc(postRef, { likes: currentLikes + 1 }); 
      fetchPosts(); // Atualizar a lista de postagens após o like
    } catch (error) {
      console.error('Erro ao dar like:', error);
    }
  };
  

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="O que você está pensando?"
        value={newPost}
        onChangeText={setNewPost}
      />
      <Button title="Postar" onPress={handleNewPost} />

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.postContainer}>
            <Text style={styles.postUser}>{item.userName}</Text>
            <Text>{item.content}</Text>
            <Text>{item.likes} likes</Text>
            <TouchableOpacity onPress={() => handleLike(item.id, item.likes)}>
              <Text style={styles.likeButton}>Curtir</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
  },
  postContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  postUser: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  likeButton: {
    color: '#007BFF',
    marginTop: 10,
  },
});

export default Home;
