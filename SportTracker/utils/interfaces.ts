import {TextStyle, ViewStyle} from "react-native";
import {GlyphMap} from "@expo/vector-icons/build/createIconSet";

export interface IKraftsportDatabaseResult {
    date: string,
    exercise: string,
    muscle_group: string,
    repetitions: number,
    training_id: number,
    weight: number
}

export interface IKraftsportData {
    training_id: number,
    datum: string,
    gruppe: string,
    uebungen: IUebung[]
}

export interface IUebung {
    id: number,
    name: string,
    saetze: ISatz[]
}

export interface ISatz {
    id: number,
    gewicht: number,
    wiederholungen: number
}

export interface IMuscleGroupDatabaseResult {
    id: number,
    name: string
}


export interface ITextIconButtonProps {
    stylePressable?: ViewStyle,
    styleText?: TextStyle,
    onPress: () => void,
    iconName: string,
    color?: string,
    iconSize?: number,
    title: string,
}

export interface IKraftsportUebungListItemProps {
    uebung: IUebung,
    updateSatz: (uebungId: number, satzId: number, wdh: string, text:string) => void,
    deleteSatz: (uebungId: number, satzId: number) => void,
    updateUebungName: (uebungId: number, name: string) => void,
    addSatz: (uebungId: number) => void,
    deleteUebung: (uebungId: number) => void,
}

export interface ISatzListItemProps {
    satz: ISatz;
    uebungId: number,
    updateSatz: (uebungId: number, satzId: number, wdh: string, text:string) => void,
    deleteSatz: (uebungId: number, satzId: number) => void,
}

export interface IIconButtonProps {
    onPress: ()=>void,
    icon: string,
    style?: ViewStyle,
    color: string,
    size: number
}

export interface ITrainingDatabase {
    name: string,
    sets: number,
    weight: number,
}

export interface IKraftsportListItemProps {
    item: IKraftsportData;
    onDelete: (trainingId: string)=>void,
}

export interface IBigButtonProps {
    onPress: ()=> void,
    title: string,
    style: ViewStyle,
}

export interface ITrainigstypDatabaseResult {
    id: number,
    name: string
}

export interface IAusdauertrainingseinheitDatabaseResult {
    datum: number,
    dauer_minuten: number,
    id: number,
    strecke_km: number,
    trainingstyp_id: number
}

export interface IAusdauerData {
    datum: string,
    datum_as_timestamp: number
    dauer: number,
    id: number,
    name: string,
    strecke: number
}

export interface IAusdauersportListItemProps {
    item: IAusdauerData,
    onDelete: (id: number)=> void,
}

export interface ITrainingstypDropdown {
    label: string,
    value: string,
}

export interface IAusdauerLineChartProps {
    screenwidth: number,
    items: IAusdauerData[],
    text: string,
    dataKey: keyof IAusdauerData
}

export interface IAusdauerScatterPlotProps{
    screenwidth: number,
    items: IAusdauerData[]
}

export interface IAusdauerStatistikListItemProps {
    item: IAusdauerData[]
}