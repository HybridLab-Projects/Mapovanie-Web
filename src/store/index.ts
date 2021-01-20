import { createStore } from 'vuex';

import Axios from 'axios';

interface Entity {
  lon: string;
  lat: string;
}

export default createStore({
  state: {
    mapEntities: [],
    geoJson: {},
  },
  mutations: {
    entitiesFetched(state, entities) {
      state.mapEntities = entities;
      const parsedGeoJson = {
        type: 'FeatureCollection',
        features: entities.map((entity: Entity) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [entity.lon, entity.lat],
          },
          properties: entity,
        })),
      };
      state.geoJson = parsedGeoJson;
    },
  },
  actions: {
    async fetchEntities({ commit }) {
      try {
        const { data } = await Axios.get(
          'https://mapovanie.hybridlab.dev/cms/api/entities',
        );
        console.log(data.data);
        commit('entitiesFetched', data.data);
      } catch (err) {
        console.log(err);
      }
    },
  },
  modules: {},
});
