import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import * as Animatable from 'react-native-animatable';
import app from '../../firebaseConfig';

const RealizarLogin = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const tentarLogar = () => {
    const auth = getAuth(app);
    signInWithEmailAndPassword(auth, email, senha)
      .then(() => {
        navigation.replace("Home");
      })
      .catch((error) => {
        console.error("Erro ao realizar login:", error);
        alert("Falha no login. Verifique seu e-mail e senha.");
      });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <Animatable.View animation="fadeInLeft" delay={300} style={styles.header}>
        <Text style={styles.headerText}>Bem-vindo(a)</Text>
      </Animatable.View>

      <Animatable.View animation="fadeInUp" style={styles.formContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite um email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={styles.input}
          placeholder="Sua senha"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
          placeholderTextColor="#999"
        />

        <TouchableOpacity style={styles.button} onPress={tentarLogar}>
          <Text style={styles.buttonText}>Acessar</Text>
        </TouchableOpacity>

        <Text
          style={styles.registerText}
          onPress={() => navigation.navigate('Cadastro')}
        >
          Não possui uma conta? <Text style={styles.bold}>Cadastre-se</Text>
        </Text>
        
      </Animatable.View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', 
  },
  header: {
    marginTop: 60,
    marginBottom: 20,
    marginLeft: 20,
  },
  headerText: {
    fontSize: 26,
    color: '#DAA520', 
    fontWeight: 'bold',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    paddingTop: 30,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#000',
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#DAA520',
    marginBottom: 20,
    paddingVertical: 6,
    fontSize: 16,
    color: '#000',
  },
  button: {
    backgroundColor: '#DAA520',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 4,
    marginTop: 10,
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  registerText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#555',
  },
  bold: {
    fontWeight: 'bold',
    color: '#DAA520',
  },
});

export default RealizarLogin;
