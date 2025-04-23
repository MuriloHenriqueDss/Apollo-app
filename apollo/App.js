import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Suas telas
import Login from './src/screens/Login';
import Cadastro from './src/screens/Cadastro';
import Home from './src/screens/Home';
import Notificacao from './src/screens/Notificacao';
import Direct from './src/screens/Direct';
import Perfil from './src/screens/Perfil';
import bemVindo from './src/screens/bemVindo';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false, 
      }}
    >
      <Tab.Screen name="Inicio" component={Home} />
      <Tab.Screen name="Perfil" component={Perfil} />
      <Tab.Screen name="Notificações" component={Notificacao} />
      <Tab.Screen name="Direct" component={Direct} />
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
