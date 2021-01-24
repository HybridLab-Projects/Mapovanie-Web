<template>
  <!-- <div class="bg-green-600 rounded-3xl mx-8 h-32 p-5 h-1/">
  <h1 class="text-center text-white text-3xl">Tailwind test</h1>
  <h2 class="text-center text-gray-200 text-xl font-bold mt-2">Subtitle</h2> -->
  <div
    id="mapContainer"
    class="h-screen w-screen"
  >
    <transition name="fade">
      <div
        v-if="Object.keys(selected).length"
        id="info"
        class="h-auto w-96 p-6 bg-white absolute z-50 top-5 left-5 rounded-3xl shadow-2xl"
      >
        <h1
          v-if="selected.type === 'tree'"
          class="text-2xl pb-5"
        >
          {{ treeTypes[selected.sub_type] }} strom
        </h1>
        <h1
          v-else-if="selected.type === 'bench'"
          class="text-2xl pb-5"
        >
          Lavička
        </h1>
        <img
          :src="
            JSON.parse(selected.images)[0]
              ? JSON.parse(selected.images)[0].url
              : ''
          "
          alt="image"
        >
        <p class="text-sm text-gray-500 pt-5">
          {{ selected.type === 'strom' ? 'Strom bol pridaný ' : 'Lavička bola pridaná ' }}
          <span class="font-semibold">{{ getParsedTime(selected.date) }}</span>
        </p>
      </div>
    </transition>
  </div>
  <!-- </div> -->
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import Moment from 'moment';
import MapBox from '@/plugins/mapbox';
import { GeoJSONSource, NavigationControl } from 'mapbox-gl';

export default defineComponent({
  name: 'Home',

  data() {
    return {
      selected: {},
      treeTypes: {
        leaf: 'Listnatý',
        fir: 'Ihličnatý',
      },
    };
  },
  computed: {
    geoJson() {
      return this.$store.state.geoJson;
    },
  },
  mounted() {
    const map = new MapBox.Map({
      container: 'mapContainer',
      style: 'mapbox://styles/jakubkoje/ckiogg5tc4r8g17s7mgiu80ta',
      center: [17.117229, 48.138243],
      zoom: 9,
    });
    const navigation = new NavigationControl();
    map.addControl(navigation, 'top-right');
    map.on('load', () => {
      map.addSource('entities', {
        type: 'geojson',
        data: this.geoJson,
        cluster: true,
        clusterMaxZoom: 100, // Max zoom to cluster points on
        clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
      });

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'entities',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#CCCCCC',
          'circle-radius': 25,
        },
      });

      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'entities',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
      });

      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'entities',
        filter: ['!=', 'cluster', true],
        paint: {
          'circle-color': [
            'case',
            // 1
            ['==', ['get', 'sub_type'], 'leaf'],
            '#66E480',
            // 2
            ['==', ['get', 'sub_type'], 'fir'],
            '#4CB962',
            // 3
            ['==', ['get', 'type'], 'bench'],
            '#3FA190',
            // default
            '#66E480',
          ],
          'circle-radius': 15,
          'circle-stroke-width': 7.5,
          'circle-stroke-color': [
            'case',
            // 1
            ['==', ['get', 'sub_type'], 'leaf'],
            'rgba(102, 228, 128, 0.5)',
            // 2
            ['==', ['get', 'sub_type'], 'fir'],
            'rgba(76, 185, 98, 0.5)',
            // 3
            ['==', ['get', 'type'], 'bench'],
            'rgba(63, 161, 144, 0.5)',
            // default
            'rgba(102, 228, 128, 0.5)',
          ],
          // 'rgba(102, 228, 128, 0.5)',
        },
      });
      map.loadImage('/icon/leaf-tree.png', (err: Error, image: ImageBitmap) => {
        if (err) throw err;
        map.addImage('leaf', image);
      });
      map.loadImage('/icon/fir-tree.png', (err: Error, image: ImageBitmap) => {
        if (err) throw err;
        map.addImage('fir', image);
      });
      map.loadImage('/icon/bench.png', (err: Error, image: ImageBitmap) => {
        if (err) throw err;
        map.addImage('bench', image);
      });

      map.addLayer({
        id: 'point-icon',
        type: 'symbol',
        source: 'entities',
        filter: ['!=', 'cluster', true],
        layout: {
          'icon-image': [
            'case',
            // 1
            ['==', ['get', 'sub_type'], 'leaf'],
            'leaf',
            // 2
            ['==', ['get', 'sub_type'], 'fir'],
            'fir',
            // 3
            ['==', ['get', 'type'], 'bench'],
            'bench',
            // default
            'leaf',
          ],

          'icon-size': 0.35,
        },
      });

      map.on('click', 'clusters', (e) => {
        console.log('clustered');
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['clusters'],
        });
        if (features[0].properties) {
          const clusterId = features[0].properties.cluster_id;
          const test = map.getSource('entities') as GeoJSONSource;
          test.getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) return;
            map.easeTo({
              // @ts-expect-error
              center: features[0].geometry.coordinates,
              zoom,
            });
          });
        }
      });
      map.on('click', 'unclustered-point', (e) => {
        console.log('unclustered', e);
        if (e.features) this.selected = e.features[0].properties as object;
      });
      map.on('click', (e) => {
        if (
          map
            .queryRenderedFeatures(e.point)
            .filter((feature) => feature.source === 'entities').length === 0
        ) {
          console.log('Basemap click');
          this.selected = {};
        }
      });
      map.on('mouseenter', 'clusters', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'clusters', () => {
        map.getCanvas().style.cursor = '';
      });
      map.on('mouseenter', 'unclustered-point', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'unclustered-point', () => {
        map.getCanvas().style.cursor = '';
      });
    });
  },
  methods: {
    getParsedTime(time: string) {
      Moment.updateLocale('sk', {
        months: [
          'januára',
          'februára',
          'marca',
          'apríla',
          'mája',
          'júna',
          'júla',
          'augusta',
          'septembra',
          'októbra',
          'novembra',
          'decembra',
        ],
      });
      return Moment(time).format('D. MMMM YYYY');
    },
  },
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.1s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
