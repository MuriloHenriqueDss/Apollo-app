//João Gustavo e Murilo Henrique

import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ScrollView } from "react-native";
import { getFirestore, collection, getDocs, addDoc, query, where, onSnapshot } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getApp } from "firebase/app";

// Função principal para a tela de Direct
export default function Direct() {
  const [usuarios, setUsuarios] = useState([]);
  const [conversas, setConversas] = useState([]); // Lista de conversas já iniciadas
  const [conversaAtiva, setConversaAtiva] = useState(null); // Controla a conversa ativa
  const [mensagens, setMensagens] = useState([]);
  const [novaMensagem, setNovaMensagem] = useState(""); 
  const [novoUsuarioId, setNovoUsuarioId] = useState(null);
  const [mostrarListaUsuarios, setMostrarListaUsuarios] = useState(false); // Controla a exibição da lista de usuários

  // Inicializa Firebase Firestore
  const db = getFirestore(getApp());
  const auth = getAuth(getApp());

  // Função para buscar os usuários da base de dados
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);

        const usuariosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsuarios(usuariosData);
      } catch (error) {
        console.error("Erro ao carregar usuários:", error);
      }
    };

    fetchUsuarios();
    fetchConversas();
  }, []);

  // Função para buscar conversas já iniciadas
  const fetchConversas = async () => {
    try {
      const convRef = collection(db, "mensagens");
      const q = query(
        convRef,
        where("usuarios", "array-contains", auth.currentUser.uid)
      );
      
      const snapshot = await getDocs(q);
      const conversasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setConversas(conversasData);
    } catch (error) {
      console.error("Erro ao carregar conversas:", error);
    }
  };

  // Função para iniciar o chat com um usuário
  const iniciarChat = (usuarioId) => {
    setConversaAtiva(usuarioId); // Define o usuário com quem está conversando
    setMensagens([]); // Limpa as mensagens antigas ao iniciar um novo chat
    setNovoUsuarioId(usuarioId); // Armazena o ID do usuário com quem vai conversar
    fetchMensagens(usuarioId); // Busca as mensagens do usuário selecionado
  };

  // Função para buscar mensagens no Firestore
  const fetchMensagens = (usuarioId) => {
    const q = query(
      collection(db, "mensagens"),
      where("usuarios", "array-contains", usuarioId)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const mensagensData = [];
      querySnapshot.forEach((doc) => {
        mensagensData.push(doc.data());
      });
      setMensagens(mensagensData);
    });

    return unsubscribe;
  };

  // Função para enviar mensagem
  const enviarMensagem = async () => {
    if (novaMensagem.trim()) {
      try {
        await addDoc(collection(db, "mensagens"), {
          texto: novaMensagem,
          sender: auth.currentUser.uid,
          usuarios: [auth.currentUser.uid, novoUsuarioId],
          createdAt: new Date(),
        });

        setNovaMensagem(""); // Limpa o campo de texto após o envio
      } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
      }
    }
  };

  // Função para exibir as mensagens de chat
  const renderItem = ({ item }) => {
    // Buscar o nome do usuário com base no sender (ID do usuário)
    const usuarioConversando = usuarios.find(user => user.id === item.sender);
    const nomeUsuario = usuarioConversando ? usuarioConversando.nome : "Desconhecido";
    
    return (
      <View style={item.sender === auth.currentUser.uid ? styles.mensagemEu : styles.mensagemOutro}>
        <Text style={styles.mensagemTexto}>
          {item.sender === auth.currentUser.uid ? "Você: " : `${nomeUsuario}: `}
          {item.texto}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {conversaAtiva ? (
        // Exibe o chat quando uma conversa está ativa
        <View style={styles.chatBox}>
          <TouchableOpacity style={styles.botaoVoltar} onPress={() => setConversaAtiva(null)}>
            <Text style={styles.botaoTexto}>Voltar</Text>
          </TouchableOpacity>
          
          <Text style={styles.chatHeader}>Conversando com {conversaAtiva}</Text>
          
          {/* Lista de mensagens */}
          <FlatList
            data={mensagens}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
            inverted
          />

          {/* Campo de texto para enviar nova mensagem */}
          <TextInput
            style={styles.inputMensagem}
            value={novaMensagem}
            onChangeText={setNovaMensagem}
            placeholder="Digite sua mensagem"
            placeholderTextColor="#888"
          />

          {/* Botão de enviar mensagem */}
          <TouchableOpacity style={styles.botaoEnviar} onPress={enviarMensagem}>
            <Text style={styles.botaoTexto}>Enviar Mensagem</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Exibe o botão de iniciar conversa ou lista de conversas
        <View style={styles.listaUsuarios}>
          {conversas.length > 0 && (
            <View style={styles.conversasBox}>
              <Text style={styles.tituloConversas}>Conversas Ativas:</Text>
              {conversas.map((conversa) => {
                const outroUsuario = conversa.usuarios.find(user => user !== auth.currentUser.uid);
                const usuario = usuarios.find(user => user.id === outroUsuario);
                return (
                  <TouchableOpacity
                    key={conversa.id}
                    style={styles.usuarioBox}
                    onPress={() => iniciarChat(outroUsuario)}
                  >
                    <Text style={styles.usuarioNome}>
                      {usuario ? usuario.nome : "Usuário desconhecido"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          {!mostrarListaUsuarios ? (
            // Exibe apenas o botão para começar uma nova conversa
            <TouchableOpacity
              style={styles.botaoNovaConversa}
              onPress={() => setMostrarListaUsuarios(true)}
            >
              <Text style={styles.botaoTexto}>Começar Nova Conversa</Text>
            </TouchableOpacity>
          ) : (
            // Exibe a lista de usuários com rolagem
            <ScrollView style={styles.scrollContainer}>
              <Text style={styles.tituloUsuarios}>Escolha com quem quer conversar</Text>
              {usuarios.map((usuario) => (
                <TouchableOpacity
                  key={usuario.id}
                  style={styles.usuarioBox}
                  onPress={() => iniciarChat(usuario.id)}
                >
                  <Text style={styles.usuarioNome}>{usuario.nome}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

// Estilos para a tela
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
  },
  listaUsuarios: {
    flex: 1,
    justifyContent: "center",
  },
  usuarioBox: {
    backgroundColor: "#333",
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
  },
  usuarioNome: {
    color: "#fff",
    fontSize: 18,
  },
  chatBox: {
    flex: 1,
    backgroundColor: "#222",
    padding: 20,
    borderRadius: 8,
  },
  chatHeader: {
    color: "#fff",
    fontSize: 20,
    marginBottom: 20,
  },
  mensagemTexto: {
    fontSize: 16,
    color: "#fff", // Mensagens em branco
  },
  inputMensagem: {
    backgroundColor: "#333",
    color: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  botaoEnviar: {
    backgroundColor: "#DAA520",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  botaoTexto: {
    color: "#000",
    fontSize: 16,
  },
  botaoNovaConversa: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  botaoVoltar: {
    backgroundColor: "#f44336", 
    padding: 10, 
    borderRadius: 8, 
    marginBottom: 10,
    alignItems: "center",
  },
  tituloUsuarios: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 10,
  },
  tituloConversas: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 15,
  },
  conversasBox: {
    marginBottom: 20,
  },
  mensagemEu: {
    backgroundColor: "#007AFF", 
    alignSelf: "flex-end", 
    padding: 10, 
    borderRadius: 8,
    marginBottom: 5,
  },
  mensagemOutro: {
    backgroundColor: "#34C759", 
    alignSelf: "flex-start", 
    padding: 10, 
    borderRadius: 8,
    marginBottom: 5,
  },
  scrollContainer: {
    maxHeight: 400, // Defina uma altura máxima para a rolagem
  },
});
