import { Store } from 'vuex';

interface LocalStoragePluginOptions {
  storageImplementation?: Storage;
}

type LocalStoreStateMap<S> = {
  [FieldName in keyof S]?: FieldDefinition<S, FieldName>;
}

type FieldDefinition<S, FieldName extends keyof S> = true | FieldWithCustomSerialization<S, FieldName>;

interface FieldWithCustomSerialization<S, K extends keyof S> {
  serialize: (state: S) => string;
  deserialize: (serialized: string) => S[K];
}

export function createLocalStoragePlugin<S>(stateMap: LocalStoreStateMap<S>, options?: LocalStoragePluginOptions) {
  const storage = options?.storageImplementation ?? window.localStorage;

  return (store: Store<S>) => {
    forEachMappedField(stateMap, (key, field) => {
      // Populate store with existing value from storage
      const serialized = storage.getItem(key);
      if (serialized != null) {
        if (fieldHasCustomSerialization(field)) {
          store.state[key] = field.deserialize(serialized);
        } else {
          store.state[key] = JSON.parse(serialized) as unknown as S[keyof S]
        }
      }

      // Persist field change to storage
      store.watch(state => state[key], value => {
        if (fieldHasCustomSerialization(field)) {
          storage.setItem(key, field.serialize(store.state))
        } else {
          storage.setItem(key, JSON.stringify(value))
        } 
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
      if (field == null) { // appease TypeScript
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
