function loadData() {
    Promise.all([
        d3.json("gadm41_BTN_1.json"),
        d3.json("data/dzongkhag-population.json")
    ])
        .then(([geoJsonData, populationData]) => {
            const map = L.map('map').setView([27.5142, 90.4336], 8);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

            // Control to display Dzongkhag name and population
            const info = L.control();

            info.onAdd = function (map) {
                this._div = L.DomUtil.create('div', 'info');
                this.update();
                return this._div;
            };

            info.update = function (props) {
                this._div.innerHTML = '<h3>' + (props ? props.NAME_1 + '<br>Population: ' + populationData[props.NAME_1]?.["Both Sex"] : 'Hover over a Dzongkhag') + '</h3>';
            };

            info.addTo(map);

            // Function to get color based on population
            function getColor(d) {
                return d > 100000 ? '#800026' :
                    d > 50000 ? '#BD0026' :
                        d > 20000 ? '#E31A1C' :
                            d > 10000 ? '#FC4E2A' :
                                d > 5000 ? '#FD8D3C' :
                                    d > 2000 ? '#FEB24C' :
                                        d > 1000 ? '#FED976' :
                                            '#FFEDA0';
            }

            // Style function for GeoJSON layer
            function style(feature) {
                return {
                    fillColor: getColor(populationData[feature.properties.NAME_1]?.["Both Sex"]),
                    weight: 2,
                    opacity: 1,
                    color: 'white',
                    dashArray: '3',
                    fillOpacity: 0.7
                };
            }

            // Add GeoJSON data to the map
            L.geoJSON(geoJsonData, {
                style: style,
                onEachFeature: function (feature, layer) {
                    layer.on({
                        mouseover: function (e) {
                            info.update(feature.properties);
                        },
                        mouseout: function (e) {
                            info.update();
                        }
                    });
                }
            }).addTo(map);
        })
        .catch(err => {
            console.error("Error loading data:", err);
        });
}

loadData();
