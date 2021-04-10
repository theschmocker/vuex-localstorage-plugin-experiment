import { Store } from 'vuex';

type LocalStoreStateMap<S> = {
  [FieldName in keyof S]?: FieldDefinition<S, FieldName>;
}

interface LocalStoragePluginOptions {
  /**
   * Optional custom Storage implementation. Defaults to window.localStorage
   */
  storageImplementation?: Storage;

  /**
   * Storage key prefix. Can be used to prevent stored state field names from colliding
   * with other values in Storage
   */
  keyPrefix?: string;
}

type FieldDefinition<S, FieldName extends keyof S> = true | FieldWithCustomSerialization<S, FieldName>;

type Serializer<T> = (value: T) => string;
type Deserializer<S, K extends keyof S> = (serialized: string) => S[K];

interface FieldWithCustomSerialization<S, K extends keyof S> {
  /**
   * Custom function to serialize data for Storage. Defaults to JSON.stringify.
   */
  serialize: Serializer<S[K]>

  /**
   * Custom function to deserialize data from Storage. Defaults to JSON.parse.
   */
  deserialize: Deserializer<S, K>
}

export function createLocalStoragePlugin<S>(stateMap: LocalStoreStateMap<S>, options?: LocalStoragePluginOptions) {
  const storage = options?.storageImplementation ?? window.localStorage;

  return (store: Store<S>) => {
    forEachMappedField(stateMap, (key, field) => {
      const storageKey = (options?.keyPrefix ?? '') + key;
      
      // Populate store with existing value from storage
      const serializedValue = storage.getItem(storageKey);
      if (serializedValue != null) {
        const value = fieldHasCustomSerialization(field)
          ? field.deserialize(serializedValue)
          : (JSON.parse as Deserializer<S, typeof key>)(serializedValue);

        store.state[key] = value;
      }

      // Persist field change to storage
      store.watch(state => state[key], value => {
        const serializedValue = fieldHasCustomSerialization(field)
          ? field.serialize(value)
          : JSON.stringify(value);

        storage.setItem(storageKey, serializedValue);
      }, {
        // ensures that state changes are persisted synchronously after they're mutated
        flush: 'sync', 
        deep: typeof store.state[key] === 'object',
      });
    });
  }
}

/**
 * Calls `visit` for each non-null field definition in `stateMap`
 */
function forEachMappedField<S>(
  stateMap: LocalStoreStateMap<S>,
  visit: (key: keyof S, field: LocalStoreStateMap<S>[keyof S]) => void
) {
    for (const key of Object.keys(stateMap) as (keyof typeof stateMap)[]) {
      const field = stateMap[key];
      if (field == null) {
        continue;
      }

      visit(key, field);
    }
}

/**
 * Type guard for FieldWithCustomSerialization
 */
function fieldHasCustomSerialization<S>(field: LocalStoreStateMap<S>[keyof S]): field is FieldWithCustomSerialization<S, keyof S> {
  return field != null && typeof field === 'object' && 'serialize' in field;
}
