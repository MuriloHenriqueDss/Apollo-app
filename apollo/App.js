//João Gustavo e Murilo Henrique

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Feather from 'react-native-vector-icons/Feather';

// Suas telas
import Login from './src/screens/Login';
import Cadastro from './src/screens/Cadastro';
import Home from './src/screens/Home';
import Notificacao from './src/screens/Notificacao';
import Direct from './src/screens/Direct';
import Perfil from './src/screens/Perfil';
import bemVindo from './src/screens/bemVindo';
import editarPerfil from './src/screens/editarPerfil';
import Logout from './src/screens/Logout'; // <-- nova importação

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();


function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopWidth: 0,
          height: 50,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarIcon: ({ focused }) => {
          let iconName;

          switch (route.name) {
            case 'Inicio':
              iconName = 'home';
              break;
            case 'Perfil':
              iconName = 'user';
              break;
            case 'Notificações':
              iconName = 'bell';
              break;
            case 'Direct':
              iconName = 'send';
              break;
            case 'Sair':
              iconName = 'log-out';
              break;
          }

          return (
            <Feather
              name={iconName}
              size={25}
              color={focused ? '#FFD700' : '#fff'}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Inicio" component={Home} />
      <Tab.Screen name="Perfil" component={Perfil} />
      <Tab.Screen name="Notificações" component={Notificacao} />
      <Tab.Screen name="Direct" component={Direct} />
      <Tab.Screen name="Sair" component={Logout} /> 
    </Tab.Navigator>
  );
}


export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="bemVindo" component={bemVindo} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Cadastro" component={Cadastro} />
        <Stack.Screen name="Home" component={BottomTabs} />
        <Stack.Screen name="editarPerfil" component={editarPerfil} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
