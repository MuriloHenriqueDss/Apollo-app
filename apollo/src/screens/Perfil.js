//João Gustavo e Murilo Henrique

import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getApp } from "firebase/app";
import { useFocusEffect } from "@react-navigation/native";

export default function Perfil({ navigation }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");

  useFocusEffect(
    React.useCallback(() => {
      const fetchUserData = async () => {
        try {
          const auth = getAuth(getApp());
          const db = getFirestore(getApp());
          const user = auth.currentUser;

          if (user) {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
              const data = docSnap.data();
              setNome(data.nome);
              setEmail(data.email);
              setBio(data.bio || "");
            }
          }
        } catch (error) {
          console.log("Erro ao buscar dados do usuário:", error);
        }
      };

      fetchUserData();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meu Perfil</Text>

      <View style={styles.infoBox}>
        <Text style={styles.nome}>{nome}</Text>

        <Text style={styles.label}>Email:</Text>
        <Text style={styles.text}>{email}</Text>

        <Text style={styles.label}>Bio:</Text>
        <Text style={styles.text}>{bio || "Não informada"}</Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("editarPerfil")}
      >
        <Text style={styles.buttonText}>Editar Perfil</Text>
      </TouchableOpacity>
    </View>
  );
}

// seus estilos permanecem os mesmos:
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
    justifyContent: "flex-start",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#DAA520",
    textAlign: "center",
    marginTop: 40,
    marginBottom: 30,
  },
  infoBox: {
    backgroundColor: "rgba(40, 40, 40, 0.95)", 
    padding: 24,
    borderRadius: 16,
    marginBottom: 40,
    elevation: 5,
  },
  nome: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#f0f0f0",
    textAlign: "center",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: "#aaa",
    marginTop: 12,
    marginBottom: 2,
  },
  text: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#DAA520",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 20,
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});

