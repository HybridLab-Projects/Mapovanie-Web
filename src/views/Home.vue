<template>
	<!-- <div class="bg-green-600 rounded-3xl mx-8 h-32 p-5 h-1/">
		<h1 class="text-center text-white text-3xl">Tailwind test</h1>
		<h2 class="text-center text-gray-200 text-xl font-bold mt-2">Subtitle</h2> -->
	<div id="mapContainer" class="h-screen w-screen"></div>
	<!-- </div> -->
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import MapBox from '@/plugins/mapbox';
import { GeoJSONSource, NavigationControl } from 'mapbox-gl';
import { mapState } from 'vuex';

export default defineComponent({
	name: 'Home',
	computed: {
		...mapState(['geoJson']),
	},
	mounted() {
		const map = new MapBox.Map({
			container: 'mapContainer',
			style: 'mapbox://styles/jakubkoje/ckim5ey4c2jsm17p3878yj22c',
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
				clusterMaxZoom: 14, // Max zoom to cluster points on
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
					'circle-color': [
						'step',
						['get', 'point_count'],
						'#51bbd6',
						100,
						'#f1f075',
						750,
						'#f28cb1',
					],
					'circle-radius': [
						'step',
						['get', 'point_count'],
						20,
						100,
						30,
						750,
						40,
					],
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
				filter: ['!', ['has', 'point_count']],
				paint: {
					'circle-color': '#11b4da',
					'circle-radius': 4,
					'circle-stroke-width': 1,
					'circle-stroke-color': '#fff',
				},
			});
			map.on('click', 'clusters', function (e) {
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
			map.on('click', 'unclustered-point', function (e) {
				console.log(e);
			});
			map.on('click', (e) => {
				console.log('object', e);
			});
			map.on('mouseenter', 'clusters', function () {
				map.getCanvas().style.cursor = 'pointer';
			});
			map.on('mouseleave', 'clusters', function () {
				map.getCanvas().style.cursor = '';
			});
		});
	},
});
</script>

<style scoped>
</style>
