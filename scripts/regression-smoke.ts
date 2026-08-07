import { createSafeStorage } from '../src/shared/model'
import { isSavedItemList } from '../src/entities/saved-item'
import { isTravelerProfile } from '../src/entities/traveler-profile'

class MemoryStorage {
  private values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
}

const memory = new MemoryStorage()
const storage = createSafeStorage({ key: 'regression', version: 1 }, memory)
memory.setItem('mbn-guide.front.v1.regression', JSON.stringify({ version: 1, value: { locale: 'xx' } }))
const invalidProfile = storage.getValidated(isTravelerProfile)
if (invalidProfile.ok || invalidProfile.reason !== 'INVALID_VALUE' || memory.getItem('mbn-guide.front.v1.regression') !== null) throw new Error('Invalid profile storage was not safely recovered')
memory.setItem('mbn-guide.front.v1.regression', JSON.stringify({ version: 1, value: [{ id: 'bad', targetType: 'article', targetId: 'x', savedAt: 'now', collection: 'default' }] }))
const invalidSaved = storage.getValidated(isSavedItemList)
if (invalidSaved.ok || invalidSaved.reason !== 'INVALID_VALUE') throw new Error('Invalid saved-item storage was not rejected')
if (!isTravelerProfile({ locale: 'ko', visitorMode: 'foreigner', interests: ['music'], persistenceStatus: 'local' })) throw new Error('Valid profile rejected')
if (!isSavedItemList([{ id: 'saved:story:s1', targetType: 'story', targetId: 's1', savedAt: '2026-08-07T00:00:00.000Z', collection: 'default' }])) throw new Error('Valid Story saved reference rejected')
console.log('Regression smoke passed: persisted schema validation and Story reference saving.')
