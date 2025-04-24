// João Gustavo e Murilo Henrique

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { launchImageLibrary } from "react-native-image-picker";
import { getApp } from "firebase/app";
import {
  getAuth,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  collection,
  getDocs,
  writeBatch,
} from "firebase/firestore";

// Imagem local como padrão
const imagemPadrao = require("../assets/img/0d64989794b1a4c9d89bff571d3d5842.jpg");

export default function EditarPerfil({ navigation }) {
  const [nome, setNome] = useState("");
  const [bio, setBio] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState(null);

  const auth = getAuth(getApp());
  const firestore = getFirestore(getApp());
  const user = auth.currentUser;

  useEffect(() => {
    const loadData = async () => {
      const userRef = doc(firestore, "users", user.uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setNome(data.nome || "");
        setBio(data.bio || "");
        if (data.foto) {
          setFotoPerfil({ uri: data.foto });
        } else {
          setFotoPerfil(imagemPadrao);
        }
      } else {
        setFotoPerfil(imagemPadrao);
      }
    };
    loadData();
  }, []);

  const selecionarImagem = () => {
    launchImageLibrary({ mediaType: 'photo' }, response => {
      if (!response.didCancel && !response.errorCode) {
        const imageUri = response.assets[0].uri;
        setFotoPerfil({ uri: imageUri });
      }
    });
  };

  const reautenticar = async () => {
    const credential = EmailAuthProvider.credential(user.email, senhaAtual);
    await reauthenticateWithCredential(user, credential);
  };

  const atualizarPostsComNovoNome = async (userId, novoNome) => {
    const q = query(collection(firestore, 'posts'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    const batch = writeBatch(firestore);
    querySnapshot.forEach(docSnap => {
      batch.update(doc(firestore, 'posts', docSnap.id), { userName: novoNome });
    });

    await batch.commit();
  };

  const salvarAlteracoes = async () => {
    try {
      if (novaSenha.length >= 6 && senhaAtual.length >= 6) {
        await reautenticar();
        await updatePassword(user, novaSenha);
      }

      const foto = fotoPerfil?.uri || null;

      await updateDoc(doc(firestore, "users", user.uid), {
        nome,
        bio,
        foto,
      });

      await atualizarPostsComNovoNome(user.uid, nome);

      Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={selecionarImagem}>
          <Image source={fotoPerfil || imagemPadrao} style={styles.avatar} />
        </TouchableOpacity>

        <Text style={styles.title}>Editar Perfil</Text>

        <TextInput
          style={styles.input}
          placeholder="Nome"
          placeholderTextColor="#666"
          value={nome}
          onChangeText={setNome}
        />

        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="Bio"
          placeholderTextColor="#666"
          value={bio}
          onChangeText={setBio}
          multiline
        />

        <TextInput
          style={styles.input}
          placeholder="Nova Senha (opcional)"
          placeholderTextColor="#666"
          value={novaSenha}
          onChangeText={setNovaSenha}
          secureTextEntry
        />

        {novaSenha.length > 0 && (
          <TextInput
            style={styles.input}
            placeholder="Senha Atual (obrigatória para alterar a senha)"
            placeholderTextColor="#666"
            value={senhaAtual}
            onChangeText={setSenhaAtual}
            secureTextEntry
          />
        )}

        <TouchableOpacity style={styles.button} onPress={salvarAlteracoes}>
          <Text style={styles.buttonText}>Salvar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Voltar</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: 30,
    paddingBottom: 40,
    alignItems: "center",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#DAA520",
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#DAA520",
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#1c1c1c",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    fontSize: 16,
    color: "#fff",
    width: "100%",
  },
  button: {
    backgroundColor: "#DAA520",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    width: "100%",
  },
  buttonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
});
