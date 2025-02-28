import {Pressable, Text} from "react-native";
import {MaterialIcons} from "@expo/vector-icons";
import React from "react";
import {ITextIconButtonProps} from "../utils/interfaces";

export default function TextIconButton({stylePressable, styleText, onPress, iconName, color, iconSize, title}: ITextIconButtonProps){
    return (
       <Pressable style={stylePressable} onPress={onPress}>
           {/*@ts-ignore*/}
           <MaterialIcons name={iconName} color={color} size={iconSize}></MaterialIcons>
           <Text style={styleText}>{title}</Text>
       </Pressable>
   )
}