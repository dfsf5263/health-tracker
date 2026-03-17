import { Migraine } from '@prisma/client'

// Shared type definition for Migraine with all its relationships
// This ensures consistency between components that work with migraine data
export interface MigraineWithRelationships extends Migraine {
  migraineMigraineAttackTypes: Array<{
    migraineAttackType: { id: string; name: string }
  }>
  migraineMigraineSymptomTypes: Array<{
    migraineSymptomType: { id: string; name: string }
  }>
  migraineMigraineTriggerTypes: Array<{
    migraineTriggerType: { id: string; name: string }
  }>
  migraineMigrainePrecognitionTypes: Array<{
    migrainePrecognitionType: { id: string; name: string }
  }>
  migraineMigraineMedicationTypes: Array<{
    migraineMedicationType: { id: string; name: string }
    dosageModifier: number
  }>
  migraineMigraineReliefTypes: Array<{
    migraineReliefType: { id: string; name: string }
  }>
  migraineMigraineActivityTypes: Array<{
    migraineActivityType: { id: string; name: string }
  }>
  migraineMigraineLocationTypes: Array<{
    migraineLocationType: { id: string; name: string }
  }>
}
