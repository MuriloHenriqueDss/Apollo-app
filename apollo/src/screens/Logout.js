//João Gustavo e Murilo Henrique

import React from 'react';
import { View, Text, ActivityIndicator, Alert, Platform } from 'react-native';
import { getAuth, signOut } from 'firebase/auth';
import { useFocusEffect } from '@react-navigation/native';

export default function Logout({ navigation }) {
  useFocusEffect(
    React.useCallback(() => {
      const auth = getAuth();

      if (Platform.OS === 'web') {
        const confirmation = window.confirm("Tem certeza que deseja sair?");
        if (confirmation) {
          signOut(auth)
            .then(() => {
              navigation.replace("Login");
            })
            .catch((error) => {
              console.error(error);
              alert("Erro ao sair: " + error.message);
            });
        } else {
          navigation.goBack();
        }
      } else {
        // Para o mobile (Expo Go), continua com o Alert
        Alert.alert(
          "Sair da conta",
          "Tem certeza que deseja sair?",
          [
            {
              text: "Cancelar",
              onPress: () => navigation.goBack(),
              style: "cancel",
            },
            {
              text: "Sair",
              onPress: () => {
                signOut(auth)
                  .then(() => {
                    navigation.replace("Login");
                  })
                  .catch((error) => {
                    console.error(error);
                    Alert.alert("Erro ao sair", error.message);
                  });
              },
              style: "destructive",
            },
          ],
          { cancelable: false }
        );
      }
    }, [])
  );

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
      <ActivityIndicator size="large" color="#DDD" />
      <Text style={{ marginTop: 10, color: '#fff' }}>Aguardando confirmação...</Text>
    </View>
  );
}
