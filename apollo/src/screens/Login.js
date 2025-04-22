import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, Button, View } from 'react-native';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import app from '../../firebaseConfig'; // Ajuste o caminho se necessário

const RealizarLogin = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const tentarLogar = () => {
    const auth = getAuth(app);
    signInWithEmailAndPassword(auth, email, senha)
      .then(() => {
        navigation.replace("Home"); // Use 'replace' para não voltar pro login
      })
      .catch((error) => {
        console.error("Erro ao realizar login:", error);
        alert("Falha no login. Verifique seu e-mail e senha.");
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
      />
      <Button title="Entrar" onPress={tentarLogar} />
      <Text
        style={styles.registerText}
        onPress={() => navigation.navigate('Cadastro')}
      >
        Não tem uma conta? Cadastre-se
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 20,
    paddingLeft: 10,
    borderRadius: 5,
  },
  registerText: {
    marginTop: 20,
    textAlign: 'center',
    color: '#007bff',
  },
});

export default RealizarLogin;
