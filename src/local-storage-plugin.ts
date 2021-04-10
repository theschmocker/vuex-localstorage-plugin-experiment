import { Store } from 'vuex';

export function createLocalStoragePlugin<S>(stateMap: LocalStoreStateMap<S>, options?: LocalStoragePluginOptions) {
  const storage = options?.storageImplementation ?? window.localStorage;

  return (store: Store<S>) => {
    // Populate store with existing values in storage
    for (const key of Object.keys(stateMap) as (keyof typeof stateMap)[]) {
      const field = stateMap[key];

      if (field == null) { // appease TypeScript
        continue;
      }

      const serialized = storage.getItem(key);
      if (serialized != null) {
        if (typeof field === 'object' && 'deserialize' in field) {
          store.state[key] = field.deserialize(serialized);
        } else {
          store.state[key] = JSON.parse(serialized) as unknown as S[keyof S]
        }
      }
    }

    for (const key of Object.keys(stateMap) as (keyof typeof stateMap)[]) {
      const field = stateMap[key];
      if (field == null) { // appease TypeScript
        continue;
      }

      store.watch(state => state[key], value => {
        if (typeof field === 'object' && 'serialize' in field) {
          storage.setItem(key, field.serialize(store.state))
        } else {
          storage.setItem(key, JSON.stringify(value))
        } 
      }, {
        deep: typeof store.state[key] === 'object',

        // ensures that state changes are persisted synchronously after they're mutated
        flush: 'sync', 
      });
    }
  }
}

interface LocalStoragePluginOptions {
  storageImplementation?: Storage;
}

type LocalStoreStateMap<S> = {
  [FieldName in keyof S]?: FieldDefinition<S, FieldName>;
}

type FieldDefinition<S, FieldName extends keyof S> = true | FieldWithCustomSerialization<S, FieldName>;

type Deserializer<S, K extends keyof S> = (serialized: string) => S[K];
type Serializer<S> = (state: S) => string;

interface FieldWithCustomSerialization<S, K extends keyof S> {
  serialize: Serializer<S>
  deserialize: Deserializer<S, K>
}
