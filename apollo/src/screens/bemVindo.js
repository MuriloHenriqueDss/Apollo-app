import React from "react";
import { StyleSheet, Text, View, Image, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as Animatable from "react-native-animatable";

export default function BemVindo() {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <View style={styles.imageContainer}>
                <Animatable.Image 
                animation="flipInX"
                    source={require("../../assets/img/logo-sem-fundo.png")} 
                    style={styles.image} 
                    resizeMode="contain" 
                />
            </View>

            <Animatable.View style={styles.containerForm} animation={"fadeInUp"} delay={500}>
                <Text style={styles.title}>Bem-vindo ao Apollo!</Text>
                <Text style={styles.text}>A melhor rede social que você ja utilizou!  </Text>

                <TouchableOpacity 
                    style={styles.button} 
                    onPress={() => navigation.navigate("Login")}
                >
                    <Text style={styles.buttonText}>Acessar</Text>
                </TouchableOpacity>
            </Animatable.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "black",
    },
    imageContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 60,
    },
    image: {
        width: 300,
        height: 300,
        marginRight: 15,
    },
    containerForm: {
        flex: 0.5,
        backgroundColor: "#DAA520",
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        paddingHorizontal: "5%",
        paddingTop: 30,
        alignItems: "center",
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 10,
        color: "black",
    },
    text: {
        color: "black",
        fontSize: 16,
    },
    button: {
        backgroundColor: "black",
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 32,
        alignItems: "center",
        marginTop: 30,
    },
    buttonText: {
        color: "white",
        fontSize: 18,
        fontWeight: "bold",
    },
});
