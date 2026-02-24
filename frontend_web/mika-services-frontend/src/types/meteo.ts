export interface ConditionTravail {
  favorable: boolean
  message: string
  alertes: string[]
}

export interface Meteo {
  ville: string
  temperature: number
  temperatureRessentie: number
  humidite: number
  description: string
  icone: string
  vitesseVent: number
  directionVent: number
  pression: number
  visibilite: number
  nuages: number
  conditionTravail: ConditionTravail
}

export interface PrevisionJour {
  date: string
  temperatureMin: number
  temperatureMax: number
  description: string
  icone: string
  probPluie: number
  vitesseVent: number
}

export interface Previsions {
  ville: string
  previsions: PrevisionJour[]
}
