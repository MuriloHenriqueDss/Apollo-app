// João Gustavo e Murilo Henrique

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ScrollView,
} from "react-native";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getApp } from "firebase/app";

export default function Direct() {
  const [usuarios, setUsuarios] = useState([]);
  const [conversas, setConversas] = useState([]);
  const [conversaAtiva, setConversaAtiva] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [novoUsuarioId, setNovoUsuarioId] = useState(null);
  const [mostrarListaUsuarios, setMostrarListaUsuarios] = useState(false);

  const db = getFirestore(getApp());
  const auth = getAuth(getApp());

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);
        const usuariosData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsuarios(usuariosData);
      } catch (error) {
        console.error("Erro ao carregar usuários:", error);
      }
    };

    fetchUsuarios();

    const convRef = collection(db, "conversas");
    const q = query(convRef, where("usuarios", "array-contains", auth.currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const conversasData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setConversas(conversasData);
    });

    return () => unsubscribe();
  }, []);

  const iniciarChat = async (usuarioId) => {
    try {
      const q = query(
        collection(db, "conversas"),
        where("usuarios", "array-contains", auth.currentUser.uid)
      );
      const snapshot = await getDocs(q);

      let conversaExistente = null;

      snapshot.forEach((doc) => {
        const usuarios = doc.data().usuarios;
        if (usuarios.includes(usuarioId) && usuarios.length === 2) {
          conversaExistente = doc;
        }
      });

      let conversaId;
      if (conversaExistente) {
        conversaId = conversaExistente.id;
      } else {
        const novaConversa = await addDoc(collection(db, "conversas"), {
          usuarios: [auth.currentUser.uid, usuarioId],
          createdAt: new Date(),
        });
        conversaId = novaConversa.id;
      }

      setConversaAtiva(conversaId);
      setNovoUsuarioId(usuarioId);
      fetchMensagens(conversaId);
    } catch (error) {
      console.error("Erro ao iniciar conversa:", error);
    }
  };

  const fetchMensagens = (conversaId) => {
    const q = query(
      collection(db, `conversas/${conversaId}/mensagens`),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const mensagensData = querySnapshot.docs.map((doc) => doc.data());
      setMensagens(mensagensData);
    });

    return unsubscribe;
  };

  const enviarMensagem = async () => {
    if (novaMensagem.trim()) {
      try {
        await addDoc(collection(db, `conversas/${conversaAtiva}/mensagens`), {
          texto: novaMensagem,
          sender: auth.currentUser.uid,
          createdAt: new Date(),
        });

        setNovaMensagem("");
      } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
      }
    }
  };

  const renderItem = ({ item }) => {
    const usuarioConversando = usuarios.find((user) => user.id === item.sender);
    const nomeUsuario = usuarioConversando ? usuarioConversando.nome : "Desconhecido";

    return (
      <View style={item.sender === auth.currentUser.uid ? styles.mensagemEu : styles.mensagemOutro}>
        <Text style={styles.mensagemTexto}>
          {item.sender === auth.currentUser.uid ? "Você: " : `${nomeUsuario}: `}{item.texto}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {conversaAtiva ? (
        <View style={styles.chatBox}>
          <TouchableOpacity style={styles.botaoVoltar} onPress={() => setConversaAtiva(null)}>
            <Text style={styles.botaoTexto}>Voltar</Text>
          </TouchableOpacity>

          <Text style={styles.chatHeader}>
            Conversando com {
              usuarios.find((user) => user.id === novoUsuarioId)?.nome || "Usuário"
            }
          </Text>

          <FlatList
            data={mensagens}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
            inverted
          />

          <TextInput
            style={styles.inputMensagem}
            value={novaMensagem}
            onChangeText={setNovaMensagem}
            placeholder="Digite sua mensagem"
            placeholderTextColor="#888"
          />

          <TouchableOpacity style={styles.botaoEnviar} onPress={enviarMensagem}>
            <Text style={styles.botaoTexto}>Enviar Mensagem</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.listaUsuarios}>
          {!mostrarListaUsuarios && conversas.length > 0 && (
            <View style={styles.conversasBox}>
              <Text style={styles.tituloConversas}>Conversas Ativas:</Text>
              {conversas.map((conversa) => {
                const outroUsuario = conversa.usuarios.find((user) => user !== auth.currentUser.uid);
                const usuario = usuarios.find((user) => user.id === outroUsuario);
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
            <TouchableOpacity style={styles.botaoNovaConversa} onPress={() => setMostrarListaUsuarios(true)}>
              <Text style={styles.botaoTexto}>Começar Nova Conversa</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flex: 1 }}>
              <TouchableOpacity style={styles.botaoVoltar} onPress={() => setMostrarListaUsuarios(false)}>
                <Text style={styles.botaoTexto}>Voltar</Text>
              </TouchableOpacity>

              <ScrollView style={styles.scrollContainer}>
                <Text style={styles.tituloUsuarios}>Escolha com quem quer conversar</Text>
                {usuarios
                  .filter((usuario) => usuario.id !== auth.currentUser.uid)
                  .map((usuario) => (
                    <TouchableOpacity
                      key={usuario.id}
                      style={styles.usuarioBox}
                      onPress={() => iniciarChat(usuario.id)}
                    >
                      <Text style={styles.usuarioNome}>{usuario.nome}</Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>

            </View>
          )}
        </View>
      )}
    </View>
  );
}

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
    color: "#fff",
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
    fontWeight: "bold",
  },
  botaoNovaConversa: {
    backgroundColor: "#DAA520",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  botaoVoltar: {
    backgroundColor: "#DAA520",
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
    backgroundColor: "gray",
    alignSelf: "flex-end",
    padding: 10,
    borderRadius: 8,
    marginBottom: 5,
  },
  mensagemOutro: {
    backgroundColor: "gray",
    alignSelf: "flex-start",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  scrollContainer: {
    maxHeight: 400,
  },
});
