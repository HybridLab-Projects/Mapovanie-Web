import { FeatureCollection, Point } from 'geojson';

export interface State {
    mapEntities: Array<Entity>;
    geoJson: FeatureCollection<Point, Entity>;
}

export interface Entity {
    id: string | number;
    type: string;
    sub_type: string;
    condition: string;
    lon: string | number;
    lat: string | number;
    custom_fields: string;
    device_uuid: string;
    images: [
        {
            url: string;
        }
    ];
    date: string;
}
