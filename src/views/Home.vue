<template>
	<!-- <div class="bg-green-600 rounded-3xl mx-8 h-32 p-5 h-1/">
		<h1 class="text-center text-white text-3xl">Tailwind test</h1>
		<h2 class="text-center text-gray-200 text-xl font-bold mt-2">Subtitle</h2> -->
	<div id="mapContainer" class="h-screen w-screen">
		<transition name="fade">
			<div
				v-if="Object.keys(selected).length"
				id="info"
				class="h-auto w-96 p-6 bg-white absolute z-50 top-5 left-5 rounded-3xl shadow-2xl"
			>
				<h1 class="text-2xl pb-5">{{ treeTypes[selected.sub_type] }} strom</h1>
				<img
					:src="
						JSON.parse(selected.images)[0]
							? JSON.parse(selected.images)[0].url
							: ''
					"
					alt="image"
				/>
				<p class="text-sm text-gray-500 pt-5">
					Strom bol pridaný
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
import { mapState } from 'vuex';

export default defineComponent({
	name: 'Home',
	computed: {
		...mapState(['geoJson']),
	},
	data() {
		return {
			selected: {},
			treeTypes: {
				leaf: 'Listnatý',
				fir: 'Ihličnatý',
			},
		};
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
			map.addSource('earthquakes', {
				type: 'geojson',
				// Point to GeoJSON data. This example visualizes all M1.0+ earthquakes
				// from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.
				data: this.geoJson,
				cluster: true,
				clusterMaxZoom: 100, // Max zoom to cluster points on
				clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
			});

			map.addLayer({
				id: 'clusters',
				type: 'circle',
				source: 'earthquakes',
				filter: ['has', 'point_count'],
				paint: {
					// Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
					// with three steps to implement three types of circles:
					//   * Blue, 20px circles when point count is less than 100
					//   * Yellow, 30px circles when point count is between 100 and 750
					//   * Pink, 40px circles when point count is greater than or equal to 750
					'circle-color': '#ffffff',
					'circle-radius': 25,
				},
			});

			map.addLayer({
				id: 'cluster-count',
				type: 'symbol',
				source: 'earthquakes',
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
				source: 'earthquakes',
				filter: ['!=', 'cluster', true],
				paint: {
					'circle-color': '#66E480',
					'circle-radius': 15,
					'circle-stroke-width': 7.5,
					'circle-stroke-color': 'rgba(102, 228, 128, 0.5)',
				},
			});
			//@ts-expect-error
			map.loadImage('/icon/leaf-tree.png', (err, image) => {
				if (err) throw err;
				map.addImage('leaf', image);
				map.addLayer({
					id: 'point-icon',
					type: 'symbol',
					source: 'earthquakes',
					filter: ['!=', 'cluster', true],
					layout: {
						'icon-image': 'leaf',
						'icon-size': 0.05,
					},
				});
			});

			map.on('click', 'clusters', function (e) {
				console.log('clustered');
				const features = map.queryRenderedFeatures(e.point, {
					layers: ['clusters'],
				});
				if (features[0].properties) {
					const clusterId = features[0].properties.cluster_id;
					const test = map.getSource('earthquakes') as GeoJSONSource;
					test.getClusterExpansionZoom(clusterId, function (err, zoom) {
						if (err) return;
						map.easeTo({
							// @ts-expect-error
							center: features[0].geometry.coordinates,
							zoom: zoom,
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
						.filter((feature) => feature.source === 'earthquakes').length === 0
				) {
					console.log('Basemap click');
					this.selected = {};
				}
			});
			map.on('mouseenter', 'clusters', function () {
				map.getCanvas().style.cursor = 'pointer';
			});
			map.on('mouseleave', 'clusters', function () {
				map.getCanvas().style.cursor = '';
			});
			map.on('mouseenter', 'unclustered-point', function () {
				map.getCanvas().style.cursor = 'pointer';
			});
			map.on('mouseleave', 'unclustered-point', function () {
				map.getCanvas().style.cursor = '';
			});
		});
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
