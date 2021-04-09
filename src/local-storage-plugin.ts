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
      if (typeof field === 'boolean') {
        if (serialized != null) {
          store.state[key] = JSON.parse(serialized) as unknown as S[keyof S]
        }
      } else {
        const serialized = storage.getItem(key);
        if (serialized != null) {
          store.state[key] = field.deserialize(serialized);
        }
      }
    }

    store.subscribe((mutation, state) => {
      for (const key of Object.keys(stateMap) as (keyof typeof stateMap)[]) {
        // Assuming for now that the mutation name matches the state field name
        if (mutation.type === key) {
          const field = stateMap[key];

          if (field == null) { // appease TypeScript
            continue;
          }

          if (typeof field === 'boolean') {
            storage.setItem(key, JSON.stringify(state[key]))
          } else {
            storage.setItem(key, field.serialize(state))
          }
        }
      }
    });
  }
}

interface LocalStoragePluginOptions {
  storageImplementation?: Storage;
}

type LocalStoreStateMap<S> = {
  [FieldName in keyof S]?: boolean | Field<S, FieldName>
}

type Deserializer<S, K extends keyof S> = (serialized: string) => S[K];
type Serializer<S> = (state: S) => string;

interface Field<S, K extends keyof S> {
  serialize: Serializer<S>
  deserialize: Deserializer<S, K>
}
