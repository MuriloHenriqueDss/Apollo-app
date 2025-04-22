import React, { useState } from "react";
import {
  View,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { getAuth, createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getApp } from "firebase/app";

export default function Cadastrar({ navigation }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const registerUser = async (email, password, nome) => {
    const auth = getAuth(getApp());
    const firestore = getFirestore(getApp());

    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length > 0) {
        alert("Erro", "Este e-mail já está em uso. Tente fazer login ou use outro e-mail.");
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(firestore, "users", user.uid), {
        uid: user.uid,
        nome,
        email,
      });

      alert("Usuário cadastrado com sucesso! Você será redirecionado para o Login");
      navigation.navigate("realizarLogin");
    } catch (error) {
      alert("Erro", error.message);
    }
  };

  const verificar = async () => {
    if (email && password && nome) {
      await registerUser(email, password, nome);
    } else {
      alert("Atenção, preencha todos os campos");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.titulo}>Cadastro</Text>

          <TextInput
            placeholder="Nome"
            value={nome}
            onChangeText={setNome}
            style={styles.input}
            placeholderTextColor="#aaa"
          />
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            style={styles.input}
            placeholderTextColor="#aaa"
          />
          <TextInput
            placeholder="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            placeholderTextColor="#aaa"
          />

          <TouchableOpacity style={styles.botaoCadastrar} onPress={verificar}>
            <Text style={styles.textoBotao}>Cadastrar</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.botaoVoltar}
          onPress={() => navigation.navigate("realizarLogin")}
        >
          <Text style={styles.textoBotaoVoltar}>Voltar pro Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#00529F",
    padding: 24,
  },
  titulo: {
    fontSize: 30,
    color: "#00529F",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    marginBottom: 20,
  },
  input: {
    width: "100%",
    height: 45,
    borderColor: "#FEBE10",
    borderWidth: 2,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#F8F9FA",
  },
  botaoCadastrar: {
    backgroundColor: "#FDB913",
    padding: 14,
    borderRadius: 50,
    alignItems: "center",
    marginTop: 5,
  },
  textoBotao: {
    color: "#00529F",
    fontWeight: "bold",
    fontSize: 16,
  },
  botaoVoltar: {
    marginTop: 12,
    alignItems: "center",
  },
  textoBotaoVoltar: {
    color: "#FDB913",
    fontWeight: "600",
    fontSize: 15,
  },
});