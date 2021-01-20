import { createStore } from 'vuex';

import Axios from 'axios';

import { Entity } from '@/types';
import { GeoJSON } from 'geojson';

export default createStore({
  state: {
    mapEntities: [] as Array<Entity>,
    geoJson: {} as GeoJSON,

  },
  mutations: {
    entitiesFetched(state, entities) {
      state.mapEntities = entities;
      state.geoJson = {
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
