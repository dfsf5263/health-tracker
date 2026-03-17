// Type definitions extracted from TYPES.md for prepopulating user type models

export interface BirthControlTypeDefinition {
  name: string
  vaginalRingInsertion: boolean
  vaginalRingRemoval: boolean
}

export const BIRTH_CONTROL_TYPES: BirthControlTypeDefinition[] = [
  { name: 'Put in Contraceptive Ring', vaginalRingInsertion: true, vaginalRingRemoval: false },
  { name: 'Took out Contraceptive Ring', vaginalRingInsertion: false, vaginalRingRemoval: true },
]

export const IRREGULAR_PHYSICAL_TYPES: string[] = [
  'Breast Tenderness',
  'Cramps',
  'Mood Swings',
  'Diarrhea',
  'Constipation',
  'Sleep Dysregulation',
]

export const NORMAL_PHYSICAL_TYPES: string[] = ['Sex', 'Exercise']

export const MIGRAINE_ATTACK_TYPES: string[] = [
  'Migraine',
  'Tension Type Headache',
  'Cluster Headache',
  'Postdrome',
  'Headache',
]

export const MIGRAINE_SYMPTOM_TYPES: string[] = [
  'Pounding Pain',
  'Pulsating Pain',
  'Throbbing Pain',
  'Worse Pain if Moving',
  'Nausea',
  'Vomiting',
  'Sensitivity to Light',
  'Sensitivity to Noise',
  'Neck Pain',
  'Giddiness',
  'Nasal Congestion',
  'Insomnia',
  'Depressed Mood',
  'Anxiety',
  'Sensitivity to Smell',
  'Heat',
  'Ringing in Ears',
  'Fatigue',
  'Blurred Vision',
  'Moody',
  'Diarrhea',
  'Confusion',
  'Lightheaded',
  'My Voice Hurts',
  'Dizzy',
  'Ear Pain',
]

export const MIGRAINE_TRIGGER_TYPES: string[] = [
  'Stress',
  'Lack of Sleep',
  'Interrupted Sleep',
  'Anxiety',
  'Missed Meal',
  'Variable Weather',
  'High Humidity',
  'Neck Pain',
  'Alcohol',
  'Sun Exposure/Dehydration',
  'Caffeine',
  'Allergy Reaction',
  'Odor/Strong Smell',
  'Rebound Headache',
  'Sinus',
  'Chocolate',
  'Skipped Magnesium',
]

export const MIGRAINE_PRECOGNITION_TYPES: string[] = [
  'None',
  'Weakness',
  'Fatigue/Achiness',
  'Visual Disturbance',
  'Tingling in Head',
  'Tingling in Neck',
  'Tingling near Eyes',
  'Frequent Yawning',
  'Muscle Stiffness',
  'Irritability',
  'Headache',
  'Aura',
  'Prodrome Only',
  'Unusually Energetic',
  'Unusually Depressed',
  'Confusion',
]

export const MIGRAINE_MEDICATION_TYPES: string[] = [
  'None',
  'Zomig 5mg',
  'Relpax 20mg',
  'Maxalt 5mg',
  'Paracetamol 500mg',
  'Topiramate 25mg',
  'Ibuprofen 200mg',
  'Sumatriptan 0.1ml',
  'Tylenol 200mg',
  'Flonase',
  'Zyrtec',
  'Decongestant',
  'Nurtec 75mg',
  'Naratriptan 2.5mg',
]

export const MIGRAINE_RELIEF_TYPES: string[] = [
  'Darkroom Rest',
  'Sleep',
  'Yoga/Meditate',
  'Stay Indoor',
  'Icepack',
  'Food',
  'Caffeine',
  'Hot Shower',
  'Cold Shower',
  'Drink Water',
  'Heatpad',
  'Weighted Eye Mask',
  'Medicine',
  'Massage',
]

export const MIGRAINE_ACTIVITY_TYPES: string[] = [
  'Not Affected',
  'Missed Work',
  'Slower at Work',
  'Missed Social Activity',
  'Slower at Home',
  'Missed Family Time',
  'Could Not Fall Asleep',
  'Woke Up During Sleep',
  'No Screen/Phone',
  'Hard to Concentrate',
]
